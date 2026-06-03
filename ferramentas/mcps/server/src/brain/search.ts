import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getStorage } from "../storage/index.js";
import { dnaFiles } from "./dna.js";

const MAX_HITS = 40;

/**
 * Tool `buscar_no_cerebro`: busca por palavra-chave no dna/ do tenant e
 * devolve as linhas relevantes (arquivo:linha). Funciona com qualquer backend.
 */
export function registerSearchTool(server: McpServer, tenant: string): void {
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
      const files = await dnaFiles(tenant);
      if (!files.length) {
        return { content: [{ type: "text", text: "dna/ vazio ou inexistente para este tenant." }], isError: true };
      }
      const fs = getStorage(tenant);
      const termos = consulta.toLowerCase().split(/\s+/).filter(Boolean);
      const hits: string[] = [];

      for (const rel of files) {
        const txt = await fs.read(rel);
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
