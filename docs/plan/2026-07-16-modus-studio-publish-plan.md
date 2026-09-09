# modus-studio — publish plan

Date: 2026-07-16. Status: approved, in execution.

Goal: publish this project as **modus-studio** — the canonical gallery + editor for
themes built on Protesilaos Stavrou's modus-themes engine — and accept community
themes via GitHub PRs.

## Decisions (locked — do not relitigate)

| Decision     | Choice                                                                                                                                                                       |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name         | `modus-studio` (repo, package, site title)                                                                                                                                   |
| License      | GPL-3.0-or-later, whole repo (palette data transcribed from GPL-3.0 upstreams)                                                                                               |
| Theme format | JSON files with a `kind` discriminator: `"full"` (baked ThemeDoc) and `"partial"` (author-style base colors + mappings, expanded live by the verified `generate-palette.ts`) |
| Deploy       | Cloudflare Pages (git-integrated; per-PR preview deploys so theme PRs can be reviewed visually)                                                                              |
| Routes       | `/` = gallery, `/theme/$themeId` = editor seeded from that theme; `?t=` diff param kept for shared edits                                                                     |

## Theme file format (source of truth for all tasks)

Location: top-level `themes/` directory, one JSON file per theme:

```
themes/
├── modus/        modus-operandi.json, modus-vivendi.json
├── ef/           ef-summer.json, … (37 files)
├── classic/      solarized-light.json, solarized-dark.json, nord.json  (kind: partial)
└── community/    user-submitted themes (PRs land here)
```

Shape (`kind: "full"`):

```jsonc
{
  "kind": "full",
  "id": "ef-summer",                  // must equal the file stem
  "meta": {
    "name": "ef-summer",              // elisp theme symbol
    "label": "Ef Summer (light)",     // picker/gallery display label
    "description": "Legible light warm pink theme.",
    "mode": "light",
    "author": "Protesilaos Stavrou",
    "homepage": "https://github.com/protesilaos/ef-themes",
    "license": "GPL-3.0-or-later",
    "tags": ["warm", "pink"]          // optional
  },
  "palette": { "bg-main": "#fff2f3", ... },   // ColorKey -> hex
  "mappings": { "keyword": "magenta-cooler", ... }  // RoleKey -> ColorKey | RoleKey | hex | "unspecified"
}
```

Shape (`kind: "partial"`) — mirrors `BaseScheme` in `src/theme/types.ts`:

```jsonc
{
  "kind": "partial",
  "id": "solarized-light",
  "meta": { ...same as above... },
  "preference": "cool",               // optional
  "base": { "bg-main": "#fdf6e3", "fg-main": "#657b83", ... },
  "mappings": { "keyword": "green", ... }   // generatePalette MAPPINGS arg
}
```

Partial themes are expanded at load time via `generatePalette` (already
Emacs-verified). Community submissions may use either kind.

Validation rules (enforced by a vitest suite that doubles as PR CI):

- `id` equals file stem; unique across all collections.
- Palette keys ⊆ `ColorKey`, mapping keys ⊆ `RoleKey` (from `src/theme/palette-keys.ts`).
- Hex values match `#rrggbb`; mapping values are a known ColorKey/RoleKey, hex, or `unspecified`.
- `kind: full` docs must resolve every syntax-critical role via `resolve.ts` without holes.
- `kind: partial` must include `bg-main` + `fg-main`; expansion must succeed.
- `meta.mode` consistent with `bg-main` luminance (warn-level).

## Workstreams & tasks

### A. Theme data layer (T1 — Opus) — KEYSTONE, blocks C and D

1. Add theme-file TS types + a loader (`import.meta.glob` over `themes/**/*.json`,
   eager, build-time). Partial kind expanded through `generatePalette` with the
   scheme's `preference`/`mappings` (reuse the wiring intended for `BaseScheme`).
2. Codegen script (`scripts/`, run once with node) converting the 39 existing
   `src/theme/{modus,ef}-*.ts` seeds to `themes/{modus,ef}/*.json`, then delete the
   TS seed files. Solarized/Nord (`src/theme/schemes/`) become
   `themes/classic/*.json` partials.
3. Rebuild `PRESET_GROUPS`/`getPreset` from the loaded files; groups become
   collections (Modus / Ef light / Ef dark / Classic / Community). Existing preset
   ids must not change (`?t=` diffs and localStorage reference them).
4. Extend `ThemeMeta` with `author`/`homepage`/`license`/`tags` (optional fields).
5. Theme-file validation vitest suite per the rules above.
6. All 189 existing tests keep passing; fidelity tests (solarized ΔE, ef-summer
   generate) re-pointed at the JSON sources.

### B. Publish foundation

- T2 (Haiku): LICENSE (GPL-3.0-or-later), rename package to `modus-studio`,
  `index.html` title, `public/_redirects` for CF Pages SPA fallback
  (`/* /index.html 200`), GitHub Actions CI (`.github/workflows/ci.yml`: pnpm via
  corepack, `vp check`, `vp test`, `vp build`).
- T5 (Sonnet, after T1/T3): real README — what it is, gallery screenshot
  placeholders, quickstart, architecture pointer to `docs/modus-ef-architecture.md`,
  contribution summary.
- Nathan (manual): `gh repo create`, push, Cloudflare Pages hookup. Commands
  drafted by orchestrator; never run by agents.

### C. Gallery/explore mode (T3 — Opus, after T1)

- `/` becomes a gallery grid over all loaded themes; current `Generator` moves to
  `/theme/$themeId` (seeded from that preset; `?t=` still wins for shared edits).
  A bare `/?t=` URL redirects to the editor to keep old share links working.
- Cards: theme name/label, mode badge, swatch strip (bg-main, fg-main, 6 hues), and
  a mini static code preview. Performance: parse the sample buffer ONCE with
  tree-sitter, reuse the token spans across all ~42 cards, restyle per theme via
  resolved colors.
- Filters: light/dark, collection, text search. Sorted, keyboard-navigable.
- Use the frontend-design skill; match existing Tailwind v4 + shadcn patterns.

### D. Contribution flow (T4 — Sonnet, after T1)

- "Submit your theme" in `ExportPanel`: serialize the working doc to `kind: full`
  JSON (author fields prompted inline) and deep-link to
  `https://github.com/nathanscully/modus-studio/new/main?filename=themes/community/<id>.json&value=<encoded>`
  so a contributor opens a PR without cloning.
- `CONTRIBUTING.md`: both submission paths (in-app button, manual PR), format
  reference, validation expectations, GPL notice.
- PR CI: the T1 validation suite runs on every PR (already covered by `vp test`
  in CI); document that CF Pages preview deploy shows the gallery incl. the new
  theme.

### E. Later (not scheduled now)

- `.el` importer (paste an existing modus-derivative like modus-alabaster → editable doc).
- Contrast checker (WCAG ratios per role — very on-brand for modus).
- More preview languages; OG image per theme.
- Nord role-fidelity question (pin against nordtheme/emacs or accept Modus arrangement) — still open from 2026-07-02 handoff.

## Orchestration

Fable orchestrates + validates; subagents implement:

| Task | Model  | Depends on | Why this model                                                          |
| ---- | ------ | ---------- | ----------------------------------------------------------------------- |
| T1   | Opus   | —          | Correctness-critical data-model refactor touching store/serialize/tests |
| T2   | Haiku  | —          | Mechanical: license, rename, CI yaml, redirects                         |
| T3   | Opus   | T1         | Design-quality UI + routing + preview performance                       |
| T4   | Sonnet | T1, T2     | Straightforward feature + docs                                          |
| T5   | Sonnet | T1, T3     | Writing task with settled feature set                                   |

Validation gates (Fable, after each wave): `pnpm exec vp check`, `pnpm exec vp test`,
`pnpm run build`, dev-server + browser smoke of gallery/editor, and an
`emacs --batch` load check of an exported `.el` at the end.

Constraints for all agents: never commit/push; no inline comments; string-literal
unions over enums; `unknown` over `any`; match existing patterns; don't touch
files outside your task's scope.
