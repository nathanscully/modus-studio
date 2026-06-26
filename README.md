# spa

A client-side single-page app: [Vite](https://vite.dev) +
[TanStack Router](https://tanstack.com/router) (file-based routing) +
[TanStack Query](https://tanstack.com/query) + [Tailwind CSS](https://tailwindcss.com).
Tooling is the [vite+](https://viteplus.dev) toolchain (Oxlint, Oxfmt, Vitest);
the Node + pnpm runtime is pinned with Nix.

## Requirements

- [Nix](https://nixos.org) with flakes enabled (provides Node + pnpm)
- Optional: [direnv](https://direnv.net) — `direnv allow` to auto-enter the shell

## Getting started

```bash
nix develop          # or: direnv allow
pnpm install
pnpm dev             # Vite dev server with HMR at http://localhost:3000
```

## Commands

| Command              | What it does                                      |
| -------------------- | ------------------------------------------------- |
| `pnpm dev`           | Vite dev server with HMR                          |
| `pnpm run build`     | Production build to `dist/` (`vp build`)          |
| `pnpm run preview`   | Serve the production build (`vp preview`)         |
| `pnpm exec vp check` | Format + lint + typecheck (Oxfmt/Oxlint/tsgolint) |
| `pnpm exec vp test`  | Run the Vitest suite (jsdom)                      |

## How it fits together

- **Runtime is Nix-owned.** The flake pins `nodejs_24` + `pnpm`. vite+'s own
  runtime manager is disabled (`VP_ENV_MODE=off`).
- **All tool config lives in `vite.config.ts`** — the Vite `plugins`/`server`
  plus the vite+ `lint`, `fmt`, `test`, and `staged` blocks.
- **File-based routing.** Add a file under `src/routes/` and the TanStack Router
  plugin regenerates `src/routeTree.gen.ts` (gitignored) on dev/build.
- **Data fetching** uses TanStack Query (see `src/routes/about.tsx`). Point its
  `queryFn` at your API.
- **Commit hooks are built in** via `vp config` (runs on `pnpm install`);
  staged files are checked with `vp check --fix`. Set `VITE_GIT_HOOKS=0` to skip.

## Layout

```
index.html              # Vite entry HTML
src/
├── main.tsx            # bootstraps React, Router, and Query
├── styles.css          # Tailwind entry (@import "tailwindcss")
├── test-setup.ts       # jest-dom matchers + auto cleanup
└── routes/
    ├── __root.tsx      # root layout: nav + <Outlet/>
    ├── index.tsx       # /
    ├── about.tsx       # /about (TanStack Query example)
    └── index.test.tsx  # example component test
```
