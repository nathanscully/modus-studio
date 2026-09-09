import { fileURLToPath } from "node:url";

import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { type PluginOption, defineConfig } from "vite-plus";

// Single source of truth. Standard Vite config (plugins/server/build) plus the
// vite+ blocks (lint/fmt/test/staged). This is a client-side SPA, so `vp build`
// (Vite) is the production build.

// Cast (not annotate) to vite+'s PluginOption: the plugins bundle their own
// Vite types, and an `as` cast bridges minor type-version skew while avoiding a
// TS2321 "excessive stack depth" that an assignability check would trigger.
const plugins = [
  // File-based routing: generates src/routeTree.gen.ts from src/routes/**.
  tanstackRouter({ target: "react", autoCodeSplitting: true }),
  react(),
  tailwindcss(),
] as PluginOption[];

export default defineConfig({
  plugins,

  // `@/*` and `~/*` both map to ./src. shadcn/ui generates `@/` imports; the
  // rest of the app uses `~/` (with explicit file extensions).
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },

  server: { port: 3000 },

  lint: {
    ignorePatterns: [
      "dist/**",
      "src/routeTree.gen.ts",
      "screenshots/**",
      "src/components/ui/color-picker-internal/**",
    ],
    plugins: ["react"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    rules: {
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
    },
  },

  fmt: {
    ignorePatterns: ["dist/**", "src/routeTree.gen.ts"],
    sortPackageJson: true,
  },

  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["src/test-setup.ts"],
  },

  staged: {
    "*.{ts,tsx,js,jsx,css}": "vp check --fix",
  },
});
