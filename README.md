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

## Available Tools (10)

### Program (2)

| Tool | Description |
|---|---|
| `get-program-activation` | Check if the loyalty program is active (GbEnabled) |
| `toggle-program-activation` | Enable/disable the entire loyalty program |

### Discovery / Utils (6)

| Tool | Description |
|---|---|
| `get-supported-languages` | Client's supported languages with IDs, codes, direction |
| `get-collections` | Product collections with collectionId for restriction rules |
| `get-tags` | Tags, segments, RFM with IDs and types for audience targeting |
| `get-customer-attributes` | Custom customer attributes with keys and data types |
| `get-events` | Events (triggers) with metadata fields and IDs for campaign creation |
| `get-merchants` | Merchants with ExternalIds, names, and branches |

### VIP Tiers (2)

| Tool | Description |
|---|---|
| `get-tiers` | List VIP tiers with IDs, names, order, and score thresholds |
| `get-tier-details` | Full details for a single tier — includes reward configurations (benefits), locales, icon |

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
