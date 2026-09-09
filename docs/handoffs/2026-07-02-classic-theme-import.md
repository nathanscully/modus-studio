# Handoff — Modus theme generator: classic-theme import (Solarized / Nord)

Date: 2026-07-02
Repo: `/Users/nathanscully/projects/modus-theme-generator` (branch `main`, clean tree)

## What this project is

A Vite + TanStack Router SPA (React 19, Tailwind v4, shadcn/ui, `vite-plus`/`vp`,
pnpm) for crafting Emacs themes built on Protesilaos Stavrou's `modus-themes`.
Two-layer palette (named colors + semantic mappings), live tree-sitter preview,
self-contained `.el` export. Verified architecture reference lives at
`docs/modus-ef-architecture.md` (read this first — it documents the palette
engine, the `modus-themes-theme` API version differences, and the derivation
formulas the TS port is based on).

## The current thread (why we're here)

The user asked to import the Doric themes, which opened a larger design question.
Key decisions reached (do not relitigate):

- **Doric is dropped.** It is a standalone theme system (depends only on Emacs,
  faces wired directly in Lisp, ~25-color palette, no semantic-mapping layer) —
  NOT a modus derivative like ef-themes. Verified rigorously. Not worth a second
  theme model right now.
- **Direction the user wants:** make the generator flexible so a classic scheme
  (Nord, Solarized, …) can be added as just a handful of base colors and expanded
  **live in the browser** into a valid Modus theme, emitting a valid modus `.el`.
  The user also described a future "show only what the theme actually uses"
  dynamic editor (open vocabulary / sparse rendering / add-key affordance) — that
  is NOT built yet; see "Deferred" below.
- **First classic schemes:** Solarized (light + dark) + Nord. **Live in-browser**
  generation (port the math), not baked presets.

## What was completed this session (all committed)

See commits `d2c9362`, `9ae203f`, `a40fddd` for full detail (messages are
thorough). Summary:

1. **`src/theme/generate-palette.ts`** — faithful TypeScript port of Emacs
   `modus-themes-generate-palette` + the `color.el` primitives. Given BASE-COLORS
   (min `bg-main`+`fg-main`, optionally the six hues) it derives the full palette
   - default semantic mappings. **Verified against real Emacs 30.2 to the digit**
     (ef-summer 70→113 expansion; test `generate-palette.test.ts`, fixtures in
     `src/theme/__fixtures__/`). Two fidelity details pinned against Emacs:
     released `color-lighten-hsl` is symmetric `L*(1+pct/100)` (NOT the asymmetric
     main-branch variant), and `format "%04x"` truncates (use `Math.floor`).
     Later added a `coreMappings` option so syntax roles (keyword/string/…) backfill
     from the core theme's mappings — otherwise they resolve to null.

2. **`src/theme/schemes/`** — `solarized.ts` (light+dark), `nord.ts`, plus the new
   `BaseScheme` type in `types.ts` (id/label/description/mode/preference/base/
   optional `mappings` override). Canonical hex values transcribed from upstream
   (altercation/solarized, nordtheme.com). Tests: `schemes.test.ts` (completeness).

3. **Fidelity verification (the last user request):** compared our Solarized port
   to `bbatsov/solarized-emacs` using **CIEDE2000 ΔE**. Found palette was already
   ΔE 0.00 but roles inherited Modus's arrangement (keyword→magenta). Fixed by
   transcribing solarized-emacs's own face→color map (`solarized-faces.el`) into
   the scheme's `mappings`. Now **both variants match solarized-emacs at ΔE 0.00
   across palette AND every syntax/UI role.** Locked in via
   `solarized-fidelity.test.ts` (self-contained CIEDE2000 impl). 189 tests total,
   `pnpm check` clean (1 pre-existing vendored warning in `compose-refs.ts`).

## Open item raised at the very end (user has NOT answered)

I flagged that **Nord's roles still follow Modus defaults**, not a reference port
— because there is no single canonical Nord-for-Emacs port to diff against the
way Solarized has solarized-emacs. Nord uses authentic Nord _colors_ but Modus's
role _arrangement_. Asked the user whether to pin Nord against a reference port
(e.g. `nordtheme/emacs`) or move on. **Await their answer before acting.**

## Not yet built (the actual "import" feature is only half done)

The schemes are pure data + a verified generator, but **nothing is wired into the
UI or the store yet.** Remaining work, roughly in order:

1. A store/preset path that carries a `BaseScheme` and expands it via
   `generatePalette` (live) — vs the current baked `ThemeDoc` presets. Look at
   `src/theme/presets.ts`, `src/state/theme-store.tsx`, `PresetCombobox.tsx`.
2. Register Solarized/Nord in the picker (probably a "Classic" group).
3. The dynamic "show only what the theme uses" editor the user described
   (open-vocabulary keys, sparse rendering, "+add key" affordance). This is a
   real refactor of `PaletteEditor.tsx`/`MappingEditor.tsx`, which currently
   iterate the full fixed `COLOR_GROUPS`/`ROLE_GROUPS`. Confirm scope with the
   user before starting — it touches types (open vocabulary via `string` keys),
   editors, preview, and export.
4. Verify a generated scheme exports as a valid `.el` (the export path
   `src/theme/export-el.ts` already backfills; confirm it handles a generated
   palette + the extra named colors like orange/violet).

## Environment / working notes

- Upstream sources cloned in `/tmp` this session (may be gone in a fresh env):
  `/tmp/modus-src`, `/tmp/ef-themes-src`, `/tmp/solarized-emacs`. Re-clone if
  needed. Emacs 30.2 is installed (`/opt/homebrew/bin/emacs`, also Emacs.app) —
  useful for ground-truth checks via `emacs --batch -Q`.
- The ad-hoc ΔE comparison harness was at `/tmp/de-compare.mjs`; the committed
  test supersedes it.
- Commit trailer required: `Claude-Session: https://claude.ai/code/session_01GcXoBhE7KF4RWLAXvj5dzd`
- Commit only when asked. Lint-staged runs `vp check --fix` on commit.
- Playwright MCP writes `.playwright-mcp/` artifacts; `rm -rf` before committing
  (dir is gitignored but stray files have snuck in before).
- Memory index at
  `/Users/nathanscully/.claude/projects/-Users-nathanscully-projects-modus-theme-generator/memory/MEMORY.md`.

## Suggested skills

- **domain-modeling** — if picking up the "open vocabulary / show only what's
  used" editor refactor. That change reworks the ubiquitous language (what a
  "theme", "palette key", "scheme" is when keys become open-ended), and recording
  that decision is exactly what this skill is for.
- **govuk-style** — if writing any user-facing copy, docs, or updating
  `docs/modus-ef-architecture.md` for the import phase.
