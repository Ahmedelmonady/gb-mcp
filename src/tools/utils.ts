import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UtilsAPI } from "../api/utils.js";

export function registerUtilsTools(server: McpServer, api: UtilsAPI): void {
  server.registerTool("get_supported_languages", {
    title: "Get Supported Languages",
    description:
      "Returns the client's supported languages with their IDs, codes, names, and direction. " +
      "ALWAYS call this before creating redemption options to discover the correct languageId values for rewardNames and redeemInstructions. " +
      "The response includes: id (use as languageId), code (e.g. 'en', 'ar'), name (e.g. 'English'), direction ('ltr'/'rtl'), isDefault flag.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getSupportedLanguages();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_collections", {
    title: "Get Collections",
    description:
      "Returns the client's available product collections with their collectionId and collectionName. " +
      "ALWAYS call this before creating redemption options or reward campaigns with collection restrictions. " +
      "Use the collectionId (not the name) when passing collections.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getCollections();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_tags", {
    title: "Get Tags",
    description:
      "Returns the client's tags with their IDs, names, and types. " +
      "ALWAYS call this before creating redemption options or reward campaigns with audience targeting, or filtering customers by tag. " +
      "Use the tag ID (not name) as the audience rule value.\n\n" +
      "Tag types: 1=Internal (system-managed, not editable), 2=Segment, 3=RFM, 4=Custom (user-created global tags).",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getTags();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_customer_attributes", {
    title: "Get Customer Attributes",
    description:
      "Returns the client's custom customer attributes with their IDs, keys, names, and data types. " +
      "Use for audience targeting in redemption options or reward campaigns, or for understanding customer data structure.\n\n" +
      "Attribute types: 1=Number, 2=String, 3=Date, 4=Boolean.\n" +
      "For date-based reward campaigns: filter results by attributeType===3 (Date) to find custom date attributes. " +
      "Use the attribute ID (as string) as configurations.attributeKey and attributeName as configurations.attributeLabel, with isCustomAttribute=true.\n" +
      "Built-in date attributes (isCustomAttribute=false): CreationDate, Counters_FirstOrderDate, DateOfBirth, JoinDate.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getCustomerAttributes();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_merchants", {
    title: "Get Merchants",
    description:
      "Returns the client's merchants with their external IDs, names, and branches. " +
      "ALWAYS call this before creating custom earning rules with merchant conditions — the condition's `matchValue` " +
      "uses the merchant's ExternalId (e.g. `Merchant.ExternalId` = `deraah`). " +
      "Also useful for redemption rules with merchant restrictions.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getMerchants();
    const data = (result as any)?.data;
    const items = (data?.items || data || []).map((m: any) => ({
      externalId: m.externalId, name: m.name,
      branches: (m.branches || []).map((b: any) => ({ externalId: b.externalId, name: b.name })),
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] };
  });

  server.registerTool("get_events", {
    title: "Get Events",
    description:
      "Returns the client's events (triggers) with their IDs, names, and metadata fields. " +
      "ALWAYS call this before creating reward campaigns to discover the correct eventId and eventMetadataId values.\n\n" +
      "Each event has: id (use as eventId in challengeEvents), name, displayName.\n" +
      "Each metadata has: id (use as eventMetadataId in challengeEventMetadata), key (e.g. 'total_paid'), isNumeric.\n\n" +
      "For challengeEventMetadata, use: { eventMetadataId: <metadata.id>, value: '<threshold>', operator: <EEventOperators> }\n" +
      "EEventOperators: 1=Equals, 2=EqualsOrGreater, 3=AccumulativeTotal, 4=DifferentValues, 5=Contains, 6=RepeatedValues, 7=Between",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getEvents();
    const events = (Array.isArray(result) ? result : (result as any)?.data || []);
    const slim = events.map((e: any) => ({
      id: e.id,
      name: e.name,
      displayName: e.displayName,
      eventMetadata: (e.eventMetadata || []).map((m: any) => ({
        id: m.id,
        key: m.key,
        isNumeric: m.isNumeric,
      })),
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(slim, null, 2) }] };
  });
}
