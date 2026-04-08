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

---

### Reward Campaigns (12 tools)

| Tool | What it does |
|---|---|
| `get_campaign_template` | Fetch seed template by type name |
| `get_reward_campaigns` | List all campaigns |
| `get_reward_campaign` | Get full details for a single campaign |
| `create_game_campaign` | Create game campaigns (11 game types) |
| `create_event_campaign` | Create event-triggered campaigns |
| `create_date_campaign` | Create date-triggered campaigns |
| `create_mission` | Create non-sequential mission campaigns |
| `create_calendar_campaign` | Create multi-day calendar campaigns |
| `create_newsletter` | Create newsletter subscription campaigns |
| `update_reward_campaign` | Update any existing campaign |
| `toggle_reward_campaign_activation` | Activate or deactivate a campaign |
| `delete_reward_campaign` | Delete a campaign |

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
| 20 | Calendar Campaign | `create_calendar_campaign` | Yes | Calendar |
| 17 | Newsletter | `create_newsletter` | Yes | Newsletter |

#### Replaced Campaign Types (not supported — use modern equivalents)

| Legacy Type | Replaced By |
|---|---|
| AmountBased | EventBased |
| ActionBased | EventBased |
| HighScore | EventBased |
| UponLogin | EventBased |
| NonCumulativeAmountBased | EventBased |
| SocialActivities | EventBased |
| Birthday | DateBased |
| JoinAnniversary | DateBased |

#### Not Supported via MCP

| Type | Reason |
|---|---|
| ScheduledChallenge | Requires backend automation entity setup |
| DailyStreak | Requires backend automation entity setup |
| PointsMultiplier | Requires backend automation entity setup |
| ActionStreak | Requires backend automation entity setup |
| SequentialMission | Requires backend automation entity setup |
| AutomationRewardBadge | System-created only |
| ManualChallenge | Staff-only award via dashboard |

#### Supported Reward Types (all campaigns)

| Reward Type | Description |
|---|---|
| Points | Any amount of loyalty points |
| Fixed Discount | $X off coupon |
| Percentage Discount | X% off coupon |
| Free Shipping | Free shipping coupon |
| Free Product | Specific product by ID |
| Custom Coupon | Third-party coupon by group handle |
| No Luck | Consolation outcome (games only) |

#### Supported Audience Targeting

| Target | How |
|---|---|
| All customers | Default (omit audience rules) |
| Registered only | AccountState filter |
| Anonymous/guest only | AccountState filter |
| By tag/segment | Tag ID with In/NotIn operator |
| By customer attribute | Attribute key + operator + value |
| Combined rules | Up to 5 rules with AND/OR logic |

Scope: `reward-campaigns:read`, `reward-campaigns:write`

---

### Widget Settings (5 tools)

| Tool | What it does |
|---|---|
| `get_widget_settings` | Read full widget config: branding, general, guest, feature toggles |
| `update_widget_style` | Update branding: colors, theme, fonts, icons, launcher button |
| `update_widget_settings` | Update general + guest: visibility, features, referral, messaging |
| `update_widget_sorting` | Update campaign, quest, and redemption sorting preferences |
| `update_supported_languages` | Add, remove, or change default language |

Scope: `widget:read`, `widget:write`

---

### Earning Rules (5 tools)

| Tool | What it does |
|---|---|
| `get_earning_config` | Read general earning config (rates, currency, expiry, pending, shipping/tax exclusions) |
| `update_earning_config` | Update earning config — partial update, send only fields to change |
| `get_earning_rules` | Read cashback type and conditions (which orders earn points) |
| `update_earning_rules` | Update cashback type and conditions |
| `create_custom_earning_rule` | Create custom earning rules with merchant/collection/channel conditions |

Custom rule modes: Percentage (X% cashback), Per unit (X points per $Y), Fixed (flat X points per order)

Supported conditions: Merchant, Branch, Collection, Category, Vendor, SKU, Tags, Channel, Custom order fields

Scope: `earning-rules:read`, `earning-rules:write`
