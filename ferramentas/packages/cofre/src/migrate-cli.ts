// Entry standalone para rodar migrations manualmente / como release step no
// Easypanel:  DATABASE_URL=... node dist/migrate-cli.js
import { migrate } from "./db.js";

migrate()
  .then(() => {
    console.log("[cofre] migrations aplicadas com sucesso");
    process.exit(0);
  })
  .catch((e) => {
    console.error("[cofre] migrate falhou:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
