import { GameballAPIClient } from "./client.js";

export class WidgetAPI {
  constructor(private client: GameballAPIClient) {}

  async getWidgetSettings(): Promise<unknown> {
    return this.client.request("GET", "/widget");
  }

  async updateWidgetStyle(params: unknown): Promise<unknown> {
    return this.client.request("PUT", "/widget/style", params);
  }

  async updateWidgetSettings(params: unknown): Promise<unknown> {
    return this.client.request("PUT", "/widget", params);
  }

  async updateWidgetSorting(params: unknown): Promise<unknown> {
    return this.client.request("PUT", "/widget/sorting", params);
  }

  async updateSupportedLanguages(languages: unknown[]): Promise<unknown> {
    return this.client.request("PUT", "/widget/languages", languages);
  }
}
