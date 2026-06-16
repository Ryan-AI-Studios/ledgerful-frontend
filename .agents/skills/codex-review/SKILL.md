---
name: codex-review
description: Use this skill when you want a cross-model code review, a second opinion on changes, or an independent audit before committing. Trigger when the user asks for a review, a second pair of eyes, cross-model review, Codex review, or wants GPT/Codex to examine code. Also trigger before final verification on high-risk changes in the Ledgerful frontend.
---

# Codex Cross-Model Review

Different AI models catch different issues. Use OpenAI Codex (`codex review`) as an independent reviewer to supplement Claude-based development. This is especially valuable before committing high-risk changes, after substantial refactors, or when the ChangeGuard impact report shows elevated risk in the backend.

## When To Use

- Before committing high-risk changes (ARCHITECTURE, FEATURE, BUGFIX categories)
- After a substantial refactor spanning multiple files
- When ChangeGuard reports `riskLevel: High` or broad temporal couplings in the backend
- After implementing a full phase of frontend work
- When you want a second opinion on design decisions
- Before creating a PR

## Quick Review (One-Shot)

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

## Flags

| Flag | Purpose |
|------|---------|
| `--uncommitted` | Review unstaged/staged changes in the working tree |
| `--commit <SHA>` | Review a specific commit or range |
| `--title <TEXT>` | Title / high-level focus of the review |
| `--output <FILE>` | Write output to file (when supported by the CLI) |

## Targeted Review

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
4. Run `codex review --uncommitted --title "..."` — get cross-model review
5. Address critical/high findings
6. Run `npm run test:unit` / `npm run test:e2e` as appropriate
7. Commit with `changeguard ledger commit` (if tracked)

## Frontend-Specific Review Checklist

Ask Codex to focus on:

- TypeScript strictness (no `any`, proper generic constraints)
- React hooks rules and dependency arrays
- Accessibility (contrast, focus management, ARIA labels)
- Tailwind class ordering and token usage
- Mock data alignment with backend contract
- Error and loading states
- Client/server boundary correctness in Next.js App Router

## Safety Notes

- The `codex review` subcommand is read-only by default; it does not modify files.
- Do not pass secrets, API keys, or `.env` contents in review titles.
- Codex output is written by a different model — its suggestions may not align with this project's conventions (Next.js 16, strict TypeScript, Tailwind design tokens). Evaluate suggestions against the design system before applying.
- Review output is advisory, not authoritative. You still make the final call.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `error: the argument '--uncommitted' cannot be used with '[PROMPT]'` | Move the review instructions into `--title` or use `--commit` mode |
| Output file is empty or only contains the version banner | Add `2>&1` or capture stderr explicitly |
| Command hangs | Codex may be waiting on stdin; run from a normal terminal first to confirm behavior |

## Cost Awareness

Each `codex review` call consumes API tokens. For routine low-risk changes, skip the cross-model review. Reserve it for:

- High-risk or high-complexity changes
- Phase completion reviews
- Pre-PR reviews
- When you're uncertain about a design decision
