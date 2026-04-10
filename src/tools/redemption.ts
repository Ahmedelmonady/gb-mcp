import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RedemptionAPI } from "../api/redemption.js";
import { UtilsAPI } from "../api/utils.js";

export function registerRedemptionTools(server: McpServer, api: RedemptionAPI, utilsApi: UtilsAPI): void {
  server.registerTool("get_redemption_options", {
    title: "Get Redemption Options",
    description:
      "Lists all redemption options (slim: id, name, type, points, active status). Use get-redemption-option with an ID for full details.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getRedemptionOptions();
    const items = (Array.isArray(result) ? result : (result as any)?.data || []).map((r: any) => ({
      id: r.id, ruleName: r.ruleName, type: r.type,
      equivalentPoints: r.equivalentPoints, equivalentPointsValue: r.equivalentPointsValue,
      isVisible: r.isVisible, hasCollections: r.hasCollections
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] };
  });

  server.registerTool("get_redemption_option", {
    title: "Get Redemption Option",
    description:
      "Returns detailed information for a single redemption rule by ID, including audience targeting, collections, merchants, advanced coupon options, and localized reward names. Use get-redemption-options first to find the ID.",
    inputSchema: {
      id: z.number().describe("The redemption rule ID. Get IDs from get-redemption-options."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ id }) => {
    const result = await api.getRedemptionOption(id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_redemption_option", {
    title: "Create Redemption Option",
    description:
      "Creates a new redemption option that defines how customers spend loyalty points.\n\n" +
      "IMPORTANT: Call get-supported-languages first to discover available languageId values for rewardNames and redeemInstructions.\n\n" +
      "RULE TYPES:\n" +
      "- fixed_rate_settings: Fixed currency discount (e.g., $5 off). Requires discountValue.\n" +
      "- percentage_discount_settings: Percentage off (e.g., 10%). Requires discountValue (1-100). Use capping to limit max discount.\n" +
      "- free_shipping_settings: Free shipping coupon. No discountValue needed.\n" +
      "- free_product_settings: Free product reward. Requires productId and productName.\n" +
      "- custom: Third-party coupon. Requires couponGroupHandle.\n\n" +
      "VALIDATION:\n" +
      "- pointsToRedeem >= 1 (always required)\n" +
      "- discountValue required for fixed_rate and percentage types\n" +
      "- percentage discountValue must be 1-100\n" +
      "- couponGroupHandle required for custom type\n" +
      "- productId required for free_product type\n" +
      "- General type cannot be created (one per client, auto-created)\n\n" +
      "AUDIENCE TARGETING:\n" +
      "- Call get-tags first to discover tag/segment IDs. Use the ID (not name) as the value.\n" +
      "- audience[].key: 'Segment', 'Tag', 'RFM', or customer attribute key\n" +
      "- audience[].operator for Tag/Segment/RFM: 9=In, 13=NotIn\n" +
      "- audience[].operator for customer attributes: 1=Is, 2=GreaterThan, 3=LessThan, 4=Equals, 5=Contains, 12=NotEquals\n" +
      "- audience[].value: tag/segment ID (number as string) or comma-separated IDs for multi-select\n" +
      "- audienceLogicalOperator: 'and' or 'or' between rules (max 5 rules)\n\n" +
      "CASHBACK:\n" +
      "- Set isCashback=true on fixed_rate or percentage to make it a cashback reward\n" +
      "- Set applyToFees=true on percentage to apply discount to fees only\n\n" +
      "IMAGE:\n" +
      "- If the user wants a custom icon, ask them for the local file path and provide it as imagePath\n" +
      "- Supported formats: .jpg, .jpeg, .png, .gif (max 1MB)\n" +
      "- If not provided, the default icon is used",
    inputSchema: {
      ruleType: z.enum([
        "fixed_rate_settings", "percentage_discount_settings",
        "free_shipping_settings", "free_product_settings", "custom",
      ]).describe("Type of redemption rule"),
      pointsToRedeem: z.number().int().min(1).describe("Points required to redeem (min 1)"),
      ruleName: z.string().optional().describe("Display name for the rule"),
      discountValue: z.number().optional().describe("Discount amount (currency for fixed, 1-100 for percentage)"),
      isActive: z.boolean().optional().default(true).describe("Whether active and visible to customers"),
      startDate: z.string().optional().describe("Start date in ISO 8601 UTC"),
      endDate: z.string().optional().describe("End date in ISO 8601 UTC"),
      rewardNames: z.array(z.object({
        languageId: z.number().int().describe("Language ID from get-supported-languages"),
        value: z.string().describe("Reward display name in this language"),
      })).optional().describe("Reward names per language. Call get-supported-languages first to get languageId values."),
      minOrderValue: z.number().optional().describe("Minimum order value for the coupon"),
      couponExpiryDays: z.number().int().optional().describe("Days until coupon expires after issuance (1-360)"),
      couponPrefix: z.string().max(5).optional().describe("1-5 char prefix for coupon codes"),
      usageLimit: z.number().int().optional().describe("Max uses per customer (default 1)"),
      capping: z.number().optional().describe("Max discount cap in currency (percentage types only)"),
      isCashback: z.boolean().optional().describe("True = cashback reward instead of instant discount"),
      applyToFees: z.boolean().optional().describe("True = applies to fees only (percentage type)"),
      combinesWithOrder: z.boolean().optional().describe("Combine with order-level discounts"),
      combinesWithProduct: z.boolean().optional().describe("Combine with product-level discounts"),
      combinesWithShipping: z.boolean().optional().describe("Combine with shipping discounts"),
      productId: z.string().optional().describe("Product ID (required for free_product type)"),
      productName: z.string().optional().describe("Product display name (free_product type)"),
      collections: z.array(z.object({
        collectionId: z.string(),
        collectionName: z.string(),
      })).optional().describe("Product collections this rule applies to"),
      merchants: z.array(z.object({
        merchantExternalId: z.string(),
        merchantName: z.string(),
      })).optional().describe("Merchant restrictions"),
      collectionMerchantOperator: z.enum(["and", "or"]).optional().describe("Operator between collections and merchants"),
      audience: z.array(z.object({
        key: z.string().describe("Attribute: Segment, Tag, RFM, or customer attribute"),
        operator: z.number().describe("Operator: For Tag/Segment/RFM use 9=In or 13=NotIn. For customer attributes use 1=Is, 4=Equals, 5=Contains, 12=NotEquals"),
        value: z.string().describe("Target value or comma-separated values"),
      })).optional().describe("Audience targeting rules (max 5)"),
      audienceLogicalOperator: z.enum(["and", "or"]).optional().describe("Operator between audience rules"),
      redeemInstructions: z.array(z.object({
        languageId: z.number().int().describe("Language ID from get-supported-languages"),
        value: z.string().describe("Redeem instruction text in this language"),
      })).optional().describe("How-to-redeem instructions per language. Call get-supported-languages first."),
      imagePath: z.string().optional().describe("Local file path to a custom icon image. Ask user for the path if they want a custom image."),
      platforms: z.array(z.string()).optional().describe("Target platforms: shopify, salla, woocommerce, etc."),
      couponGroupHandle: z.string().optional().describe("Coupon group handle (required for custom type)"),
    },
    annotations: { openWorldHint: true },
  }, async (params) => {
    const { imagePath, ...rest } = params;
    const createParams = rest as Record<string, unknown>;

    if (imagePath) {
      const uploadResult = await utilsApi.uploadImage(imagePath);
      createParams.iconPath = uploadResult.path;
    }

    const result = await api.createRedemptionOption(createParams as any);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_redemption_option", {
    title: "Update Redemption Option",
    description:
      "Updates an existing redemption option by ID. ALWAYS call get-redemption-option first to get the current state with existing entity IDs — updates require the full object with IDs to avoid duplicates or errors. Modify the fields you need, then pass the full object back. Uses the same fields as create-redemption-option.",
    inputSchema: {
      id: z.number().describe("The redemption rule ID to update."),
      ruleType: z.enum([
        "fixed_rate_settings", "percentage_discount_settings",
        "free_shipping_settings", "free_product_settings", "custom",
      ]).describe("Type of redemption rule"),
      pointsToRedeem: z.number().int().min(1).describe("Points required to redeem"),
      ruleName: z.string().optional().describe("Display name for the rule"),
      discountValue: z.number().optional().describe("Discount amount"),
      isActive: z.boolean().optional().describe("Whether active"),
      rewardNames: z.array(z.object({
        languageId: z.number().int(),
        value: z.string(),
      })).optional().describe("Reward names per language"),
    },
    annotations: { idempotentHint: true },
  }, async (params) => {
    const { id, ...rest } = params;
    const result = await api.updateRedemptionOption(id, rest as any);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("toggle_redemption_option_activation", {
    title: "Toggle Redemption Option Activation",
    description:
      "Activates or deactivates a specific redemption option by ID. Toggles the IsVisible flag. Use get-redemption-options first to check current state.",
    inputSchema: {
      id: z.number().describe("The redemption option ID to toggle."),
    },
    annotations: { idempotentHint: true },
  }, async ({ id }) => {
    const result = await api.toggleRedemptionOptionActivation(id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("delete_redemption_option", {
    title: "Delete Redemption Option",
    description:
      "Permanently deletes a redemption option by ID. The General (default) rule cannot be deleted. This action is irreversible.",
    inputSchema: {
      id: z.number().describe("The redemption rule ID to delete. Cannot delete the General (default) rule."),
    },
    annotations: { destructiveHint: true },
  }, async ({ id }) => {
    const result = await api.deleteRedemptionOption(id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });
}
