import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { WidgetAPI } from "../api/widget.js";

export function registerWidgetTools(server: McpServer, api: WidgetAPI): void {
  server.registerTool("get_widget_settings", {
    title: "Get Widget Settings",
    description:
      "Returns the current widget settings — all fields across Branding, General, Launcher, and Guest sections.\n\n" +
      "Use update-widget-style for: Branding > Colors + Identity + Launcher fields (PUT /ClientBotSettings/style — MUST send ALL style fields, nulls wipe values).\n" +
      "Use update-widget-settings for: General > Visibility + Guest + Referral + Icons fields (PUT /ClientBotSettings — partial updates OK, only sent fields change).",
    annotations: { readOnlyHint: true },
  }, async () => {
    const result = await api.getWidgetSettings();
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_widget_style", {
    title: "Update Widget Style",
    description: `Updates Branding + Launcher settings via PUT /ClientBotSettings/style. ALWAYS call get-widget-settings first and pass ALL style fields back (modified + unchanged) — AutoMapper overwrites ALL mapped fields including nulls.

BRANDING > COLORS:
- isBotDarkTheme (bool) — light/dark theme
- botMainColor (hex) — main widget body color
- buttonBackgroundColor (hex) — launcher button background
- buttonFlagColor (hex) — launcher button icon color
- buttonForegroundColor (hex) — launcher button text color
- buttonSariColor (hex) — secondary button color (copy of buttonFlagColor)

BRANDING > IDENTITY:
- widgetFont (string) — "Montserrat", "Cairo", "Tajawal", "Noto"
- widgetRankPointsIcon (URL) — rank/score points icon
- widgetWalletPointsIcon (URL) — wallet points icon

LAUNCHER > CUSTOMIZE:
- widgetIcon (string) — launcher icon: "1"=default, "2"=badge, "3"=gift, "4"=love, "5"=trophy, or URL for custom upload
- buttonDirection (string) — "left" or "right"
- isReverseDirectionEnable (string) — "true" or "false"
- enableLauncherEffect (bool) — launcher animation

LAUNCHER > SHAPE:
- buttonShape (string) — "circle", "rounded", "tab", "tabText", "quarterCircle", "toggle"

IMAGE VALUES PATTERN (applies to widgetTrophyIcon, widgetReferralIcon, earnIconUrl, redeemIconUrl):
- null = use default built-in icon
- "none" = hide the icon completely (no image)
- URL string = custom uploaded image

PER-LANGUAGE (optional):
- clientBotSettingLocals[] — array of { languageId, programName, rankPointsName, walletPointsName, buttonShapeText }`,
    inputSchema: {
      style: z.object({}).passthrough().describe("Full ProfileStyleViewModel — get ALL style fields from get-widget-settings, modify what you need, pass ALL back"),
    },
    annotations: { idempotentHint: true },
  }, async ({ style }) => {
    const result = await api.updateWidgetStyle(style);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_widget_settings", {
    title: "Update Widget Settings",
    description: `Updates General + Guest settings via PUT /ClientBotSettings. Send ONLY the fields you want to change — backend loads current state from DB and applies your values on top (omitted fields preserved).

GENERAL > VISIBILITY:
- enableUserProfile (bool) — show widget to registered customers
- enableVisitorProfile (bool) — show widget to guests
- isLevelCardVisible (bool) — show VIP tiers card
- enableLeaderboard (bool) — show leaderboard tab
- enableLevelBenefits (bool) — show recent tiers benefits
- enableAllGamesPage (bool) — show all games page
- enableCalendarCampaignCard (bool) — show calendar campaign card
- isReferralRewardCardVisible (bool) — show referral reward card
- isReferralPointsVisible (bool) — show referral points
- enableNotifications (bool) — show notifications
- enableFAQ (bool) — show FAQ section
- enableGBFooter (bool) — show "Powered by Gameball" footer
- isCouponTabVisible (bool) — show coupons tab
- isWalletPointsVisible (bool) — show wallet points card
- isRankPointsVisible (bool) — show rank/score points card
- isPointsExpiryVisible (bool) — show expiring points warning
- enableFamilyWallet (bool) — enable family wallet
- enableGuestReward (bool) — enable guest rewards
- enableAchievements (bool) — show achievements
- widgetReferralIcon — referral icon: null = default icon, "none" = no image, URL = custom uploaded image

BRANDING > GUEST:
- widgetTrophyIcon — guest trophy icon: null = default icon, "none" = no image, URL = custom uploaded image
- buttonLink (URL) — guest launcher button link
- signinLink (URL) — guest sign-in/signup link

BRANDING > IDENTITY (icons saved via main PUT):
- earnIconUrl (URL) — earn section icon
- redeemIconUrl (URL) — redeem section icon
- gamesBannerImageUrl (URL) — games banner background
- calendarBannerBackgroundUrl (URL) — calendar card background
- calendarBannerIconUrl (URL) — calendar card icon

REFERRAL:
- isReferralOn (bool) — enable referral program
- referralSignUpLink (URL) — referral signup link
- referralSharingOption (int) — 1=Link, 2=Code

DISPLAY:
- defaultTab (int) — default tab when widget opens
- programName (string) — loyalty program name
- rankPointsName (string) — custom name for rank/score points
- walletPointsName (string) — custom name for wallet points
- welcomeMessage (string) — welcome message for guests
- offlineStatemessage (string) — offline state message
- button (string) — guest launcher button text`,
    inputSchema: {
      settings: z.object({}).passthrough().describe("Partial ClientBotSettingViewModel — only include the fields you want to change"),
    },
    annotations: { idempotentHint: true },
  }, async ({ settings }) => {
    const result = await api.updateWidgetSettings(settings);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_widget_sorting", {
    title: "Update Widget Sorting",
    description:
      "Updates how reward campaigns, quests, and redemption options are sorted in the widget. Send ONLY the fields you want to change.\n\n" +
      "Fields:\n" +
      "- challengeSorting (string) — how campaigns are sorted: \"Creation Date\" or \"Name\"\n" +
      "- questSorting (string) — how quests are sorted: \"Creation Date\" or \"Name\"\n" +
      "- redemptionSorting (string) — how redemption options are sorted: \"Creation Date\" or \"Points\"\n\n" +
      "NOTE: \"Manual\" sorting is not supported via MCP — use the dashboard for drag-drop ordering.",
    inputSchema: {
      sorting: z.object({}).passthrough().describe("Partial sorting settings — only include the fields you want to change"),
    },
    annotations: { idempotentHint: true },
  }, async ({ sorting }) => {
    const result = await api.updateWidgetSorting(sorting);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });

  server.registerTool("update_supported_languages", {
    title: "Update Supported Languages",
    description:
      "Updates the client's supported languages — add, remove, or change the default language. " +
      "ALWAYS call get-supported-languages first to get the current list, then modify and pass the FULL list back.\n\n" +
      "To add a language: append a new entry with { localeLanguageId, code, name, isDefault: false, isDeleted: false }.\n" +
      "To remove a language: set isDeleted: true on the existing entry (must keep at least one non-deleted).\n" +
      "To change default: set isDefault: true on the new default, isDefault: false on the old one.\n" +
      "Available locale language IDs: 1=English, 2=French, 3=Spanish, 4=Italian, 5=German, 6=Portuguese, 7=Turkish, 8=Arabic, 9=Dutch, 10=Japanese, 11=Indonesian, 12=Korean.",
    inputSchema: {
      languages: z.array(z.object({}).passthrough()).describe("Full list of SupportedLanguageViewModel objects — get from get-supported-languages, modify, pass all back"),
    },
    annotations: { idempotentHint: true },
  }, async ({ languages }) => {
    const result = await api.updateSupportedLanguages(languages);
    return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
  });
}
