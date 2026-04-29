import { GameballAPIClient } from "./client.js";

export class AnalyticsAPI {
  constructor(private client: GameballAPIClient) {}

  /** Fetches one analytics chart from the gb-advanced-analytics service via the backend's MCP analytics router. The chartName must be a technical name (mapping happens in the tool layer). groupingType / aggregationType are the EGroupingType / EAggregationType enum NAMES (e.g. "Weekly", "Sum") — the backend translates the strings to the enum. */
  async queryAnalyticsChart(params: {
    chartName: string;
    from?: string;
    to?: string;
    tag?: string;
    groupingType?: string;
    aggregationType?: string;
    challengeId?: number;
  }): Promise<unknown> {
    const query = new URLSearchParams();
    query.set("chartName", params.chartName);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.tag) query.set("tag", params.tag);
    if (params.groupingType) query.set("groupingType", params.groupingType);
    if (params.aggregationType) query.set("aggregationType", params.aggregationType);
    if (params.challengeId !== undefined) query.set("challengeId", String(params.challengeId));
    return this.client.request("GET", `/analytics/query?${query.toString()}`);
  }
}
