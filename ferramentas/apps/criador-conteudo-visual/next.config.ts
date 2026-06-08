import path from "node:path";
import type { NextConfig } from "next";

// Raiz do filesystem do Turbopack: precisa englobar o app E os pacotes do workspace
// (ferramentas/packages/*), que entram como symlink (file: deps) FORA da pasta do app.
// Sem isso, o Turbopack não resolve os @infosaas/* ("Can't resolve"). cwd = pasta do
// app tanto em dev quanto no `next build` (local e Docker) → ../.. = ferramentas/.
const monorepoRoot = path.resolve(process.cwd(), "..", "..");

const nextConfig: NextConfig = {
  turbopack: {
    root: monorepoRoot,
  },

  // Pacotes do monorepo: tratados como código local (resolve + bundla corretamente
  // em vez de external node_modules, que com symlink de workspace dá problema).
  transpilePackages: ["@infosaas/content", "@infosaas/renderer", "@infosaas/cofre"],

  // Remotion: o renderer/bundler incluem Webpack e binários nativos — não podem
  // ser empacotados pelo Turbopack no server; mantê-los externos.
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "ffmpeg-static"],
};

export default nextConfig;
