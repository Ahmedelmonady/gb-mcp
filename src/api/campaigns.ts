import { GameballAPIClient } from "./client.js";

export class CampaignsAPI {
  constructor(private client: GameballAPIClient) {}

  async getRewardCampaigns(): Promise<unknown> {
    return this.client.request("GET", "/reward-campaigns");
  }

  async getRewardCampaign(id: number): Promise<unknown> {
    return this.client.request("GET", `/reward-campaigns/${id}`);
  }

  async toggleRewardCampaignActivation(id: number): Promise<unknown> {
    return this.client.request("PUT", `/reward-campaigns/${id}/activation`);
  }

  async getRewardCampaignTemplate(type: string): Promise<unknown> {
    return this.client.request("GET", `/reward-campaigns/template?type=${encodeURIComponent(type)}`);
  }

  async createRewardCampaign(params: unknown): Promise<unknown> {
    return this.client.request("POST", "/reward-campaigns", params);
  }

  async updateRewardCampaign(id: number, params: unknown): Promise<unknown> {
    return this.client.request("PUT", `/reward-campaigns/${id}`, params);
  }

  async deleteRewardCampaign(id: number): Promise<unknown> {
    return this.client.request("DELETE", `/reward-campaigns/${id}`);
  }
}
