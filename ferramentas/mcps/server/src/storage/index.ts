import type { Storage } from "./types.js";
import { LocalStorage } from "./local.js";
import { WebdavStorage } from "./webdav.js";

export type { Storage, Entry } from "./types.js";

/**
 * Escolhe o backend de storage:
 * - NEXTCLOUD_URL definido → WebDAV (produção, Nextcloud/Storage Share)
 * - senão → Local (dev, lê o repo)
 */
export function getStorage(tenant: string): Storage {
  if (process.env.NEXTCLOUD_URL?.trim()) {
    return new WebdavStorage(tenant);
  }
  return new LocalStorage(tenant);
}

/** Nome do backend ativo (para log/health). */
export function storageKind(): "webdav" | "local" {
  return process.env.NEXTCLOUD_URL?.trim() ? "webdav" : "local";
}
