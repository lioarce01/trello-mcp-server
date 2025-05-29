import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
    ListResourcesRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';
import express from 'express';

const [, , apiKeyArg, tokenArg, portArg] = process.argv;

if (!apiKeyArg || !tokenArg) {
    throw new Error("TRELLO_API_KEY and TRELLO_TOKEN must be provided as CLI arguments");
}

const TRELLO_API_KEY = apiKeyArg;
const TRELLO_TOKEN = tokenArg;
const TRELLO_BASE_URL = "https://api.trello.com/1";
const HTTP_PORT = portArg ? parseInt(portArg) : 3001;

// Helper functions to make API requests
async function trelloGet(path: string, params: Record<string, any> = {}) {
    const response = await axios.get(`${TRELLO_BASE_URL}${path}`, {
        params: {
            key: TRELLO_API_KEY,
            token: TRELLO_TOKEN,
            ...params
        }
    });
    return response.data;
}

async function trelloPost(path: string, data: Record<string, any> = {}) {
    const response = await axios.post(`${TRELLO_BASE_URL}${path}`, null, {
        params: {
            key: TRELLO_API_KEY,
            token: TRELLO_TOKEN,
            ...data
        }
    });
    return response.data;
}

async function trelloPut(path: string, data: Record<string, any> = {}) {
    const response = await axios.put(`${TRELLO_BASE_URL}${path}`, null, {
        params: {
            key: TRELLO_API_KEY,
            token: TRELLO_TOKEN,
            ...data
        }
    });
    return response.data;
}

// Add missing createList method
async function createList(boardId: string, name: string) {
    return await trelloPost("/lists", { idBoard: boardId, name });
}

// Tool handler functions
async function handleListBoards() {
    try {
        const boards = await trelloGet("/members/me/boards", { fields: "id,name,closed" });
        const openBoards = boards.filter((board: any) => !board.closed);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(openBoards.map((board: any) => ({
                        id: board.id,
                        name: board.name,
                        description: `Trello board: ${board.name}`,
                    })), null, 2)
                },
            ],
        };
    } catch (error) {
        console.error("Error listing boards:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

async function handleReadBoard(args: any) {
    try {
        const { boardId } = args;
        if (!boardId) throw new Error("boardId is required");

        const boardData = await trelloGet(`/boards/${boardId}`, { fields: "id,name,closed" });
        if (boardData.closed) throw new Error("Board is closed");

        const lists = await trelloGet(`/boards/${boardId}/lists`, { fields: "id,name,closed" });
        const openLists = lists.filter((list: any) => !list.closed);

        const listWithCards = await Promise.all(openLists.map(async (list: any) => {
            const cards = await trelloGet(`/lists/${list.id}/cards`, { fields: "id,name,closed" });
            const openCards = cards.filter((card: any) => !card.closed);
            return {
                listId: list.id,
                listName: list.name,
                cards: openCards.map((card: any) => ({
                    id: card.id,
                    name: card.name,
                    description: `Trello card: ${card.name} in list ${list.name}`,
                }))
            };
        }));

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        boardId: boardData.id,
                        boardName: boardData.name,
                        lists: listWithCards
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error("Error reading board:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

async function handleCreateList(args: any) {
    try {
        const { boardId, name } = args;
        if (!boardId || !name) throw new Error("boardId and name are required");

        const list = await createList(boardId as string, name as string);

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        id: list.id,
                        name: list.name,
                        boardId: list.idBoard
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error("Error creating list:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

async function handleCreateCard(args: any) {
    try {
        const { listId, name, desc = "" } = args;
        if (!listId || !name) throw new Error("listId and name are required");

        const card = await trelloPost("/cards", { idList: listId, name, desc });

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        id: card.id,
                        url: card.url,
                        name: card.name
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error("Error creating card:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

async function handleMoveCard(args: any) {
    try {
        const { cardId, listId } = args;
        if (!cardId || !listId) throw new Error("cardId and listId are required");

        await trelloPut(`/cards/${cardId}`, { idList: listId });

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({ moved: true, cardId, listId }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error("Error moving card:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

async function handleAddComment(args: any) {
    try {
        const { cardId, text } = args;
        if (!cardId || !text) throw new Error("cardId and text are required");

        const comment = await trelloPost(`/cards/${cardId}/actions/comments`, { text });

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        commentId: comment.id,
                        text: comment.data.text
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error("Error adding comment:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

async function handleArchiveCard(args: any) {
    try {
        const { cardId } = args;
        if (!cardId) throw new Error("cardId is required");

        await trelloPut(`/cards/${cardId}`, { closed: true });

        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        archived: true,
                        cardId
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error("Error archiving card:", error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
}

// Create MCP Server (only for resource handling)
const mcpServer = new Server({
    name: "trello-mcp-server",
    version: "1.0.0",
});

// MCP Resources Handlers
mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
        const boards = await trelloGet("/members/me/boards", { fields: "id,name,closed" });
        const openBoards = boards.filter((b: any) => !b.closed);

        return {
            resources: openBoards.map((board: any) => ({
                uri: `board:${board.id}`,
                name: board.name,
                description: `Trello board: ${board.name}`,
                mimeType: "application/json"
            })),
        };
    } catch (error) {
        console.error("Error fetching boards:", error);
        return {
            resources: [],
        };
    }
});

mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resourceId = request.params.uri;
    if (!resourceId.startsWith("board:")) {
        throw new Error("Only board resources are supported");
    }

    const boardId = resourceId.split(":")[1];

    try {
        const lists = await trelloGet(`/boards/${boardId}/lists`, { fields: "id,name,closed" });
        const openLists = lists.filter((list: any) => !list.closed);

        const listWithCards = await Promise.all(openLists.map(async (list: any) => {
            const cards = await trelloGet(`/lists/${list.id}/cards`, { fields: "id,name,closed" });
            const openCards = cards.filter((card: any) => !card.closed);
            return {
                listId: list.id,
                listName: list.name,
                cards: openCards.map((card: any) => ({
                    id: card.id,
                    name: card.name,
                    description: `Trello card: ${card.name} in list ${list.name}`,
                }))
            };
        }));

        return {
            contents: [
                {
                    uri: resourceId,
                    mimeType: "application/json",
                    text: JSON.stringify({
                        boardId,
                        lists: listWithCards
                    }, null, 2)
                }
            ]
        };
    } catch (error) {
        console.error("Error reading board:", error);
        throw error;
    }
});

// HTTP Server wrapper - Simplified approach
class MCPHTTPWrapper {
    private app: express.Application;

    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
    }

    private setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Logging middleware
        this.app.use((req, res, next) => {
            console.error(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    private setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                service: 'trello-mcp-server',
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });

        // Main MCP endpoint - Direct tool handling
        this.app.post('/mcp', async (req, res) => {
            try {
                const jsonRpcRequest = req.body;
                
                // Validate JSON-RPC format
                if (!jsonRpcRequest.jsonrpc || jsonRpcRequest.jsonrpc !== '2.0') {
                    return res.status(400).json({
                        jsonrpc: '2.0',
                        id: jsonRpcRequest.id || null,
                        error: {
                            code: -32600,
                            message: 'Invalid Request - jsonrpc must be "2.0"'
                        }
                    });
                }

                const { method, params, id } = jsonRpcRequest;
                let result;

                switch (method) {
                    case 'tools/list':
                        result = {
                            tools: [
                                {
                                    name: "listBoards",
                                    description: "List all open Trello boards",
                                    inputSchema: {
                                        type: "object",
                                        properties: {},
                                        required: []
                                    }
                                },
                                {
                                    name: "readBoard",
                                    description: "Read lists and cards from a specific board",
                                    inputSchema: {
                                        type: "object",
                                        properties: {
                                            boardId: {
                                                type: "string",
                                                description: "ID of the board to read"
                                            }
                                        },
                                        required: ["boardId"]
                                    }
                                },
                                {
                                    name: "createList",
                                    description: "Create a new list in a specific board",
                                    inputSchema: {
                                        type: "object",
                                        properties: {
                                            boardId: {
                                                type: "string",
                                                description: "ID of the board to create the list in"
                                            },
                                            name: {
                                                type: "string",
                                                description: "Name of the list"
                                            }
                                        },
                                        required: ["boardId", "name"]
                                    }
                                },
                                {
                                    name: "createCard",
                                    description: "Create a new card in a specific list",
                                    inputSchema: {
                                        type: "object",
                                        properties: {
                                            listId: {
                                                type: "string",
                                                description: "ID of the list to create the card in"
                                            },
                                            name: {
                                                type: "string",
                                                description: "Name of the card"
                                            },
                                            desc: {
                                                type: "string",
                                                description: "Description of the card (optional)"
                                            }
                                        },
                                        required: ["listId", "name"]
                                    }
                                },
                                {
                                    name: "moveCard",
                                    description: "Move a card to a different list",
                                    inputSchema: {
                                        type: "object",
                                        properties: {
                                            cardId: {
                                                type: "string",
                                                description: "ID of the card to move"
                                            },
                                            listId: {
                                                type: "string",
                                                description: "ID of the target list"
                                            }
                                        },
                                        required: ["cardId", "listId"]
                                    }
                                },
                                {
                                    name: "addComment",
                                    description: "Add a comment to a card",
                                    inputSchema: {
                                        type: "object",
                                        properties: {
                                            cardId: {
                                                type: "string",
                                                description: "ID of the card to add a comment to"
                                            },
                                            text: {
                                                type: "string",
                                                description: "Comment text"
                                            }
                                        },
                                        required: ["cardId", "text"]
                                    }
                                },
                                {
                                    name: "archiveCard",
                                    description: "Archive a card",
                                    inputSchema: {
                                        type: "object",
                                        properties: {
                                            cardId: {
                                                type: "string",
                                                description: "ID of the card to archive"
                                            }
                                        },
                                        required: ["cardId"]
                                    }
                                }
                            ]
                        };
                        break;

                    case 'tools/call':
                        const { name, arguments: args } = params;
                        
                        switch (name) {
                            case "listBoards":
                                result = await handleListBoards();
                                break;
                            case "readBoard":
                                result = await handleReadBoard(args);
                                break;
                            case "createList":
                                result = await handleCreateList(args);
                                break;
                            case "createCard":
                                result = await handleCreateCard(args);
                                break;
                            case "moveCard":
                                result = await handleMoveCard(args);
                                break;
                            case "addComment":
                                result = await handleAddComment(args);
                                break;
                            case "archiveCard":
                                result = await handleArchiveCard(args);
                                break;
                            default:
                                throw new Error(`Tool "${name}" is not implemented`);
                        }
                        break;

                    default:
                        return res.status(400).json({
                            jsonrpc: '2.0',
                            id: id || null,
                            error: {
                                code: -32601,
                                message: `Method not found: ${method}`
                            }
                        });
                }

                res.json({
                    jsonrpc: '2.0',
                    id: id || null,
                    result
                });

            } catch (error) {
                console.error('Error processing MCP request:', error);
                
                res.status(500).json({
                    jsonrpc: '2.0',
                    id: req.body.id || null,
                    error: {
                        code: -32603,
                        message: 'Internal error',
                        data: error instanceof Error ? error.message : String(error)
                    }
                });
            }
        });

        // Convenience endpoints for direct tool access
        this.app.post('/tools/:toolName', async (req, res) => {
            try {
                const { toolName } = req.params;
                const args = req.body;

                let result;
                switch (toolName) {
                    case "listBoards":
                        result = await handleListBoards();
                        break;
                    case "readBoard":
                        result = await handleReadBoard(args);
                        break;
                    case "createList":
                        result = await handleCreateList(args);
                        break;
                    case "createCard":
                        result = await handleCreateCard(args);
                        break;
                    case "moveCard":
                        result = await handleMoveCard(args);
                        break;
                    case "addComment":
                        result = await handleAddComment(args);
                        break;
                    case "archiveCard":
                        result = await handleArchiveCard(args);
                        break;
                    default:
                        throw new Error(`Tool "${toolName}" is not implemented`);
                }

                res.json({
                    success: true,
                    result
                });

            } catch (error) {
                console.error(`Error calling tool ${req.params.toolName}:`, error);
                res.status(500).json({
                    success: false,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.method} ${req.originalUrl} not found`,
                availableEndpoints: [
                    'GET /health',
                    'POST /mcp',
                    'POST /tools/:toolName'
                ]
            });
        });
    }

    listen(port: number) {
        return this.app.listen(port, () => {
            console.error(`🚀 Trello MCP HTTP Server running on port ${port}`);
            console.error(`📋 Available endpoints:`);
            console.error(`   Health check: http://localhost:${port}/health`);
            console.error(`   MCP endpoint: http://localhost:${port}/mcp`);
            console.error(`   Direct tools: http://localhost:${port}/tools/:toolName`);
        });
    }
}

async function main() {
    console.error('🔧 Starting Trello MCP Server...');
    
    // Create HTTP wrapper
    const httpWrapper = new MCPHTTPWrapper();
    
    // Start HTTP server
    const httpServer = httpWrapper.listen(HTTP_PORT);

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.error('\n🛑 Shutting down Trello MCP Server...');
        httpServer.close(() => {
            console.error('✅ Server closed');
            process.exit(0);
        });
    });

    process.on('SIGTERM', () => {
        console.error('\n🛑 Received SIGTERM, shutting down...');
        httpServer.close(() => {
            console.error('✅ Server closed');
            process.exit(0);
        });
    });
}

main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});