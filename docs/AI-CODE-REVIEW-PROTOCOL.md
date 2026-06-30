# AI-Code Adversarial Review Protocol

> **Purpose:** The Ledgerful codebase is entirely AI-generated. Research shows AI-generated code
> carries an elevated vulnerability base rate that automated scanners (SAST/secret-scan) miss
> ~98% of the time. This protocol is the **high-value manual gate** that compensates.

## When this review is required

- **Every PR** that touches security-sensitive code (crypto, auth, daemon API, path handling,
  deserialization, dependency manifests, CI/CD workflows).
- **Before merging** any change to: `src/sync/crypto.rs`, `src/commands/web/`,
  `src/sync/bundle.rs`, MCP tool inputs, GitHub Action inputs, `deny.toml`, `Cargo.toml`,
  `package.json`, or any `.github/workflows/` file.
- **On every dependency add** (new crate or npm package) — the §3 provenance check must run.
- **Standing rule:** security-sensitive code is not iterated by AI across multiple rounds
  without a human or cross-model review between iterations (iterative AI "fixes" measurably
  *add* vulnerabilities).

## What to review (by surface)

### Crypto / auth (`src/sync/crypto.rs`, session-token code, `src/commands/web/auth`)
- Ed25519 signing/verification uses the vetted crate API correctly; no custom signature logic.
- ChaCha20-Poly1305 AEAD: unique nonces per message (no reuse), AAD covers what it must,
  decryption failures are hard-rejected (no partial-plaintext use).
- Argon2id parameters meet current OWASP guidance (memory/iterations/parallelism).
- Session token: generated from a CSPRNG, sufficient entropy, compared in **constant time**
  (`subtle`), never logged.

### Validator / process runner (shell-execution path)
- `{entity}` and any user/config-derived substitution cannot inject shell commands; arguments
  are passed as an argv array, not a shell string, wherever possible.
- `ProcessPolicy` is enforced (allowed executables, no arbitrary command escalation).
- Timeouts and resource bounds hold; failure modes are explicit.

### Path handling
- Path normalization rejects traversal (`..`), absolute-path escapes, and symlink escapes
  from the intended repo/state root. Windows + POSIX both covered.

### Deserialization / untrusted input (`src/sync/bundle.rs`, daemon JSON, MCP stdio, Action inputs)
- Peer sync bundles are signature-verified **before** deserialization is trusted.
- Malformed input cannot panic-crash or allocate unbounded memory.
- Daemon/API request bodies are size-limited and schema-validated.
- MCP tool inputs and GitHub Action inputs are treated as untrusted.

### Web / SSRF / secret-exposure (`ledgerful-web`, `ledgerful-frontend`)
- No service-role keys, Ed25519 private keys, daemon tokens, or `.env` reach the browser bundle
  (`NEXT_PUBLIC_*` audit).
- Telemetry uses only the official opt-in Supabase path.
- Mock data is never presented as live. `fallback.ts` must NOT convert 401/403 (or 4xx
  generally) into mock data — auth failures surface as errors; only 404 may map to an explicit
  empty state. Returned values carry data-source provenance (live / mock / stale / unavailable).

### Frontend-specific review surfaces
- **Browser bundle secrets audit:** scan `NEXT_PUBLIC_*` usage in `src/lib/api/`,
  `src/lib/types.ts`, `src/components/`, and `src/app/`. Service-role keys,
  daemon tokens, and `LEDGERFUL_TOKEN` must stay server-side or in environment
  config, never in the client bundle.
- **Telemetry path:** only the Supabase opt-in ingest endpoint is used. Verify in
  `src/lib/api/` and `src/lib/fallback.ts` that telemetry is disabled unless the
  user opts in.
- **Mock-data boundary:** `src/lib/fallback.ts` must NOT convert 401/403/4xx to
  mock data. Only 5xx → mock fallback is permitted (per track 0002). Live data must
  carry provenance (`live`) and mock data must carry provenance (`mock`).
- **Type discipline:** no `any` types in production code (`src/`). Type-only
  assertions in `.ts` files must not escape to runtime.
- **Logging discipline:** no `console.log` in production code; use the project
  logger or remove debug output.
- **Design system:** styling lives in Tailwind utilities and shared components.
  No inline `style` props except for documented theming exceptions.

## How to review

1. **Cross-model review:** a different model than the author reviews the diff. The orchestrator
   delegates to a review subagent (e.g. `final-verifier`, `codex-review`, or equivalent
   cross-model tool).
2. **Human sign-off:** the owner reviews the cross-model findings and adjudicates.
3. **Provenance check:** for any new dependency, verify it's a real, maintained, correctly-named
   package (run `node scripts/provenance-check.mjs` or check the registry manually).

## Enforcement (CI gate)

Branch protection requires the `ai-reviewed` status check before merge. This check is set by
the orchestrator **only after** the cross-model review subagent passes. The gate is:

- **Status check name:** `ai-reviewed`
- **Set by:** the orchestrator (manager agent) after the review subagent reports clean.
- **Implementation:** a GitHub Action workflow (`ai-review-gate.yml`) that creates a
  `pending` status on PR open, and the orchestrator pushes a `success` status via
  `gh api` when the review passes.

## Risk-accepted enforcement gap (private-repo window)

- **Constraint:** the repository is private, and the GitHub branch-protection API returns 403
  without GitHub Pro. CodeQL is also unavailable on private repositories without GHAS. This
  blocks the mechanical `ai-reviewed` required check at the platform level.
- **Compensating control (active now):** on every track, the orchestrator runs the review
  subagent and codex-review gate before merge, per `AGENTS.md` workflow §workflow. The
  `conductor/<track>/review.md` evidence file is the audit trail. Branch-protection settings
  are staged in `scripts/apply-branch-protection.ps1` and ready to activate.
- **Activation condition:** when the repository is made public or GitHub Pro is acquired, run
  `scripts/apply-branch-protection.ps1`. That will require `ai-reviewed` (plus the CI and
  security checks) and allow admin bypass for the solo owner.
- **Risk-acceptance rationale:** the platform tier is the only blocker; the mechanical
  scaffolding (workflow + branch-protection script + status API integration) is implemented
  and correct. The orchestrator's manual gate provides a bounded, documented, auditable
  compensating control until the platform restriction is removed. This is recorded as an
  explicit risk-acceptance, not a convention.

## Standing rules (every PR)

- Security-sensitive code is not iterated by AI across multiple rounds without a
  human/cross-model review between iterations.
- No AI-suggested dependency is merged without the §3 provenance check.
- SAST is a floor, not proof — this protocol is the higher-value gate.