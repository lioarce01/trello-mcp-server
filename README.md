# Trello MCP Agent

Este agente MCP permite interactuar con la API de Trello para listar tableros, crear tarjetas, y otras operaciones relacionadas.

---

## Requisitos previos

- Tener configuradas las variables de entorno `TRELLO_API_KEY` y `TRELLO_TOKEN` para autenticación con la API de Trello.
- Tener instalado y configurado Docker con la imagen `trello-mcp`.

---

## Configuración

El agente se ejecuta dentro de un contenedor Docker. Asegúrate de que en tu configuración (`settings.json`) tengas algo similar:

```json
"mcp": {
  "servers": {
    "trello": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e", "TRELLO_API_KEY=tu_api_key",
        "-e", "TRELLO_TOKEN=tu_token",
        "trello-mcp"
      ]
    }
  }
}
```

## Ejemplos de uso

Listar tableros
Realiza una llamada RPC para obtener la lista de tableros asociados a tu cuenta de Trello:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "callTool",
  "params": {
    "tool_id": "listBoards"
  }
}
```
