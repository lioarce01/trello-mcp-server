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
- 🐳 Docker support for easy deployment

## Prerequisites

- Node.js 20+ installed (for local development)
- Docker (for containerized deployment)
- A Trello account
- Trello API credentials (API Key and Token)

## Installation

### Option 1: Local Installation

1. Clone this repository:

```bash
git clone https://github.com/lioarce01/trello-mcp-server.git
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

### Option 2: Docker Installation

1. Clone this repository:

```bash
git clone https://github.com/lioarce01/trello-mcp-server.git
cd trello-mcp-server
```

2. Build the Docker image:

```bash
docker build -t trello-mcp-server .
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

#### Local Installation

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
        "args": ["absolute/path/to/the/project/dist/index.js"],
        "env": {
          "TRELLO_API_KEY": "your_api_key",
          "TRELLO_TOKEN": "your_token",
          "TRELLO_BASE_URL": "https://api.trello.com/1"
        }
      }
    }
  }
}
```

#### Docker Configuration

For Docker deployment, add this configuration:

```json
{
  "mcp": {
    "servers": {
      "trello-mcp": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "-e",
          "TRELLO_API_KEY=your_api_key",
          "-e",
          "TRELLO_TOKEN=your_token",
          "-e",
          "TRELLO_BASE_URL=https://api.trello.com/1",
          "trello-mcp-server"
        ]
      }
    }
  }
}
```

### For VS Code with GitHub Copilot Chat

#### Local Installation

Add to your VS Code settings.json:

```json
{
  "mcp": {
    "servers": {
      "trello-mcp": {
        "command": "node",
        "args": ["absolute/path/to/the/project/dist/index.js"],
        "env": {
          "TRELLO_API_KEY": "your_api_key",
          "TRELLO_TOKEN": "your_token",
          "TRELLO_BASE_URL": "https://api.trello.com/1"
        }
      }
    }
  }
}
```

#### Docker Configuration

```json
{
  "mcp": {
    "servers": {
      "trello-mcp": {
        "command": "docker",
        "args": [
          "run",
          "--rm",
          "-i",
          "-e",
          "TRELLO_API_KEY=your_api_key",
          "-e",
          "TRELLO_TOKEN=your_token",
          "-e",
          "TRELLO_BASE_URL=https://api.trello.com/1",
          "trello-mcp-server"
        ]
      }
    }
  }
}
```

**Important:**

- Replace `absolute/path/to/the/project/dist/index.js` with the actual absolute path to your compiled server file (local installation)
- Replace `YOUR_TRELLO_API_KEY` and `YOUR_TRELLO_TOKEN` with your actual Trello credentials

## Docker Usage

### Using Docker Run

```bash
# Build the image
docker build -t trello-mcp-server .

# Run with API key and token as arguments
docker run --rm -i --env-file .env trello-mcp-server
```

### Local Testing

To test if your server works correctly:

1. **Build the project:**

```bash
npm run build
```

2. **Run with credentials:**

```bash
node dist/index.js
```

### Docker Testing

1. **Build and run with Docker:**

```bash
docker build -t trello-mcp-server .
docker run --rm -i --env-file .env trello-mcp-server
```

2. **You should see:**

```
MCP server connected and ready.
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

### Building

#### Local Development

```bash
npm run build
```

#### Docker Development

```bash
# Build Docker image
docker build -t trello-mcp-server .
```

### Running in Development

#### Local Development

To run the server directly (for testing):

```bash
# With npm
npm run build
node dist/index.js

# With pnpm
pnpm run build
node dist/index.js
```

#### Docker Development

```bash
# Run with docker (pass credentials as arguments)
docker run --rm -i --env-file .env trello-mcp-server
```

### Development Scripts

You can also create a development script in your `package.json`:

```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsx ./src/index.ts",
    "docker:build": "docker build -t trello-mcp-server .",
    "docker:run": "docker run --rm -i --env-file .env trello-mcp-server"
  }
}
```

## Troubleshooting

### Server Not Connecting

1. **Check credentials:** Make sure you're passing API Key and Token as arguments
2. **Verify file path:** Ensure the path in your MCP configuration is correct (local installation)
3. **Build first:** Always run `npm run build` or `docker build` before testing
4. **Test standalone:** Try running the server independently first
5. **Restart client:** Restart your MCP client (Claude Desktop/VS Code) after config changes

### Docker-Specific Issues

1. **Image not found:** Make sure you've built the Docker image first with `docker build -t trello-mcp-server .`
2. **Arguments not passed:** Ensure API key and token are passed as arguments after the image name
3. **Permissions:** Check that Docker has the necessary permissions to run containers

### Invalid Credentials Error

- Double-check your Trello API Key and Token
- Ensure the token has the necessary permissions
- Try regenerating your token if it's expired
- Verify credentials are properly passed as arguments

### Tools Not Working

- Verify the board/card/list IDs are correct
- Check that you have write permissions to the Trello board
- Look at the console logs for detailed error messages

## Security Notes

- **Never commit your API credentials** to version control
- Store credentials securely and rotate them regularly
- Use `.env` files and add them to `.gitignore`
- The server only requires the permissions you grant via the Trello token
- Consider using environment variables for credentials in production
- Docker containers run with non-root user for security

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Made with ❤️ for the MCP community**
