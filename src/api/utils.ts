import { readFile } from "fs/promises";
import { basename } from "path";
import { GameballAPIClient } from "./client.js";

export class UtilsAPI {
  constructor(private client: GameballAPIClient) {}

  async getSupportedLanguages(): Promise<unknown> {
    return this.client.request("GET", "/utils/supported-languages");
  }

  /** Returns the client's available product collections with their collectionId and collectionName */
  async getCollections(): Promise<unknown> {
    return this.client.request("GET", "/utils/collections");
  }

  /** Returns the client's tags (custom tags, segments, RFM) with their IDs, names, and types */
  async getTags(): Promise<unknown> {
    return this.client.request("GET", "/utils/tags");
  }

  /** Returns the client's custom customer attributes with their IDs, keys, names, and data types */
  async getCustomerAttributes(): Promise<unknown> {
    return this.client.request("GET", "/utils/customer-attributes");
  }

  /** Returns the client's events with their IDs, names, display names, and metadata — use EventId when creating campaigns */
  async getEvents(): Promise<unknown> {
    return this.client.request("GET", "/utils/events");
  }

  /** Returns the client's merchants with their external IDs, names, and branches */
  async getMerchants(): Promise<unknown> {
    return this.client.request("GET", "/utils/merchants");
  }

  /** Reads a local image file and uploads it as multipart/form-data to the MCP upload-image endpoint, returns the S3 path */
  async uploadImage(filePath: string): Promise<{ path: string }> {
    const url = `${this.client.apiBaseUrl}/api/v4.0/mcp/utils/upload-image`;
    const fileBuffer = await readFile(filePath);
    const fileName = basename(filePath);

    // Build multipart form data with the image file
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer]), fileName);

    const response = await fetch(url, {
      method: "POST",
      headers: { "X-GB-Access-Token": this.client.authToken },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Image upload failed ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    return result as { path: string };
  }
}
