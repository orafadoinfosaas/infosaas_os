import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tenantPath } from "../fs/paths.js";

/**
 * Expõe cada arquivo .md do dna/ do tenant como um *resource* MCP, que o
 * Claude lê sob demanda via URI `infosaas://dna/<caminho>`.
 *
 * fast-glob normaliza os caminhos com `/` (mesmo no Windows), então a URI
 * fica consistente entre plataformas.
 */
export async function registerBrainResources(
  server: McpServer,
  tenantId: string,
): Promise<void> {
  const dnaDir = tenantPath(tenantId, "dna");
  if (!existsSync(dnaDir)) {
    console.warn(`[brain] dna/ não encontrado em ${dnaDir} — nenhum resource registrado.`);
    return;
  }

  const files = await fg("**/*.md", { cwd: dnaDir, dot: false });
  for (const rel of files) {
    const uri = `infosaas://dna/${rel}`;
    server.registerResource(
      rel,
      uri,
      { title: rel, description: `DNA da empresa — ${rel}`, mimeType: "text/markdown" },
      async () => ({
        contents: [
          {
            uri,
            mimeType: "text/markdown",
            text: await readFile(tenantPath(tenantId, "dna", rel), "utf8"),
          },
        ],
      }),
    );
  }
  console.log(`[brain] ${files.length} resources do dna/ registrados (tenant=${tenantId}).`);
}
