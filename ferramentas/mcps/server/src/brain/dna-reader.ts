import type { DnaReader } from "@infosaas/content";
import { getStorage } from "../storage/index.js";

/**
 * `DnaReader` backed pelo storage do tenant (WebDAV/local) — é o que permite o MCP
 * montar o MESMO system prompt do DNA que o editor usa, lendo do Nextcloud do cliente.
 *
 * Convenção de pastas no OS do tenant:
 *   - DNA da empresa:        dna/empresa/*.md, dna/perfil-de-cliente-ideal/*.md, dna/produtos/<id>/*.md
 *   - skills da fase do funil: dna/skills/{DESCOBERTA,RELACIONAMENTO,PRONTIDAO}.md
 */
export function tenantDnaReader(tenant: string): DnaReader {
  const fs = getStorage(tenant);
  return {
    async readDnaFile(rel) {
      return fs.read(`dna/${rel}`);
    },
    async listDnaMarkdown(relDir) {
      try {
        const entries = await fs.list(`dna/${relDir}`);
        return entries
          .filter((e) => e.type === "file" && e.name.toLowerCase().endsWith(".md"))
          .map((e) => e.name);
      } catch {
        return [];
      }
    },
    async readSkillFile(filename) {
      return fs.read(`dna/skills/${filename}`);
    },
  };
}
