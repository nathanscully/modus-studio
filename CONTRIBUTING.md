# Contributing a theme

Two ways to submit a theme. Both land as a file at `themes/community/<id>.json`.

## Path 1: in-app (recommended)

1. Build your theme in the editor.
2. Open the export panel and click **Submit your theme**.
3. Fill in the theme id (slug), your name, and an optional homepage.
4. The dialog validates the theme file live and flags any issues before you
   submit.
5. Click **Copy JSON** (or **Download**), then **Open PR on GitHub** — this
   opens a new-file page pre-filled with the right path. Paste the JSON in,
   propose the file, and open the PR.

## Path 2: manual PR

1. Fork the repo.
2. Add `themes/community/<id>.json` following the format below (`<id>` must
   equal the file stem).
3. Run `pnpm exec vp test` locally to confirm it validates.
4. To see it rendered, run `pnpm dev` and open the gallery in a browser (the
   app is client-rendered — your theme won't show up in `curl`'d HTML).
5. Open a PR.

## Theme file format

A theme file is JSON, discriminated on `kind`. The types and validator live in
[`src/theme/theme-file.ts`](src/theme/theme-file.ts); any bundled file under
[`themes/`](themes/) is a working example (e.g. `themes/classic/nord.json` for
`kind: "partial"`). The two accepted shapes:

- `kind: "full"` — an explicit `palette` (named colors) + `mappings` (semantic
  roles → colors). Use this if you've built the theme in the editor.
- `kind: "partial"` — author-style `base` colors (must include `bg-main` +
  `fg-main`) + optional `mappings`, expanded at load time through the
  engine's `generatePalette`. Use this if you're porting a small palette
  (e.g. a handful of brand colors) and want the rest derived.

Compact `kind: "full"` example:

```jsonc
{
  "kind": "full",
  "id": "my-cool-theme",
  "meta": {
    "name": "my-cool-theme",
    "label": "My Cool Theme (dark)",
    "description": "A short description.",
    "mode": "dark",
    "author": "Your Name",
    "homepage": "https://github.com/you/your-project",
    "license": "GPL-3.0-or-later",
    "tags": ["dark", "cool"],
  },
  "palette": { "bg-main": "#101010", "fg-main": "#e0e0e0" /* … */ },
  "mappings": { "keyword": "magenta-cooler" /* … */ },
}
```

## What CI checks

Every PR runs `pnpm exec vp test`, which includes the theme-file validation
suite (`src/theme/theme-files.test.ts`). It checks, per file:

- `id` equals the file stem, and is unique across every collection.
- Palette keys are known `ColorKey`s, mapping keys are known `RoleKey`s (see
  `src/theme/palette-keys.ts`).
- Hex values match `#rrggbb`; mapping values are a known color/role name, a
  hex string, or `"unspecified"`.
- `kind: "full"` themes resolve every syntax-critical role (keyword, string,
  comment, constant, fnname, type, variable, builtin) to a concrete color.
- `kind: "partial"` themes expand successfully through `generatePalette`.

A failing check names the file, the key, and what's wrong — fix it and push
again. CI failures are actionable without reading the validator source.

Cloudflare Pages also builds a preview deploy for every PR, so a reviewer can
open the gallery and see your theme rendered before merging.

## Licensing

Submissions must be GPL-3.0-or-later, matching the rest of this repo (palette
data here is transcribed from GPL-3.0 upstreams). By submitting a theme you
agree to license it under GPL-3.0-or-later.

## Expectations

- Themes should differ meaningfully from what's already bundled — a
  near-duplicate of an existing Modus/Ef/community theme is unlikely to be
  accepted.
- Be terse and clear in your PR description; explain what makes the theme
  distinct.
- The maintainer has final say on inclusion.
