import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios'

const server = new Server(
    {
        name: "trello-mcp-server",
        version: "1.0.0",
    },
    {
        capabilities: {
            resources: {},
            tools: {}
        }
    }
)

async function runServer() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.log("Server started and listening for requests...")
}

runServer().catch((error) => {
    console.error("Error starting server:", error);
});