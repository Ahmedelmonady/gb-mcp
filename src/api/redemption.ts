import { GameballAPIClient } from "./client.js";

/** Full create redemption request matching backend McpCreateRedemptionRuleRequest */
export interface CreateRedemptionParams {
  ruleType: string;
  pointsToRedeem: number;
  ruleName?: string;
  discountValue?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  rewardNames?: { languageId: number; value: string }[];
  minOrderValue?: number;
  couponExpiryDays?: number;
  couponPrefix?: string;
  usageLimit?: number;
  capping?: number;
  isCashback?: boolean;
  applyToFees?: boolean;
  combinesWithOrder?: boolean;
  combinesWithProduct?: boolean;
  combinesWithShipping?: boolean;
  productId?: string;
  productName?: string;
  collections?: { collectionId: string; collectionName: string }[];
  merchants?: { merchantExternalId: string; merchantName: string }[];
  collectionMerchantOperator?: string;
  audience?: { key: string; operator: number; value: string }[];
  audienceLogicalOperator?: string;
  redeemInstructions?: { languageId: number; value: string }[];
  iconPath?: string;
  platforms?: string[];
  couponGroupHandle?: string;
}

export class RedemptionAPI {
  constructor(private client: GameballAPIClient) {}

  async getRedemptionOptions(): Promise<unknown> {
    return this.client.request("GET", "/redemption");
  }

  async getRedemptionOption(id: number): Promise<unknown> {
    return this.client.request("GET", `/redemption/${id}`);
  }

  async toggleRedemptionOptionActivation(id: number): Promise<unknown> {
    return this.client.request("PUT", `/redemption/${id}/activation`);
  }

  async deleteRedemptionOption(id: number): Promise<unknown> {
    return this.client.request("DELETE", `/redemption/${id}`);
  }

  async createRedemptionOption(params: CreateRedemptionParams): Promise<unknown> {
    return this.client.request("POST", "/redemption", params);
  }

  async updateRedemptionOption(id: number, params: CreateRedemptionParams): Promise<unknown> {
    return this.client.request("PUT", `/redemption/${id}`, params);
  }
}
