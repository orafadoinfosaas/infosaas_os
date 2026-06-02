import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remotion: o renderer/bundler incluem Webpack e binários nativos — não podem
  // ser empacotados pelo Webpack do Next; mantê-los externos no server.
  serverExternalPackages: ["@remotion/bundler", "@remotion/renderer", "ffmpeg-static"],
};

export default nextConfig;
