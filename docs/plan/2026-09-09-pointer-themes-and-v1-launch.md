# modus-studio — pointer themes and the v1.0 launch

Date: 2026-09-09. Status: approved, not started. Supersedes the theme-data parts
of `docs/plan/2026-07-16-modus-studio-publish-plan.md`; the name, license, deploy
and route decisions there still stand.

modus-studio is an index of Emacs themes built on the modus-themes engine, plus
an editor for making new ones. It links to each theme's own repo and sends credit
and traffic to the author. It copies no theme data. Each theme in the catalogue is
a pointer file naming an upstream repo, its `.el` files and a pinned commit. A
build step fetches those files, reads the palette out of the elisp, and expands
it through our verified `generatePalette`. The pin makes the build reproducible,
so CI and the Nix screenshot build can validate every theme without network
access at test time.

## Decisions (locked)

| Decision         | Choice                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme source     | Pointer files only. Modus, Ef, classic and community themes all point at an upstream repo. No palette data lives in this repo; the 8 Modus core palettes resolve from `modus-themes.el` like any other theme. |
| Resolution       | Build time, from a pinned commit. "Load latest from upstream" in the editor is deferred.                                                                                                                      |
| Unlicensed repos | Included. Card shows the license or "no license". Nathan removes case by case if asked.                                                                                                                       |
| Submissions      | A pointer PR. Authors host their theme in their own repo; the PR adds one small JSON file here.                                                                                                               |
| Export format    | The author-style form: base colors plus a `modus-themes-generate-palette` call and the 7-argument `modus-themes-theme`, with an Emacs 30 fallback.                                                            |

## Why the exporter comes first

Every derivative theme found on GitHub (14 repos surveyed, list in the appendix)
defines its palette as one quoted data form:

```elisp
(defconst modus-vague-palette
  (modus-themes-generate-palette
   '((bg-main "#141415") (fg-main "#cdcdcd") ...)   ; base colors
   nil nil mappings))                              ; preference, core, mappings
(modus-themes-theme 'modus-vague 'modus-vague "..." 'dark
 'modus-themes-vivendi-palette 'modus-vague-palette 'modus-vague-palette-overrides)
```

That is our `kind: partial` shape. The resolver reads it; the exporter should
write it, so a theme made in the editor and pushed to GitHub resolves like any
other. Today the exporter writes the Emacs 30 3-argument macro form, which fails
on Emacs 31.1 and on any Emacs with modus-themes 5 from ELPA (verified: 46 of 46
exports fail with `void-variable`). Changing the export format fixes the launch
blocker and defines the parser's target at the same time.

## Pointer file format

Location stays `themes/<collection>/<id>.json`. Collections stay
`modus/`, `ef/`, `classic/`, `community/`.

```jsonc
{
  "kind": "source",
  "id": "modus-vague", // equals the file stem; one pointer per theme
  "source": {
    "repo": "paniash/modus-vague", // GitHub owner/name; other hosts later
    "rev": "3f2a9c1e...", // full commit SHA, bumped by PR
    "files": ["modus-vague-theme.el"], // every file the resolver must read
    "theme": "modus-vague", // the symbol passed to modus-themes-theme
  },
  "install": "(use-package modus-vague :vc (:url \"https://github.com/paniash/modus-vague\"))",
  "meta": { "tags": ["dark", "low-contrast"] }, // optional; everything else comes from upstream
}
```

Name, description, mode, author, homepage and license come from the `.el`
header and the `modus-themes-theme` call. A pointer may override any of them in
`meta`, for example when a header has no author line.

A repo with several themes has one pointer per theme, each listing the files it
needs. ef-summer needs `ef-summer-theme.el` and `ef-themes.el` because its
mappings append `ef-themes-palette-common` from the second file.

`themes/lock.json` records, per pointer, the SHA-256 of each fetched file at the
pinned rev. The Nix build fetches by hash and the Node resolver checks the hash,
so both see the same bytes.

## Resolver

`scripts/resolve-themes.ts`, plain Node 24 like `screenshots/export-themes.ts`.
Input: the pointer files and the lock. Output: `themes/.resolved/<id>.json`
(gitignored), one `full` ThemeDoc per theme, which the existing loader and the
screenshot exporter consume unchanged. The Vite build runs it as a pre-step; CI
and Nix run it explicitly.

The reader handles this subset of elisp and nothing more:

- comments, strings, symbols, numbers, quoted lists, backquote treated as quote
- `defconst`, `defvar` and `defcustom` with a literal or a quoted list value
- `append` of symbol references and quoted lists
- symbol references across the listed files
- `modus-themes-generate-palette` with positional arguments: base, preference,
  core, mappings
- the 7-argument `modus-themes-theme` with quoted symbols
- the Emacs 30 3-argument `modus-themes-theme` macro with bare symbols, inside
  `eval-and-compile`

The core-palette argument resolves to a `defconst` in the listed files. The 8
Modus cores are `(defconst modus-themes-operandi-palette (append '(...)
modus-themes-common-palette-mappings))` in `modus-themes.el`, inside the subset,
so the Modus pointers list that file and no palette data lives in our code.
Every pointer whose theme call names a Modus core, and every partial that relies
on the default core fill, depends on the Modus pointers; the resolver resolves
those first. nano-like-modus and modern-themes pass their own generated palette
as the core with user palette nil, like ef-themes.

`modus-themes.el` is 7,868 lines, mostly function definitions. The reader scans
top-level forms and keeps only `defconst`, `defvar` and `defcustom`; it skips
other forms by matching parentheses while respecting strings, comments and
character literals such as `?\(`. It never needs to understand a `defun` body.

Anything else fails resolution. The error names the pointer, the file, the line,
and the form it could not read. The theme is dropped from the build with a
console warning, and the validation test fails the PR.

Custom faces (`modus-vague-custom-faces`) are outside the model. The card and
editor show "upstream also defines N custom faces" with a link.

## Workstreams

### A. Exporter: author-style `.el` with dual API

1. Emit the palette as base colors plus mappings in a `generate-palette` call
   when the doc came from a partial, and as a full quoted palette otherwise.
2. Emit the 7-argument `modus-themes-theme` form. Wrap the Emacs 30 3-argument
   form in a branch chosen by `(macrop 'modus-themes-theme)` at load time.
3. Replace the `require` guard with `(require-theme 'modus-themes)` when
   available, falling back to `require`, so a downloaded theme loads from
   `custom-theme-load-path` on stock Emacs.
4. Credit the upstream in the header: author, homepage, license, and
   "derived from <id> at <rev>" when the doc was seeded from a pointer.
5. Verify: `emacs --batch -Q` on Emacs 31.1 for all themes, and the Nix
   `themeScreenshots` build (Emacs 30) for all themes. Both must pass.

Effort: medium. Impact: unblocks launch on its own.

### B. Resolver and pointer format

1. Types and validator for `kind: source` in `theme-file.ts`; the `full` and
   `partial` kinds stay for tests and for the editor's in-memory doc.
2. The elisp reader and the palette extractor, with fixture tests built from the
   surveyed repos at fixed revs.
3. `scripts/resolve-themes.ts` and `themes/lock.json`; `scripts/pin-theme.ts
<repo> [--rev]` to add or bump a pointer and its hashes.
4. Vite pre-build hook, CI step, and Nix `fetchurl` by hash from the lock.
5. Fidelity tests re-pointed at resolver output: ef-summer expansion matches the
   Emacs fixture; Solarized ΔE stays 0.00 against solarized-emacs.

Effort: large. Impact: the product changes from archive to index.

### C. Catalogue migration

1. Pointers for the 8 Modus themes at protesilaos/modus-themes, each listing
   `modus-themes.el` and its `<name>-theme.el`. This adds the 6 variants we do
   not ship today (tinted, deuteranopia, tritanopia); modus-zenburn builds on
   vivendi-tinted. Delete the transcribed operandi and vivendi JSON.
2. Pointers for the 38 Ef themes at protesilaos/ef-themes, each listing
   `ef-themes.el` and its `<name>-theme.el`. Delete the 38 baked JSON files.
3. Pointers for the surveyed community repos (appendix). Delete the 3 community
   JSON files; modus-alabaster points at dpassen/modus-alabaster.
4. Solarized and Nord: host them in their own repo (Nathan's) as `.el` files
   exported by workstream A, then point at it. Until then they stay `partial`.
5. A scheduled GitHub Action that bumps `rev` per pointer and opens one PR per
   theme; the Cloudflare preview and the screenshot artifact show the change.

Effort: medium. Impact: 60 to 90 themes at launch instead of 46.

### D. Gallery and editor for pointers

1. Card: author, license badge, repo link, install snippet copy button.
2. Editor: "Source" panel with the same, plus "upstream also defines custom
   faces" when true. Export header carries the credit.
3. Submit dialog becomes "Add your theme": download the `.el`, push it to a
   repo, paste the repo URL; the dialog drafts the pointer JSON and opens the
   GitHub new-file page for `themes/community/<id>.json`. The JSON is small, so
   the `value=` parameter can carry it.
4. CONTRIBUTING and README rewritten for the pointer flow.

Effort: medium. Impact: contribution takes one minute and credits the author.

### E. Launch cleanup (from the 2026-09-09 review)

1. `tsconfig.json`: `vite/client` to `vite-plus/client`. CI is red until then.
2. `index.html`: description, Open Graph and Twitter tags, favicon, robots.
3. Root route: error boundary, styled 404, toast on unknown theme id and on a
   rejected `?t=` param.
4. Editor: stack the two columns below `md`; confirm before Reset.
5. `Gallery.tsx` imports `REPO_URL` instead of hardcoding it. README counts
   corrected. Stale localStorage comments removed. Vendored color-picker dir
   added to lint ignore.

Effort: small. Impact: needed before the first public link.

### F. Publish (Nathan runs these)

1. `gh repo create nathanscully/modus-studio --public --source . --push`.
2. Cloudflare Pages project on the repo with preview deploys on PRs.
3. Tag `v1.0.0`; set `version` in `package.json`.

## Order

A, then E, then commit and push as the baseline (F1, F2). Then B, C, D together,
then F3. A and E are independent of B; landing them first gives a working site
while the resolver is built.

## Validation gates

After each workstream: `pnpm exec vp check`, `pnpm exec vp test`,
`pnpm run build`, browser smoke of gallery and editor, `emacs --batch -Q` load
of every export on Emacs 31.1, and the Nix `themeScreenshots` build on Emacs 30.

## Deferred

- "Load latest from upstream" in the editor (runtime fetch; raw.githubusercontent
  allows cross-origin reads).
- Hosts other than GitHub (SourceHut, Codeberg, GNU ELPA tarballs).
- Contrast checker per role.
- Precomputed gallery data to shrink the 598 kB entry chunk.

## Appendix: surveyed repos (2026-09-09)

Resolvable with the subset above:

| Repo                           | Themes | License | Note                                             |
| ------------------------------ | ------ | ------- | ------------------------------------------------ |
| dpassen/modus-flexoki          | 2      | GPL-3.0 | mappings in a sibling file                       |
| dpassen/modus-alabaster        | 2      | GPL-3.0 | replaces our copied JSON                         |
| paniash/modus-vague            | 1      | GPL-3.0 |                                                  |
| kiennq/modus-zenburn           | 2      | GPL-3.0 | core is vivendi-tinted                           |
| emacsmirror/peppers-theme      | 1      | GPL-3.0 | full quoted palette, no generate call            |
| splintersuidman/flexoki-themes | 2      | GPL-3.0 | `append` of partial and common, on vivendi core  |
| dalugm/jinlor.el               | 5      | GPL-3.0 | extra named colors                               |
| benleis1/nano-like-modus-theme | 1      | none    | own palette as core, user nil                    |
| Artawower/modern-themes        | 26     | none    | ayu, catppuccin, gruvbox, tokyo, github and more |
| andiogenes/bogus-themes        | 2      | none    | Emacs 30 3-argument form                         |

Not resolvable: kn66/modus-solarized (palettes built by functions),
thattemperature/thattem-modus-themes (symbol-renaming wrapper),
deadendpl/modus-ewal-theme (pywal colors at runtime). Not derivative themes:
jeffkreeftmeijer/base16-modus, pkazmier/doom-nebula-theme, the exporters,
configs and mirrors.
