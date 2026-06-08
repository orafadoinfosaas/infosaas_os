import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { PREVIEW_HTML } from "@infosaas/renderer/preview-html";

// URI da view do preview de conteúdo (MCP Apps). As tools que querem mostrar o
// carrossel no chat apontam pra cá no _meta.ui.resourceUri.
export const PREVIEW_CONTEUDO_URI = "ui://infosaas/preview-conteudo";

/**
 * Registra as views (MCP Apps) servidas pelo MCP. Cada view é um resource ui://
 * com o HTML self-contained (bundle do @infosaas/renderer). O host renderiza num
 * iframe sandboxed e empurra o resultado da tool pro iframe.
 */
export function registerUiViews(server: McpServer): void {
  registerAppResource(
    server,
    PREVIEW_CONTEUDO_URI,
    PREVIEW_CONTEUDO_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => ({
      contents: [{ uri: PREVIEW_CONTEUDO_URI, mimeType: RESOURCE_MIME_TYPE, text: PREVIEW_HTML }],
    }),
  );
}
