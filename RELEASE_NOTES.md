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

### Utils / Discovery (7 tools)

| Tool | What it does |
|---|---|
| `get_supported_languages` | List client's languages with IDs, codes, and direction |
| `get_collections` | List product collections for restriction rules |
| `get_tags` | List tags (1=Internal, 2=Segment, 3=RFM, 4=Custom) for audience targeting |
| `get_customer_attributes` | List custom customer attributes with data types |
| `get_events` | List events (triggers) with metadata fields for campaign creation |
| `get_merchants` | List merchants with ExternalIds, names, and branches |
| `get_levels` | List VIP tiers with IDs, names, order, and score thresholds |

Multi-scope: each tool accepts any relevant scope (e.g., `get_tags` works with `reward-campaigns:read` OR `customers:read`)

---

### Redemption Options (6 tools)

| Tool | What it does |
|---|---|
| `get_redemption_options` | List all redemption rules |
| `get_redemption_option` | Get full details for a single rule |
| `create_redemption_option` | Create new rule with audience, collections, merchants, localized names |
| `update_redemption_option` | Update an existing rule |
| `toggle_redemption_option_activation` | Activate or deactivate a rule |
| `delete_redemption_option` | Delete a rule |

#### Supported Redemption Rule Types

| Rule Type | Key | Description |
|---|---|---|
| Fixed Rate Discount | `fixed_rate_settings` | Fixed currency discount (e.g., $5 off) |
| Percentage Discount | `percentage_discount_settings` | Percentage off (1-100%) with optional capping |
| Free Shipping | `free_shipping_settings` | Free shipping coupon |
| Free Product | `free_product_settings` | Specific product by ID |
| Custom | `custom` | Third-party coupon by group handle |

All rules support: audience targeting, collection/merchant restrictions, localized reward names, coupon expiry, usage limits, cashback mode, platform targeting.

Scope: `redemption:read`, `redemption:write`
