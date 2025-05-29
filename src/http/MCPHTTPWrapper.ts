import express from "express";
import { TrelloApi } from "../api/trelloApi";
import { createToolHandlers } from "../handlers/toolHandlers";
import {
  TRELLO_API_KEY,
  TRELLO_TOKEN,
  TRELLO_BASE_URL,
} from "../config/config";
import { toolsMetadata } from "../metadata/toolsMetadata";

const trello = new TrelloApi(TRELLO_API_KEY, TRELLO_TOKEN, TRELLO_BASE_URL);
const toolHandlers = createToolHandlers(trello);

export default class MCPHTTPWrapper {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req, res, next) => {
      console.error(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    // Health check
    this.app.get("/health", (req, res) => {
      res.json({
        status: "ok",
        service: "trello-mcp-server",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
      });
    });

    // Main MCP endpoint - Direct tool handling
    this.app.post("/mcp", async (req, res) => {
      try {
        const jsonRpcRequest = req.body;

        // Validate JSON-RPC format
        if (!jsonRpcRequest.jsonrpc || jsonRpcRequest.jsonrpc !== "2.0") {
          return res.status(400).json({
            jsonrpc: "2.0",
            id: jsonRpcRequest.id || null,
            error: {
              code: -32600,
              message: 'Invalid Request - jsonrpc must be "2.0"',
            },
          });
        }

        const { method, params, id } = jsonRpcRequest;
        let result;

        switch (method) {
          case "tools/list":
            result = { tools: toolsMetadata };
            break;

          case "tools/call":
            const { name, arguments: args } = params;

            switch (name) {
              case "listBoards":
                result = await toolHandlers.handleListBoards();
                break;
              case "readBoard":
                result = await toolHandlers.handleReadBoard(args);
                break;
              case "createList":
                result = await toolHandlers.handleCreateList(args);
                break;
              case "createCard":
                result = await toolHandlers.handleCreateCard(args);
                break;
              case "moveCard":
                result = await toolHandlers.handleMoveCard(args);
                break;
              case "addComment":
                result = await toolHandlers.handleAddComment(args);
                break;
              case "archiveCard":
                result = await toolHandlers.handleArchiveCard(args);
                break;
              default:
                throw new Error(`Tool "${name}" is not implemented`);
            }
            break;

          default:
            return res.status(400).json({
              jsonrpc: "2.0",
              id: id || null,
              error: {
                code: -32601,
                message: `Method not found: ${method}`,
              },
            });
        }

        res.json({
          jsonrpc: "2.0",
          id: id || null,
          result,
        });
      } catch (error) {
        console.error("Error processing MCP request:", error);

        res.status(500).json({
          jsonrpc: "2.0",
          id: req.body.id || null,
          error: {
            code: -32603,
            message: "Internal error",
            data: error instanceof Error ? error.message : String(error),
          },
        });
      }
    });

    // Convenience endpoints for direct tool access
    this.app.post("/tools/:toolName", async (req, res) => {
      try {
        const { toolName } = req.params;
        const args = req.body;

        let result;
        switch (toolName) {
          case "listBoards":
            result = await toolHandlers.handleListBoards();
            break;
          case "readBoard":
            result = await toolHandlers.handleReadBoard(args);
            break;
          case "createList":
            result = await toolHandlers.handleCreateList(args);
            break;
          case "createCard":
            result = await toolHandlers.handleCreateCard(args);
            break;
          case "moveCard":
            result = await toolHandlers.handleMoveCard(args);
            break;
          case "addComment":
            result = await toolHandlers.handleAddComment(args);
            break;
          case "archiveCard":
            result = await toolHandlers.handleArchiveCard(args);
            break;
          default:
            throw new Error(`Tool "${name}" is not implemented`);
        }

        res.json({
          success: true,
          result,
        });
      } catch (error) {
        console.error(`Error calling tool ${req.params.toolName}:`, error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        error: "Not Found",
        message: `Route ${req.method} ${req.originalUrl} not found`,
        availableEndpoints: [
          "GET /health",
          "POST /mcp",
          "POST /tools/:toolName",
        ],
      });
    });
  }

  listen(port: number) {
    return this.app.listen(port, () => {
      console.error(`🚀 Trello MCP HTTP Server running on port ${port}`);
      console.error(`📋 Available endpoints:`);
      console.error(`   Health check: http://localhost:${port}/health`);
      console.error(`   MCP endpoint: http://localhost:${port}/mcp`);
      console.error(
        `   Direct tools: http://localhost:${port}/tools/:toolName`
      );
    });
  }
}
