import { z } from "zod";
import fg from "fast-glob";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { tenantPath } from "../fs/paths.js";

const MAX_HITS = 40;

/**
 * Tool `buscar_no_cerebro`: busca por palavra-chave no dna/ do tenant e
 * devolve as linhas relevantes (arquivo:linha). Suficiente na Fase 1;
 * quando o dna/ crescer, troca-se por RAG/embeddings (ver §9 do doc).
 */
export function registerSearchTool(server: McpServer, tenantId: string): void {
  server.registerTool(
    "buscar_no_cerebro",
    {
      title: "Buscar no cérebro da empresa",
      description:
        "Busca trechos relevantes na memória (dna/) da empresa: posicionamento, voz, produtos, ICP, identidade visual.",
      inputSchema: {
        consulta: z.string().min(2).describe("o que procurar no DNA da empresa"),
      },
    },
    async ({ consulta }) => {
      const dnaDir = tenantPath(tenantId, "dna");
      if (!existsSync(dnaDir)) {
        return {
          content: [{ type: "text", text: "dna/ não encontrado para este tenant." }],
          isError: true,
        };
      }

      const files = await fg("**/*.md", { cwd: dnaDir, dot: false });
      const termos = consulta.toLowerCase().split(/\s+/).filter(Boolean);
      const hits: string[] = [];

      for (const rel of files) {
        const txt = await readFile(tenantPath(tenantId, "dna", rel), "utf8");
        const linhas = txt.split("\n");
        for (let i = 0; i < linhas.length; i++) {
          if (termos.some((t) => linhas[i].toLowerCase().includes(t))) {
            hits.push(`${rel}:${i + 1}  ${linhas[i].trim()}`);
            if (hits.length >= MAX_HITS) break;
          }
        }
        if (hits.length >= MAX_HITS) break;
      }

      const texto = hits.length ? hits.join("\n") : "Nada encontrado no dna/.";
      return { content: [{ type: "text", text: texto }] };
    },
  );
}
