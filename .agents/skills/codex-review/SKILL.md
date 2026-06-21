---
name: codex-review
description: Use this skill when you want a cross-model code review, a second opinion on changes, or an independent audit before committing. Trigger when the user asks for a review, a second pair of eyes, cross-model review, Codex review, Claude review, or wants GPT/Claude/Codex to examine code. Also trigger before final verification on high-risk changes in the Ledgerful frontend.
---

# Cross-Model Review (Codex + Claude)

Different AI models catch different issues. The primary reviewer is OpenAI
Codex (`codex review`); the fallback when Codex is exhausted or rate-limited
is Anthropic Claude (`claude -p`). Both produce independent reviews of the
same diff. This is especially valuable before committing high-risk changes,
after substantial refactors, or when the ChangeGuard impact report shows
elevated risk in the backend.

## When To Use

- Before committing high-risk changes (ARCHITECTURE, FEATURE, BUGFIX categories)
- After a substantial refactor spanning multiple files
- When ChangeGuard reports `riskLevel: High` or broad temporal couplings in the backend
- After implementing a full phase of frontend work
- When you want a second opinion on design decisions
- Before creating a PR

## Primary: Codex Review (One-Shot)

Run a non-interactive review of uncommitted changes:

```powershell
codex review --uncommitted --title "Ledgerful frontend phase review"
```

Codex will review the current git diff and emit findings to the terminal. To capture the full output on Windows, redirect **both** stdout and stderr to a file:

```powershell
New-Item -ItemType Directory -Force -Path output
codex review --uncommitted --title "Ledgerful frontend phase review" 2>&1 | Out-File -FilePath output/review.md -Encoding utf8 -Width 4096
```

> [!IMPORTANT]
> The Codex CLI writes its version banner, workdir, and progress messages to **stderr**, so `2>&1` is required on Windows/PowerShell or the captured file will be incomplete. On Unix use `codex review ... > review.md 2>&1`.

> [!NOTE]
> In some Codex CLI versions, `--uncommitted` does **not** accept a trailing `[PROMPT]`. Put your review focus in `--title` (which accepts free text) or use `--commit <SHA>` with an explicit prompt.

### Codex Flags

| Flag | Purpose |
|------|---------|
| `--uncommitted` | Review unstaged/staged changes in the working tree |
| `--commit <SHA>` | Review a specific commit or range |
| `--title <TEXT>` | Title / high-level focus of the review |
| `--output <FILE>` | Write output to file (when supported by the CLI) |

### Codex Targeted Review

Review a specific commit range:

```powershell
codex review --commit HEAD~5..HEAD --title "Ledgerful project switching and data fetching"
```

Review a specific file set by narrowing the commit range or by staging only those files first:

```powershell
git add src/app/page.tsx src/lib/data.ts src/components/HeroCard.tsx
New-Item -ItemType Directory -Force -Path output
codex review --uncommitted --title "Dashboard hero and data service review" 2>&1 | Out-File output/review.md -Encoding utf8 -Width 4096
git reset
```

## Fallback: Claude Review (when Codex is exhausted)

When Codex hits a usage limit, rate limit, or is unavailable, fall back to
Anthropic Claude for the cross-model pass. Claude is a different model family
(Anthropic vs OpenAI) and catches a different set of issues.

```powershell
New-Item -ItemType Directory -Force -Path output
claude -p "Run 'git diff HEAD~3..HEAD --stat' then 'git diff HEAD~3..HEAD' in this repo and review the changes. Output P0/P1/P2 findings with file:line, issue, fix. Focus: TypeScript strictness, React render safety, accessibility, design-system conformance, mock/live contract parity. Read-only review — do not edit files." --allowedTools "Read,Edit,Bash" 2>&1 | Out-File -FilePath output/claude-review.md -Encoding utf8 -Width 4096
```

> [!IMPORTANT]
> - Claude `-p` is non-interactive but slow (2-10 min). Give it a generous timeout (600000ms+).
> - The `--allowedTools "Read,Edit,Bash"` flags are required so Claude can run `git diff` and read files.
> - Claude writes the full output at the end (not streamed), so an empty file during execution is normal.
> - If reviewing a committed range, pre-stage the diff (`git diff HEAD~3..HEAD > output/review-diff.txt`) and tell Claude to read that file instead of running git — more reliable on Windows.
> - If Claude hangs with no output after 10 min, kill the process and retry; it's a Windows stdin/pipe issue, not a prompt-size problem.

### Claude Flags

| Flag | Purpose |
|------|---------|
| `-p "<prompt>"` | Non-interactive print mode (required) |
| `--allowedTools "Read,Edit,Bash"` | Tool allowlist (required for git/file access) |
| `--dangerously-skip-permissions` | Bypass permission prompts (optional, faster) |

### Choosing Codex vs Claude

| Situation | Use |
|---|---|
| Codex available, under limit | **Codex** (primary) |
| Codex rate-limited / usage exhausted | **Claude** (fallback) |
| Both available | **Codex first**, then Claude for a second independent pass if the first found issues |
| Neither available | Continue with native gates (build/lint/test); report the missing cross-model signal |

## ChangeGuard-Aware Review

Include backend signals in the review context:

```powershell
# Get backend risk summary first (run in backend repo)
changeguard impact --summary

# Then review frontend diff with that context in the title
New-Item -ItemType Directory -Force -Path output
codex review --uncommitted --title "Ledgerful frontend review. Backend impact context: high-risk surfaces include [X]. Focus on UI that displays backend data, mock/backend contract alignment, and protected paths." 2>&1 | Out-File output/review.md -Encoding utf8 -Width 4096
```

## Interactive Review

For deeper investigation where you want back-and-forth:

```powershell
codex
```

Then inside the TUI use `/review` or ask questions about the diff.

## Output Location and Cleanup

Review scratch files belong in `output/` so they are not committed accidentally. Create the directory first if it does not exist:

```powershell
New-Item -ItemType Directory -Force -Path output
```

After capturing output, read it from `output/review.md`:

```powershell
Get-Content output/review.md -TotalCount 200
```

Remove or gitignore the scratch file before finishing. Either delete it explicitly:

```powershell
Remove-Item output/review.md
```

or ensure `output/` is listed in `.gitignore` and leave non-sensitive artifacts there during development.

The review should contain findings ordered by severity. Address critical and high findings before committing. Medium and low findings can be tracked as follow-up.

## Integration with Ledgerful Workflow

1. Run `changeguard scan --impact` in the backend repo — get risk signals
2. Make your frontend changes
3. Run `npm run build` and `npm run lint`
4. Run cross-model review (Codex primary, Claude fallback) — get findings
5. Address critical/high findings
6. Run `npm run test:unit` / `npm run test:e2e` as appropriate
7. Commit with `changeguard ledger commit` (if tracked)

## Frontend-Specific Review Checklist

Ask Codex or Claude to focus on:

- TypeScript strictness (no `any`, proper generic constraints)
- React hooks rules and dependency arrays
- Accessibility (contrast, focus management, ARIA labels)
- Tailwind class ordering and token usage
- Mock data alignment with backend contract
- Error and loading states
- Client/server boundary correctness in Next.js App Router
- Design-system conformance (no `rounded-2xl`, `scale-105`, `shadow-xl` decoration, gradient text, glassmorphism, emoji; mint accent only for actions)

## Safety Notes

- Both `codex review` and `claude -p` are read-only by default; they do not modify files.
- Do not pass secrets, API keys, or `.env` contents in review prompts.
- Cross-model output is written by a different model — its suggestions may not align with this project's conventions (Next.js 16, strict TypeScript, Tailwind design tokens). Evaluate suggestions against the design system before applying.
- Review output is advisory, not authoritative. You still make the final call.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `error: the argument '--uncommitted' cannot be used with '[PROMPT]'` | Move the review instructions into `--title` or use `--commit` mode |
| Codex output file is empty or only contains the version banner | Add `2>&1` or capture stderr explicitly |
| Codex: `You've hit your usage limit` | Fall back to Claude (see above); Codex resets at the stated time |
| Codex command hangs | Codex may be waiting on stdin; run from a normal terminal first to confirm behavior |
| Claude `-p` hangs with empty output after 10 min | Kill the process and retry; Windows stdin/pipe issue. Pre-stage the diff to a file and tell Claude to read it instead of running git. |
| Claude output is truncated or mangled | Ensure the prompt is a single quoted string; spaces in unquoted args get split on Windows |

## Cost Awareness

Each `codex review` or `claude -p` call consumes API tokens. For routine low-risk changes, skip the cross-model review. Reserve it for:

- High-risk or high-complexity changes
- Phase completion reviews
- Pre-PR reviews
- When you're uncertain about a design decision
