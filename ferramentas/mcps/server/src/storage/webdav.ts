import { createClient, type WebDAVClient, type FileStat } from "webdav";
import type { Entry, Storage } from "./types.js";
import { normalizeRel } from "./util.js";

/**
 * Backend de produção: fala com o Nextcloud (Hetzner Storage Share) via WebDAV.
 * Sem FUSE/mount — chamadas HTTP diretas, ideal para o container do Easypanel.
 *
 * A raiz de cada tenant no servidor é `<NEXTCLOUD_BASE>/<tenant>` (ex.
 * `clientes/infosaas`). Todos os caminhos da interface são relativos a essa raiz.
 */
export class WebdavStorage implements Storage {
  private readonly client: WebDAVClient;
  private readonly base: string; // ex.: "clientes/infosaas"

  constructor(tenant: string) {
    const url = req("NEXTCLOUD_URL");
    this.client = createClient(url, {
      username: req("NEXTCLOUD_USER"),
      password: req("NEXTCLOUD_PASS"),
    });
    const root = (process.env.NEXTCLOUD_BASE ?? "clientes").replace(/^\/+|\/+$/g, "");
    this.base = `${root}/${tenant}`;
  }

  /** caminho absoluto no servidor WebDAV para um rel do tenant */
  private srv(rel: string): string {
    const r = normalizeRel(rel);
    return "/" + [this.base, r].filter(Boolean).join("/");
  }

  /** tira o prefixo da raiz do tenant de um filename retornado pelo WebDAV */
  private stripBase(filename: string): string {
    const prefix = "/" + this.base + "/";
    const i = filename.indexOf(prefix);
    return i >= 0 ? filename.slice(i + prefix.length) : filename.replace(/^\/+/, "");
  }

  async list(rel: string): Promise<Entry[]> {
    let items: FileStat[];
    try {
      items = (await this.client.getDirectoryContents(this.srv(rel))) as FileStat[];
    } catch {
      return [];
    }
    return items
      .map((it) => ({
        name: it.basename,
        path: this.stripBase(it.filename),
        type: it.type === "directory" ? ("dir" as const) : ("file" as const),
        size: it.type === "file" ? it.size : undefined,
      }))
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
  }

  async walk(rel: string): Promise<string[]> {
    let items: FileStat[];
    try {
      items = (await this.client.getDirectoryContents(this.srv(rel), { deep: true })) as FileStat[];
    } catch {
      return [];
    }
    return items
      .filter((it) => it.type === "file")
      .map((it) => this.stripBase(it.filename))
      .sort();
  }

  async read(rel: string): Promise<string> {
    return (await this.client.getFileContents(this.srv(rel), { format: "text" })) as string;
  }

  async write(rel: string, content: string): Promise<void> {
    const parent = normalizeRel(rel).split("/").slice(0, -1).join("/");
    if (parent) await this.client.createDirectory(this.srv(parent), { recursive: true });
    await this.client.putFileContents(this.srv(rel), content, { overwrite: true });
  }

  async exists(rel: string): Promise<boolean> {
    return this.client.exists(this.srv(rel));
  }

  async remove(rel: string): Promise<void> {
    await this.client.deleteFile(this.srv(rel));
  }

  async move(from: string, to: string): Promise<void> {
    const parent = normalizeRel(to).split("/").slice(0, -1).join("/");
    if (parent) await this.client.createDirectory(this.srv(parent), { recursive: true });
    await this.client.moveFile(this.srv(from), this.srv(to));
  }
}

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`env ${name} obrigatória para o backend WebDAV (Nextcloud)`);
  return v;
}
