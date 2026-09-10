# Contributing a theme

Themes live in their authors' repos. This repo holds one small pointer file per
theme under `themes/community/`, and a build step reads the palette out of the
upstream `.el` at a pinned commit. To add yours:

1. Publish the theme in a public GitHub repo. It must define its palette as
   data: a quoted list, `append`, and `modus-themes-generate-palette`, then call
   `modus-themes-theme`. Every theme built the usual way already does, and so
   does every file the editor's Download button writes.
2. Add the pointer. In the editor, open the menu and choose "Add your theme to
   the gallery": paste the repo, pick the commit, and the dialog opens GitHub's
   new-file page with `themes/community/<id>.json` filled in. From a clone of
   this repo, the same thing is `pnpm run pin <owner/repo> <theme-symbol>`
   followed by `pnpm run resolve -- --update-lock`, which also pins the file
   hashes in `themes/lock.json`.
3. Open the PR. CI resolves the pointer and validates the theme. A pointer
   added from the browser has no `themes/lock.json` entry yet, so CI reports
   "not pinned"; a maintainer runs `pnpm run resolve -- --update-lock` on the
   branch and pushes the lock before merging.

A pointer looks like this:

```jsonc
{
  "kind": "source",
  "id": "modus-vague",
  "source": {
    "repo": "paniash/modus-vague",
    "rev": "a3b94751ef2ab3e3ccae15b641cee5370e652c0f",
    "files": ["modus-vague-theme.el"],
    "theme": "modus-vague",
  },
  "install": "(use-package modus-vague :vc (:url \"https://github.com/paniash/modus-vague\"))",
  "meta": { "license": "GPL-3.0" }, // optional overrides for label, description, author, homepage, license, tags
}
```

Author, homepage and license come from the `.el` header when the pointer does
not set them. A palette built by a custom function cannot be read; the resolver
says so with the file and line.

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
