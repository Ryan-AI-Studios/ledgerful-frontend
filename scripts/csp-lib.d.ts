/**
 * Type declarations for scripts/csp-lib.mjs (imported by vercel.ts).
 */

export const DEFAULT_API_URL: string;
export const PERMISSIONS_POLICY: string;
/** HSTS without preload — includeSubDomains only. */
export const HSTS_VALUE: string;

export function apiOriginFromUrl(apiUrl?: string): string;
export function apiOriginFromEnv(
  env?: NodeJS.ProcessEnv | Record<string, string | undefined>,
): string;
export function loadCommittedUnionSync(root?: string): string[];
export function buildVercelCsp(unionHashes: string[], apiOrigin: string): string;
export function scriptSrcHasUnsafeInline(csp: string): boolean;
