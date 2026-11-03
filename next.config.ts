import type { NextConfig } from "next";

/**
 * Em proxies como o encaminhamento de portas do GitHub Codespaces, o navegador
 * envia `Origin: <codespace>-3000.app.github.dev`, mas o servidor recebe
 * `x-forwarded-host: localhost:3000`. O Next.js bloqueia Server Actions quando
 * esses hosts divergem (proteção contra CSRF), então liberamos explicitamente
 * os endereços públicos deste Codespace. Outras origens podem ser adicionadas
 * via ALLOWED_ORIGINS (separadas por vírgula).
 */
function allowedOrigins(): string[] {
  const origins = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const { CODESPACE_NAME, GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN } = process.env;
  if (CODESPACE_NAME && GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) {
    const ports = new Set([process.env.PORT ?? "3000", "3000", "3001"]);
    for (const port of ports) {
      origins.push(`${CODESPACE_NAME}-${port}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`);
    }
  }
  return origins;
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      allowedOrigins: allowedOrigins(),
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
