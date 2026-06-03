/** Uma entrada (arquivo ou pasta) no OS do tenant. */
export interface Entry {
  /** nome simples (basename) */
  name: string;
  /** caminho relativo à raiz do tenant, sempre com `/` */
  path: string;
  type: "file" | "dir";
  /** tamanho em bytes (só para arquivos) */
  size?: number;
}

/**
 * Abstração de armazenamento do OS de um tenant. Todos os caminhos são
 * RELATIVOS à raiz do tenant e usam `/`. As implementações garantem que
 * nenhum caminho escape da raiz (anti path-traversal).
 *
 * Backends: LocalStorage (dev, lê o repo) e WebdavStorage (prod, Nextcloud).
 */
export interface Storage {
  /** lista o conteúdo imediato de uma pasta (não-recursivo) */
  list(rel: string): Promise<Entry[]>;
  /** todos os caminhos de ARQUIVO sob `rel` (recursivo), relativos à raiz */
  walk(rel: string): Promise<string[]>;
  /** lê um arquivo como texto utf-8 */
  read(rel: string): Promise<string>;
  /** cria/sobrescreve um arquivo (cria pastas-pai se preciso) */
  write(rel: string, content: string): Promise<void>;
  /** existe? (arquivo ou pasta) */
  exists(rel: string): Promise<boolean>;
  /** remove um arquivo */
  remove(rel: string): Promise<void>;
  /** move/renomeia um arquivo */
  move(from: string, to: string): Promise<void>;
}
