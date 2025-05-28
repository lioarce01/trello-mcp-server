# Trello MCP Server

A Model Context Protocol (MCP) server that connects Trello with AI assistants like Claude Desktop, GitHub Copilot Chat, and other MCP-compatible clients.

## Features

- 📋 List all your Trello boards
- 🔍 Read board contents (lists and cards)
- ➕ Create new cards
- 🔄 Move cards between lists
- 💬 Add comments to cards
- 🗃️ Archive cards
- 🔗 Access boards as MCP resources

## Prerequisites

- Node.js 16+ installed
- A Trello account
- Trello API credentials (API Key and Token)

## Installation

1. Clone this repository:

```bash
git clone https://github.com/yourusername/trello-mcp-server.git
cd trello-mcp-server
```

2. Install dependencies:

```bash
npm install
```

3. Build the TypeScript code:

```bash
npm run build
```

## Getting Trello API Credentials

1. **Get your API Key:**

   - Go to https://trello.com/app-key
   - Copy your API Key

2. **Get your Token:**
   - On the same page, click on "Token" link
   - Authorize the application and copy your Token

## Configuration

### For Claude Desktop

Add the server configuration to your Claude Desktop config file:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Linux:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcp": {
    "servers": {
      "trello-mcp": {
        "command": "node",
        "args": [
          "absolute/path/to/the/project/dist/index.js",
          "TRELLO_API_KEY",
          "TRELLO_TOKEN"
        ]
      }
    }
  }
}
```

### For VS Code with GitHub Copilot Chat

Add to your VS Code settings.json:

```json
{
  "mcp": {
    "servers": {
      "trello-mcp": {
        "command": "node",
        "args": [
          "absolute/path/to/the/project/dist/index.js",
          "TRELLO_API_KEY",
          "TRELLO_TOKEN"
        ]
      }
    }
  }
}
```

**Important:**

- Replace `absolute/path/to/the/project/dist/index.js` with the actual absolute path to your compiled server file
- Replace `TRELLO_API_KEY` and `TRELLO_TOKEN` with your actual Trello credentials

## Quick Test

To test if your server works correctly:

1. **Build the project:**

```bash
pnpm run build
```

2. **Run with credentials:**

```bash
node dist/index.js YOUR_TRELLO_API_KEY YOUR_TRELLO_TOKEN
```

3. **You should see:**

```
Trello MCP server connected and ready.
```

**Note:** The server will wait for MCP client connections. To exit, press `Ctrl+C`.

Once configured, you can interact with your Trello boards through natural language:

### List Boards

```
Show me all my Trello boards
```

### Read Board Contents

```
What cards are in my "Project Management" board?
```

### Create Cards

```
Create a new card called "Review documentation" in the "To Do" list
```

### Move Cards

```
Move the "Bug fix" card to the "In Progress" list
```

### Add Comments

```
Add a comment to the card saying "This needs urgent attention"
```

### Archive Cards

```
Archive the completed card "Setup database"
```

## Available Tools

| Tool          | Description                                | Parameters                          |
| ------------- | ------------------------------------------ | ----------------------------------- |
| `listBoards`  | List all open Trello boards                | None                                |
| `readBoard`   | Read lists and cards from a specific board | `boardId`                           |
| `createCard`  | Create a new card in a specific list       | `listId`, `name`, `desc` (optional) |
| `moveCard`    | Move a card to a different list            | `cardId`, `listId`                  |
| `addComment`  | Add a comment to a card                    | `cardId`, `text`                    |
| `archiveCard` | Archive a card                             | `cardId`                            |

## Available Resources

The server exposes your Trello boards as MCP resources that can be read by AI assistants:

- **Resource URI:** `board:{boardId}`
- **Content:** JSON containing all lists and cards for the board

## Development

### Project Structure

```
trello-mcp-server/
├── index.ts          # Main server implementation
├── dist/             # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

### Building

```bash
npm run build
```

### Running in Development

To run the server directly (for testing):

```bash
# With npm
npm run build
node dist/index.js YOUR_TRELLO_API_KEY YOUR_TRELLO_TOKEN

# With pnpm
pnpm run build
node dist/index.js YOUR_TRELLO_API_KEY YOUR_TRELLO_TOKEN
```

### Development Scripts

You can also create a development script in your `package.json`:

```json
{
  "scripts": {
    "start": "node dist/index.js",
    "start:dev": "node dist/index.js YOUR_API_KEY YOUR_TOKEN",
    "build": "tsc",
    "dev": "tsc && node dist/index.js YOUR_API_KEY YOUR_TOKEN"
  }
}
```

## Troubleshooting

### Server Not Connecting

1. **Check credentials:** Make sure you're passing API Key and Token as arguments
2. **Verify file path:** Ensure the path in your MCP configuration is correct
3. **Build first:** Always run `npm run build` or `pnpm run build` before testing
4. **Test standalone:** Try running `node dist/index.js YOUR_KEY YOUR_TOKEN` first
5. **Restart client:** Restart your MCP client (Claude Desktop/VS Code) after config changes

### Invalid Credentials Error

- Double-check your Trello API Key and Token
- Ensure the token has the necessary permissions
- Try regenerating your token if it's expired

### Tools Not Working

- Verify the board/card/list IDs are correct
- Check that you have write permissions to the Trello board
- Look at the console logs for detailed error messages

### Debug Mode

Run the server with debug output:

```bash
node dist/index.js YOUR_API_KEY YOUR_TOKEN 2>&1 | tee debug.log
```

## Security Notes

- **Never commit your API credentials** to version control
- Store credentials securely and rotate them regularly
- The server only requires the permissions you grant via the Trello token
- Consider using environment variables for credentials in production

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Made with ❤️ for the MCP community**
