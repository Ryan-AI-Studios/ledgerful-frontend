---
name: ledgerful
description: Use this skill when making frontend edits that depend on backend intelligence, when reviewing impact/risk, verification planning, drift handling, ledger provenance, or deciding what tests to run in the Ledgerful frontend repo. Before meaningful edits, run Ledgerful scan/impact in the backend repo; after edits, run frontend verification and report unresolved drift or ledger state.
---

# Ledgerful as Ledgerful Backend Intelligence

Use Ledgerful as the local safety layer and engineering intelligence engine for the Ledgerful backend. It provides impact analysis, hotspot and temporal-coupling signals, verification planning, and transactional provenance. The Ledgerful frontend displays these signals in a readable dashboard.

## Core Capabilities (Backend-Driven)

- **Search & Discovery**: High-performance regex (Tantivy), precise LSP navigation (SCIP), and conceptual semantic search (local embeddings) with parallel HNSW retrieval.
- **Code Symbol Index**: Tree-sitter parsing of Rust, TypeScript, and Python — extracts every public function, struct, enum, trait, module, and HTTP route into the Knowledge Graph. Queryable via `ledgerful search` and `ledgerful ask`.
- **Route Extraction**: Detects HTTP routes from Axum, Express, and other frameworks. Stores `method`, `path_pattern`, `handler_name`, `framework`, and confidence score.
- **Call Graph**: Tracks function call relationships (`Direct`, `MethodCall`, `TraitDispatch`, `Dynamic`, `External`) so you can answer "what calls this function?" and "what does this function depend on?".
- **Knowledge Graph**: Durable, billion-edge relational and vector storage (CozoDB-redux/Sled) with native code-aware tokenization (Tree-Sitter). Stores symbols in `project_symbol` table.
- **AI-Brains Bridge**: Exports hotspots, ledger entries, and MADR data to AI-Brains via `ledgerful bridge export --hotspots --ledger [--madr] [--stdout]`. AI-Brains nightly pipeline ingests this output as code symbols into recall (T70). Inbound recall uses `ledgerful bridge query "<text>"` (IPC with CLI fallback).
- **Impact Analysis**: Deep "blast radius" analysis across 20+ specialized providers (Infra, Contracts, Observability, Temporal).
- **Cryptographic Provenance**: Mathematical proof of intent via Ed25519 signing of every ledger entry. Offline verification via `verify --signatures`.
- **Predictable Verification**: Bayesian test reordering and CI failure prediction.
- **Dead Code Detection**: Confidence-based dead code detection blending graph reachability, git activity, and test history (`dead-code` command).
- **Live Visualization**: WebSocket-based Arc Diagram for real-time Knowledge Graph updates (`viz-server`, `viz-server --stop`).
- **Endpoints**: Indexed endpoint graph with auth, schemas, consumers, and owner links. `ledgerful endpoints --json` / `--changed` for direct review.
- **Services Diff**: Declared service map with queue/topic/RPC edges and PR-style boundary diff. `ledgerful services diff`.
- **Data Models**: Durable data model, table, migration, and compatibility-class relations with impact rules for destructive changes. `ledgerful data-models impact --changed`.
- **Config Schema & Diff**: Explicit env var schema metadata (required/secret/owner/provider) and change diff. `ledgerful config schema` / `ledgerful config diff`.
- **Dependency & Advisory Graph**: Cargo/npm/Python lockfile ingestion with cargo-audit/osv advisory matching. Impact rules for vulnerable dependency introduction.
- **Test Mapping**: Durable test nodes linked to endpoints, symbols, services, and data models. `ledgerful verify explain --entity <path>` for entity-scoped test explanation.
- **Observability Graph**: SLO, metric, alert, and signal nodes from OpenSLO YAML. Source-file-backed diff matching. `ledgerful observability diff` / `observability coverage`.
- **Hotspot Trends**: Persistent hotspot and temporal coupling snapshots with trend deltas. `ledgerful hotspots trend` / `hotspots explain`.
- **Ledger Graph**: Per-transaction entity neighborhood view linking ledger entries to symbols, endpoints, services, ADRs, config keys, and deploy surfaces. `ledgerful ledger graph <tx-id>`.
- **Ledger Validator Lifecycle**: Full validator lifecycle with `ledger validator list`, `disable`, `enable`, `remove`, `doctor`, and hook-repair rollback for sidecar/pending mismatches.
- **Security Boundaries**: Cedar policy parsing with cross-surface links (policy→endpoint/service/config_key/deploy_surface/ADR). `ledgerful security boundaries` / `security impact --changed`.

## Frontend ↔ Backend Relationship

The Ledgerful frontend is **not** the backend. It consumes Ledgerful data through:

1. **Mock services** in `src/lib/*-data.ts` (current v1 default).
2. **HTTP API** from the daemon when wired (target for v2).
3. **WebSocket** for live updates and real-time KG visualizations (future).

When working on the frontend, treat Ledgerful commands as **discovery and governance tools** against the backend repo, not as build/test tools for this repo.

## Default Workflow

1. Check availability when uncertain:

   ```bash
   ledgerful doctor
   ```

2. Check current provenance state:

   ```bash
   ledgerful ledger status
   ```

3. Before meaningful code edits, assess impact in the **backend repo**:

   ```bash
   ledgerful scan --impact
   ```

4. Read `.ledgerful/reports/latest-impact.json` when it exists. Use it to
   identify risk level, hotspots, temporal couplings, affected symbols, runtime
   dependencies, and verification hints.

5. Make the smallest scoped frontend change that satisfies the task.

6. After edits, run frontend verification:

   ```bash
   npm run build
   npm run lint
   npm run test:unit
   ```

   Also run `ledgerful verify` in the backend repo if backend contracts changed.

7. Report the outcome: impact/risk signals used, frontend verification run, and any
   unresolved pending transactions, drift, or unavailable Ledgerful command.

## Code Symbol Queries — Use These First for Backend Research

Before searching the web or reading files manually, query Ledgerful's symbol index. It knows every public function, struct, route, and call edge in the backend codebase.

```bash
# Always refresh the index first (incremental, fast)
ledgerful index --incremental

# Use automated SCIP indexing for compiler-grade precision (Rust, TS, Python)
ledgerful index --auto-scip

# Find a function, struct, or type by name
ledgerful search "handleGetUser"
ledgerful search "AuthMiddleware"

# Find HTTP routes
ledgerful search "POST /auth"
ledgerful ask "list all HTTP GET route handlers"

# Find what calls a function
ledgerful ask "what calls validateToken"
ledgerful ask "show callers of UserRepository::find_by_id"

# Find all public endpoints
ledgerful ask "find all Axum route handlers"
ledgerful ask "what API endpoints are defined in src/routes"

# Dead code
ledgerful dead-code --threshold 0.75

# Dead code — show everything including standard traits (Eq, Clone, Debug, …)
# By default, standard trait symbols are EXCLUDED because they are used implicitly
# via derive macros or blanket impls and almost always produce false positives.
ledgerful dead-code --include-traits
```

> **Heuristic note**: Dead code analysis blends graph reachability, git inactivity, and
> test coverage. Results are probabilistic, not definitive. Common false-positive patterns:
> - Traits derived via `#[derive(...)]` (Eq, Ord, Clone, Debug, Serialize, …) — suppressed by default.
> - Types ending in `Provider`, `Chunk`, `Record`, `Result` — receive a -0.20 confidence penalty
>   (they are often dispatched dynamically or through serde).
> Use `--include-traits` to restore unfiltered output for auditing purposes.

For **frontend** code symbols (React components, hooks, data services), use LSP/Grep instead of Ledgerful.

## Audit Smoke Tests

When reviewing backend behavior that surfaces in the dashboard, supplement unit tests with command-level smoke tests against the running daemon or `target\debug\ledgerful.exe` on Windows.

Useful checks include:

- JSON mode remains parseable on failure paths (`config verify --json`, invalid
  `config.toml`, invalid `rules.toml`, unknown `--section`).
- API responses the frontend depends on keep stable field names and types.
- Dry-run commands do not create persistent state unless that is explicitly part of the dry-run contract.

## Repository Configuration

Ledgerful's `.ledgerful/rules.toml` and `.ledgerful/config.toml` live in the **backend repo**, not here. When the frontend needs new data shapes, coordinate with the backend repo's config and API surface rather than copying policy files.

If `ledgerful verify` fails with "Command not found" or times out while the
same command passes manually, fix the backend repo-local config before treating it as a
frontend failure.

## Dependency Alert Workflow

Dependabot findings in the frontend repo are handled with npm/yarn tooling:

```bash
npm audit
```

For backend audit findings, coordinate fixes in the backend repo and update the frontend only if the API contract changes.

## When To Skip

Skip Ledgerful backend checks only for trivial frontend formatting, simple dependency lockfile updates, binary/media changes, temporary scratch files, or when the user explicitly says to bypass it.

## If Commands Fail

- If `ledgerful` is unavailable, continue with normal frontend tools and tell the
  user backend Ledgerful signals were unavailable.
- If `ledger status` shows unaudited drift, reconcile or adopt in the **backend repo** before continuing
  unless the user directs otherwise.
- If `scan --impact` cannot complete, continue cautiously and include the error
  in the final report.
- If a command reports that the index is `[STALE]`, you can append the `--auto-index` flag to commands like `search`, `ask`, `hotspots`, or `dead-code` to automatically refresh it before executing.
- Do not edit `.ledgerful/` state files directly.

## Ledger Provenance

For tracked manual edits (typically in the backend repo):

```bash
ledgerful ledger start <entity> --category <CAT> --message "Intent"
# edit files
ledgerful ledger commit <tx-id> --summary "Done" --reason "Why"
```

For surgical one-command provenance:

```bash
ledgerful ledger atomic <entity> --category <CAT> --summary "Task" --reason "Goal"
```

For lightweight notes or lessons learned:

```bash
# Both positional and --message formats are supported
ledgerful ledger note <entity> "Note content"
ledgerful ledger note <entity> --message "Note content"
```

### Git Hook Lifecycle (Milestone O)

Ledgerful uses a two-phase commit lifecycle to ensure zero phantom records:
1. **`commit-msg`**: Launches the TUI to capture intent. Creates a `PENDING` transaction and a sidecar file.
2. **`post-commit`**: Automatically promotes the `PENDING` transaction to `COMMITTED` once the Git commit is finalized. If the Git commit fails, the record remains pending or is safely rolled back on the next attempt.

### Cryptographic Security

If `intent.require_signing = true` is set in `.ledgerful/config.toml` in the backend repo, all ledger entries must be signed by the developer's local Ed25519 key.

To verify the integrity of the entire ledger:
```bash
ledgerful verify --signatures
```
This performs an offline mathematical validation of every record against its signature and public key.

## Publish Hygiene

When asked to push, catch up `main`, or prune branches in the frontend repo:

1. Fetch current remote state first:

   ```powershell
   git fetch --all --prune
   git rev-list --left-right --count origin/main...HEAD
   ```

2. If `origin/main` moved, reconcile before staging or pushing. Do not rebase or
   reset over user work without explicit direction.

3. Stage only the intended scope, commit, then push:

   ```powershell
   git push origin main
   ```

4. Prune conservatively:

   ```powershell
   git remote prune origin --dry-run
   git branch --merged main
   ```

   Delete local branches only when they are listed as merged into `main` and are
   not the active branch. Branch pruning can legitimately be a no-op.

## Reasoning Rules

- If temporal coupling is above 70% for an unchanged backend file, inspect that file before adding a frontend display for it.
- If hotspots are reported, bias frontend verification toward those backend surfaces first.
- If KG reachability identifies downstream nodes, inspect them before finalizing UI designs that depend on them.
- Treat hooks and CI gates as enforcement. Treat this skill as guidance.

## Maintenance & Upgrades

Backend maintenance commands (run in the backend repo):

```bash
# Safely migrate repository state (clears indices, preserves ledger)
ledgerful update --migrate --force

# Rebuild indices after migration
ledgerful index --semantic
```

## Cross-Model Review Notes

For high-risk diffs, a read-only `codex exec` review can be useful before final
verification. In non-interactive Windows/PowerShell runs, redirect stdin from
`NUL` so the process does not wait for input:

```powershell
cmd /c "codex exec -C ""C:\dev\ledgerful-frontend"" -s read-only -m gpt-5.4 -o output\review.md ""Review the current diff for regressions. Do not modify files."" < NUL"
```

If the command appears stuck, inspect the output file before waiting longer; the
review may already have written useful findings.

## References

- `.agents/skills/ledgerful/references/commands.md` — Full command details
- `.agents/skills/ledgerful/references/install.md` — Install fallback
- `.agents/skills/ledgerful/references/internals.md` — Architecture/internal notes
- Backend repo: `docs/engineering.md`, `docs/architecture.md`
- Frontend repo: `AGENTS.md`, `docs/product.md`, `docs/design.md`
