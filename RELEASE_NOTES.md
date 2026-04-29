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

### VIP Tiers (2 tools)

| Tool | What it does |
|---|---|
| `get_tiers` | List VIP tiers with IDs, names, order, and score thresholds |
| `get_tier_details` | Get full details for a single tier — includes reward configurations (benefits), locales, icon |

Used by Customers (filter by tier), Campaigns (audience targeting), Redemption (tier-specific rules), Earning (tier children).

Scope: `vip-tiers:read`, `customers:read`

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

Dependencies: Utils (languages, tags, collections, merchants)

Scope: `redemption:read`, `redemption:write`

---

### Reward Campaigns (16 tools)

| Tool | What it does |
|---|---|
| `get_campaign_template` | Fetch seed template by type name |
| `get_reward_campaigns` | List campaigns with pagination + dashboard-parity filters |
| `get_reward_campaigns_count` | Aggregate count of campaigns matching the filter |
| `get_reward_campaigns_stats` | List campaigns with **per-campaign achievement counts pre-aggregated** in one call (`numberAchievements`, `numberPlayersAchieved`). Solves the N+1 problem of looping `get_reward_campaign_customers_count` per campaign — wraps the dashboard's `Statistics` endpoint that joins the `Achievement` table once for the whole page. |
| `get_reward_campaign` | Get full details for a single campaign |
| `get_reward_campaign_customers` | List achievement records on a specific campaign (winners + NoLuck losers by default; pass `success eq true` in filter for winners only on game campaigns) |
| `get_reward_campaign_customers_count` | Count of achievement records — same filter set; pass `success eq true` for winners only |
| `create_game_campaign` | Create game campaigns (11 game types) |
| `create_event_campaign` | Create event-triggered campaigns |
| `create_date_campaign` | Create date-triggered campaigns |
| `create_mission` | Create non-sequential mission campaigns |
| `create_calendar_campaign` | Create multi-day calendar campaigns |
| `create_newsletter` | Create newsletter subscription campaigns |
| `update_reward_campaign` | Update any existing campaign |
| `toggle_reward_campaign_activation` | Activate or deactivate a campaign |
| `delete_reward_campaign` | Delete a campaign |

#### Supported Filters on `get_reward_campaigns` (mirrors dashboard rewards-list)

| Filter | Syntax | Value Type |
|---|---|---|
| Created after / before | `cdate ge/le` | ISO date |
| Campaign name | `cname in {text}` | Contains match |
| Display name | `dname in {text}` | Contains match |
| Rank Points >= / <= | `frubies ge/le` | Integer |
| Wallet Points >= / <= | `points ge/le` | Integer |
| Active status | `status eq {bool}` | true/false |
| Visibility | `visibility eq {1\|2\|3}` | 1=Always, 2=Not, 3=If Earned |
| Behavior type | `behavior eq {id}` | Behavior enum (14 dashboard-exposed IDs: 4, 5, 7, 8, 9, 10, 11, 12, 15, 17, 18, 19, 20, 21) |
| Activation Settings | `activation eq {1\|2}` | 1=Always Active, 2=Scheduled |
| Repeatability | `repeatability eq {-1\|N}` | -1=Unlimited, N=occurrence count |
| In-App Notification Status | `notifyStatus eq {1\|2\|3}` | 1=Global, 2=On, 3=Off |
| Email Notification Status | `emailStatus eq {1\|2\|3}` | 1=Global, 2=On, 3=Off |

Filters use AND logic, separated by `;f;`. Example: `status eq true;f;behavior eq 15;f;cname in welcome`

#### Supported Filters on `get_reward_campaign_customers` (mirrors dashboard insights/rewards-customers-list page)

| Filter | Syntax | Value Type |
|---|---|---|
| External ID | `id in {text}` | Contains match |
| Display name | `name in {text}` | Contains match |
| Email | `email in {text}` | Contains match |
| Reward Points >= / <= | `points ge/le` | Integer |
| Reward Frubies >= / <= | `frubies ge/le` | Integer |
| Achieved after / before | `cdate ge/le` | ISO date |
| Tags | `tags in {id,id}` | Comma-separated tag IDs |
| Game success | `success eq {bool}` | true=won (not NoLuck), false=NoLuck |
| Voucher product | `voucherpname in {text}` | Contains match |
| Voucher discount >= / <= | `voucherdicount ge/le` | Number |
| Free shipping voucher | `vouchershipping sl {any}` | Marker |
| Merchant name | `mname in {text}` | Contains match |
| Branch name | `bname in {text}` | Contains match |
| Merchant IDs | `merchants id {id,id}` | Comma-separated |
| Branch IDs | `branches id {id,id}` | Comma-separated |
| Achievement rank IDs | `rank in {id,id}` | Comma-separated |

#### Supported Campaign Types (17)

| ID | Type | Tool | Template | Category |
|---|---|---|---|---|
| 15 | Spin The Wheel | `create_game_campaign` | Yes | Luck-based Game |
| 18 | Slot Machine | `create_game_campaign` | Yes | Luck-based Game |
| 21 | Scratch & Win | `create_game_campaign` | Yes | Luck-based Game |
| 19 | Quiz | `create_game_campaign` | Yes (no questions) | Skill-based Game |
| 22 | Match Cards | `create_game_campaign` | Yes | Skill-based Game |
| 23 | Catcher | `create_game_campaign` | Yes | Skill-based Game |
| 26 | Tic Tac Toe | `create_game_campaign` | Yes | Skill-based Game |
| 27 | Space Shooter | `create_game_campaign` | Yes | Skill-based Game |
| 28 | Puzzle | `create_game_campaign` | Yes | Skill-based Game |
| 29 | Tap The Target | `create_game_campaign` | Yes | Skill-based Game |
| 30 | Driving Game | `create_game_campaign` | Yes | Skill-based Game |
| 9 | EventBased | `create_event_campaign` | No (from scratch) | Event-triggered |
| 32 | Spending Milestone | `create_event_campaign` | Yes | Event-triggered |
| 33 | DateBased | `create_date_campaign` | Yes | Date-triggered |
| 31 | Non-Sequential Mission | `create_mission` | Yes | Mission |
| 20 | Calendar Campaign | `create_calendar_campaign` | Yes (parent + children) | Calendar |
| 17 | Newsletter | `create_newsletter` | Yes | Newsletter |

#### Supported Reward Types

Points, Fixed Discount ($X off), Percentage Discount (X% off), Free Shipping, Free Product, Custom Coupon, No Luck (games)

Dependencies: Utils (events, languages, tags, attributes)

Scope: `reward-campaigns:read`, `reward-campaigns:write`

---

### Widget Settings (5 tools)

| Tool | What it does |
|---|---|
| `get_widget_settings` | Read full widget config: branding, general, guest, feature toggles |
| `update_widget_style` | Update branding: colors, theme, fonts, icons, launcher button (MUST send ALL style fields) |
| `update_widget_settings` | Update general + guest: visibility, features, referral, messaging (partial update OK) |
| `update_widget_sorting` | Update campaign, quest, and redemption sorting preferences |
| `update_supported_languages` | Add, remove, or change default language |

Dependencies: Utils (languages)

Scope: `widget:read`, `widget:write`

---

## Summary

### Earning Rules (8 tools)

| Tool | What it does |
|---|---|
| `get_earning_config` | Read general earning config (rates, currency, expiry, pending, shipping/tax exclusions) |
| `update_earning_config` | Update general earning config |
| `get_earning_rules` | List default earning rules |
| `update_earning_rules` | Update default earning rules |
| `create_custom_earning_rule` | Create a custom earning rule with one of 3 reward modes |
| `get_custom_earning_rules` | List custom earning rules |
| `update_custom_earning_rule` | Update a custom earning rule |
| `delete_custom_earning_rule` | Delete a custom earning rule |

Scope: `earning:read`, `earning:write`

---

### Customers (7 tools)

| Tool | What it does |
|---|---|
| `get_customers` | List customers with pagination and 18 filter types |
| `get_customers_count` | Aggregate customer counts (total, active, inactive) matching the same filter syntax as get_customers |
| `get_customer_details` | Get full customer profile by ExternalId (customerId) |
| `add_customer_points` | Add points or currency amount to a customer's balance |
| `deduct_customer_points` | Deduct points or currency amount from a customer's balance |
| `assign_customer_tags` | Assign tags to one or more customers by Gameball IDs |
| `remove_customer_tags` | Remove tags from one or more customers by Gameball IDs |

#### Supported Filters (18)

| Filter | Syntax | Value Type |
|---|---|---|
| External ID | `id in {text}` | Contains match |
| Display name | `name in {text}` | Contains match |
| Phone | `phone in {text}` | Contains match |
| Email | `email in {text}` | Contains match |
| Tier | `level in {id,id}` | Comma-separated tier IDs |
| Points >= / <= / range | `points ge/le/between` | Integer |
| Pending points >= / <= / range | `ppoints ge/le/between` | Integer |
| Score >= / <= / range | `frubies ge/le/between` | Integer |
| Created after / before | `cdate ge/le` | ISO date |
| Active status | `active eq {bool}` | true/false |
| Guest status | `isguest eq {bool}` | true/false |
| Tags | `tags in {id,id}` | Comma-separated tag IDs |

Filters use AND logic, separated by `;f;`. Example: `level in 1464;f;points ge 100;f;active eq true`

Dependencies: Utils (tags), Tiers (tier IDs for filter)

Scope: `customers:read`, `customers:write`

---

### Analytics (1 tool)

| Tool | What it does |
|---|---|
| `get_analytics_chart` | Fetch one analytics chart from gb-advanced-analytics — covers 90 named charts grouped across 8 dashboard pages |

The tool exposes the chart catalog as a friendly-name `chartName` enum. The MCP layer maps each friendly name (e.g. `"Top Achieved Campaigns"`) to the technical chartName (`top_achieved_campaigns`) before calling the backend, which forwards the request to gb-advanced-analytics' `/internal/analytics/dashboard/query` endpoint via the existing `IAdvancedAnalyticsService`.

#### Required vs optional parameters

| Param | Required? | The AI's behavior |
|---|---|---|
| `chartName` | required | enum of 90 friendly names, echo back to user |
| `from`, `to` | required | always ask the user for a date range, convert relative terms to ISO 8601 |
| `tag` | optional, universal | offer when user mentions a segment by name; resolve name → ID via `get_tags` first (same pattern as event-id resolution) |
| `groupingType` | optional, per-chart | offer ONLY on charts where Time grouping = `yes` |
| `aggregationType` | optional, almost-never | each chart has a default, override only on explicit user request |
| `challengeId` | optional, narrow | only meaningful on a few campaign-related charts; resolve campaign name → ID via `get_reward_campaigns` first |

#### Catalog metadata (per-chart)

Each chart entry in the tool description carries: `human` name, `technical` name, `type` (`card` / `line` / `bar` / `pie` / `heatmap` / `table`), `page`, `supportsTimeGrouping`. Sources kept in sync with:

- chart **type** ← `gb-frontend-v2` `chartConfigs.ts`
- **time grouping** support ← `gb-advanced-analytics` `ChartMappings.ChartToGroup` default
- technical-name allowlist ← `g-backend-v2` `AnalyticsChartCatalog.cs`

#### Charts by page

| Page | Count | Examples |
|---|---|---|
| Member Analytics | 11 | Enrolled Members (card), Member Growth (line), Retention Cohort (heatmap) |
| Purchase Behavior | 13 | Attributed Sales (card), Average Order Value AOV (card), Customer LTV by Segment (line) |
| Points & Rewards | 32 | Total Available Points (card), Redemption Rate (bar), Coupon Usage Rate (card), Top Issued Coupons (bar) |
| Campaign Performance | 8 | Reward Campaign Reach (card), Top Achieved Campaigns (bar), Campaigns Cost in Points Trend (line) |
| Referral Analytics | 6 | Pending Referrals (card), Successful Referrals Rate (bar), Top Referring Customers (bar) |
| Tiers Performance | 14 | Tier Upgrade Percentage (card), Tier Transition Trends (line), Revenue per Tier (bar), Tier Performance Prediction (table) |
| Redemption Options | 5 | Redemption Options Performance (table), Average Burn Rate (card) |
| Home Analytics | 1 | Home Revenue Distribution (table) |

#### Routing

`gameball-mcp` → `g-backend-v2` `/api/v4.0/mcp/analytics/query` (PAT auth + `analytics:read` scope) → server-to-server HTTP → `gb-advanced-analytics` `/internal/analytics/dashboard/query` (no JWT, `clientId` query param).

Scope: `analytics:read`

---

**53 tools** across 9 modules: Program (2), Utils (6), Tiers (2), Redemption (6), Campaigns (16), Widget (5), Earning (8), Customers (7), Analytics (1)
