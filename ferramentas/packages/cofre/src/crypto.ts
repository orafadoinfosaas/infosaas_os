import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

// Cifragem das credenciais do cliente em repouso. AES-256-GCM (autenticado).
// A master key vem da env COFRE_KEY (base64 de 32 bytes). Rotação = nova key +
// re-cifrar (futuro). NUNCA logar plaintext nem a key.
const ALGO = "aes-256-gcm";

function key(): Buffer {
  const b64 = process.env.COFRE_KEY?.trim();
  if (!b64) throw new Error("COFRE_KEY ausente — defina a master key (base64 de 32 bytes).");
  const k = Buffer.from(b64, "base64");
  if (k.length !== 32) throw new Error("COFRE_KEY inválida — precisa ser 32 bytes (base64).");
  return k;
}

/** Cifra um texto. Saída: "iv.tag.ciphertext" (cada parte em base64). */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(".");
}

/** Decifra uma string "iv.tag.ciphertext". Lança se a key estiver errada/dado adulterado. */
export function decrypt(payload: string): string {
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("ciphertext malformado.");
  const decipher = createDecipheriv(ALGO, key(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString("utf8");
}

/** Gera uma master key nova (base64) — utilitário p/ setup (ex.: node -e). */
export function generateKey(): string {
  return randomBytes(32).toString("base64");
}
