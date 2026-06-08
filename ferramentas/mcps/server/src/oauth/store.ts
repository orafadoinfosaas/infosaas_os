// Estado efêmero do fluxo OAuth, em memória com TTL. Curtíssima duração (<10 min):
// transações de login (entre /authorize e o callback do Logto) e auth codes
// (entre o callback e /token). Single-use via take(). Tokens emitidos são JWT
// (stateless) → sobrevivem a restart; só logins em andamento se perdem (aceitável).
// Premissa: MCP single-instance (Easypanel). Se escalar, mover p/ Redis/cofre.

type Entry<T> = { value: T; exp: number };

class TTLStore<T> {
  private m = new Map<string, Entry<T>>();

  set(key: string, value: T, ttlMs: number): void {
    this.m.set(key, { value, exp: Date.now() + ttlMs });
    if (this.m.size > 5000) this.gc();
  }

  /** Lê e REMOVE (single-use). null se ausente/expirado. */
  take(key: string): T | null {
    const e = this.m.get(key);
    if (!e) return null;
    this.m.delete(key);
    return Date.now() > e.exp ? null : e.value;
  }

  private gc(): void {
    const now = Date.now();
    for (const [k, e] of this.m) if (now > e.exp) this.m.delete(k);
  }
}

export type LoginTx = {
  clientRedirectUri: string;
  clientState: string;
  clientCodeChallenge: string;
  logtoVerifier: string;
  logtoNonce: string;
};

export type AuthCode = {
  sub: string;
  email: string;
  clientCodeChallenge: string;
  clientRedirectUri: string;
};

export const loginTxStore = new TTLStore<LoginTx>();
export const authCodeStore = new TTLStore<AuthCode>();
