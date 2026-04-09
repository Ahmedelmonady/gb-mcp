import { GameballAPIClient } from "./client.js";

export class ProgramAPI {
  constructor(private client: GameballAPIClient) {}

  async getProgramActivation(): Promise<unknown> {
    return this.client.request("GET", "/program/activation");
  }

  async toggleProgramActivation(isActive: boolean): Promise<unknown> {
    return this.client.request("PUT", "/program/activation", { isActive });
  }
}
