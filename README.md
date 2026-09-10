# modus-studio

A web gallery and live editor for Emacs themes built on Protesilaos Stavrou's
[modus-themes](https://github.com/protesilaos/modus-themes) engine. Browse
and preview 90 themes, edit any of them the way a theme author does (a dozen
base colors, a few mapping overrides, the rest derived live by the engine's
own palette math) with a live tree-sitter-highlighted code preview, and export
a `.el` file that loads in Emacs. For Emacs users who want a theme close to
Modus or Ef but tuned to their taste, without writing elisp.

<img src="docs/screenshots/gallery.png" alt="Theme gallery" />
<img src="docs/screenshots/editor.png" alt="Live editor" />

## The themes

Every theme is a small pointer file under `themes/` naming its author's repo,
the `.el` files to read and a pinned commit. At build time
`scripts/resolve-themes.ts` fetches those files, reads the palette out of the
elisp and expands it with the same `generate-palette` math Emacs runs, so the
site copies no theme data and every card links to the upstream repo.

| Collection | Count | Source / credit                                                                                                                                                   |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modus      | 8     | [Protesilaos Stavrou](https://github.com/protesilaos/modus-themes)                                                                                                |
| Ef         | 38    | [Protesilaos Stavrou](https://github.com/protesilaos/ef-themes)                                                                                                   |
| Classic    | 3     | Solarized colors by Ethan Schoonover, mappings from [solarized-emacs](https://github.com/bbatsov/solarized-emacs); Nord by [Sven Greb](https://www.nordtheme.com) |
| Community  | 41    | Themes their authors built on modus-themes, each credited and linked on its card                                                                                  |

## Adding a theme

Publish your theme in your own repo, then add one pointer file under
`themes/community/`. The editor's menu has "Add your theme to the gallery",
which drafts the pointer and opens the GitHub new-file page with it filled in.
From a clone, the same thing is:

```bash
pnpm run pin <owner/repo> <theme-symbol>
pnpm run resolve -- --update-lock
```

CI validates the pointer and resolves it. Format and rules:
[CONTRIBUTING.md](CONTRIBUTING.md).

## Fidelity

The palette generator is a TypeScript port of `modus-themes-generate-palette`,
verified digit-for-digit against real Emacs output. The Solarized port is
checked against bbatsov/solarized-emacs with CIEDE2000 color difference
(ΔE 0.00). An edited theme exports in the author's shape: base colors, mapping
overrides and one `modus-themes-generate-palette` call, so it needs
modus-themes 5 (bundled with Emacs 31, on GNU ELPA for Emacs 30). The eight
Modus themes and other full-palette themes export with their whole palette and
load on the modus-themes bundled with Emacs 30 as well. Every export is
confirmed to load via `emacs --batch` on Emacs 31.1 and on Emacs 30.2 with
modus-themes 5, and the resolver's palettes are checked key for key against
what Emacs 31 computes when it loads the same pinned files. Background on the palette engine, the two-layer
color/mapping model, and the API differences across Modus versions:
[docs/modus-ef-architecture.md](docs/modus-ef-architecture.md).

## Development

Requires [Nix](https://nixos.org) with flakes enabled. `nix develop` (or
`direnv allow`) drops into a [devshell](https://github.com/numtide/devshell)
with Node, pnpm and one command per workflow; `menu` lists them, and each is
also reachable as `nix develop -c <name>`.

```bash
nix develop          # or: direnv allow
pnpm install
dev                  # resolves the theme pointers, then Vite with HMR at http://localhost:3000
```

| Command       | What it does                                                                    |
| ------------- | ------------------------------------------------------------------------------- |
| `dev`         | Resolve the pointers, then Vite with HMR                                        |
| `resolve`     | Fetch the pinned upstream files, write themes/resolved (`--update-lock` to pin) |
| `pin`         | Write a pointer for `<owner/repo> <theme-symbol>`                               |
| `check`       | Resolve, lint, typecheck, test and build: what CI runs                          |
| `lint`        | Format, lint and typecheck (`--fix` to write)                                   |
| `vitest`      | Run the test suite                                                              |
| `build`       | Production build to `dist/`                                                     |
| `check-el`    | Export every theme and load it in Emacs 31, and in Emacs 30 with modus-themes 5 |
| `screenshots` | Real-Emacs PNG per theme (Linux; the Mac uses the linux-builder)                |
| `fmt`         | Format the nix files                                                            |

`nix flake check` runs the export check against store Emacs builds with
nothing from the host; CI runs `check` and then `nix flake check`.

## License

GPL-3.0-or-later, for the whole repo. The bundled palette data is
transcribed from GPL-3.0 upstreams (modus-themes, ef-themes, and the
Solarized/Nord ports), so the project inherits their license.
