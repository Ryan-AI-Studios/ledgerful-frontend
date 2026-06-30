import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "export",
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
