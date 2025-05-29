import MCPHTTPWrapper from "./http/MCPHTTPWrapper";

export async function startServer(port: number) {
  console.error("Starting Trello MCP Server...");

  // Create HTTP wrapper
  const httpWrapper = new MCPHTTPWrapper();

  // Start HTTP server
  const httpServer = httpWrapper.listen(port);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.error("\nShutting down Trello MCP Server...");
    httpServer.close(() => {
      console.error("Server closed");
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    console.error("\nReceived SIGTERM, shutting down...");
    httpServer.close(() => {
      console.error("Server closed");
      process.exit(0);
    });
  });
}
