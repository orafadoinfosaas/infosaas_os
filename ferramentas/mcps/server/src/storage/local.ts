import { readFile, writeFile, mkdir, rm, rename, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { Entry, Storage } from "./types.js";
import { tenantPath } from "../fs/paths.js";
import { normalizeRel } from "./util.js";

/**
 * Backend local (dev): opera sobre o filesystem, dentro da pasta do tenant.
 * Em dev sem CLIENTS_ROOT, a raiz é o próprio repo (lê dna/ direto).
 * Toda resolução passa por tenantPath() → anti path-traversal.
 */
export class LocalStorage implements Storage {
  constructor(private readonly tenant: string) {}

  private abs(rel: string): string {
    return tenantPath(this.tenant, normalizeRel(rel));
  }

  async list(rel: string): Promise<Entry[]> {
    const dir = this.abs(rel);
    if (!existsSync(dir)) return [];
    const ents = await readdir(dir, { withFileTypes: true });
    const base = normalizeRel(rel);
    const out: Entry[] = [];
    for (const e of ents) {
      const p = base ? `${base}/${e.name}` : e.name;
      if (e.isDirectory()) {
        out.push({ name: e.name, path: p, type: "dir" });
      } else if (e.isFile()) {
        const s = await stat(path.join(dir, e.name));
        out.push({ name: e.name, path: p, type: "file", size: s.size });
      }
    }
    return out.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
  }

  async walk(rel: string): Promise<string[]> {
    const base = normalizeRel(rel);
    const root = this.abs(rel);
    if (!existsSync(root)) return [];
    const out: string[] = [];
    const stack: string[] = [base];
    while (stack.length) {
      const cur = stack.pop()!;
      const ents = await readdir(this.abs(cur), { withFileTypes: true });
      for (const e of ents) {
        const p = cur ? `${cur}/${e.name}` : e.name;
        if (e.isDirectory()) stack.push(p);
        else if (e.isFile()) out.push(p);
      }
    }
    return out.sort();
  }

  async read(rel: string): Promise<string> {
    return readFile(this.abs(rel), "utf8");
  }

  async write(rel: string, content: string): Promise<void> {
    const abs = this.abs(rel);
    await mkdir(path.dirname(abs), { recursive: true });
    await writeFile(abs, content, "utf8");
  }

  async exists(rel: string): Promise<boolean> {
    return existsSync(this.abs(rel));
  }

  async remove(rel: string): Promise<void> {
    await rm(this.abs(rel), { force: true });
  }

  async move(from: string, to: string): Promise<void> {
    const dst = this.abs(to);
    await mkdir(path.dirname(dst), { recursive: true });
    await rename(this.abs(from), dst);
  }
}
