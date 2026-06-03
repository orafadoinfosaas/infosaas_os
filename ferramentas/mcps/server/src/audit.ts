/**
 * Log de auditoria estruturado. Registra quem (tenant), o quê (tool), com quais
 * argumentos relevantes e quando. Vai pro stdout (capturado pelo Easypanel).
 * Nunca loga o CONTEÚDO de arquivos — só caminhos/metadados, pra não vazar dados
 * entre tenants nem inchar o log.
 */
export function audit(
  tenant: string,
  tool: string,
  details: Record<string, unknown> = {},
): void {
  const line = {
    ts: new Date().toISOString(),
    tenant,
    tool,
    ...details,
  };
  console.log(`[audit] ${JSON.stringify(line)}`);
}
