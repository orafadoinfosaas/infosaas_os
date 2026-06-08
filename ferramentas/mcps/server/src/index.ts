import express, { type Request, type Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { buildServer } from "./server.js";
import { resolveTenant } from "./tenancy/resolve.js";
import { DEFAULT_TENANT, registrySize, storeMode, USE_COFRE } from "./tenancy/store.js";
import { storageKind } from "./storage/index.js";
import { ensureSchema } from "@infosaas/cofre";

const PORT = Number(process.env.PORT ?? 8787);

const app = express();
app.use(express.json({ limit: "4mb" }));

// Cofre (Postgres): garante o schema no boot (idempotente). Só quando DATABASE_URL existe.
if (USE_COFRE) {
  void ensureSchema()
    .then(() => console.log("[cofre] schema garantido (Postgres)."))
    .catch((err) => console.error("[cofre] falha ao garantir schema:", err));
}

// Healthcheck (sem auth) — usado pelo reverse proxy / uptime.
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "infosaas-os-mcp", tenant: DEFAULT_TENANT, tenancy: storeMode(), tenants: registrySize(), storage: storageKind() });
});

// Endpoint MCP — Streamable HTTP, stateless (um transport por requisição).
// O TOKEN identifica o tenant (multi-tenant por token). null = não autorizado.
app.post("/mcp", async (req: Request, res: Response) => {
  const tenantId = await resolveTenant(req);
  if (!tenantId) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "unauthorized" },
      id: null,
    });
    return;
  }

  try {
    const server = await buildServer({ tenantId });
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => {
      void transport.close();
      void server.close();
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("[mcp] erro ao processar requisição:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "internal error" },
        id: null,
      });
    }
  }
});

// Stateless: GET/DELETE não mantêm stream de sessão.
function methodNotAllowed(_req: Request, res: Response): void {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
}
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.listen(PORT, () => {
  console.log(`[mcp] Infosaas OS MCP ouvindo em :${PORT} (default=${DEFAULT_TENANT}, tenants=${registrySize()})`);
});
