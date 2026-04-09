# Gameball MCP Server — Release Notes

## Architecture

```
AI Agent (Claude, Cursor, etc.)
  |-- MCP Protocol (stdio)
        |-- gameball-mcp (this server)
              |-- HTTP (X-GB-Access-Token header)
                    |-- Gameball API (/api/v4.0/mcp/*)
                          |-- GlobalFilter (PAT auth + scope check)
                                |-- Dashboard Controllers (delegated)
```

All operations go through the same backend controllers the dashboard uses — identical validation, cache invalidation, and audit logging.

## Setup

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

- `GAMEBALL_PAT_TOKEN` — required. Personal Access Token from Settings > Account Integration.
- `GAMEBALL_BASE_URL` — optional. The Gameball API base URL.

---

## Modules

### Program (2 tools)

| Tool | What it does |
|---|---|
| `get_program_activation` | Check if the loyalty program is active |
| `toggle_program_activation` | Enable or disable the entire loyalty program |

Scope: `program:read`, `program:write`

---

### Utils / Discovery (6 tools)

| Tool | What it does |
|---|---|
| `get_supported_languages` | List client's languages with IDs, codes, and direction |
| `get_collections` | List product collections for restriction rules |
| `get_tags` | List tags (1=Internal, 2=Segment, 3=RFM, 4=Custom) for audience targeting |
| `get_customer_attributes` | List custom customer attributes with data types |
| `get_events` | List events (triggers) with metadata fields for campaign creation |
| `get_merchants` | List merchants with ExternalIds, names, and branches |

Multi-scope: each tool accepts any relevant scope (e.g., `get_tags` works with `reward-campaigns:read` OR `customers:read`)
