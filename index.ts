import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios';

const [, , apiKeyArg, tokenArg] = process.argv;

if (!apiKeyArg || !tokenArg) {
    throw new Error("TRELLO_API_KEY and TRELLO_TOKEN must be provided as CLI arguments");
}

const TRELLO_API_KEY = apiKeyArg;
const TRELLO_TOKEN = tokenArg;
const TRELLO_BASE_URL = "https://api.trello.com/1";

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
);

// Helper function to make API requests
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

// MCP Resources Handlers

// ListResources: List all resources (boards)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    try {
        const boards = await trelloGet("/members/me/boards", { fields: "id,name,closed" });
        const openBoards = boards.filter((b: any) => !b.closed);

        return {
            resources: openBoards.map((board: any) => ({
                uri: `board:${board.id}`, // Cambio: usar 'uri' en lugar de 'id'
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

// ReadResources: Read lists and cards from a specific board
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
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

// MCP Tools Handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        switch (name) {
            case "listBoards": {
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
            }

            case "readBoard": {
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
            }

            case "createCard": {
                const { listId, name, desc = "" } = args;
                if (!listId || !name) throw new Error("listId and name are required");

                const card = await trelloPost("/cards", { idList: listId, name, desc });

                return {
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                cardId: card.id,
                                url: card.url,
                                name: card.name
                            }, null, 2)
                        }
                    ]
                };
            }

            case "moveCard": {
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
            }

            case "addComment": {
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
            }

            case "archiveCard": {
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
            }

            default:
                throw new Error(`Tool "${name}" is not implemented`);
        }
    } catch (error) {
        console.error(`Error in tool handler for ${name}:`, error);
        return {
            content: [
                {
                    type: "text",
                    text: `Error: ${error.message || error}`,
                },
            ],
            isError: true,
        };
    }
});

// ListTools: List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
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
});

async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Trello MCP server connected and ready.");
}

runServer().catch(console.error);