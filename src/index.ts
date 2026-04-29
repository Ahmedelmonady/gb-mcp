#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { GameballAPIClient } from "./api/client.js";
import { UtilsAPI } from "./api/utils.js";
import { ProgramAPI } from "./api/program.js";
import { TiersAPI } from "./api/tiers.js";
import { RedemptionAPI } from "./api/redemption.js";
import { CampaignsAPI } from "./api/campaigns.js";
import { WidgetAPI } from "./api/widget.js";
import { EarningAPI } from "./api/earning.js";
import { CustomersAPI } from "./api/customers.js";
import { AnalyticsAPI } from "./api/analytics.js";
import { registerUtilsTools } from "./tools/utils.js";
import { registerProgramTools } from "./tools/program.js";
import { registerTierTools } from "./tools/tiers.js";
import { registerRedemptionTools } from "./tools/redemption.js";
import { registerCampaignTools } from "./tools/campaigns.js";
import { registerWidgetTools } from "./tools/widget.js";
import { registerEarningTools } from "./tools/earning.js";
import { registerCustomerTools } from "./tools/customers.js";
import { registerAnalyticsTools } from "./tools/analytics.js";

const GAMEBALL_TOKEN = process.env.GAMEBALL_PAT_TOKEN;
const GAMEBALL_BASE_URL = process.env.GAMEBALL_BASE_URL;

if (!GAMEBALL_TOKEN) {
  console.error("GAMEBALL_PAT_TOKEN environment variable is required");
  process.exit(1);
}

const client = new GameballAPIClient(GAMEBALL_TOKEN, GAMEBALL_BASE_URL);
const utilsApi = new UtilsAPI(client);

const SERVER_INSTRUCTIONS =`You are operating the Gameball MCP server — a thin wrapper over the same backend controllers the Gameball dashboard uses. Every tool runs against the client's real loyalty data. Apply these rules to every interaction with every tool unless a specific tool's description overrides them.

## Conversational style
- Be interactive. Ask one or two related questions at a time, never a wall of every possible option.
- Show progress as you collect inputs ("Got it — name set to X. Now let's pick rewards…"). Never go silent for long stretches while building a request.
- Echo each answer back so the user can correct it before moving on.
- If the user gives a vague answer, ask one clarifying follow-up — don't guess.
- Use friendly names in conversation, never raw IDs or operator numbers. Resolve IDs from the relevant get_* tool first when needed.

## Always ask before filling in missing values
- **Required values that are missing** → always ask the user to provide them. Never invent a value, never silently fall through with a placeholder.
- **Optional values with a documented default** → tell the user what the default is and ask if they want to keep it or pick something else. For example: "Date range — default is the last 30 days. Keep that, or pick a different period?". Never silently apply the default without a yes.
- **Skip prompts that genuinely don't apply** to the specific object/operation (e.g. don't ask "what triggers this?" for a campaign type that has no trigger; don't ask "active or inactive?" if the type must be created in a fixed state). The tool's description tells you which params are relevant.

## Confirm before acting
- Before any write operation (create / update / delete / toggle / add-points / deduct-points / assign-tags / remove-tags), present a plain-language summary of what's about to happen and ask for confirmation.
- For destructive or high-impact operations (delete, deactivate, deduct points, program off), ask twice — once at the summary, once just before the call. Use words like "Are you sure?" and state the scope explicitly.
- After the call, confirm the result in plain language ("Done — X is now disabled.").

## Read state before mutating
- For toggle / update / delete tools, call the matching get_* tool first to know the current state. Don't assume.
- When a tool description says "GET first, modify, pass back" (update tools), follow it strictly — don't build update payloads from scratch.

## Name → ID resolution
- Whenever a tool needs an ID (event, reward campaign, tag, tier, customer, redemption rule, etc.), let the user provide either the **name or the ID** — explicitly tell them they can pick whichever is easier.
- If they give a name, call the matching discovery tool (\`get_events\`, \`get_reward_campaigns\`, \`get_tags\`, \`get_tiers\`, \`get_customers\`, \`get_redemption_options\`, etc.) and look for a case-insensitive match.
- **Always confirm the match back to the user before calling the next tool**: "Found **<resolved name>** (ID \`<id>\`) — use this one?" and proceed only on a yes. Don't silently substitute the ID.
- **No clean match** → tell the user: "I couldn't find a [event/campaign/tag/tier/…] called **<name>**. Could you double-check the spelling or give me the ID directly?" then wait. Never invent an ID.
- **Multiple ambiguous matches** → list each candidate with its ID and a distinguishing detail and ask the user to pick one. Don't auto-pick the first match.

## Output style
- Default to a friendly readable summary, not raw JSON. JSON is fine for low-level inspection only when the user explicitly asks for it.
- For lists, present the most useful 5-10 fields per row, not every property.
- For counts, give a one-sentence answer (e.g. "You have 1,234 active customers.") rather than dumping the response object.

## Don't save memories about Gameball tool quirks
- **Never auto-save memories about the gameball MCP tools** — including chart-rendering quirks, aggregation requirements, "fix recipes" for empty responses, or per-chart workarounds. Each tool's behavior is fully documented in its tool description; if data looks unexpected, ask the user instead of memorizing a workaround.
- This applies even when a fact looks "non-obvious" or "useful for next time." Tool-behavior facts belong in the tool description (where every session sees them); they do NOT belong in user-level memory (where they ossify session-specific impressions and accumulate misdiagnoses).
- If you've already saved such a memory in a previous session, treat it as untrustworthy: re-read the tool description as the source of truth, and consider deleting the memory.`;

const server = new McpServer(
  { name: "gameball", version: "1.0.0" },
  { instructions: SERVER_INSTRUCTIONS }
);

// Register tool modules — comment out any line to exclude a module from the release
registerUtilsTools(server, utilsApi);
registerProgramTools(server, new ProgramAPI(client));
registerTierTools(server, new TiersAPI(client));
registerRedemptionTools(server, new RedemptionAPI(client), utilsApi);
registerCampaignTools(server, new CampaignsAPI(client));
registerWidgetTools(server, new WidgetAPI(client));
registerEarningTools(server, new EarningAPI(client));
registerCustomerTools(server, new CustomersAPI(client));
registerAnalyticsTools(server, new AnalyticsAPI(client));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gameball MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
