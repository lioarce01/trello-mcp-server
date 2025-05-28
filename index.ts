import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListResourcesRequestSchema,
    ListToolsRequestSchema,
    ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from 'axios'

const [, , TRELLO_API_KEY, TRELLO_TOKEN] = process.argv;
if (!TRELLO_API_KEY || !TRELLO_TOKEN) {
    console.log("Please provide a TRELLO_API_KEY and TRELLO_TOKEN as command line arguments.");
    process.exit(1);
}

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
)

// Helper function to make API requests
async function trelloGet(path: string, params: Record<string, any> = {}) {
    const response = await axios.get(`${TRELLO_BASE_URL}${path}`, {
        params: {
            key: TRELLO_API_KEY, token: TRELLO_TOKEN, ...params
        }
    })
    return response.data;
}

async function trelloPost(path: string, data: Record<string, any> = {}) {
    const response = await axios.post(`${TRELLO_BASE_URL}${path}`, null, {
        params: { key: TRELLO_API_KEY, token: TRELLO_TOKEN, ...data }
    });
    return response.data;
}

async function trelloPut(path: string, data: Record<string, any> = {}) {
    const response = await axios.put(`${TRELLO_BASE_URL}${path}`, null, {
        params: { key: TRELLO_API_KEY, token: TRELLO_TOKEN, ...data }
    });
    return response.data;
}

async function getBoardDetails(boardId: string) {
    const lists = await trelloGet(`/boards/${boardId}/lists`, { fields: "id, name, closed" });
    const openLists = lists.filter((list: any) => !list.closed);

    return await Promise.all(openLists.map(async (list: any) => {
        const cards = await trelloGet(`/lists/${list.id}/cards`, { fields: "id, name, closed" });
        const openCards = cards.filter((card: any) => !card.closed);

        return {
            listId: list.id,
            listName: list.name,
            cards: openCards.map((card: any) => ({
                id: `card:${card.id}`,
                name: card.name,
                description: `Trello card: ${card.name} in list ${list.name}`,
            }))
        };
    }));
}


// MCP Resources Handlers

// ListResources: List all resources (boards)
server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const boards = await trelloGet("/members/me/boards", { fields: "id, name, closed" })

    // filter out closed boards
    const openBoards = boards.filter((board: any) => !board.closed);

    // create resource for each open board
    return openBoards.map((board: any) => ({
        id: `board:${board.id}`,
        name: board.name,
        description: `Trello board: ${board.name}`,
    }))
})

// ReadResources: Read listas and cards from a specific board
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const resourceId = request.params.uri;
    if (!resourceId.startsWith("board:")) {
        throw new Error("Only board resources are supported");
    }

    const boardId = resourceId.split(":")[1];

    // Get lists from the board
    const lists = await trelloGet(`/boards/${boardId}/lists`, { fields: "id, name, closed" })

    // Filter out closed lists
    const openLists = lists.filter((list: any) => !list.closed)

    // Get cards from the board
    const listWithCards = await Promise.all(openLists.map(async (list: any) => {
        const cards = await trelloGet(`/lists/${list.id}/cards`, { fields: "id, name, closed" })
        const openCards = cards.filter((card: any) => !card.closed);

        return {
            listId: list.id,
            listName: list.name,
            cards: openCards.map((card: any) => ({
                id: `card:${card.id}`,
                name: card.name,
                description: `Trello card: ${card.name} in list ${list.name}`,
            }))
        }
    }))

    return {
        boardId,
        lists: listWithCards
    }
})

// MCP Tools Handlers

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const name = request.params.name
    const args = request.params.arguments

    switch (name) {
        case "listBoards":
            const boards = await trelloGet("/members/me/boards", { fields: "id, name, closed" });
            return {
                content: [{ type: "json", data: boards }],
                isError: false,
            };
        case "readBoard":
            const boardId = args.boardId;
            if (!boardId) throw new Error("boardId is required");
            const boardData = await trelloGet(`/boards/${boardId}`, { fields: "id, name, closed" });
            if (boardData.closed) throw new Error("Board is closed");

            // Get lists and cards from the board
            const lists = await trelloGet(`/boards/${boardId}/lists`, { fields: "id, name, closed" });
            const openLists = lists.filter((list: any) => !list.closed);

            const listWithCards = await Promise.all(openLists.map(async (list: any) => {
                const cards = await trelloGet(`/lists/${list.id}/cards`, { fields: "id, name, closed" });
                const openCards = cards.filter((card: any) => !card.closed);

                return {
                    listId: list.id,
                    listName: list.name,
                    cards: openCards.map((card: any) => ({
                        id: `card:${card.id}`,
                        name: card.name,
                        description: `Trello card: ${card.name} in list ${list.name}`,
                    }))
                }
            }));

            return {
                boardId: boardData.id,
                boardName: boardData.name,
                lists: listWithCards
            };
        case "createCard":
            const listId = args.listId;
            const cardName = args.name;
            const desc = args.desc || "";

            if (!listId || !cardName) throw new Error("listId and name are required");
            const card = await trelloPost("/cards", { idList: listId, name: cardName, desc });
            return { cardId: card.id, url: card.url };

        case "moveCard":
            const { cardId: moveId, listId: targetList } = args;
            if (!moveId || !targetList) throw new Error("cardId and listId required");
            await trelloPut(`/cards/${moveId}`, { idList: targetList });
            return { moved: true };

        case "addComment":
            const { cardId: commentCardId, text } = args;
            if (!commentCardId || !text) throw new Error("cardId and text are required");
            const comment = await trelloPost(`/cards/${commentCardId}/actions/comments`, { text });
            return { commentId: comment.id };

        case "archiveCard":
            const { cardId: archiveId } = args;
            if (!archiveId) throw new Error("cardId is required");
            await trelloPut(`/cards/${archiveId}`, { closed: true });
            return { archived: true };

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
})

// ListTools: List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "listBoards",
                description: "List all open Trello boards",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                name: "readBoard",
                description: "Read lists and cards from a specific board",
                parameters: {
                    type: "object",
                    properties: {
                        boardId: { type: "string", description: "ID of the board to read" }
                    },
                    required: ["boardId"]
                }
            },
            {
                name: "createCard",
                description: "Create a new card in a specific list",
                parameters: {
                    type: "object",
                    properties: {
                        listId: { type: "string", description: "ID of the list to create the card in" },
                        name: { type: "string", description: "Name of the card" },
                        desc: { type: "string", description: "Description of the card", optional: true }
                    },
                    required: ["listId", "name"]
                }
            },
            {
                name: "moveCard",
                description: "Move a card to a different list",
                parameters: {
                    type: "object",
                    properties: {
                        cardId: { type: "string", description: "ID of the card to move" },
                        listId: { type: "string", description: "ID of the target list" }
                    },
                    required: ["cardId", "listId"]
                }
            },
            {
                name: "addComment",
                description: "Add a comment to a card",
                parameters: {
                    type: "object",
                    properties: {
                        cardId: { type: "string", description: "ID of the card to add a comment to" },
                        text: { type: "string", description: "Comment text" }
                    },
                    required: ["cardId", "text"]
                }
            },
            {
                name: "archiveCard",
                description: "Archive a card",
                parameters: {
                    type: "object",
                    properties: {
                        cardId: { type: "string", description: "ID of the card to archive" }
                    },
                    required: ["cardId"]
                }
            }
        ]
    }
})

async function runServer(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log("Server started and listening for requests...");
}

runServer().catch((error: unknown) => {
    console.error("Error starting server:", error);
});