# Gameball MCP Server

MCP (Model Context Protocol) server for managing Gameball loyalty program configuration via AI agents. Authenticates using Personal Access Tokens (PATs) generated from the Gameball dashboard.

## Setup

```bash
npm install
npm run build
```

## Configuration

| Environment Variable | Required | Description |
|---|---|---|
| `GAMEBALL_PAT_TOKEN` | Yes | Personal Access Token (starts with `gbpat_`) generated from Settings > Account Integration |
| `GAMEBALL_BASE_URL` | No | API base URL. Defaults to `https://api.gameball.co` |

## Usage

### Claude Desktop / Claude Code

Add to your MCP config (`~/.claude/settings.json` or Claude Desktop config):

```json
{
  "mcpServers": {
    "gameball": {
      "command": "node",
      "args": ["/path/to/gameball-mcp/build/index.js"],
      "env": {
        "GAMEBALL_PAT_TOKEN": "gbpat_your_token_here",
        "GAMEBALL_BASE_URL": "https://api.gameball.co"
      }
    }
  }
}
```

### Direct

```bash
GAMEBALL_PAT_TOKEN=gbpat_xxx node build/index.js
```

## Available Tools (0)

Toolsets are added in subsequent commits — utils, program, tiers, redemption, reward campaigns, widget, earning, customers.

## Authentication

All API calls use the `X-GB-Access-Token` header with the PAT provided via the `GAMEBALL_PAT_TOKEN` environment variable. The PAT is validated by the Gameball API on every request — scoped to the client that created the token.

## Architecture

```
AI Agent (Claude, Cursor, etc.)
  +-- MCP Protocol (stdio)
        +-- gameball (this server)
              +-- HTTP (X-GB-Access-Token header)
                    +-- Gameball API (/api/v4.0/mcp/*)
                          +-- GlobalFilter (PAT auth + scope check)
                                +-- Dashboard Controllers (delegated)
```

## Development

```bash
npm run dev    # Watch mode (recompiles on change)
npm run build  # One-time build
npm start      # Run the server
```
