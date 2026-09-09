// `/` is the gallery. Back-compat: old share links were bare `/?t=<param>`; we
// decode enough of the param to recover its base preset id and redirect into the
// editor at /theme/<base>?t=<param>, so those links keep resolving.

import { createFileRoute, redirect } from "@tanstack/react-router";

import { Gallery } from "~/components/gallery/Gallery.tsx";
import { decodeFromParam } from "~/theme/serialize.ts";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): { t?: string } => {
    const t = search.t;
    return typeof t === "string" ? { t } : {};
  },
  beforeLoad: ({ search }) => {
    if (search.t) {
      const decoded = decodeFromParam(search.t);
      if (decoded) {
        throw redirect({
          to: "/theme/$themeId",
          params: { themeId: decoded.baseId },
          search: { t: search.t },
        });
      }
    }
  },
  component: Gallery,
});
