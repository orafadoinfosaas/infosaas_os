import path from "node:path";

/**
 * Normaliza um caminho relativo e BLOQUEIA path traversal. Aceita `/` ou `\`,
 * remove `.` e barras iniciais, e rejeita qualquer tentativa de escapar a raiz
 * do tenant com `..`. Retorna sempre um caminho posix relativo (ou "" para raiz).
 */
export function normalizeRel(rel: string): string {
  const norm = path.posix.normalize(String(rel ?? "").replace(/\\/g, "/")).replace(/^\/+/, "");
  if (norm === ".." || norm.startsWith("../")) {
    throw new Error("path traversal bloqueado");
  }
  return norm === "." ? "" : norm;
}

/** Junta segmentos em um caminho posix relativo, já normalizado/seguro. */
export function joinRel(...parts: string[]): string {
  return normalizeRel(parts.filter(Boolean).join("/"));
}
