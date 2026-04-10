#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { GameballAPIClient } from "./api/client.js";
import { ProgramAPI } from "./api/program.js";
import { UtilsAPI } from "./api/utils.js";
import { TiersAPI } from "./api/tiers.js";
import { RedemptionAPI } from "./api/redemption.js";
import { CampaignsAPI } from "./api/campaigns.js";
import { registerProgramTools } from "./tools/program.js";
import { registerUtilsTools } from "./tools/utils.js";
import { registerTierTools } from "./tools/tiers.js";
import { registerRedemptionTools } from "./tools/redemption.js";
import { registerCampaignTools } from "./tools/campaigns.js";

const GAMEBALL_TOKEN = process.env.GAMEBALL_PAT_TOKEN;
const GAMEBALL_BASE_URL = process.env.GAMEBALL_BASE_URL;

if (!GAMEBALL_TOKEN) {
  console.error("GAMEBALL_PAT_TOKEN environment variable is required");
  process.exit(1);
}

const client = new GameballAPIClient(GAMEBALL_TOKEN, GAMEBALL_BASE_URL);
const server = new McpServer({ name: "gameball", version: "1.0.0" });
const utilsApi = new UtilsAPI(client);

// Register tool modules — comment out any line to exclude a module from the release
registerProgramTools(server, new ProgramAPI(client));
registerUtilsTools(server, utilsApi);
registerTierTools(server, new TiersAPI(client));
registerRedemptionTools(server, new RedemptionAPI(client), utilsApi);
registerCampaignTools(server, new CampaignsAPI(client));

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gameball MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
