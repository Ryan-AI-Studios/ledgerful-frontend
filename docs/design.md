---
version: alpha
name: Ledgerful
description: Local-first "intent ledger for agentic engineering." Dark, dense,
  terminal-adjacent — the visual language of a power tool, not a marketing site.
  Single mint accent over GitHub-dark surfaces, Inter for UI, JetBrains Mono for
  data. Ported from ChangeGuard and renamed for the Ledgerful v1 ship.

# ─────────────────────────────────────────────────────────────────
# COLORS
# Dark-first. The mint primary is the ONLY chromatic action color.
# Risk colors carry semantic load and must never be the brand accent.
# ─────────────────────────────────────────────────────────────────
colors:
  # Brand
  primary: "#00E5A0"           # Mint/emerald. Action color, links, active states.
  primaryMuted: "#00B87A"       # Hover, secondary actions.
  primaryDeep: "#007A4D"        # Pressed, high-contrast text on light surfaces.
  accent: "#FF7B72"             # Coral. RESERVED for AI-attribution + hotspot highlights only.

  # Surfaces (GitHub-dark family)
  surface: "#0D1117"            # Page background. Same as github.com dark.
  surfaceAlt: "#161B22"         # Card backgrounds, sidebar, code blocks.
  surfaceRaised: "#1C2333"      # Hover states, dropdowns, modals.
  surfaceOverlay: "rgba(13, 17, 23, 0.72)"  # Modal scrim, command-K backdrop.

  # Borders (hairlines)
  border: "#30363D"             # Default container border.
  borderMuted: "#21262D"        # Table dividers, subtle separators.
  borderStrong: "#484F58"       # Focus rings (3:1 contrast required for SC 1.4.11).

  # Text ladder
  textPrimary: "#E6EDF3"        # Default body. 16.0:1 on surface (AAA).
  textSecondary: "#8B949E"      # Metadata, helper text. 6.15:1 on surface (AA).
  textMuted: "#7D8590"          # 5.07:1 on surface (AA), 4.63:1 on surfaceAlt (AA).
  textInverse: "#0D1117"        # Text on light/mint surfaces.

  # Semantic (risk levels — CLI parity)
  danger: "#F85149"             # HIGH risk, errors, destructive. 5.65:1 (AA).
  dangerMuted: "#DA3633"        # Danger bg fill.
  warning: "#D29922"            # MEDIUM risk, stale data. 7.50:1 (AAA).
  warningMuted: "#9E6A03"       # Warning bg fill.
  success: "#3FB950"            # LOW risk, healthy. 7.45:1 (AAA).
  successMuted: "#238636"       # Success bg fill.
  info: "#58A6FF"               # Neutral alerts, links. 7.49:1 (AAA).
  infoMuted: "#1F6FEB"          # Info bg fill.

  # Risk level badges (semantic + 5.16:1 minimum on surfaceAlt)
  riskHigh: "#F85149"
  riskMedium: "#D29922"
  riskLow: "#3FB950"
  riskTrivial: "#8B949E"

# ─────────────────────────────────────────────────────────────────
# TYPOGRAPHY
# Inter Variable for UI (geometric, OpenType-rich, on Google Fonts).
# JetBrains Mono for data (file paths, tx_ids, symbols, commands).
# Body 14px / 0.875rem is the canonical size. Density over decoration.
# ─────────────────────────────────────────────────────────────────
typography:
  display:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, sans-serif"
    fontSize: "2.25rem"         # 36px, hero metrics
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  h1:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, sans-serif"
    fontSize: "1.5rem"          # 24px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  h2:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, sans-serif"
    fontSize: "1.25rem"         # 20px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"        # 14px — canonical body
    fontWeight: 400
    lineHeight: 1.5
  bodySmall:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"         # 12px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.6875rem"       # 11px — table headers, badges
    fontWeight: 600
    lineHeight: 1.4
    textTransform: "uppercase"
    letterSpacing: "0.04em"
  mono:
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace"
    fontSize: "0.8125rem"       # 13px — tx_ids, file paths, code
    fontWeight: 400
    lineHeight: 1.4
  monoSmall:
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, monospace"
    fontSize: "0.6875rem"       # 11px — inline metadata
    fontWeight: 400
    lineHeight: 1.4

# ─────────────────────────────────────────────────────────────────
# LAYOUT & SPACING
# 8px grid. Sidebar 260px (fixed). Main 12-col. Cards 4×3, 8×3, 4×3.
# ─────────────────────────────────────────────────────────────────
rounded:
  sm: "4px"                     # Pills, checkboxes
  md: "6px"                     # Buttons, inputs
  lg: "8px"                     # Cards (canonical)
  xl: "12px"                    # Modals, popovers
  full: "9999px"                # Avatars, status dots, badge-pill

spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"                    # Card padding
  lg: "24px"                    # Section gap
  xl: "32px"                    # Page padding
  xxl: "48px"                   # Hero gap

# ─────────────────────────────────────────────────────────────────
# COMPONENTS
# The canonical set. Every component in the SPA must trace back to
# one of these. New components require a v2 bump of this file.
# ─────────────────────────────────────────────────────────────────
components:

  # ── Surfaces ───────────────────────────────────────────────
  page:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textPrimary}"
    font: "{typography.body}"

  sidebar:
    backgroundColor: "{colors.surface}"
    width: "260px"
    borderRight: "1px solid {colors.border}"
    padding: "{spacing.md}"

  topnav:
    backgroundColor: "{colors.surfaceAlt}"
    height: "48px"
    borderBottom: "1px solid {colors.border}"
    padding: "0 {spacing.lg}"

  card:
    backgroundColor: "{colors.surfaceAlt}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.border}"

  cardRaised:                   # Hover state
    backgroundColor: "{colors.surfaceRaised}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    border: "1px solid {colors.border}"

  # ── Typography helpers ────────────────────────────────────
  kpiHero:                      # The "94/100" Project Health number
    font: "{typography.display}"
    textColor: "{colors.textPrimary}"
    fontWeight: 600
  kpiLabel:
    font: "{typography.label}"
    textColor: "{colors.textSecondary}"

  # ── Buttons ───────────────────────────────────────────────
  button:
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    fontSize: "0.8125rem"
    fontWeight: 500
    transition: "background-color 100ms ease-out"
  buttonPrimary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.textInverse}"   # Black for 12.72:1 contrast
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    fontWeight: 600
  buttonPrimaryHover:
    backgroundColor: "{colors.primaryMuted}"
  buttonSecondary:
    backgroundColor: "transparent"
    textColor: "{colors.textPrimary}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.md}"
  buttonDanger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.textPrimary}"
    rounded: "{rounded.md}"

  # ── Form controls ─────────────────────────────────────────
  input:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.borderMuted}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    textColor: "{colors.textPrimary}"
    font: "{typography.body}"
  inputFocus:
    border: "1px solid {colors.primary}"
    outline: "2px solid {colors.borderStrong}"  # 3:1 contrast for SC 1.4.11
    outlineOffset: "2px"

  searchInput:
    backgroundColor: "{colors.surface}"
    border: "1px solid {colors.borderMuted}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm} {spacing.md}"
    placeholderColor: "{colors.textMuted}"
    width: "320px"

  # ── Risk indicators (multi-cue per SC 1.4.1) ──────────────
  riskHigh:
    color: "{colors.riskHigh}"
    icon: "▲"                   # Triangle — distinct from circle/dot
    textLabel: "HIGH"
    font: "{typography.label}"
  riskMedium:
    color: "{colors.riskMedium}"
    icon: "●"                   # Filled circle
    textLabel: "MED"
  riskLow:
    color: "{colors.riskLow}"
    icon: "○"                   # Empty circle
    textLabel: "LOW"
  riskTrivial:
    color: "{colors.riskTrivial}"
    icon: "·"                   # Mid-dot
    textLabel: "TRIV"
  riskBadge:
    rounded: "{rounded.full}"
    padding: "2px {spacing.sm}"
    font: "{typography.label}"
    border: "1px solid currentColor"  # Border uses the risk color itself

  # ── Alerts ────────────────────────────────────────────────
  alertSuccess:
    backgroundColor: "rgba(63, 185, 80, 0.10)"
    border: "1px solid {colors.successMuted}"
    textColor: "{colors.success}"
    icon: "✓"
  alertDanger:
    backgroundColor: "rgba(248, 81, 73, 0.10)"
    border: "1px solid {colors.dangerMuted}"
    textColor: "{colors.danger}"
    icon: "✕"
  alertWarning:
    backgroundColor: "rgba(210, 153, 34, 0.10)"
    border: "1px solid {colors.warningMuted}"
    textColor: "{colors.warning}"
    icon: "!"
  alertInfo:
    backgroundColor: "rgba(88, 166, 255, 0.10)"
    border: "1px solid {colors.infoMuted}"
    textColor: "{colors.info}"
    icon: "i"

  # ── Tables (Ledger, Hotspots, Changes) ────────────────────
  table:
    borderCollapse: "collapse"
    width: "100%"
  tableHeader:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.textSecondary}"
    font: "{typography.label}"
    borderBottom: "1px solid {colors.border}"
    padding: "{spacing.sm} {spacing.md}"
    textAlign: "left"
  tableRow:
    borderBottom: "1px solid {colors.borderMuted}"
    padding: "{spacing.sm} {spacing.md}"
  tableRowHover:
    backgroundColor: "{colors.surfaceRaised}"
  tableRowSelected:
    backgroundColor: "rgba(0, 229, 160, 0.06)"   # 6% mint tint
    borderLeft: "2px solid {colors.primary}"

  # ── Tabs ──────────────────────────────────────────────────
  tab:
    padding: "{spacing.sm} {spacing.md}"
    textColor: "{colors.textMuted}"
    borderBottom: "2px solid transparent"
  tabActive:
    textColor: "{colors.textPrimary}"
    borderBottom: "2px solid {colors.primary}"
    fontWeight: 600

  # ── Code / data display ───────────────────────────────────
  code:
    font: "{typography.mono}"
    backgroundColor: "{colors.surfaceAlt}"
    padding: "2px 6px"
    rounded: "{rounded.sm}"
  codeBlock:
    font: "{typography.mono}"
    backgroundColor: "{colors.surfaceAlt}"
    padding: "{spacing.md}"
    rounded: "{rounded.md}"
    border: "1px solid {colors.borderMuted}"
    overflowX: "auto"

  # ── Skip link (a11y, SC 2.4.1) ────────────────────────────
  skipLink:
    position: "absolute"
    top: "-40px"
    left: "0"
    backgroundColor: "{colors.primary}"
    textColor: "{colors.textInverse}"
    padding: "{spacing.sm} {spacing.md}"
    rounded: "0 0 {rounded.md} 0"
    zIndex: "100"
  skipLinkFocus:
    top: "0"

---

## Overview

Ledgerful is a developer tool first. The web UI is **not** a marketing
site — it's a power tool that lives next to a terminal. The visual language
borrows from:

- **GitHub dark** (`#0D1117` is the exact default) — every dev knows it.
- **Linear's restraint** — single accent, surface ladder, no gradients.
- **Datadog/Honeycomb density** — the activity feeds feel like monitoring
  dashboards, not consumer SaaS.
- **The Ledgerful CLI itself** — green success, red danger, yellow
  warning, cyan info. The web app is the CLI, but visual.

No emoji anywhere in the product — they age poorly across OSes and break
screen readers (SC 1.1.1).

## Colors

The palette is dark-first. The single chromatic accent is the mint
emerald `#00E5A0` — used **only** for action elements (primary buttons,
active tab underline, focus rings, the "verified" check, the active row
in tables). Reserve the coral `#FF7B72` for AI-attribution markers and
hotspot highlights — never for primary actions.

**Risk colors are semantic, not brand.** HIGH=red, MEDIUM=yellow,
LOW=green, TRIVIAL=gray. They map 1:1 to the CLI's risk levels and to
the existing `risk*` tokens. Never reuse them for non-risk UI.

## Typography

Inter for UI, JetBrains Mono for data. Two families, no more. Body
text is **14px / 0.875rem** — denser than consumer SaaS, comfortable
on a 27" monitor. Display type is Inter Variable weight 600 with
`-0.022em` tracking.

**No third font family.** No "we need a serif for the docs."
No "what about a display font for the hero." Restraint scales.

## Layout & Spacing

Three-column developer-tool layout:
1. **Sidebar (260px fixed):** Navigation, project selector, status indicator
2. **Main content:** 12-column responsive grid
3. **Detail panel (optional, 480px):** Contextual info on selection (Ledger)

8px grid throughout. Card padding 16px internal, 24px between cards.
Page padding 32px on the main column. Min viewport 1280px (v1).

## Elevation & Depth

- **Cards** sit flush on `surfaceAlt` with a 1px `border` — no shadows.
- **Dropdowns, modals, popovers** lift with `box-shadow: 0 8px 24px rgba(0,0,0,0.4)`.
- **Hover states** raise via background color change
  (`surfaceAlt` → `surfaceRaised`), not elevation. The motion is
  instant — 100ms ease-out, no spring physics.
- **Focus rings** are 2px outlines with 2px offset using `borderStrong`,
  always visible, never suppressed. (SC 2.4.7)

## Risk-Level Multi-Cue System (SC 1.4.1)

Color alone is forbidden by WCAG. Every risk indicator uses 4 cues:

| Level    | Icon | Text Label | Position          | Color                |
|----------|------|------------|-------------------|----------------------|
| CRITICAL | ▲▲   | CRIT       | Top of list       | `#F85149` (danger)   |
| HIGH     | ▲    | HIGH       | Inline pill       | `#F85149` (danger)   |
| MEDIUM   | ●    | MED        | Inline pill       | `#D29922` (warning)  |
| LOW      | ○    | LOW        | Inline pill       | `#3FB950` (success)  |
| TRIVIAL  | ·    | TRIV       | Inline pill       | `#8B949E` (trivial)  |

Screen reader announcement: "HIGH: rate-limiter bypass in auth/session.rs,
3 files changed, pending review 2 days." Per Sentry's design tenets:
**disable, don't hide; explain, don't just show.**

## Components

The components above are the **canonical set**. Every component in
the SPA must trace back to one of them. To add a new component, bump
this DESIGN.md to v0.2 and document the new component with the same
property whitelist. This is the discipline that lets the system scale.

## Do's and Don'ts

**Do:**
- Use the mint primary **only** for action and active state.
- Use the coral accent **only** for AI-attribution and hotspot highlights.
- Use the risk colors **only** for risk levels. They are semantic.
- Pair every color cue with an icon, text label, and/or position.
- Use Inter for UI, JetBrains Mono for data. Never mix.
- Show a skip link at the top of every page.
- Use `textMuted` for metadata only, never for primary content.
- Use `borderStrong` for focus rings, never `border` or `borderMuted`.

**Don't:**
- Don't use emoji anywhere in the product.
- Don't use gradients in v1. They're decoration, not data.
- Don't add a third font family. Restraint scales.
- Don't use color alone to convey meaning. (SC 1.4.1)
- Don't use `textMuted` for body text. Use `textSecondary`.
- Don't reuse the risk colors for non-risk UI.
- Don't ship a component that isn't in this DESIGN.md. If you need one,
  add it here first.
- Don't use shadows to communicate state. Use background color changes.
- Don't disable the URL state. Every filter, sort, and selection must
  be in the URL (Sentry design tenet: navigation that changes visible
  data should go in the URL).
