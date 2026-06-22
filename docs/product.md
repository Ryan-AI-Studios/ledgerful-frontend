# Product

## Register

product

## Users

Three personas, in priority order:

1. **Developer Champion** — Senior / Staff engineer or tech lead. Ships daily, owns the PR queue, manages 3–8 developers. Wants a 5-minute "I trust this" loop that proves AI coding agents and junior commits haven't silently rewritten fragile parts of the codebase.
2. **Engineering Manager / Director** — Approves budget, sets quality bar, reports upward. Needs a single Slack-screenshot view of project health, recent risk, and pending work.
3. **CISO / Compliance Officer** — Owns SOC2 / ISO 27001 / FedRAMP audits. Needs a cryptographically signed change trail that survives internal investigation and external auditor scrutiny.

The adoption triangle: the developer champion pulls it in, their manager approves it, the CISO pays for it. No persona can feel like a second-class user.

## Product Purpose

Ledgerful is a local-first Rust CLI and dashboard that captures the immutable "why" behind every code change — intent, reasoning, verification — signs it with Ed25519, and makes it answerable in two seconds. Where git answers "what changed," Ledgerful answers "why did it change, who decided, and was it reviewed with the impact understood?" It runs entirely on the developer's machine or inside the customer's air-gapped VPC, with no SaaS, no telemetry, and no data egress.

Success looks like: a manager can screenshot the Dashboard and post it in Slack; a CISO can run `ledgerful export --format=soc2` and hand the signed bundle to an auditor; a developer can run `ledgerful scan --open` and trust the number they see in under 10 seconds.

## Positioning

Ledgerful is a **B2B developer-tool SaaS** in the **DevSecOps / code-intelligence
/ AI-assisted code review** lane. Not a generic cybersecurity SaaS — positioning
against Snyk/Wiz/CrowdStrike loses; positioning as devtool-first with a trust
overlay wins.

- **Primary category:** developer tools SaaS. Built for engineers, repos, PRs,
  local workflows, CLI/IDE habits.
- **Secondary:** code intelligence / codebase understanding — maps what changed,
  what it affects, what needs verification.
- **Secondary:** AI code review / PR quality — helps catch gaps before
  review/merge.
- **Trust overlay:** DevSecOps / secure SDLC — security and governance matter
  but must not swallow the core message.

**Closest 2026 benchmarks:**
- Sourcegraph (codebase credibility)
- Graphite + CodeRabbit (CTA simplicity, self-serve install)
- Linear (dark-mode polish, restraint)
- Snyk + Semgrep (trust language — borrowed in form, not content)

**Product framing:** Ledgerful is not an AI code reviewer (CodeRabbit/Qodo
lane, crowded, weaker). It is the intent ledger that AI agents can read but
cannot bypass. AI is the consumer of the ledger, not the engine. Position as
"the ledger AI agents can't silently skip" — not "AI-assisted change analysis."

## Brand Personality

Precise. Immutable. Credible.

The visual voice is a developer power tool, not a marketing site: dark-first, dense, terminal-adjacent, with a single mint accent. It should feel like the most carefully engineered tool in the terminal — the interface an auditor and a Staff engineer both believe without asking for a demo.

## Anti-references

- SaaS-cream marketing dashboards with big hero metrics floating in empty space.
- Generic 3-card feature grids (icon + heading + paragraph) repeated down a landing page.
- Tiny uppercase tracked eyebrows above every section.
- Gradient text, glassmorphism cards, or decorative blur used as the default.
- Noisy real-time observability UIs that sacrifice scanability for animation.
- Compliance tools that bury the answer under five clicks of forms and tabs.
- Risk communicated by color alone.

## Design Principles

1. **The answer in 2 seconds.** Every screen must answer "why did this code change?" faster than the user can lose trust. If a manager can't screenshot it in 30 seconds, it has failed.
2. **Density is clarity.** Information-rich surfaces beat whitespace for power users; visual hierarchy, type scale, and risk cues carry the cognitive load.
3. **Cryptography without ceremony.** Signed provenance is shown as a receipt, not a puzzle. Signatures, tx IDs, and status are legible without being intimidating.
4. **Multi-cue risk.** Risk is always color + icon + text. Never one alone.
5. **CLI and web are one product.** The terminal is the first UI a developer sees; the dashboard is the manager's UI. They share the same risk language, color logic, and density.

## Accessibility & Inclusion

- Target WCAG 2.2 AA minimum; AAA where cheap (body text contrast, focus indicators).
- Respect `prefers-reduced-motion`: no entrance animations that gate content; motion must enhance an already-visible default.
- Keyboard navigation for ledger lists and tables: arrow keys, Enter to open, Esc to close, focus rings at 3:1 contrast.
- Screen-reader announcements for risk states and ledger list position ("Entry 1 of 8,247. dbce9fe7, FEATURE, PENDING, 3 days old").
- Color is not the only signal for risk or status.
