import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CustomersAPI } from "../api/customers.js";

export function registerCustomerTools(server: McpServer, api: CustomersAPI): void {
  server.registerTool("get_customers", {
    title: "Get Customers",
    description:
      "Lists customers with pagination and filtering. Returns minimal data: ID, name, email, tier, points, tags, status.\n\n" +
      "**Filter syntax:** semicolon-delimited conditions joined by `;f;` (AND logic).\n" +
      "**Format:** `{field} {operator} {value}` separated by `;f;`\n\n" +
      "**Available filters:**\n" +
      "| Filter | Syntax | Example |\n" +
      "|--------|--------|---------|\n" +
      "| External ID (contains) | `id in {text}` | `id in john123` |\n" +
      "| Display name (contains) | `name in {text}` | `name in John` |\n" +
      "| Phone (contains) | `phone in {text}` | `phone in +201` |\n" +
      "| Email (contains) | `email in {text}` | `email in john@test.com` |\n" +
      "| Tier (by IDs) | `level in {id,id}` | `level in 1,2,3` |\n" +
      "| Points >= | `points ge {int}` | `points ge 500` |\n" +
      "| Points <= | `points le {int}` | `points le 1000` |\n" +
      "| Points range | `points between {min},{max}` | `points between 100,500` |\n" +
      "| Pending points >= | `ppoints ge {int}` | `ppoints ge 50` |\n" +
      "| Pending points <= | `ppoints le {int}` | `ppoints le 200` |\n" +
      "| Pending points range | `ppoints between {min},{max}` | `ppoints between 0,100` |\n" +
      "| Score >= | `frubies ge {int}` | `frubies ge 100` |\n" +
      "| Score <= | `frubies le {int}` | `frubies le 500` |\n" +
      "| Score range | `frubies between {min},{max}` | `frubies between 50,200` |\n" +
      "| Created after | `cdate ge {date}` | `cdate ge 2026-01-01` |\n" +
      "| Created before | `cdate le {date}` | `cdate le 2026-03-31` |\n" +
      "| Active status | `active eq {bool}` | `active eq true` |\n" +
      "| Guest status | `isguest eq {bool}` | `isguest eq true` |\n" +
      "| Tags (by IDs) | `tags in {id,id}` | `tags in 5,10,15` |\n\n" +
      "**Combined example:** `level in 1,2;f;points ge 100;f;active eq true`\n\n" +
      "**Important:** Tier and tag filters use IDs, not names. Call `get_levels` or `get_tags` first to resolve names to IDs.\n\n" +
      "**User prompting:** If the user's request is vague (e.g. 'show me customers'), ask what filters they'd like before calling this tool. " +
      "Suggest common options: by tier, by points balance, by tag, by active status, or by date range. " +
      "Present results in a friendly, readable format — not raw JSON.",
    inputSchema: {
      pageNo: z.number().optional().default(1).describe("Page number (default: 1)"),
      pageSize: z.number().max(20).optional().default(12).describe("Page size (default: 12, max: 20)"),
      filter: z.string().optional().describe("Filter string using the syntax above. Omit for no filtering."),
      orderBy: z.string().optional().default("CreationDate").describe("Sort field (default: CreationDate)"),
      dir: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort direction (default: desc)"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ pageNo, pageSize, filter, orderBy, dir }) => {
    const result = await api.getCustomers({ pageNo, pageSize, filter, orderBy, dir });
    const data = (result as any)?.data;
    const items = (data?.items || data || []).map((c: any) => ({
      id: c.id, externalId: c.externalId, displayName: c.displayName, email: c.email,
      currentLevelName: c.currentLevelName, accPoints: c.accPoints,
      pendingAccPoints: c.pendingAccPoints, isActive: c.isActive,
      accountState: c.accountState, creationDate: c.creationDate,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify({ items, totalCount: data?.totalCount }, null, 2) }] };
  });

  server.registerTool("get_customer_details", {
    title: "Get Customer Details",
    description:
      "Returns full details for a single customer by their external ID (customerId). " +
      "Includes: profile (name, email, mobile, gender, DOB), referral info (code, link, status), " +
      "custom attributes, tags, UTMs, devices, payment methods, total spent, and last order date.\n\n" +
      "The customerId is the customer's unique identifier in the client's system (e.g. their user ID, email, or phone).\n\n" +
      "**User prompting:** If the user asks for customer details without providing an ID, ask them for the customer's external ID. " +
      "Present the results in a friendly summary — highlight key info like name, tier, points balance, and tags rather than dumping raw data.",
    inputSchema: {
      customerId: z.string().describe("The customer's external ID (customerId) — the unique identifier in the client's system."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ customerId }) => {
    const result = await api.getCustomerDetails(customerId);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("add_customer_points", {
    title: "Add Customer Points",
    description:
      "Adds points or a currency amount to a customer's wallet balance.\n\n" +
      "Provide EITHER `points` (integer) OR `amount` (currency value) — not both. " +
      "When using `amount`, the backend converts it to points using the client's redemption factor.\n\n" +
      "**Expiry:** If `expiryAfterDays` is omitted, the account's default points expiry setting is used. " +
      "Set to a specific number of days to override.\n\n" +
      "**User prompting:** Before calling this tool, ask the user for:\n" +
      "1. The customer's external ID\n" +
      "2. How many points (or what currency amount) to add\n" +
      "3. The reason for adding points\n" +
      "Then confirm: 'I'll add [X points / $X] to customer [ID] for reason: [reason]. Proceed?'",
    inputSchema: {
      customerId: z.string().describe("The customer's external ID."),
      points: z.number().int().positive().optional().describe("Points to add (positive integer). Provide this OR amount, not both."),
      amount: z.number().positive().optional().describe("Currency amount to add (converted to points via redemption factor). Provide this OR points, not both."),
      reason: z.string().max(60).describe("Reason for adding points (required, max 60 characters)."),
      expiryAfterDays: z.number().int().positive().optional().describe("Days until these points expire. Omit to use the account's default expiry setting."),
    },
    annotations: { idempotentHint: true },
  }, async ({ customerId, points, amount, reason, expiryAfterDays }) => {
    const result = await api.addCustomerPoints(customerId, { points, amount, reason, expiryAfterDays });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("deduct_customer_points", {
    title: "Deduct Customer Points",
    description:
      "Deducts points or a currency amount from a customer's wallet balance.\n\n" +
      "Provide EITHER `points` (integer) OR `amount` (currency value) — not both. " +
      "The balance will not go below zero — if the deduction exceeds the available balance, it is capped at the current balance.\n\n" +
      "**No expiry setting** — expiry does not apply to deductions.\n\n" +
      "**User prompting:** ALWAYS confirm with the user before deducting. Ask for:\n" +
      "1. The customer's external ID\n" +
      "2. How many points (or what currency amount) to deduct\n" +
      "3. The reason for the deduction\n" +
      "Then confirm: 'I'll deduct [X points / $X] from customer [ID] for reason: [reason]. Are you sure?'",
    inputSchema: {
      customerId: z.string().describe("The customer's external ID."),
      points: z.number().int().positive().optional().describe("Points to deduct (positive integer — backend handles the sign). Provide this OR amount, not both."),
      amount: z.number().positive().optional().describe("Currency amount to deduct (converted to points via redemption factor). Provide this OR points, not both."),
      reason: z.string().max(60).describe("Reason for deducting points (required, max 60 characters)."),
    },
    annotations: { destructiveHint: true },
  }, async ({ customerId, points, amount, reason }) => {
    const result = await api.deductCustomerPoints(customerId, { points, amount, reason });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("assign_customer_tags", {
    title: "Assign Customer Tags",
    description:
      "Assigns one or more tags to one or more customers by their Gameball IDs.\n\n" +
      "**Flow:** Call `get_customers` first to find customers (the response includes `id` — the Gameball ID). " +
      "Call `get_tags` to discover available tag IDs. Then pass both to this tool.\n\n" +
      "**User prompting:** Before calling, confirm with the user:\n" +
      "1. Which customers? (show names/IDs from get_customers)\n" +
      "2. Which tags? (show names from get_tags)\n" +
      "3. Confirm: 'I'll assign [tag names] to [N] customers. Proceed?'",
    inputSchema: {
      customerIds: z.array(z.number()).min(1).describe("Gameball customer IDs (from get_customers `id` field). At least one required."),
      tagIds: z.array(z.number().int()).min(1).describe("Tag IDs to assign (from get_tags). At least one required."),
    },
    annotations: { idempotentHint: true },
  }, async ({ customerIds, tagIds }) => {
    const result = await api.assignCustomerTags({ customerIds, tagIds });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("remove_customer_tags", {
    title: "Remove Customer Tags",
    description:
      "Removes one or more tags from one or more customers by their Gameball IDs.\n\n" +
      "**Flow:** Call `get_customers` first to find customers. Call `get_tags` to discover tag IDs. " +
      "Or use `get_customer_details` to see which tags a customer currently has.\n\n" +
      "**User prompting:** ALWAYS confirm before removing:\n" +
      "1. Which customers?\n" +
      "2. Which tags to remove?\n" +
      "3. Confirm: 'I'll remove [tag names] from [N] customers. Are you sure?'",
    inputSchema: {
      customerIds: z.array(z.number()).min(1).describe("Gameball customer IDs (from get_customers `id` field). At least one required."),
      tagIds: z.array(z.number().int()).min(1).describe("Tag IDs to remove (from get_tags). At least one required."),
    },
    annotations: { destructiveHint: true },
  }, async ({ customerIds, tagIds }) => {
    const result = await api.removeCustomerTags({ customerIds, tagIds });
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });
}
