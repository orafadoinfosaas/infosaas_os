import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStorage, storageKind } from "../storage/index.js";
import { dnaFiles } from "./dna.js";

/**
 * Expõe cada .md do dna/ do tenant como um resource MCP (`infosaas://<caminho>`),
 * que o Claude lê sob demanda. Funciona com qualquer backend de storage.
 */
export async function registerBrainResources(server: McpServer, tenant: string): Promise<void> {
  const files = await dnaFiles(tenant);
  const fs = getStorage(tenant);

  for (const rel of files) {
    const uri = `infosaas://${rel}`;
    server.registerResource(
      rel,
      uri,
      { title: rel, description: `DNA da empresa — ${rel}`, mimeType: "text/markdown" },
      async () => ({
        contents: [{ uri, mimeType: "text/markdown", text: await fs.read(rel) }],
      }),
    );
  }
  console.log(`[brain] ${files.length} resources do dna/ registrados (tenant=${tenant}, storage=${storageKind()}).`);
}
