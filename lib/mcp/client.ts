/*
 * This is a reference for how to connect with Streamable HTTP
 * It is not used anywhere.
*/

import {
  Client,
  ClientOptions
} from "@modelcontextprotocol/sdk/client/index.js";
import {
  StreamableHTTPClientTransport
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  SSEClientTransport
} from "@modelcontextprotocol/sdk/client/sse.js";
import { MCPTool } from "./types";

export class MCPHttpClient {
  private mcp: Client;
  private tools: MCPTool[] = [];
  private connected = false;

  constructor(
    private readonly baseUrl = "http://localhost:3001/mcp", // modern endpoint
    private readonly legacySseUrl = "http://localhost:3001/sse" // fallback
  ) {
    const info: ClientInfo = { name: "nextjs-mcp-client", version: "1.0.0" };
    this.mcp = new Client(info);
  }

  /** Initialises the MCP connection (idempotent). */
  async init(): Promise<void> {
    if (this.connected) return;

    // Try Streamable HTTP first
    try {
      const transport = new StreamableHTTPClientTransport(new URL(this.baseUrl));
      await this.mcp.connect(transport);
    } catch {
      // Fallback to deprecated SSE servers
      const transport = new SSEClientTransport(new URL(this.legacySseUrl));
      await this.mcp.connect(transport);
    }

    const { tools } = await this.mcp.listTools();
    this.tools = tools as MCPTool[];
    this.connected = true;
  }

  getTools(): MCPTool[] {
    return this.tools;
  }

  /** Executes a tool by name with given args. */
  async callTool<T = any>(name: string, args: unknown): Promise<T> {
    if (!this.connected) await this.init();
    return this.mcp.callTool(name, { arguments: args }) as Promise<T>;
  }
}

// Singleton instance
export const mcpClient = new MCPHttpClient();
