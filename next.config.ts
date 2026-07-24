import type { NextConfig } from "next";
import path from "node:path";
import { assertApiBaseAllowed } from "./src/lib/security/api-base-allowlist";

// FE-A3: fail the build when the baked-in API base is non-loopback unless
// ALLOW_REMOTE_DAEMON=1 is set explicitly (defense-in-depth; daemon CORS also
// only accepts loopback origins).
assertApiBaseAllowed(
  process.env.NEXT_PUBLIC_LEDGERFUL_API_URL,
  process.env.ALLOW_REMOTE_DAEMON,
);

const nextConfig: NextConfig = {
  output: "export",
  // Pin buildId so App Router inline flight payloads are byte-stable across
  // identical source trees. Random buildIds change one field in each page's
  // inline <script> and break hash-based CSP determinism (DoD-5). Static
  // chunks under /_next/static still use content hashes for cache busting.
  generateBuildId: async () => "ledgerful-frontend",
  turbopack: {
    root: path.join(__dirname),
  },
  env: {
    // Only allowlisted public configuration values reach the bundle.
    // Secrets such as SUPABASE_SERVICE_ROLE_KEY must not be referenced here.
    NEXT_PUBLIC_LEDGERFUL_API_URL: process.env.NEXT_PUBLIC_LEDGERFUL_API_URL,
    NEXT_PUBLIC_LEDGERFUL_USE_MOCK: process.env.NEXT_PUBLIC_LEDGERFUL_USE_MOCK,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
