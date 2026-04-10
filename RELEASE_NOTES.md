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

#### Supported Reward Types

Points, Fixed Discount ($X off), Percentage Discount (X% off), Free Shipping, Free Product, Custom Coupon, No Luck (games)

#### Supported Audience Targeting

All customers, Registered only, Anonymous/guest only, By tag/segment (In/NotIn), By customer attribute (Equals/Contains/GreaterThan/etc.), Combined rules (max 5, AND/OR logic)

#### Not Supported (legacy / cross-service)

| Type | Reason |
|---|---|
| AmountBased, ActionBased, HighScore, UponLogin, NonCumulativeAmountBased, SocialActivities | Replaced by EventBased |
| Birthday, JoinAnniversary | Replaced by DateBased |
| ScheduledChallenge, DailyStreak, PointsMultiplier, ActionStreak, SequentialMission | Backend automation entity setup required |
| AutomationRewardBadge, ManualChallenge | System-only / staff-only |

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
