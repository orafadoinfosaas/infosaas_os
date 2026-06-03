import { getStorage } from "../storage/index.js";

/**
 * Lista (cacheada) dos arquivos .md do dna/ do tenant. Cache curto pra não
 * fazer PROPFIND no Nextcloud a cada requisição (o server é stateless e
 * reconstrói por request, mas o cache de módulo persiste no processo).
 */
const TTL_MS = 30_000;
const cache = new Map<string, { at: number; files: string[] }>();

export async function dnaFiles(tenant: string): Promise<string[]> {
  const hit = cache.get(tenant);
  const now = Date.now();
  if (hit && now - hit.at < TTL_MS) return hit.files;
  const all = await getStorage(tenant).walk("dna");
  const files = all.filter((f) => f.toLowerCase().endsWith(".md"));
  cache.set(tenant, { at: now, files });
  return files;
}
