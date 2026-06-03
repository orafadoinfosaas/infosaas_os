import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBrainResources } from "./brain/resources.js";
import { registerSearchTool } from "./brain/search.js";
import { registerFileTools } from "./tools/files.js";

export interface BuildOpts {
  tenantId: string;
}

/**
 * Monta um McpServer para um tenant. Na Fase 1/2 é sempre o mesmo tenant
 * (single-tenant); na Fase 3, o tenantId vem da auth (OAuth) por requisição.
 */
export async function buildServer({ tenantId }: BuildOpts): Promise<McpServer> {
  const server = new McpServer({ name: "infosaas-os", version: "2.0.0" });

  await registerBrainResources(server, tenantId); // dna/ como resources
  registerSearchTool(server, tenantId); // tool buscar_no_cerebro
  registerFileTools(server, tenantId); // Fase 2: CRUD genérico do OS

  return server;
}
