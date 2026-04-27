import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ProgramAPI } from "../api/program.js";

export function registerProgramTools(server: McpServer, api: ProgramAPI): void {
  server.registerTool("get_program_activation", {
    title: "Get Program Activation",
    description:
      "Retrieves the current Gameball program activation state. Returns the client settings including whether the loyalty program (GbEnabled) is active or inactive.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getProgramActivation();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("toggle_program_activation", {
    title: "Toggle Program Activation",
    description:
      "Enables or disables the overall Gameball loyalty program (GbEnabled).\n\n" +
      "**Effects when disabled:** the widget stops showing on the storefront, and events from the storefront stop being processed. Existing data and integrations are unaffected.\n\n" +
      "Follow the global server instructions for confirm-before-acting and read-state-before-mutating — call `get_program_activation` first, state the current status, double-confirm before deactivation.",
    inputSchema: {
      isActive: z.boolean().describe("Set to true to enable the program, false to disable"),
    },
    annotations: { idempotentHint: true },
  }, async ({ isActive }) => {
    const result = await api.toggleProgramActivation(isActive);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });
}
