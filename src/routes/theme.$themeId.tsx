// `/theme/$themeId` is the editor, seeded from that preset. Unknown ids redirect
// to the gallery. A `?t=` diff param (shared edits) wins over the plain seed.

import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";

import { Generator } from "~/components/Generator.tsx";
import { getPreset } from "~/theme/presets.ts";

export const Route = createFileRoute("/theme/$themeId")({
  validateSearch: (search: Record<string, unknown>): { t?: string } => {
    const t = search.t;
    return typeof t === "string" ? { t } : {};
  },
  beforeLoad: ({ params }) => {
    if (!getPreset(params.themeId)) {
      toast.error(`No theme called "${params.themeId}"`, {
        description: "It may have been renamed or removed. Pick one from the gallery.",
      });
      throw redirect({ to: "/" });
    }
  },
  head: ({ params }) => {
    const preset = getPreset(params.themeId);
    const label = preset?.label ?? params.themeId;
    return {
      meta: [
        { title: `${label} · modus-studio` },
        { name: "description", content: preset?.doc.meta.description ?? "" },
      ],
    };
  },
  component: ThemeEditor,
});

function ThemeEditor() {
  const { themeId } = Route.useParams();
  const { t } = Route.useSearch();
  return <Generator initialPresetId={themeId} initialParam={t} />;
}
