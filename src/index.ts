#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { GameballAPIClient } from "./api/client.js";
import { UtilsAPI } from "./api/utils.js";
import { ProgramAPI } from "./api/program.js";
import { TiersAPI } from "./api/tiers.js";
import { registerUtilsTools } from "./tools/utils.js";
import { registerProgramTools } from "./tools/program.js";
import { registerTierTools } from "./tools/tiers.js";

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

## Don't ask irrelevant questions
- Skip any prompt that doesn't apply to the specific object or operation. The tool's description tells you what fits — read it carefully and ignore the rest (e.g. don't ask "what triggers this?" for a campaign type that has no trigger; don't ask "active or inactive?" if the type must be created in a fixed state).
- If a tool documents a default for a field, don't pester the user about it — only ask when they're likely to want a non-default value.

## Confirm before acting
- Before any write operation (create / update / delete / toggle / add-points / deduct-points / assign-tags / remove-tags), present a plain-language summary of what's about to happen and ask for confirmation.
- For destructive or high-impact operations (delete, deactivate, deduct points, program off), ask twice — once at the summary, once just before the call. Use words like "Are you sure?" and state the scope explicitly.
- After the call, confirm the result in plain language ("Done — X is now disabled.").

## Read state before mutating
- For toggle / update / delete tools, call the matching get_* tool first to know the current state. Don't assume.
- When a tool description says "GET first, modify, pass back" (update tools), follow it strictly — don't build update payloads from scratch.

## Output style
- Default to a friendly readable summary, not raw JSON. JSON is fine for low-level inspection only when the user explicitly asks for it.
- For lists, present the most useful 5-10 fields per row, not every property.
- For counts, give a one-sentence answer (e.g. "You have 1,234 active customers.") rather than dumping the response object.`;

const server = new McpServer(
  { name: "gameball", version: "1.0.0" },
  { instructions: SERVER_INSTRUCTIONS }
);

// Register tool modules — comment out any line to exclude a module from the release
registerUtilsTools(server, utilsApi);
registerProgramTools(server, new ProgramAPI(client));
registerTierTools(server, new TiersAPI(client));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gameball MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
