import { mcpServer } from "./handlers/MCPHandlers";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

const start = async () => {
  try {
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    console.error("MCP Server connected and ready.");
  } catch (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

start().catch((error) => {
  console.error("Error starting server:", error);
  process.exit(1);
});
