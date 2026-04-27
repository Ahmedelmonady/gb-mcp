import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { CampaignsAPI } from "../api/campaigns.js";
import { TEMPLATE_FLOW, CORE_REQUIRED, UPDATE_FLOW } from "./shared.js";

const campaignSchema = {
  campaign: z.object({}).passthrough().describe("Full campaign object from get-campaign-template, modified with user's values."),
};

export function registerCampaignTools(server: McpServer, api: CampaignsAPI): void {
  // --- Campaign Template ---

  server.registerTool("get_campaign_template", {
    title: "Get Campaign Template",
    description:
      "Returns the seed-data template for a campaign type. Call this BEFORE creating — it returns the full object with all defaults (configurations, colors, images, localized game text, icon). Modify the fields the user wants, then pass the full object to the appropriate create tool. The type parameter uses enum names: SpinTheWheel, SlotMachine, ScratchAndWin, Quiz, MatchCardsCampaign, Catcher, TicTacToe, SpaceShooter, Puzzle, TapTheTarget, DrivingGame, CalendarCampaign, NonSequentialMission, SpendingMilestone, DateBased, SubscribeToNewsletter, EventBased, ManualChallenge, RewardCampaign.",
    inputSchema: {
      type: z.string().describe("Campaign type enum name, e.g. 'SpinTheWheel', 'Quiz', 'CalendarCampaign'. Case-insensitive."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ type }) => {
    const result = await api.getRewardCampaignTemplate(type);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  // --- List / Get ---

  server.registerTool("get_reward_campaigns", {
    title: "Get Reward Campaigns",
    description:
      "Lists reward campaigns with pagination and filtering (slim: id, name, behaviorType, isActive, gbCode). Use `get_reward_campaign` with an ID for full details including rewards, events, audience, and scheduling.\n\n" +
      "**Filter syntax:** semicolon-delimited conditions joined by `;f;` (AND logic).\n" +
      "**Format:** `{field} {operator} {value}` separated by `;f;`\n\n" +
      "**Available filters (mirrors the dashboard rewards-list filters):**\n" +
      "| Filter | Syntax | Example |\n" +
      "|--------|--------|---------|\n" +
      "| Created after | `cdate ge {date}` | `cdate ge 2026-01-01` |\n" +
      "| Created before | `cdate le {date}` | `cdate le 2026-03-31` |\n" +
      "| Campaign name (contains) | `cname in {text}` | `cname in welcome` |\n" +
      "| Display name (contains) | `dname in {text}` | `dname in spring` |\n" +
      "| Rank Points >= | `frubies ge {int}` | `frubies ge 100` |\n" +
      "| Rank Points <= | `frubies le {int}` | `frubies le 500` |\n" +
      "| Wallet Points >= | `points ge {int}` | `points ge 50` |\n" +
      "| Wallet Points <= | `points le {int}` | `points le 200` |\n" +
      "| Active status | `status eq {bool}` | `status eq true` |\n" +
      "| Visibility | `visibility eq {id}` | `visibility eq 1` (1=Always Visible, 2=Not Visible, 3=Visible If Earned) |\n" +
      "| Behavior type | `behavior eq {id}` | `behavior eq 15` |\n" +
      "| Activation Settings | `activation eq {id}` | `activation eq 1` (1=Always Active, 2=Scheduled) |\n" +
      "| Repeatability | `repeatability eq {id}` | `repeatability eq -1` (-1=Unlimited, otherwise occurrence count) |\n" +
      "| In-App Notification Status | `notifyStatus eq {id}` | `notifyStatus eq 2` (1=Global, 2=On, 3=Off) |\n" +
      "| Email Notification Status | `emailStatus eq {id}` | `emailStatus eq 2` (1=Global, 2=On, 3=Off) |\n\n" +
      "**Behavior type IDs (the dashboard exposes these 14 options):** 4=HighScore, 5=Signup (UponLogin), 7=Birthday, 8=JoinAnniversary, 9=EventBased, 10=SocialActivities, 11=ScheduledChallenge, 12=DailyStreak, 15=SpinTheWheel, 17=Popup (SubscribeToNewsletter), 18=SlotMachine, 19=Quiz, 20=CalenderCampaign, 21=ScratchAndWin.\n\n" +
      "**Combined example:** `status eq true;f;behavior eq 15;f;cname in welcome`\n\n" +
      "**User prompting:** If the user's request is vague, ask what they'd like to filter by — by name, status (active/inactive), behavior type, visibility, activation, repeatability, notification status, or creation date. Present results as a friendly readable list, not raw JSON.",
    inputSchema: {
      pageNo: z.number().optional().default(1).describe("Page number (default: 1)"),
      pageSize: z.number().max(200).optional().default(20).describe("Page size (default: 20, max: 200)"),
      filter: z.string().optional().describe("Filter string using the syntax above. Omit for no filtering."),
      orderBy: z.enum(["CreationDate", "frubies", "points"]).optional().default("CreationDate").describe("Sort field (default: CreationDate). Use 'frubies' for rank points or 'points' for wallet points."),
      dir: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort direction (default: desc)"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ pageNo, pageSize, filter, orderBy, dir }) => {
    const result = await api.getRewardCampaigns({ pageNo, pageSize, filter, orderBy, dir });
    const data = (result as any)?.data;
    const rawItems = data?.items || data || [];
    const items = (Array.isArray(rawItems) ? rawItems : []).map((c: any) => ({
      id: c.id, name: c.name, behaviorTypeId: c.behaviorTypeId,
      isActive: c.isActive, gbCode: c.gbCode, isReferral: c.isReferral,
      visibility: c.visibility, hasAudience: c.hasAudience,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify({ items, totalCount: data?.totalCount }, null, 2) }] };
  });

  server.registerTool("get_reward_campaigns_count", {
    title: "Get Reward Campaigns Count",
    description:
      "Returns the total count of reward campaigns matching the filter — same filter syntax as `get_reward_campaigns`.\n\n" +
      "Use this when the user wants a count or quick stat (e.g. 'how many active spin-the-wheel campaigns', 'count of campaigns created this month') " +
      "without needing the full list. Cheaper than paging through `get_reward_campaigns`.\n\n" +
      "**Filter syntax:** identical to `get_reward_campaigns` — see that tool's description for the full filter table. " +
      "Omit the filter to get the total reward-campaign count for the client.\n\n" +
      "**User prompting:** Ask what they want to count if not specified. Present the result as a short sentence (e.g. 'You have 12 active campaigns.') rather than raw JSON.",
    inputSchema: {
      filter: z.string().optional().describe("Filter string using the same syntax as get_reward_campaigns. Omit for the total count."),
      orderBy: z.enum(["CreationDate", "frubies", "points"]).optional().default("CreationDate").describe("Sort field (default: CreationDate). Does not affect the count."),
      dir: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort direction (default: desc). Does not affect the count."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ filter, orderBy, dir }) => {
    const result = await api.getRewardCampaignsCount({ filter, orderBy, dir });
    return { content: [{ type: "text" as const, text: JSON.stringify((result as any)?.data ?? result, null, 2) }] };
  });

  server.registerTool("get_reward_campaign", {
    title: "Get Reward Campaign",
    description:
      "Returns full details for a single reward campaign by ID — includes behavior configuration, reward configurations, challenge events, audience rules, scheduling, goal, and locales.",
    inputSchema: {
      id: z.number().describe("The campaign ID. Get IDs from get-reward-campaigns."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ id }) => {
    const result = await api.getRewardCampaign(id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("get_reward_campaign_customers", {
    title: "Get Reward Campaign Customers",
    description:
      "Lists achievement records on a specific reward campaign with pagination and filtering. Each row is one customer's reward earned (or NoLuck outcome for game campaigns). Includes customer info, achievement date, points/frubies awarded, voucher/coupon, and a `success` flag.\n\n" +
      "**Returns by default:** EVERY achievement record — winners and NoLuck losers (game campaigns) or just earners (non-game campaigns).\n\n" +
      "**To list ONLY winners** (real reward earners, exclude NoLuck) on game campaigns: add `success eq true` to the filter. For non-game campaigns this filter is a no-op (no NoLuck concept exists).\n\n" +
      "**Game campaigns where success matters:** SpinTheWheel, SlotMachine, ScratchAndWin, Quiz, Catcher, MatchCards, TicTacToe, SpaceShooter, Puzzle, TapTheTarget, DrivingGame. All others (EventBased, SpendingMilestone, Birthday, DateBased, NonSequentialMission, Newsletter, etc.) have no NoLuck records — `success eq true` always matches all rows.\n\n" +
      "**Filter syntax:** semicolon-delimited conditions joined by `;f;` (AND logic). Format: `{field} {operator} {value}` separated by `;f;`.\n\n" +
      "**Available filters (mirrors the dashboard reward-customers-list filters):**\n" +
      "| Filter | Syntax | Example |\n" +
      "|--------|--------|---------|\n" +
      "| External ID (contains) | `id in {text}` | `id in john123` |\n" +
      "| Display name (contains) | `name in {text}` | `name in John` |\n" +
      "| Email (contains) | `email in {text}` | `email in john@test.com` |\n" +
      "| Reward Points >= | `points ge {int}` | `points ge 50` |\n" +
      "| Reward Points <= | `points le {int}` | `points le 200` |\n" +
      "| Reward Frubies >= | `frubies ge {int}` | `frubies ge 10` |\n" +
      "| Reward Frubies <= | `frubies le {int}` | `frubies le 100` |\n" +
      "| Achieved after | `cdate ge {date}` | `cdate ge 2026-01-01` |\n" +
      "| Achieved before | `cdate le {date}` | `cdate le 2026-03-31` |\n" +
      "| Tags (by IDs) | `tags in {id,id}` | `tags in 5,10,15` |\n" +
      "| Game success | `success eq {bool}` | `success eq true` (true=won, false=NoLuck — applies to game campaigns: Quiz, Catcher, SpinTheWheel, SlotMachine, ScratchAndWin, etc.) |\n" +
      "| Voucher product (contains) | `voucherpname in {text}` | `voucherpname in t-shirt` |\n" +
      "| Voucher discount >= | `voucherdicount ge {number}` | `voucherdicount ge 10` |\n" +
      "| Voucher discount <= | `voucherdicount le {number}` | `voucherdicount le 50` |\n" +
      "| Free shipping voucher | `vouchershipping sl {any}` | `vouchershipping sl 1` |\n" +
      "| Merchant name (contains) | `mname in {text}` | `mname in acme` |\n" +
      "| Branch name (contains) | `bname in {text}` | `bname in downtown` |\n" +
      "| Merchant IDs | `merchants id {id,id}` | `merchants id 1,2` |\n" +
      "| Branch IDs | `branches id {id,id}` | `branches id 5,8` |\n" +
      "| Achievement rank IDs | `rank in {id,id}` | `rank in 1,2,3` |\n\n" +
      "**Combined example:** `cdate ge 2026-01-01;f;success eq true;f;tags in 5,10` (winners on or after Jan 1, with tags 5 or 10)\n\n" +
      "**Important:** Tag filters use IDs, not names. Call `get_tags` first to resolve names to IDs.\n\n" +
      "**User prompting:** If the user asks 'who won my Spin-The-Wheel' or 'who got rewarded by my Quiz', call this tool with `success eq true` in the filter. If they ask 'who participated' or want full audit, call without `success eq true`. Ask which campaign first if not specified — use `get_reward_campaigns` to list options. Present results in a friendly readable format, not raw JSON.",
    inputSchema: {
      campaignId: z.number().describe("The reward campaign ID. Get IDs from get_reward_campaigns."),
      pageNo: z.number().optional().default(1).describe("Page number (default: 1)"),
      pageSize: z.number().max(50).optional().default(12).describe("Page size (default: 12, max: 50)"),
      filter: z.string().optional().describe("Filter string using the syntax above. Omit for no filtering."),
      orderBy: z.string().optional().default("CreationDate").describe("Sort field (default: CreationDate)"),
      dir: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort direction (default: desc)"),
    },
    annotations: { readOnlyHint: true },
  }, async ({ campaignId, pageNo, pageSize, filter, orderBy, dir }) => {
    const result = await api.getRewardCampaignCustomers(campaignId, { pageNo, pageSize, filter, orderBy, dir });
    return { content: [{ type: "text" as const, text: JSON.stringify((result as any)?.data ?? result, null, 2) }] };
  });

  server.registerTool("get_reward_campaign_customers_count", {
    title: "Get Reward Campaign Customers Count",
    description:
      "Returns the total count of achievement records on a specific reward campaign matching the filter. Single number, much cheaper than paging through the full list.\n\n" +
      "**Returns by default:** count of EVERY achievement record (winners + NoLuck for games).\n\n" +
      "**To count ONLY winners** (exclude NoLuck on game campaigns): add `success eq true` to the filter. For non-game campaigns this filter is a no-op.\n\n" +
      "**Filter syntax:** identical to `get_reward_campaign_customers` — see that tool's description for the full filter table.\n\n" +
      "**User prompting:** Ask which campaign and what to count if not specified. For 'how many won' / 'how many people got a prize' on game campaigns, include `success eq true` in the filter. Present the result as a short sentence (e.g. '1,234 customers participated in your Welcome Spin.' or '342 customers won your Welcome Spin.') rather than raw JSON.",
    inputSchema: {
      campaignId: z.number().describe("The reward campaign ID. Get IDs from get_reward_campaigns."),
      filter: z.string().optional().describe("Filter string using the same syntax as get_reward_campaign_customers. Omit for the total count."),
      orderBy: z.string().optional().default("CreationDate").describe("Sort field (default: CreationDate). Does not affect the count."),
      dir: z.enum(["asc", "desc"]).optional().default("desc").describe("Sort direction (default: desc). Does not affect the count."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ campaignId, filter, orderBy, dir }) => {
    const result = await api.getRewardCampaignCustomersCount(campaignId, { filter, orderBy, dir });
    return { content: [{ type: "text" as const, text: JSON.stringify((result as any)?.data ?? result, null, 2) }] };
  });

  // --- Create Tools ---

  server.registerTool("create_game_campaign", {
    title: "Create Game Campaign",
    description: `Creates a game campaign: SpinTheWheel, SlotMachine, ScratchAndWin, Quiz, MatchCardsCampaign, Catcher, TicTacToe, SpaceShooter, Puzzle, TapTheTarget, DrivingGame.

${TEMPLATE_FLOW}

${CORE_REQUIRED}

GAME-SPECIFIC (ask if not provided):
- Reward segments: "How many rewards? What does each award? Include a 'no luck' outcome?" (min 2 for Spin/Slot)
- Repeatability: "Can customers play multiple times, or once only?" Default from template: unlimited, once per day. Set isUnlimitedOccurance, intervalLimit, timeIntervalTypeId (1=Day, 2=Week, 3=Month).
- Quiz ONLY: "What questions? Answers? Which is correct? Time limit?" — set configurations.questionsLocales[]: [{ langId, langCode, questions: [{ questionText, answers: [{ answerText, isCorrect }] }] }]. No template default for questions.
- All game rewards use rewardType:7, optional rewardType:8 for NoLuck.
`,
    inputSchema: campaignSchema,
    annotations: { openWorldHint: true },
  }, async ({ campaign }) => {
    const result = await api.createRewardCampaign(campaign);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_event_campaign", {
    title: "Create Event Campaign",
    description: `Creates an event-triggered campaign: EventBased or SpendingMilestone.

FLOW BY TYPE:
- EventBased: do NOT call get-campaign-template — build from scratch. Call get-events first, then construct the object directly. EventBased is the ONLY type that skips the template.
- SpendingMilestone: MUST call get-campaign-template('SpendingMilestone') first — it has all visual defaults (progress bar, colors, images, localized text). Then call get-events for GB_ITEM_PURCHASED eventId + total_paid metadataId. Modify the template's existing challengeEvents[0].challengeEventMetadata[0].value — do NOT rebuild from scratch.

${CORE_REQUIRED}

EVENT-SPECIFIC (ask if not provided):
- EventBased: "Which event triggers this?" (show options from get-events). "Any conditions?" (e.g., order total >= 500). Set challengeBehaviour.behaviorTypeId to 9.
- SpendingMilestone: "What spending threshold amount?" Change the template's challengeEvents[0].challengeEventMetadata[0].value to the threshold.
- Repeatability: "Can customers earn this multiple times?" Default: once. Set isUnlimitedOccurance + intervalLimit if multiple.

challengeEventMetadata structure (ALL fields required, even id:0 for new):
challengeEvents: [{ id: 0, eventId: <int>, eventOccurrence: 1, logicalOperator: 0,
  challengeEventMetadata: [{ id: 0, challengeEventId: 0, eventMetadataId: <int>, value: "<string>", operator: <int> }] }]
Operators: 1=Equals, 2=EqualsOrGreater, 3=AccumulativeTotal, 5=Contains, 7=Between. value MUST be string. Verify after creation with get-reward-campaign.
EventBased example — "50 points when order total >= 500":
{ "challengeBehaviour": { "behaviorTypeId": 9, "name": "Order Bonus", "gameName": "Order Bonus", "description": "Earn points", "visibility": 1, "activationCriteriaTypeId": 1,
    "locals": [{ "languageId": "<langId>", "name": "Order Bonus", "gameName": "Order Bonus", "description": "Earn points" }] },
  "isActive": false,
  "challengeEvents": [{ "id": 0, "eventId": "<from get-events>", "eventOccurrence": 1, "logicalOperator": 0,
    "challengeEventMetadata": [{ "id": 0, "challengeEventId": 0, "eventMetadataId": "<from get-events>", "value": "500", "operator": 2 }] }],
  "rewardConfigurations": [{ "rewardType": 1, "playerPoints": 50, "rewardOrder": 0, "locales": [{ "languageId": "<langId>", "rewardName": "50 points" }] }] }`,
    inputSchema: {
      campaign: z.object({}).passthrough().describe("Full campaign — from get-campaign-template for SpendingMilestone, or built from scratch for EventBased."),
    },
    annotations: { openWorldHint: true },
  }, async ({ campaign }) => {
    const result = await api.createRewardCampaign(campaign);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_date_campaign", {
    title: "Create Date Campaign",
    description: `Creates a date-triggered campaign (DateBased). Fires yearly on the customer's date attribute.

${TEMPLATE_FLOW}

${CORE_REQUIRED}

DATE-SPECIFIC (ask if not provided):
- "Which customer date? Birthday, join date, first order, or a custom date attribute?"
- Built-in (isCustomAttribute:false): DateOfBirth, JoinDate, CreationDate, Counters_FirstOrderDate
- Custom (isCustomAttribute:true): call get-customer-attributes, filter attributeType===3, use ID as attributeKey
- Set configurations: { type:18, isCustomAttribute, attributeKey, attributeLabel }
- Note: DateBased campaigns are single occurrence (once per year). No repeatability setting needed.`,
    inputSchema: campaignSchema,
    annotations: { openWorldHint: true },
  }, async ({ campaign }) => {
    const result = await api.createRewardCampaign(campaign);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_mission", {
    title: "Create Mission",
    description: `Creates a mission campaign (NonSequentialMission). Tasks can be completed in any order.

${TEMPLATE_FLOW}

${CORE_REQUIRED}

MISSION-SPECIFIC (ask if not provided):
- "What are the mission tasks?" (each task = one event from get-events, call get-events first)
- "Reward per step or only a completion reward?"
- Set challengeEvents[] with one event per task. Backend auto-creates StepReward per event.
- Note: Missions are single occurrence. No repeatability setting needed.
`,
    inputSchema: campaignSchema,
    annotations: { openWorldHint: true },
  }, async ({ campaign }) => {
    const result = await api.createRewardCampaign(campaign);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_calendar_campaign", {
    title: "Create Calendar Campaign",
    description: `Creates a calendar campaign — a multi-day container with child campaigns per day.

TWO-STEP FLOW:
1. Create parent: call get-campaign-template('CalendarCampaign') → set name, date range → call this tool
2. Create children: for each day, call the appropriate tool (create-game-campaign, etc.) with parentChallengeId = parent ID

${CORE_REQUIRED}

CALENDAR-SPECIFIC (ask if not provided):
- "What date range?" (start and end dates — REQUIRED for calendar)
- "What campaign type for each day?" (quiz, spin, scratch, etc.)
- Per-day details (e.g., quiz questions for quiz days)
- Each child MUST have challengeBehaviour.startDate and .endDate for its day window
- Children are forced to single occurrence
- Note: Calendar parent is inherently date-bound. No repeatability setting needed.
`,
    inputSchema: campaignSchema,
    annotations: { openWorldHint: true },
  }, async ({ campaign }) => {
    const result = await api.createRewardCampaign(campaign);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("create_newsletter", {
    title: "Create Newsletter",
    description: `Creates a newsletter subscription campaign (SubscribeToNewsletter).

${TEMPLATE_FLOW}

REQUIRED: Campaign name and locales (set on challengeBehaviour.locals[].gameName per language — keep extraTranslations from template!). At least one reward.

ASK THE USER:
- Audience, scheduling, budget, reward cap (same as other tools)
- Customizations: "The template has a popup design with colors and text. Want to customize the heading, button text, or colors?"

IMPORTANT: MUST create as isActive:false. Activate separately via toggle-reward-campaign-activation after customer sync completes.
Note: Newsletter is always single occurrence. No repeatability or badge settings — the popup IS the campaign visual.
`,
    inputSchema: campaignSchema,
    annotations: { openWorldHint: true },
  }, async ({ campaign }) => {
    const result = await api.createRewardCampaign(campaign);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  // --- Update ---

  server.registerTool("update_reward_campaign", {
    title: "Update Reward Campaign",
    description: `Updates an existing reward campaign by ID. ALWAYS call get-reward-campaign first — updates require the full object with entity IDs to avoid duplicates.

${UPDATE_FLOW}

ASK about: name, rewards, audience, scheduling, budget, reward cap, repeatability, visual customizations (colors, images, configurations) — whatever the user wants to change.`,
    inputSchema: {
      id: z.number().describe("The campaign ID to update."),
      campaign: z.object({}).passthrough().describe("Full updated campaign object with entity IDs preserved."),
    },
    annotations: { idempotentHint: true },
  }, async ({ id, campaign }) => {
    const result = await api.updateRewardCampaign(id, campaign);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  // --- Toggle ---

  server.registerTool("toggle_reward_campaign_activation", {
    title: "Toggle Reward Campaign Activation",
    description:
      "Activates or deactivates a reward campaign by ID. Handles cache invalidation, job scheduling, and audit logging. Use get-reward-campaigns first to check current state.",
    inputSchema: {
      id: z.number().describe("The campaign ID to toggle."),
    },
    annotations: { idempotentHint: true },
  }, async ({ id }) => {
    const result = await api.toggleRewardCampaignActivation(id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  // --- Delete ---

  server.registerTool("delete_reward_campaign", {
    title: "Delete Reward Campaign",
    description:
      "Permanently deletes a reward campaign by ID. This removes the campaign and all associated rewards, events, and audience rules.\n\n**User prompting:** Confirm with the user before deleting — this removes the campaign and all associated rewards, events, and audience rules. This action is irreversible.",
    inputSchema: {
      id: z.number().describe("The campaign ID to delete."),
    },
    annotations: { destructiveHint: true },
  }, async ({ id }) => {
    const result = await api.deleteRewardCampaign(id);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });
}
