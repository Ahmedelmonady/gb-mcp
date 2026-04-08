/**
 * Base HTTP client for the Gameball MCP API.
 * All requests are authenticated via the X-GB-Access-Token header (PAT).
 * Calls the /api/v4.0/mcp/* endpoints on the Gameball backend.
 */

const DEFAULT_BASE_URL = "https://api.gameball.co";

export class GameballAPIClient {
  private baseUrl: string;
  private token: string;

  constructor(token: string, baseUrl?: string) {
    this.token = token;
    this.baseUrl = baseUrl || DEFAULT_BASE_URL;
  }

  /** The PAT token used for authentication */
  get authToken(): string {
    return this.token;
  }

  /** The base URL for the Gameball API */
  get apiBaseUrl(): string {
    return this.baseUrl;
  }

  /** Makes an authenticated JSON request to the Gameball MCP API */
  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}/api/v4.0/mcp${path}`;
    const headers: Record<string, string> = {
      "X-GB-Access-Token": this.token,
      "Content-Type": "application/json",
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : (method !== "GET" ? "{}" : undefined),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gameball API error ${response.status}: ${errorText}`);
    }

    const text = await response.text();
    return text ? (JSON.parse(text) as T) : ({} as T);
  }
}
