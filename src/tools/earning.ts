import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { EarningAPI } from "../api/earning.js";
import { UPDATE_FLOW } from "./shared.js";

export function registerEarningTools(server: McpServer, api: EarningAPI): void {
  server.registerTool("get_earning_config", {
    title: "Get Earning Config",
    description:
      "Returns the general earn-points configuration — how many points customers earn per dollar spent, currency, expiry, pending period, and fee/tax exclusions. This is the base earning rule (singleton per client, not a list).",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getEarningConfig();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_earning_config", {
    title: "Update Earning Config",
    description: `Updates the general earn-points configuration. Send ONLY the fields you want to change — backend loads current and merges. ALWAYS call get-earning-config first to show the user the current state.

${UPDATE_FLOW}

**User prompting — this MUST be an interactive process:**
1. Call get-earning-config and present the current settings in friendly language
2. Ask: "What would you like to change?" — do NOT assume what to change
3. Walk through ONLY the settings the user wants to modify
4. Show a summary of changes before submitting (current value → new value)
5. Confirm: "Ready to apply these changes?"

**WARNING:** Changing currency propagates to ALL rules and the widget — always confirm with the user before modifying currency fields.

Available fields:
- amountRewardThreshold (number) — minimum order amount to earn points (e.g., 1.0 = earn on orders >= $1)
- rewardWalletFactor (number) — wallet points earned per $1 spent (e.g., 1.0 = 1 point per $1)
- rewardRankFactor (number) — score points earned per $1 spent
- redemptionFactor (number) — points needed per $1 of redemption value
- currency (string) — ISO currency code (e.g., "USD", "SAR")
- currencySymbol (string) — display symbol (e.g., "$", "SAR")
- isUsingCurrencySymbol (bool) — true = show symbol, false = show code
- pointsExpiry (int) — days until points expire (0 = never expire)
- pointsPendingDays (int) — return window in days before points become available (pending period)
- isPointsRewardOn (bool) — master toggle for earning points
- isPointsRedemptionOn (bool) — master toggle for redeeming points
- excludeNonProductCosts (bool) — true = exclude shipping and non-product costs from earning calculation
- excludeTaxes (bool) — true = exclude taxes from earning calculation
- holdPointsInMinutes (int) — hold duration in minutes (1-21600)`,
    inputSchema: {
      config: z.object({}).passthrough().describe("Partial earning config — only include fields to change."),
    },
    annotations: { idempotentHint: true },
  }, async ({ config }) => {
    const result = await api.updateEarningConfig(config);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_earning_rules", {
    title: "Get Earning Rules",
    description:
      "Returns the earning rules — cashback reward type (General/Exclude/Include) and dynamic conditions that control which orders earn points.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getEarningRules();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_earning_rules", {
    title: "Update Earning Rules",
    description: `Updates earning rules — which orders earn points. Send ONLY the fields you want to change. ALWAYS call get-earning-rules first to show the user the current state.

${UPDATE_FLOW}

**User prompting — this MUST be an interactive process:**
1. Call get-earning-rules and present the current configuration in friendly language
2. ASK: "Which orders should earn points?"
   - "All orders (General)" — cashbackRewardType=1
   - "All orders EXCEPT specific items (Exclude)" — cashbackRewardType=2
   - "ONLY specific items (Include)" — cashbackRewardType=3
3. If Exclude/Include: ASK "Which field to filter on?" — call get_merchants or get_collections to discover values
4. Show a summary of changes before submitting
5. Confirm before applying

Fields:
- cashbackRewardType (int) — 1=General (all orders earn), 2=Exclude (all except matching), 3=Include (only matching), 4=Merchant, 5=Custom
- items (array) — conditions for Exclude/Include/Custom. REPLACES the entire array (not a merge). Each item:
  - fieldPath (string) — the order field: "OrderLineItems.Collection", "Merchant.ExternalId", "Order.Channel", "OrderLineItems.Category", "OrderLineItems.Vendor", "OrderLineItems.Sku", "OrderLineItems.Tags", "Order.Extra.<fieldName>"
  - matchValue (string) — value to match, comma-separated for multiple (e.g., "POS,WEB" or "collection_123,collection_456")
  - operator (int) — 1=Equals, 2=NotEquals, 3=GreaterThan, 4=GreaterThanOrEqual, 5=LessThan, 6=LessThanOrEqual, 7=Contains, 8=NotContains, 9=Exists
  - logicalOperator (int) — 1=AND, 2=OR (how this condition combines with the next)
- collections (array) — product collections for Include/Exclude: [{ collectionId, collectionName }]`,
    inputSchema: {
      rules: z.object({}).passthrough().describe("Partial earning rules — only include fields to change. Pass complete items[] array if updating conditions."),
    },
    annotations: { idempotentHint: true },
  }, async ({ rules }) => {
    const result = await api.updateEarningRules(rules);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_custom_earning_rule", {
    title: "Create Custom Earning Rule",
    description:
      "Creates a custom earning rule with conditions (merchant, collection, channel, etc.) and a specific point reward.\n\n" +
      "**Config modes** (choose one):\n" +
      "- `percentage` — X% cashback of order amount. Set `walletCashback`.\n" +
      "- `per_unit` — X points per $Y spent. Set `rewardWalletFactor` and `amountRewardThreshold`.\n" +
      "- `fixed` — flat X points per qualifying order. Set `equivalentPoints`.\n\n" +
      "**Conditions** — define which orders qualify:\n" +
      "| Field Path | Description | Example matchValue |\n" +
      "|---|---|---|\n" +
      "| `Merchant.ExternalId` | Merchant ID(s) | `deraah` or `deraah,zara` |\n" +
      "| `Merchant.Branch.ExternalId` | Branch ID(s) | `branch_123` |\n" +
      "| `OrderLineItems.Collection` | Product collection(s) | `summer-sale` |\n" +
      "| `OrderLineItems.Category` | Product category | `Electronics` |\n" +
      "| `OrderLineItems.Vendor` | Vendor name | `Nike` |\n" +
      "| `OrderLineItems.Sku` | Product SKU(s) | `SKU-001,SKU-002` |\n" +
      "| `OrderLineItems.Tags` | Product tags | `new-arrival` |\n" +
      "| `Order.Channel` | Order channel | `WEB,POS` |\n" +
      "| `Order.Extra.<field>` | Custom order field | any value |\n\n" +
      "**Condition operators:** 1=Equals, 2=NotEquals, 7=Contains, 8=NotContains\n" +
      "**Logical operators** (between conditions): 1=AND, 2=OR\n\n" +
      "**Discovery tools — call these BEFORE creating to resolve IDs/values:**\n" +
      "- `get_merchants` — resolve merchant names to ExternalIds for `Merchant.ExternalId` conditions\n" +
      "- `get_collections` — resolve collection names to IDs for `OrderLineItems.Collection` conditions\n\n" +
      "**User prompting — this MUST be an interactive process:**\n" +
      "1. Ask: 'What should this rule be called?'\n" +
      "2. Ask: 'Which orders should qualify?' — call `get_merchants` or `get_collections` to show available options\n" +
      "3. Ask: 'How should customers be rewarded?' — explain the three options:\n" +
      "   - Percentage cashback (e.g. 5% of order amount)\n" +
      "   - Points per amount spent (e.g. 2 points per $10)\n" +
      "   - Fixed points per order (e.g. 1000 points flat)\n" +
      "4. Ask for the reward value based on the chosen mode\n" +
      "5. Show a friendly summary before creating: rule name, conditions, reward type + value\n" +
      "6. Confirm: 'Ready to create this custom earning rule?'",
    inputSchema: {
      ruleName: z.string().describe("Display name for the custom rule"),
      configMode: z.enum(["percentage", "per_unit", "fixed"]).describe("Reward mode: percentage (% cashback), per_unit (X points per $Y), fixed (flat points)"),
      walletCashback: z.number().optional().describe("Cashback percentage (percentage mode only, e.g. 5 = 5%)"),
      rewardWalletFactor: z.number().optional().describe("Points earned per threshold amount (per_unit mode only)"),
      amountRewardThreshold: z.number().optional().describe("Currency threshold for per_unit mode (e.g. 10 = per $10 spent). Default: 1"),
      equivalentPoints: z.number().int().optional().describe("Fixed points per qualifying order (fixed mode only)"),
      conditions: z.array(z.object({
        fieldPath: z.string().describe("The order field to match — e.g. 'Merchant.ExternalId', 'OrderLineItems.Collection', 'Order.Channel'"),
        matchValue: z.string().describe("Value(s) to match — comma-separated for multiple (e.g. 'deraah,zara')"),
        operator: z.number().optional().default(1).describe("1=Equals (default), 2=NotEquals, 7=Contains, 8=NotContains"),
        logicalOperator: z.number().optional().describe("How to combine with the next condition: 1=AND, 2=OR. Omit for last/only condition."),
      })).describe("Conditions defining which orders qualify for this rule"),
    },
    annotations: { openWorldHint: true },
  }, async ({ ruleName, configMode, walletCashback, rewardWalletFactor, amountRewardThreshold, equivalentPoints, conditions }) => {
    const result = await api.createCustomEarningRule({
      ruleName, configMode, walletCashback, rewardWalletFactor, amountRewardThreshold, equivalentPoints, conditions,
    });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_custom_earning_rules", {
    title: "Get Custom Earning Rules",
    description:
      "Lists all custom earning rules for the client — returns each rule's name, config mode, conditions, and reward values.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getCustomEarningRules();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_custom_earning_rule", {
    title: "Update Custom Earning Rule",
    description:
      "Updates an existing custom earning rule. ALWAYS call `get_custom_earning_rules` first to get the full object with IDs — " +
      "updates require the complete object. Modify the fields you need, then pass the full object back.\n\n" +
      "**User prompting:** Show current rule state, ask what to change, confirm before applying.",
    inputSchema: {
      rule: z.object({}).passthrough().describe("Full ClientPointsSettingViewModel with entity IDs preserved — get from get_custom_earning_rules, modify, pass back."),
    },
    annotations: { idempotentHint: true },
  }, async ({ rule }) => {
    const result = await api.updateCustomEarningRule(rule);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("delete_custom_earning_rule", {
    title: "Delete Custom Earning Rule",
    description:
      "Deletes a custom earning rule by its rule name. This removes the rule and all tier-specific children with the same name.\n\n" +
      "**User prompting:** ALWAYS confirm before deleting — 'Are you sure you want to delete the custom earning rule [name]? This action is irreversible.'",
    inputSchema: {
      ruleName: z.string().describe("The exact rule name to delete (from get_custom_earning_rules)."),
    },
    annotations: { destructiveHint: true },
  }, async ({ ruleName }) => {
    const result = await api.deleteCustomEarningRule(ruleName);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });
}
