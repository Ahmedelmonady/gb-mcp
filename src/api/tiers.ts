import { GameballAPIClient } from "./client.js";

export class TiersAPI {
  constructor(private client: GameballAPIClient) {}

  /** Returns all VIP tiers with IDs, names, order, and score thresholds */
  async getTiers(): Promise<unknown> {
    return this.client.request("GET", "/tiers");
  }

  /** Returns full details for a single VIP tier by ID — includes reward configurations (benefits), locales, icon */
  async getTierDetails(id: number): Promise<unknown> {
    return this.client.request("GET", `/tiers/${id}`);
  }
}
