import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { TiersAPI } from "../api/tiers.js";

export function registerTierTools(server: McpServer, api: TiersAPI): void {
  server.registerTool("get_tiers", {
    title: "Get VIP Tiers",
    description:
      "Returns the client's VIP tiers with their IDs, names, order, and score thresholds. " +
      "ALWAYS call this before filtering customers by tier — the filter syntax uses tier IDs, not names " +
      "(e.g. `level in 1,2,3`). Also useful for understanding the tier structure.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getTiers();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_tier_details", {
    title: "Get Tier Details",
    description:
      "Returns full details for a single VIP tier by ID — includes reward configurations (benefits), " +
      "locales, icon, and pointing configuration. Use `get_tiers` first to discover tier IDs.",
    inputSchema: {
      id: z.number().describe("The tier/level ID (from get_tiers)."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ id }) => {
    const result = await api.getTierDetails(id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });
}
