---
name: codex-review
description: Use this skill when you want a cross-model code review, a second opinion on changes, or an independent audit before committing. Trigger when the user asks for a review, a second pair of eyes, cross-model review, Codex review, Claude review, or wants GPT/Claude/Codex to examine code. Also trigger before final verification on high-risk changes in the Ledgerful frontend.
---

# Cross-Model Review (Codex + Claude)

Different AI models catch different issues. The primary reviewer is OpenAI
Codex (`codex review`); the fallback when Codex is exhausted or rate-limited
is Anthropic Claude (`claude -p`). Both produce independent reviews of the
same diff. This is especially valuable before committing high-risk changes,
after substantial refactors, or when the Ledgerful impact report shows
elevated risk in the backend.

## When To Use

- Before committing high-risk changes (ARCHITECTURE, FEATURE, BUGFIX categories)
- After a substantial refactor spanning multiple files
- When Ledgerful reports `riskLevel: High` or broad temporal couplings in the backend
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

### Auth: usually zero setup

On a machine with a valid interactive `claude login` session already on
disk, `claude -p` reuses those stored credentials automatically — no
`ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` needed. Verified empirically
(both Git Bash and PowerShell, no env vars set): a plain
`claude -p "Reply with exactly: OK" --output-format json` returned in ~2.5s.
If you're already logged in on this machine, just run the command below —
don't add token setup as a precondition.

```powershell
New-Item -ItemType Directory -Force -Path output
claude -p "YOUR COMMAND HERE" --allowedTools "Read,Edit,Bash" --output-format json 2>&1 | Out-File -FilePath output/claude-review.md -Encoding utf8 -Width 4096
```

### If it hangs anyway

A hang with zero output is *not* automatically "needs a token" — treat it as
a symptom to diagnose, not a known cause:

1. **Check for a stale/conflicting interactive `claude` process first.** A
   already-running interactive session can hold a lock on the credential
   file that a nested headless call blocks on. Find and consider closing it
   (`Get-Process claude` / Task Manager) before assuming an auth problem.
2. **Check the stored login is actually valid**, not expired — run a plain
   interactive `claude` and confirm it doesn't prompt to re-login.
3. **Only if both of those check out**, fall back to an explicit credential
   that bypasses the stored-login path entirely:
   ```powershell
   claude setup-token   # one-time; mints a ~1-year token off your subscription
   $env:CLAUDE_CODE_OAUTH_TOKEN = "<token from setup-token>"
   ```
   `$env:` assignments are session-scoped — to avoid re-pasting it every new
   terminal, persist it once instead:
   ```powershell
   [Environment]::SetEnvironmentVariable("CLAUDE_CODE_OAUTH_TOKEN", "<token>", "User")
   ```
   An `ANTHROPIC_API_KEY` also works and takes precedence if you'd rather
   bill per-token through the Console instead of riding the subscription.

> [!IMPORTANT]
> - Claude `-p` is non-interactive but can be slow (2-10 min) on substantive prompts even when auth is fine. Give it a generous timeout (600000ms+); there's also a built-in background-wait cap (~10 min by default since v2.1.182), overridable via `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`.
> - The `--allowedTools "Read,Edit,Bash"` flags are required so Claude can run `git diff` and read files.
> - Claude writes the full output at the end (not streamed), so an empty file during execution is normal for the first couple minutes — don't kill it prematurely.
> - If reviewing a committed range, pre-stage the diff (`git diff HEAD~3..HEAD > output/review-diff.txt`) and tell Claude to read that file instead of running git — more reliable on Windows.

### Claude Flags

| Flag | Purpose |
|------|---------|
| `-p "<prompt>"` | Non-interactive print mode (required) |
| `--allowedTools "Read,Edit,Bash"` | Tool allowlist (required for git/file access) |
| `--output-format json` | Structured output; easier to parse than raw text (optional) |
| `--bare` | Skip OAuth/keychain reads entirely — pairs with an explicit `ANTHROPIC_API_KEY` in CI-style environments with no user profile (optional) |
| `--dangerously-skip-permissions` | Bypass permission prompts (optional, faster) |

### Environment / Auth

| Variable | Purpose |
|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Long-lived token from `claude setup-token`, rides your existing subscription. **Preferred for this workflow.** |
| `ANTHROPIC_API_KEY` | Console API key; takes precedence over subscription OAuth if set. Bills per-token separately from your subscription. |
| `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` | Override the ~10 min default background-wait cap for `-p` (`0` = unlimited) |

### Choosing Codex vs Claude

| Situation | Use |
|---|---|
| Codex available, under limit | **Codex** (primary) |
| Codex rate-limited / usage exhausted | **Claude** (fallback) |
| Both available | **Codex first**, then Claude for a second independent pass if the first found issues |
| Neither available | Continue with native gates (build/lint/test); report the missing cross-model signal |

## Ledgerful-Aware Review

Include backend signals in the review context:

```powershell
# Get backend risk summary first (run in backend repo)
ledgerful impact --summary

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

1. Run `ledgerful scan --impact` in the backend repo — get risk signals
2. Make your frontend changes
3. Run `npm run build` and `npm run lint`
4. Run cross-model review (Codex primary, Claude fallback) — get findings
5. Address critical/high findings
6. Run `npm run test:unit` / `npm run test:e2e` as appropriate
7. Commit with `ledgerful ledger commit` (if tracked)

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
| Claude `-p` hangs with empty output, no auth error | Do NOT assume "needs a token" — verified empirically that a logged-in machine needs no env var at all. Check for a stale/conflicting interactive `claude` process first (it can hold a credential-file lock); confirm the stored login isn't expired by running plain interactive `claude`; only then fall back to `CLAUDE_CODE_OAUTH_TOKEN`/`ANTHROPIC_API_KEY` (see "If it hangs anyway" above). |
| Claude `-p` still hangs after ruling out stale processes, expired login, and setting an explicit token | Kill the process and retry; suspect a Windows stdin/pipe issue. Pre-stage the diff to a file and tell Claude to read it instead of running git. |
| Claude output is truncated or mangled | Ensure the prompt is a single quoted string; spaces in unquoted args get split on Windows |

## Cost Awareness

Each `codex review` or `claude -p` call consumes API tokens. For routine low-risk changes, skip the cross-model review. Reserve it for:

- High-risk or high-complexity changes
- Phase completion reviews
- Pre-PR reviews
- When you're uncertain about a design decision
