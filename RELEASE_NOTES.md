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

## Server-level instructions

The MCP server ships a `SERVER_INSTRUCTIONS` block to the client during the initialize handshake (`src/index.ts`). The instructions apply to **every tool in every toolset** and the LLM honors them across the whole session. Five sections:

1. **Conversational style** — ask one or two related questions at a time, show progress, echo answers back, no silent stretches, friendly names not raw IDs.
2. **Don't ask irrelevant questions** — skip prompts that don't apply to the specific object/operation; respect documented defaults instead of pestering.
3. **Confirm before acting** — plain-language summary before any write op; double-confirm on destructive ops (delete / deactivate / deduct points / program off).
4. **Read state before mutating** — call the matching `get_*` tool first for toggle / update / delete; never build update payloads from scratch.
5. **Output style** — friendly readable summary, not raw JSON; one-sentence answer for counts.

Toolset-specific overrides remain in their files (e.g. `tools/shared.ts` `CORE_REQUIRED` carries the campaign-type SKIP rules: games have no triggers, dates trigger by attribute, single-occurrence types have no repeatability, newsletter must be inactive, redirection button only for EventBased / DateBased / CalendarCampaign).

---

## Conventions

- **List/count interface parity** — every list/count tool pair shares the exact same input shape. `pageNo` and `pageSize` are accepted on count tools too (for parity) but ignored — count is a single number, pagination doesn't apply.
- **Filter syntax** — `;f;`-delimited AND-combined filters, identical to what the dashboard sends. URL captured from a filtered dashboard page is byte-identical to the MCP `filter` argument.

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

---

## Summary

**8 tools** across 2 modules: Program (2), Utils (6)
