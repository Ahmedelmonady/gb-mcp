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

## Available Tools (53)

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

### Redemption Options (6)

| Tool | Description |
|---|---|
| `get-redemption-options` | List all redemption rules (slim: id, name, type, points, isVisible) |
| `get-redemption-option` | Full details for a single rule by ID |
| `create-redemption-option` | Create new rule (fixed, percentage, free shipping, free product, custom) |
| `update-redemption-option` | Update an existing rule by ID |
| `toggle-redemption-option-activation` | Activate/deactivate a rule by ID |
| `delete-redemption-option` | Delete a rule by ID (General rule protected) |

### Customers (7)

| Tool | Description |
|---|---|
| `get-customers` | List customers with pagination and 18 filter types |
| `get-customers-count` | Aggregate customer counts (total, active, inactive) — same parameter shape as `get-customers` (pageNo/pageSize accepted but ignored) |
| `get-customer-details` | Get full customer profile by ExternalId (customerId) |
| `add-customer-points` | Add points or currency amount to a customer's balance |
| `deduct-customer-points` | Deduct points or currency amount from a customer's balance |
| `assign-customer-tags` | Assign tags to one or more customers by Gameball IDs |
| `remove-customer-tags` | Remove tags from one or more customers by Gameball IDs |

### Earning (8)

| Tool | Description |
|---|---|
| `get-earning-config` | Read general earning config (rates, currency, expiry, pending, shipping/tax exclusions) |
| `update-earning-config` | Update general earning config |
| `get-earning-rules` | List default earning rules |
| `update-earning-rules` | Update default earning rules |
| `create-custom-earning-rule` | Create a custom earning rule with one of 3 reward modes |
| `get-custom-earning-rules` | List custom earning rules |
| `update-custom-earning-rule` | Update a custom earning rule |
| `delete-custom-earning-rule` | Delete a custom earning rule |

### Widget Settings (5)

Requires **both** `widget:read` and `widget:write` scopes. Always call `get-widget-settings` first — updates use AutoMapper merge, so nulls wipe existing values.

| Tool | Description |
|---|---|
| `get-widget-settings` | Full widget config: branding, general, guest, feature toggles |
| `update-widget-style` | Update branding: colors, theme, fonts, icons, launcher button |
| `update-widget-settings` | Update general + guest: visibility, features, referral, messaging, links |
| `update-widget-sorting` | Update campaign, quest, and redemption sorting preferences |
| `update-supported-languages` | Add, remove, or change default language (GET languages first, modify, pass back) |

### Reward Campaigns (16)

Template-first flow: call `get-campaign-template` to get a full seed-data template with all defaults, modify only the fields the user wants, then call the appropriate grouped create tool. This mirrors the dashboard's exact creation flow.

| Tool | Description |
|---|---|
| `get-campaign-template` | Fetch seed template by type name (e.g., "SpinTheWheel", "Quiz"). Returns full object with all defaults. |
| `get-reward-campaigns` | List campaigns with pagination + dashboard-parity filters (cdate, cname, dname, frubies, points, status, visibility, behavior, activation, repeatability, notifyStatus, emailStatus) |
| `get-reward-campaigns-count` | Aggregate count of campaigns matching the filter — same parameter shape as `get-reward-campaigns` (pageNo/pageSize accepted but ignored) |
| `get-reward-campaigns-stats` | List campaigns with **per-campaign achievement counts pre-aggregated** in one call (`numberAchievements`, `numberPlayersAchieved`). Use for ranking questions like "campaign with most achievements" instead of N+1-ing the count tool. |
| `get-reward-campaign` | Full details for a single campaign by ID |
| `get-reward-campaign-customers` | List achievement records on a specific campaign (mirrors dashboard insights/rewards-customers-list). Returns winners + NoLuck losers by default; pass `success eq true` in filter for winners only on game campaigns |
| `get-reward-campaign-customers-count` | Count of achievement records on a specific campaign — same parameter shape; pass `success eq true` for winners only |
| `create-game-campaign` | Create game campaigns: SpinTheWheel, SlotMachine, ScratchAndWin, Quiz, MatchCards, Catcher, TicTacToe, SpaceShooter, Puzzle, TapTheTarget, DrivingGame |
| `create-event-campaign` | Create event-triggered campaigns: EventBased (from scratch) or SpendingMilestone (from template) |
| `create-date-campaign` | Create date-triggered campaigns: DateBased (birthday, join date, custom attributes) |
| `create-mission` | Create mission campaigns: NonSequentialMission (tasks in any order) |
| `create-calendar-campaign` | Create calendar campaigns: parent container + child campaigns per day (two-step) |
| `create-newsletter` | Create newsletter subscription campaigns (must create inactive) |
| `update-reward-campaign` | Update an existing campaign by ID (GET first, modify, pass back) |
| `toggle-reward-campaign-activation` | Activate/deactivate a campaign by ID |
| `delete-reward-campaign` | Delete a campaign and all child entities by ID |

### Analytics (1)

| Tool | Description |
|---|---|
| `get_analytics_chart` | Fetch one analytics chart from gb-advanced-analytics. The tool description carries a structured catalog of 90 charts across 8 dashboard pages, each labeled with chart type (`card` / `line` / `bar` / `pie` / `heatmap` / `table`) and a `supportsTimeGrouping` flag. The AI uses that flag to decide whether to offer `groupingType`. Tag and campaign filters require name → ID resolution via `get_tags` and `get_reward_campaigns` first. MCP layer maps friendly chart name → technical chartName before calling the backend. Required: `chartName`, `from`, `to` (the AI must gather all three from the user before calling). |

Scope: `analytics:read`

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
