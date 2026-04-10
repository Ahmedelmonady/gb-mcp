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
      "Lists all reward campaigns (slim: id, name, behaviorType, isActive, gbCode). Use get-reward-campaign with an ID for full details including rewards, events, audience, and scheduling.",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getRewardCampaigns();
    const data = (result as any)?.data?.items || (result as any)?.data || [];
    const items = (Array.isArray(data) ? data : []).map((c: any) => ({
      id: c.id, name: c.name, behaviorTypeId: c.behaviorTypeId,
      isActive: c.isActive, gbCode: c.gbCode, isReferral: c.isReferral,
      visibility: c.visibility, hasAudience: c.hasAudience,
    }));
    return { content: [{ type: "text" as const, text: JSON.stringify(items, null, 2) }] };
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
