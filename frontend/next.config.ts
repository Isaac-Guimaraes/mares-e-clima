import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A versão anterior tinha uma tela única em /dashboard; links antigos continuam funcionando.
  async redirects() {
    return [{ source: "/dashboard", destination: "/hoje", permanent: false }];
  },
};

export default nextConfig;
