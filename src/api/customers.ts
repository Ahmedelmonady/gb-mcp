import { GameballAPIClient } from "./client.js";

export class CustomersAPI {
  constructor(private client: GameballAPIClient) {}

  /** Lists customers with pagination and filtering — filter syntax: "level in 1,2;f;points ge 100;f;active eq true" */
  async getCustomers(params: {
    pageNo?: number;
    pageSize?: number;
    filter?: string;
    orderBy?: string;
    dir?: string;
  }): Promise<unknown> {
    const query = new URLSearchParams();
    if (params.pageNo) query.set("pageNo", String(params.pageNo));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.filter) query.set("filter", params.filter);
    if (params.orderBy) query.set("orderBy", params.orderBy);
    if (params.dir) query.set("dir", params.dir);
    const qs = query.toString();
    return this.client.request("GET", `/customers${qs ? `?${qs}` : ""}`);
  }

  /** Returns full details for a single customer by their external ID (customerId) */
  async getCustomerDetails(customerId: string): Promise<unknown> {
    return this.client.request("GET", `/customers/${encodeURIComponent(customerId)}`);
  }

  /** Adds points or currency amount to a customer's balance */
  async addCustomerPoints(customerId: string, params: { points?: number; amount?: number; reason: string; expiryAfterDays?: number }): Promise<unknown> {
    return this.client.request("POST", `/customers/${encodeURIComponent(customerId)}/add-points`, params);
  }

  /** Deducts points or currency amount from a customer's balance */
  async deductCustomerPoints(customerId: string, params: { points?: number; amount?: number; reason: string }): Promise<unknown> {
    return this.client.request("POST", `/customers/${encodeURIComponent(customerId)}/deduct-points`, params);
  }
}
