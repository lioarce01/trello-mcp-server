export const toolsMetadata = [
  {
    name: "list_boards",
    description: "List all open Trello boards",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "read_board",
    description: "Read lists and cards from a specific board",
    inputSchema: {
      type: "object",
      properties: {
        boardId: {
          type: "string",
          description: "ID of the board to read",
        },
      },
      required: ["boardId"],
    },
  },
  {
    name: "create_list",
    description: "Create a new list in a specific board",
    inputSchema: {
      type: "object",
      properties: {
        boardId: {
          type: "string",
          description: "ID of the board to create the list in",
        },
        name: {
          type: "string",
          description: "Name of the list",
        },
      },
      required: ["boardId", "name"],
    },
  },
  {
    name: "create_card",
    description: "Create a new card in a specific list",
    inputSchema: {
      type: "object",
      properties: {
        listId: {
          type: "string",
          description: "ID of the list to create the card in",
        },
        name: {
          type: "string",
          description: "Name of the card",
        },
        desc: {
          type: "string",
          description: "Description of the card (optional)",
        },
      },
      required: ["listId", "name"],
    },
  },
  {
    name: "move_card",
    description: "Move a card to a different list",
    inputSchema: {
      type: "object",
      properties: {
        cardId: {
          type: "string",
          description: "ID of the card to move",
        },
        listId: {
          type: "string",
          description: "ID of the target list",
        },
      },
      required: ["cardId", "listId"],
    },
  },
  {
    name: "add_comment",
    description: "Add a comment to a card",
    inputSchema: {
      type: "object",
      properties: {
        cardId: {
          type: "string",
          description: "ID of the card to add a comment to",
        },
        text: {
          type: "string",
          description: "Comment text",
        },
      },
      required: ["cardId", "text"],
    },
  },
  {
    name: "archive_card",
    description: "Archive a card",
    inputSchema: {
      type: "object",
      properties: {
        cardId: {
          type: "string",
          description: "ID of the card to archive",
        },
      },
      required: ["cardId"],
    },
  },
  {
    name: "archive_list",
    description: "Archive a list",
    inputSchema: {
      type: "object",
      properties: {
        listId: {
          type: "string",
          description: "ID of the list to archive",
        },
      },
      required: ["listId"],
    },
  },
  {
    name: "delete_board",
    description: "Delete a board",
    inputSchema: {
      type: "object",
      properties: {
        boardId: {
          type: "string",
          description: "ID of the board to delete",
        },
      },
      required: ["boardId"],
    },
  },
  {
    name: "update_list_name",
    description: "Update a list name",
    inputSchema: {
      type: "object",
      properties: {
        listId: {
          type: "string",
          description: "ID of the list to be updated",
        },
        name: {
          type: "string",
          description: "New name of the card",
        },
      },
      required: ["listId", "name"],
    },
  },
  {
    name: "update_card_name",
    description: "Update a card name",
    inputSchema: {
      type: "object",
      properties: {
        cardId: {
          type: "string",
          description: "ID of the card to be updated",
        },
        name: {
          type: "string",
          description: "New name of the card",
        },
      },
      required: ["cardId", "name"],
    },
  },
];
