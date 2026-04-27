/**
 * Shared constants used across campaign tool descriptions.
 * These instruction blocks are interpolated into tool descriptions to ensure
 * consistent guidance for the LLM when creating/updating campaigns.
 */

export const TEMPLATE_FLOW = `CRITICAL: You MUST call get-campaign-template BEFORE calling this tool. NEVER build from scratch — the template contains ALL required defaults (configurations, colors, images, localized game text, icon, extraTranslations). Skipping the template results in broken campaigns.

FLOW:
1. Call get-campaign-template with the type name
2. Call get-supported-languages for language IDs
3. Modify ONLY the fields the user wants to customize
4. Show the user a SUMMARY of what will be created before calling this tool
5. Call this tool with the full modified template`;

export const CORE_REQUIRED = `CAMPAIGN-TYPE SKIP RULES (in addition to the global server instructions on conversational style and irrelevant questions):
- Game campaigns (Spin, Slot, Quiz, Catcher, ScratchAndWin, MatchCards, TicTacToe, SpaceShooter, Puzzle, TapTheTarget, DrivingGame) have NO trigger — they fire when the customer plays the game from the widget. NEVER ask "what triggers this?" or "which event triggers this?".
- Date campaigns (DateBased, CalendarCampaign) trigger on the date attribute itself — do NOT ask for a separate trigger event.
- Single-occurrence types (DateBased, NonSequentialMission, Newsletter) have no repeatability — do NOT ask "can customers earn this multiple times?".
- Newsletter campaigns must be created inactive — do NOT ask "create active or inactive?".
- Redirection button only applies to EventBased, DateBased, CalendarCampaign — do NOT offer it for games, missions, newsletter, or spending milestone.

REQUIRED (form won't save without these):
1. Campaign name and description (set on challengeBehaviour.locals[].gameName and .description per language — keep extraTranslations from template!)
2. At least one reward (rewardConfigurations[]: set playerPoints, rewardType, and locales[].rewardName per language)

ASK THE USER (prompt for each only if it applies — see INTERACTIVITY RULES above — and only if not already mentioned):
3. Audience — "Target all customers (default), registered only, anonymous/guest, or a specific segment?"
   Default=omit audience. Anonymous=[{ key:"AccountState", operator:9, value:"2" }]. By tag=[{ key:"Tag", operator:9, value:"<tagId>" }] (call get-tags for IDs).
4. Scheduling — "Always active (default), or restrict to a specific date range?"
   Default=no dates. If scheduled: set challengeBehaviour.startDate and .endDate.
5. Budget — "Set a budget limit? If yes, what's the total amount?" Default=no budget.
   Set campaignBudget: { amount: <number> }. Also set rewardConfigurations[].rewardCost for tracking.
6. Reward cap — "Limit how many total rewards can be given out?" Default=unlimited.
   Set rewardConfigurations[].rewardLimit (int, null=unlimited).
7. Customizations — after fetching the template, tell the user what visual defaults it has (colors, images, game settings) and ask: "Want to customize any of these?"

BEFORE SUBMITTING: Show the user a human-readable summary (NO raw IDs, operator numbers, or technical attributes — use friendly names only):
- Name, description, type
- Rewards (e.g., "100 points" or "10% discount", not "rewardType:7, playerPoints:100")
- Audience (e.g., "All customers" or "Tagged: VIP", not "operator:9, value:2542")
- Schedule (e.g., "Always active" or "Apr 10 – Apr 20", not raw ISO dates)
- Budget and reward cap (if set, in plain language)
- Any customizations made (e.g., "Custom button color: red", not "#FF0000")
- "Create as inactive (draft). Ready to proceed?"

REDIRECTION BUTTON (for EventBased, DateBased, CalendarCampaign only — NOT games, missions, newsletter, or spending milestone):
8. Ask: "Add a redirection button that links customers to a page?"
   If yes, ALL of these are required before submitting:
   - challengeBehaviour.redirectionUrl — the destination URL
   - challengeBehaviour.locals[].redirectButton — button text per language (required for EACH locale)
   - Query parameters — optional, appended to URL as ?key=value (e.g., "https://shop.com/promo?utm_source=gameball")

OPTIONAL (only if user mentions): Notification scripts, goal.
GOAL: goal: { eventId: <from get-events>, count: 1, duration: <MINUTES> } — CRITICAL: duration is in MINUTES (10 days = 14400).

REWARDS: rewardType 1=Default, 7=Game, 8=NoLuck. CouponType: null=Points, 1=Fixed, 2=Percentage, 3=FreeShipping, 4=FreeProduct, 6=Custom
VISIBILITY: 1=AlwaysVisible, 2=NotVisible, 3=VisibleIfEarned`;

export const UPDATE_FLOW = `FLOW:
1. Call the appropriate GET tool first to see current state
2. Ask the user what they want to change
3. Show a human-readable SUMMARY of changes before submitting (NO raw IDs or technical attributes — use friendly names)
4. Call this tool with the modified data`;
