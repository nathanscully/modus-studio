# modus-studio

A web gallery and live editor for Emacs themes built on Protesilaos Stavrou's
[modus-themes](https://github.com/protesilaos/modus-themes) engine. Browse
and preview 46 themes, edit any of them (named colors and semantic
role mappings) with a live tree-sitter-highlighted code preview, and export
a self-contained `.el` file that loads in stock Emacs. For Emacs users who
want a theme close to Modus or Ef but tuned to their taste, without writing
elisp.

<img src="docs/screenshots/gallery.png" alt="Theme gallery" />
<img src="docs/screenshots/editor.png" alt="Live editor" />

## The themes

| Collection | Count | Source / credit                                                                                                                                                                              |
| ---------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modus      | 2     | [Protesilaos Stavrou](https://github.com/protesilaos/modus-themes)                                                                                                                           |
| Ef         | 38    | [Protesilaos Stavrou](https://github.com/protesilaos/ef-themes)                                                                                                                              |
| Classic    | 3     | Solarized colors by Ethan Schoonover; mappings ported from [bbatsov/solarized-emacs](https://github.com/bbatsov/solarized-emacs). Nord by [Sven Greb / nordtheme](https://www.nordtheme.com) |
| Community  | 3     | Submitted by users via PR, see below                                                                                                                                                         |

## Submitting a theme

Build a theme in the editor and use the **Submit your theme** button in the
export panel, or hand-write a JSON file under `themes/community/`. Either
path lands as a PR; CI validates the file and Cloudflare Pages builds a
preview deploy so reviewers can see it in the gallery before merging. Full
instructions and the file format: [CONTRIBUTING.md](CONTRIBUTING.md).

## Fidelity

The palette generator is a TypeScript port of `modus-themes-generate-palette`,
verified digit-for-digit against real Emacs output. The Solarized port is
checked against bbatsov/solarized-emacs with CIEDE2000 color difference
(ΔE 0.00). Every exported `.el` file is confirmed to load in stock Emacs 30.2
via `emacs --batch`. Background on the palette engine, the two-layer
color/mapping model, and the API differences across Modus versions:
[docs/modus-ef-architecture.md](docs/modus-ef-architecture.md).

## Development

Requires [Nix](https://nixos.org) with flakes enabled (provides Node + pnpm),
and optionally [direnv](https://direnv.net) (`direnv allow` to auto-enter the
shell).

```bash
nix develop          # or: direnv allow
pnpm install
pnpm dev             # Vite dev server with HMR at http://localhost:3000
```

| Command              | What it does                                      |
| -------------------- | ------------------------------------------------- |
| `pnpm dev`           | Vite dev server with HMR                          |
| `pnpm run build`     | Production build to `dist/` (`vp build`)          |
| `pnpm run preview`   | Serve the production build (`vp preview`)         |
| `pnpm exec vp check` | Format + lint + typecheck (Oxfmt/Oxlint/tsgolint) |
| `pnpm exec vp test`  | Run the Vitest suite (jsdom)                      |

## License

GPL-3.0-or-later, for the whole repo. The bundled palette data is
transcribed from GPL-3.0 upstreams (modus-themes, ef-themes, and the
Solarized/Nord ports), so the project inherits their license.
