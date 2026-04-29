import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { AnalyticsAPI } from "../api/analytics.js";

/**
 * Catalog of all 90 supported charts. Single source of truth for:
 *  - The friendly-name → technical-name mapping (the analytics service expects technical names)
 *  - The zod enum of valid chartName inputs
 *  - The per-chart metadata (type, page, default grouping) rendered in the
 *    tool description so the AI can decide which optional params to offer.
 *
 * Sources (kept in sync manually for now):
 *  - Chart type:                gb-frontend-v2 src/app/modules/analytics/chartConfigs.ts
 *  - Default grouping:          gb-advanced-analytics ChartMappings.ChartToGroup
 *  - Technical name allowlist:  g-backend-v2 GameBall.BLL/Helper/Mcp/AnalyticsChartCatalog.cs
 *
 * `defaultGrouping`:
 *  - "Daily" | "Weekly" | "Monthly" → time-series chart; the AI should ask the user whether to keep the default or change to a different time bucket.
 *  - "None" | "Category" → not user-selectable (snapshot KPI / categorical ranking); the AI should NOT ask about grouping.
 *
 * `defaultAggregation`:
 *  - "Sum" | "Count" | "AVG" → user-adjustable; the AI should confirm the default with the user before calling.
 *  - "None" | "Ratio" | "Table" → not user-selectable (no aggregation, calculated ratio, or raw table data); the AI should NOT ask about aggregation.
 */
interface ChartSpec {
  human: string;
  technical: string;
  type: "card" | "line" | "bar" | "pie" | "heatmap" | "table";
  page: string;
  defaultGrouping: "None" | "Daily" | "Weekly" | "Monthly" | "Category";
  defaultAggregation: "None" | "Sum" | "Count" | "AVG" | "Ratio" | "Table";
}

const CHART_CATALOG: ChartSpec[] = [
  // Member Analytics (11)
  { human: "Enrolled Members",                          technical: "enrolled_members",                       type: "card",    page: "Member Analytics",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Excluded Members",                          technical: "excluded_members",                       type: "card",    page: "Member Analytics",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "New Members",                               technical: "new_members",                            type: "card",    page: "Member Analytics",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Member Growth",                             technical: "member_growth",                          type: "line",    page: "Member Analytics",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Tier Distribution (Members)",               technical: "tier_distribution",                      type: "bar",     page: "Member Analytics",     defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Engagement Rate",                           technical: "engagement_rate_line",                   type: "line",    page: "Member Analytics",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Engaged Customers",                         technical: "engaged_customers",                      type: "line",    page: "Member Analytics",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Engagement Interactions",                   technical: "engagement_interactions",                type: "line",    page: "Member Analytics",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Retention Rate",                            technical: "retention_rate",                         type: "line",    page: "Member Analytics",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Customers Who Placed Orders",               technical: "customers_who_placed_orders",            type: "line",    page: "Member Analytics",     defaultGrouping: "Monthly",  defaultAggregation: "AVG"   },
  { human: "Retention Cohort",                          technical: "retention_cohort",                       type: "heatmap", page: "Member Analytics",     defaultGrouping: "Category", defaultAggregation: "Sum"   },

  // Purchase Behavior (13)
  { human: "Customer Growth",                           technical: "customer_growth",                        type: "line",    page: "Purchase Behavior",    defaultGrouping: "Daily",    defaultAggregation: "Sum"   },
  { human: "Customer LTV by Segment",                   technical: "behavioural_impact_ltv",                 type: "line",    page: "Purchase Behavior",    defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Attributed Sales",                          technical: "attributed_sales",                       type: "card",    page: "Purchase Behavior",    defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Attributed Revenue",                        technical: "attributed_revenue",                     type: "card",    page: "Purchase Behavior",    defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Attributed Revenue Over Time",              technical: "revenue_attributed_by_time",             type: "bar",     page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Revenue Contribution",                      technical: "revenue_contribution",                   type: "bar",     page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Average Order Value (AOV)",                 technical: "behavioural_impact_aov",                 type: "card",    page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "AVG"   },
  { human: "Order Frequency",                           technical: "order_frequency",                        type: "card",    page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "None"  },
  { human: "Average Basket Size (ABS)",                 technical: "behavioural_impact_abs",                 type: "card",    page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "AVG"   },
  { human: "AOV by Redeemer Segment",                   technical: "behavioural_impact_segmented_aov",       type: "line",    page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "None"  },
  { human: "Order Frequency by Segment",                technical: "segmented_order_frequency",              type: "line",    page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "None"  },
  { human: "ABS by Redeemer Segment",                   technical: "behavioural_impact_segmented_abs",       type: "line",    page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "None"  },
  { human: "Transaction Volumes",                       technical: "trasaction_volumes",                     type: "line",    page: "Purchase Behavior",    defaultGrouping: "Monthly",  defaultAggregation: "None"  },

  // Points & Rewards (32)
  { human: "Total Available Points",                    technical: "total_available_points",                 type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Total Pending Points",                      technical: "total_pending_points",                   type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Expiring Points (Next 15 Days)",            technical: "expiring_points",                        type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Total Accumulated Points",                  technical: "total_accumulated_points",               type: "card",    page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Accumulated Points by Source",              technical: "accumulated_points_source",              type: "bar",     page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Total Deducted Points",                     technical: "total_deducted_points",                  type: "card",    page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Deducted Points by Type",                   technical: "deducted_points_by_type",                type: "bar",     page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Redeemed Points by Type",                   technical: "redeemed_points_by_type",                type: "bar",     page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Redemption Rate",                           technical: "redemption_rate",                        type: "bar",     page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Total Coupons Issued (Reward Source)",      technical: "total_coupons_issued",                   type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Total Coupons Burned (Reward Source)",      technical: "total_coupons_burned",                   type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Coupons Reward by Source",                  technical: "coupons_reward_by_source",               type: "bar",     page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Top Created Coupons (Reward Source)",       technical: "top_created_coupons",                    type: "bar",     page: "Points & Rewards",     defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Top Burned Coupons (Reward Source)",        technical: "top_burned_coupons",                     type: "bar",     page: "Points & Rewards",     defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Total Issued Coupons",                      technical: "total_issued_coupons",                   type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Total Used Coupons",                        technical: "total_used_coupons",                     type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Coupon Usage Rate",                         technical: "coupon_usage_rate",                      type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Coupons Issued by Source",                  technical: "coupons_by_source_issued",               type: "bar",     page: "Points & Rewards",     defaultGrouping: "Daily",    defaultAggregation: "None"  },
  { human: "Coupons Used by Source",                    technical: "coupons_by_source_used",                 type: "bar",     page: "Points & Rewards",     defaultGrouping: "Daily",    defaultAggregation: "None"  },
  { human: "Coupons Issued by Type",                    technical: "coupons_by_type_issued",                 type: "bar",     page: "Points & Rewards",     defaultGrouping: "Daily",    defaultAggregation: "None"  },
  { human: "Coupons Used by Type",                      technical: "coupons_by_type_used",                   type: "bar",     page: "Points & Rewards",     defaultGrouping: "Daily",    defaultAggregation: "None"  },
  { human: "Issued vs Used Coupons Trends",             technical: "issued_used_trends",                     type: "line",    page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "None"  },
  { human: "Orders With Coupons",                       technical: "orders_with_coupons",                    type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Order Value With Coupons",                  technical: "order_value_with_coupons",               type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "AOV With Coupons",                          technical: "aov_with_coupons",                       type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "AOV Without Coupons",                       technical: "aov_without_coupons",                    type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Top Issued Coupons",                        technical: "top_issued_coupons",                     type: "bar",     page: "Points & Rewards",     defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Top Used Coupons",                          technical: "top_used_coupons",                       type: "bar",     page: "Points & Rewards",     defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Total Coupons Expired",                     technical: "total_coupons_expired",                  type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "About to Expire Coupons",                   technical: "about_to_expire_coupons",                type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Coupon Expiry Rate",                        technical: "coupon_expiry_rate",                     type: "card",    page: "Points & Rewards",     defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Coupon Expiry Trends",                      technical: "coupon_expiry_trends",                   type: "line",    page: "Points & Rewards",     defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },

  // Campaign Performance (8)
  { human: "Reward Campaign Reach",                     technical: "reward_campaign_reach",                  type: "card",    page: "Campaign Performance", defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Customers Who Achieved Reward Campaigns",   technical: "customers_achieved_reward_campaigns",    type: "card",    page: "Campaign Performance", defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Campaigns Cost in Points (Trend)",          technical: "campaigns_cost_in_points",               type: "line",    page: "Campaign Performance", defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Campaigns Coupons Issued (Trend)",          technical: "campaigns_number_of_coupons",            type: "line",    page: "Campaign Performance", defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Top Achieved Campaigns",                    technical: "top_achieved_campaigns",                 type: "bar",     page: "Campaign Performance", defaultGrouping: "Category", defaultAggregation: "Ratio" },
  { human: "Top Points-Cost Campaigns",                 technical: "top_points_campaigns",                   type: "bar",     page: "Campaign Performance", defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Top Coupon-Issuing Campaigns",              technical: "top_coupon_campaigns",                   type: "bar",     page: "Campaign Performance", defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Widget Funnel Game Performance",            technical: "widget_funnel_game_performance",         type: "table",   page: "Campaign Performance", defaultGrouping: "None",     defaultAggregation: "None"  },

  // Referral Analytics (6)
  { human: "Pending Referrals",                         technical: "pending_referrals",                      type: "card",    page: "Referral Analytics",   defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Successful Referrals",                      technical: "successful_referrals",                   type: "card",    page: "Referral Analytics",   defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Successful Referrals Rate",                 technical: "successful_referrals_rate",              type: "bar",     page: "Referral Analytics",   defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Total Referral Revenue",                    technical: "total_referral_revenue",                 type: "card",    page: "Referral Analytics",   defaultGrouping: "None",     defaultAggregation: "Sum"   },
  { human: "Total Revenue by Referral (Trend)",         technical: "total_revenue_by_referral",              type: "line",    page: "Referral Analytics",   defaultGrouping: "Monthly",  defaultAggregation: "Sum"   },
  { human: "Top Referring Customers",                   technical: "top_referring_customers",                type: "bar",     page: "Referral Analytics",   defaultGrouping: "Category", defaultAggregation: "Sum"   },

  // Tiers Performance (14)
  { human: "Tier Upgrade Percentage",                   technical: "upgrade_percent",                        type: "card",    page: "Tiers Performance",    defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Tier Downgrade Percentage",                 technical: "downgrade_percent",                      type: "card",    page: "Tiers Performance",    defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Tier No-Change Percentage",                 technical: "no_change_percent",                      type: "card",    page: "Tiers Performance",    defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Tier New Static Joiners Percentage",        technical: "new_static_joiners_percent",             type: "card",    page: "Tiers Performance",    defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Tier Transition Trends",                    technical: "transition_trends",                      type: "line",    page: "Tiers Performance",    defaultGrouping: "Monthly",  defaultAggregation: "Count" },
  { human: "Orders per Tier",                           technical: "orders_per_tier",                        type: "bar",     page: "Tiers Performance",    defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Time Spent per Tier",                       technical: "time_spent_tier",                        type: "bar",     page: "Tiers Performance",    defaultGrouping: "Category", defaultAggregation: "None"  },
  { human: "Tiers Members Distribution",                technical: "distribution_tiers",                     type: "pie",     page: "Tiers Performance",    defaultGrouping: "Category", defaultAggregation: "Count" },
  { human: "Stagnating Members per Tier",               technical: "stagnating_members",                     type: "bar",     page: "Tiers Performance",    defaultGrouping: "Category", defaultAggregation: "Count" },
  { human: "Revenue per Tier",                          technical: "revenue_per_tier",                       type: "bar",     page: "Tiers Performance",    defaultGrouping: "Category", defaultAggregation: "Sum"   },
  { human: "Points Breakdown per Tier",                 technical: "points_breakdown_per_tier",              type: "table",   page: "Tiers Performance",    defaultGrouping: "None",     defaultAggregation: "Table" },
  { human: "Revenue Breakdown per Tier",                technical: "revenue_breakdown_per_tier",             type: "table",   page: "Tiers Performance",    defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Tier Performance Prediction",               technical: "tier_performance_prediction",            type: "table",   page: "Tiers Performance",    defaultGrouping: "Category", defaultAggregation: "Table" },
  { human: "Tiers Names and IDs",                       technical: "tiers_names_ids",                        type: "table",   page: "Tiers Performance",    defaultGrouping: "Category", defaultAggregation: "Table" },

  // Redemption Options (5)
  { human: "Total Issued Coupons (Redemption Options)", technical: "total_issued_coupons_redemption_options", type: "card",   page: "Redemption Options",   defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Total Burned Coupons (Redemption Options)", technical: "total_burned_coupons_redemption_options", type: "card",   page: "Redemption Options",   defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Average Burn Rate (Redemption Options)",    technical: "avg_burn_rate_redemption_options",       type: "card",    page: "Redemption Options",   defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Total Expired Coupons (Redemption Options)", technical: "total_expired_coupons_redemption_options", type: "card", page: "Redemption Options",   defaultGrouping: "None",     defaultAggregation: "None"  },
  { human: "Redemption Options Performance",            technical: "redemption_options_performance",         type: "table",   page: "Redemption Options",   defaultGrouping: "None",     defaultAggregation: "None"  },

  // Home Analytics (1)
  { human: "Home Revenue Distribution",                 technical: "home_analytics_revenue_distribution",    type: "table",   page: "Home Analytics",       defaultGrouping: "None",     defaultAggregation: "None"  },
];

// Derived structures
const HUMAN_TO_TECHNICAL: Record<string, string> = Object.fromEntries(
  CHART_CATALOG.map(c => [c.human, c.technical])
);
const FRIENDLY_CHART_NAMES = CHART_CATALOG.map(c => c.human) as [string, ...string[]];

const PAGE_ORDER = [
  "Member Analytics", "Purchase Behavior", "Points & Rewards",
  "Campaign Performance", "Referral Analytics", "Tiers Performance",
  "Redemption Options", "Home Analytics",
];

function buildPageTable(page: string): string {
  const charts = CHART_CATALOG.filter(c => c.page === page);
  return [
    "| Chart | Type | Default grouping |",
    "|---|---|---|",
    ...charts.map(c =>
      `| ${c.human} | ${c.type} | ${c.defaultGrouping} |`
    ),
  ].join("\n");
}

const DESCRIPTION = [
  "Fetches one analytics chart from the dashboard analytics service. Mirrors what the dashboard fetches per-card on its analytics pages.",
  "",
  "## Required parameters — ask if missing",
  "",
  "1. **chartName** — pick one of the 90 friendly names listed below. If the user's request doesn't make the chart obvious, ask which one. Echo the chosen name back before calling.",
  "",
  "## Optional parameters",
  "",
  "- `from` / `to` — ISO 8601 datetimes, inclusive on both ends (`from` at `00:00:00.000`, `to` at `23:59:59.999`). Default = last 30 days. Convert user-stated periods (\"April\", \"last quarter\") to absolute ISO 8601 with day boundaries.",
  "- `groupingType` (`Daily | Weekly | Monthly`) — default per chart (catalog `Default grouping` column). Surfaced in the combined ask in step 2 when `defaultGrouping ∈ {Daily, Weekly, Monthly}`; not user-selectable on `None`/`Category` charts.",
  "- `aggregationType` (`Sum | Count | AVG`) — leave unset; the analytics service applies each chart's natural aggregation. Only set if the user explicitly asks for an override.",
  "- `tag` — segment/audience filter. Don't ask proactively (dashboard defaults to \"All Tags\"). Only set when the user names a segment, then resolve via `get_tags` and confirm the match before re-running.",
  "- `challengeId` — only meaningful on a few campaign-related charts. Don't ask proactively. Only set when the user names a specific reward campaign, then resolve via `get_reward_campaigns` and confirm the match before re-running.",
  "",
  "## Available charts (90)",
  "",
  ...PAGE_ORDER.flatMap(page => [
    `### ${page} (${CHART_CATALOG.filter(c => c.page === page).length})`,
    "",
    buildPageTable(page),
    "",
  ]),
  "## Common questions and the chart that answers them",
  "",
  "- \"How many active members?\"                    → Enrolled Members",
  "- \"Member growth this quarter?\"                 → Member Growth + groupingType: monthly",
  "- \"Which campaigns have the most achievements?\" → Top Achieved Campaigns",
  "- \"Referral revenue trend?\"                     → Total Revenue by Referral (Trend) + groupingType: monthly",
  "- \"Tier upgrade rate?\"                          → Tier Upgrade Percentage",
  "- \"Average order value?\"                        → Average Order Value (AOV)",
  "- \"Coupon usage rate?\"                          → Coupon Usage Rate",
  "",
  "## Interaction protocol",
  "",
  "1. Pick the chart. If intent is ambiguous (\"how is engagement?\"), pick which lens (rate / count / interactions / retention) — ask the user only if you genuinely can't tell.",
  "2. **Bucket-size ask** — only when `defaultGrouping ∈ {Daily, Weekly, Monthly}`. Phrasing: *\"Bucket size — default is **<defaultGrouping>**. Keep that, or pick `Daily`/`Weekly`/`Monthly`?\"* Wait for the user's reply. Skip this step entirely on charts whose `defaultGrouping` is `None` or `Category` (grouping is fixed).",
  "3. Call the tool with the agreed values.",
  "4. **Render in two parts** — always table first, then the chart in its **defined natural type from the catalog `Type` column** (no chart-type prompt, no opt-in, no choice):",
  "   - **Part A — Markdown table**: always render the raw values as a markdown table with explicit column headers (metric name + units, e.g. `| Week starting | New members | % vs prior |`), thousands-separator formatted numbers. This is the source of truth.",
  "   - **Part B — Chart in its natural type**: directly render the chart in the type from the catalog. Do NOT ask the user which type they want — the type is fixed by the chart's natural format. For `card` charts, skip Part A and just render the bolded value + trend (cards are scalar — no table or chart needed).",
  "",
  "   **Where each rendered element comes from in the tool response (`data` object):**",
  "   - `data.title` → chart title (heading above the chart)",
  "   - `data.series[]` → array of `{ name, data }`. Single series → use `series[0]`. Multi-series → iterate; each `series[i].name` is a legend entry, `series[i].data` is the value array.",
  "   - `data.xAxis.categories` → x-axis tick labels (dates or category names). Fall back to `data.labels` if `xAxis.categories` is empty/missing.",
  "   - `data.labels` → legend labels (also used for pie slice labels and heatmap rows).",
  "   - `data.metric` → for `card` charts: `currentValue` (the bolded number), `previousValue` + `delta` (the ▲/▼ trend), `postText` (small suffix label).",
  "   - `data.tableData` → for `table` and `heatmap` charts: rows of `{ key: value }` records (column headers come from the keys).",
  "   - `data.agg` → aggregation type that was applied (informational; surface only if the user asks).",
  "   Always ground the rendering in these exact fields — don't invent labels or values that aren't in the response.",
  "",
  "   ASCII rendering recipes — clarity-first; always label axes, label every series, and surface every data point's numeric value:",
  "   - `bar` → vertical bars from `███` blocks. **Y-axis** on the left with `┤` ticks, k/M-suffixed labels, metric label from `data.series[0].name` at the top. **X-axis** on the bottom (`└─→`) with `data.xAxis.categories` (or `data.labels`) as ticks. **Numeric value from `data.series[0].data[i]` under each bar.** Multi-series → side-by-side bars per category from `data.series[]` + a **legend** line above using `series[i].name` (e.g. `■ Series A  ■ Series B`).",
  "   - `line` → ⚠️ **DO NOT draw a freehand ASCII line plot. It will break.** Repeated past attempts produced misaligned axes, ghost markers, step rectangles, and improvised box-drawing characters. The deterministic recipe below is the ONLY allowed render path — emit exactly these three pieces, in this order, and nothing else:",
  "       **(a) Sparkline** — one line, mandatory, can't misalign:",
  "         1. Compute `Y_max` = next \"nice\" number ≥ `max(data.series[0].data)`. Nice = `10^k × {1, 2, 2.5, 5}`.",
  "         2. For each value `v` in `data.series[0].data`, pick the corresponding character from `▁▂▃▄▅▆▇█` based on `round(v × 7 / Y_max)` (0 → `▁`, 7 → `█`).",
  "         3. Join the characters with no separator. Output as one line, prefixed by `data.series[0].name`.",
  "         Example for values `[250k, 310k, 370k, 370k, 200k, 100k]` (Y_max = 400k): `Orders: ▅▆██▄▂   peak ~370k Apr 6–13, ▼73% by Apr 27`.",
  "         Multi-series → one sparkline line per `data.series[i]`, each prefixed by its name.",
  "       **(b) Mermaid `xychart-beta` block** — mandatory; renders inline in Claude Code as a real chart. Pull values directly from the response:",
  "         ```mermaid",
  "         xychart-beta",
  "             title \"<data.title>\"",
  "             x-axis [<comma-separated data.xAxis.categories or data.labels>]",
  "             y-axis \"<data.series[0].name>\" 0 --> <Y_max>",
  "             line [<comma-separated data.series[0].data>]",
  "         ```",
  "         Multi-series → one `line [...]` per `data.series[i].data` with a 1-line note above naming each series in order (Mermaid `xychart-beta` does not yet have native series labels).",
  "       **(c) Markdown table** — already part of step 4 Part A; the table is the source of truth and remains mandatory.",
  "       That's it — no freehand ASCII line plot, no `╭╮╰╯` rounded corners, no step rectangles, no improvised y-axis labels. The sparkline gives at-a-glance trend, the Mermaid block gives a real chart on capable hosts, the table gives exact values. All three are deterministic — character-for-character predictable from the response data.",
  "   - `pie` → category rows sorted largest→smallest, each showing label, proportional bar, percentage, and absolute value (e.g. `VIP    │ ████████████░░░░░░░  45%   (3,421)`). Total below. (Mermaid `pie` block is also acceptable for hosts that render it.)",
  "   - `heatmap` → emoji grid cool→hot `⬜🟪🟦🟩🟨🟧🟥` with row + column labels. One-line **color→value legend** (e.g. `⬜ 0–10%   🟪 10–25%   🟦 25–50%   🟩 50–75%   🟨 75–90%   🟧 90–95%   🟥 95–100%`). For small grids, append numeric value per cell (e.g. `🟦 42%`).",
  "   - `table` → if the chart's natural type IS `table`, only render Part A (the markdown table is the chart). Skip Part B.",
  "5. **Tag / Campaign** — only when the user mentions a segment or specific campaign by name or ID. Resolve names via `get_tags` / `get_reward_campaigns`, confirm the match (\"Found <name> (ID <id>) — use this one?\"), then re-run the tool with the resolved id. Otherwise leave unset (default = all). Never invent an ID, never pass a raw name.",
  "6. Show raw JSON only if the user explicitly asks for it.",
].join("\n");

export function registerAnalyticsTools(server: McpServer, api: AnalyticsAPI): void {
  server.registerTool("get_analytics_chart", {
    title: "Get Analytics Chart",
    description: DESCRIPTION,
    inputSchema: {
      chartName: z.enum(FRIENDLY_CHART_NAMES).describe("REQUIRED. The chart to fetch — pick one of the 90 friendly names from the catalog in the description."),
      from: z.string().optional().describe("ISO 8601 start datetime (e.g. 2026-04-01T00:00:00Z). Optional — defaults to 30 days before today (matches dashboard default). Only set if the user mentions a specific period."),
      to: z.string().optional().describe("ISO 8601 end datetime. Optional — defaults to today. Only set if the user mentions a specific period."),
      tag: z.string().optional().describe("Optional segment/tag filter — pass the tag's numeric ID. When prompting the user, accept either name or ID (\"the name or the ID, whichever is easier\"). If they give a name, resolve it via `get_tags`; if no match or ambiguous, tell the user and ask them to confirm or provide the ID before calling this tool."),
      groupingType: z.enum(["Daily", "Weekly", "Monthly"]).optional().describe("Time-bucket grouping (matches the dashboard Time period dropdown). Relevant ONLY on charts whose `defaultGrouping` is `Daily`/`Weekly`/`Monthly`. Leave unset to use the chart's natural default."),
      aggregationType: z.enum(["Sum", "Count", "AVG"]).optional().describe("Aggregation function. Relevant ONLY on charts whose `defaultAggregation` is `Sum`/`Count`/`AVG`. Leave unset to use the chart's natural default."),
      challengeId: z.number().int().optional().describe("Reward-campaign id filter — pass the campaign's numeric ID. When prompting the user, accept either name or ID (\"the name or the ID, whichever is easier\"). If they give a name, resolve it via `get_reward_campaigns`; if no match or ambiguous, tell the user and ask them to confirm or provide the ID before calling this tool. Only meaningful on a few campaign-related charts."),
    },
    annotations: { readOnlyHint: true },
  }, async ({ chartName, from, to, tag, groupingType, aggregationType, challengeId }) => {
    const technicalName = HUMAN_TO_TECHNICAL[chartName];
    const chartSpec = CHART_CATALOG.find(c => c.human === chartName);
    const isCard = chartSpec?.type === "card";
    const { defaultFrom, defaultTo } = computeDefaultDateRange();
    const result = await api.queryAnalyticsChart({
      chartName: technicalName,
      from: from ?? defaultFrom,
      to: to ?? defaultTo,
      tag,
      groupingType,
      aggregationType,
      challengeId,
    });
    const data = (result as any)?.data ?? result;
    // Embed a brief post-call instruction in the tool response so the assistant has fresh context for the render step. Render in two parts: markdown table first, then the chart in its defined natural type from the catalog. No chart-type choice — the type is fixed.
    const payload = isCard
      ? { data }
      : {
          data,
          renderHint: `Render in two parts:\n  1. Markdown table with the raw values (always — source of truth, with explicit headers + thousands separators).\n  2. Chart in its natural type from the catalog: **${chartSpec?.type}**. Do NOT ask the user which chart type to use — the type is fixed. ASCII art per the recipes in the tool description (or Mermaid for pie). For 'table' charts, skip part 2 (the table IS the chart).`,
        };
    return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
  });
}

/** Returns the dashboard's default analytics range — last 30 days inclusive on both ends. `from` is set to start-of-day (00:00:00.000) 29 days ago, `to` is set to end-of-day (23:59:59.999) today, so the full first day and full last day are both included. Matches gb-frontend-v2 analytics-layout `selectedDateRange = 'last30days'`. */
function computeDefaultDateRange(): { defaultFrom: string; defaultTo: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  from.setHours(0, 0, 0, 0);
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { defaultFrom: from.toISOString(), defaultTo: to.toISOString() };
}
