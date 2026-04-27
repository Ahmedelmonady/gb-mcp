import { GameballAPIClient } from "./client.js";

export class CampaignsAPI {
  constructor(private client: GameballAPIClient) {}

  /** Lists reward campaigns with pagination and filtering — filter syntax: "status eq true;f;behavior in 1,2;f;cname in welcome" */
  async getRewardCampaigns(params: {
    pageNo?: number;
    pageSize?: number;
    filter?: string;
    orderBy?: string;
    dir?: string;
  } = {}): Promise<unknown> {
    const query = new URLSearchParams();
    if (params.pageNo) query.set("pageNo", String(params.pageNo));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.filter) query.set("filter", params.filter);
    if (params.orderBy) query.set("orderBy", params.orderBy);
    if (params.dir) query.set("dir", params.dir);
    const qs = query.toString();
    return this.client.request("GET", `/reward-campaigns${qs ? `?${qs}` : ""}`);
  }

  /** Returns the total count of reward campaigns matching the filter — uses the same interface as getRewardCampaigns (pageNo/pageSize accepted but ignored) */
  async getRewardCampaignsCount(params: {
    pageNo?: number;
    pageSize?: number;
    filter?: string;
    orderBy?: string;
    dir?: string;
  } = {}): Promise<unknown> {
    const query = new URLSearchParams();
    if (params.pageNo) query.set("pageNo", String(params.pageNo));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.filter) query.set("filter", params.filter);
    if (params.orderBy) query.set("orderBy", params.orderBy);
    if (params.dir) query.set("dir", params.dir);
    const qs = query.toString();
    return this.client.request("GET", `/reward-campaigns/count${qs ? `?${qs}` : ""}`);
  }

  async getRewardCampaign(id: number): Promise<unknown> {
    return this.client.request("GET", `/reward-campaigns/${id}`);
  }

  /** Lists customers rewarded by a specific campaign with pagination and filtering — same filter syntax as get_customers, plus campaign-specific filters (success, behavior, voucher, merchant) */
  async getRewardCampaignCustomers(id: number, params: {
    pageNo?: number;
    pageSize?: number;
    filter?: string;
    orderBy?: string;
    dir?: string;
  } = {}): Promise<unknown> {
    const query = new URLSearchParams();
    if (params.pageNo) query.set("pageNo", String(params.pageNo));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.filter) query.set("filter", params.filter);
    if (params.orderBy) query.set("orderBy", params.orderBy);
    if (params.dir) query.set("dir", params.dir);
    const qs = query.toString();
    return this.client.request("GET", `/reward-campaigns/${id}/customers${qs ? `?${qs}` : ""}`);
  }

  /** Returns the total count of customers rewarded by a specific campaign matching the filter — same interface as getRewardCampaignCustomers (pageNo/pageSize accepted but ignored) */
  async getRewardCampaignCustomersCount(id: number, params: {
    pageNo?: number;
    pageSize?: number;
    filter?: string;
    orderBy?: string;
    dir?: string;
  } = {}): Promise<unknown> {
    const query = new URLSearchParams();
    if (params.pageNo) query.set("pageNo", String(params.pageNo));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.filter) query.set("filter", params.filter);
    if (params.orderBy) query.set("orderBy", params.orderBy);
    if (params.dir) query.set("dir", params.dir);
    const qs = query.toString();
    return this.client.request("GET", `/reward-campaigns/${id}/customers/count${qs ? `?${qs}` : ""}`);
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
