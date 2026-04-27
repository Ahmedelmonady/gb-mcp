import { GameballAPIClient } from "./client.js";

export class EarningAPI {
  constructor(private client: GameballAPIClient) {}

  async getEarningConfig(): Promise<unknown> {
    return this.client.request("GET", "/earning");
  }

  async updateEarningConfig(params: unknown): Promise<unknown> {
    return this.client.request("PUT", "/earning", params);
  }

  async getEarningRules(): Promise<unknown> {
    return this.client.request("GET", "/earning/rules");
  }

  async updateEarningRules(params: unknown): Promise<unknown> {
    return this.client.request("PUT", "/earning/rules", params);
  }

  async createCustomEarningRule(params: unknown): Promise<unknown> {
    return this.client.request("POST", "/earning/custom-rules", params);
  }

  async getCustomEarningRules(): Promise<unknown> {
    return this.client.request("GET", "/earning/custom-rules");
  }

  async updateCustomEarningRule(params: unknown): Promise<unknown> {
    return this.client.request("PUT", "/earning/custom-rules", params);
  }

  async deleteCustomEarningRule(ruleName: string): Promise<unknown> {
    return this.client.request("DELETE", `/earning/custom-rules?ruleName=${encodeURIComponent(ruleName)}`);
  }
}
