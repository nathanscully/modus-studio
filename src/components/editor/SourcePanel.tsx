// Where the base theme comes from: author, license, the pinned upstream file,
// and how to install the original. Themes are pointers to their authors' repos,
// so this panel is the credit line of the editor.

import { CopyIcon, ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button.tsx";
import { useThemeStore } from "~/state/theme-store.tsx";
import type { Preset } from "~/theme/types.ts";

export function licenseLabel(license: string | undefined): string {
  return license ?? "no license";
}

export function repoUrlOf(preset: Pick<Preset, "source" | "spec">): string | undefined {
  if (preset.source) return `https://github.com/${preset.source.repo}`;
  return preset.spec.meta.homepage;
}

export async function copyInstall(install: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(install);
    toast.success("Install snippet copied to clipboard");
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

export function SourcePanel() {
  const { preset } = useThemeStore();
  const { meta } = preset.spec;
  const source = preset.source;
  const repoUrl = repoUrlOf(preset);

  return (
    <section className="border-t px-4 py-3 text-xs" aria-label="Theme source">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-semibold">{preset.label}</span>
        <span className="text-muted-foreground">{meta.mode}</span>
        <LicenseBadge license={meta.license} />
        {meta.author ? <span className="text-muted-foreground">by {meta.author}</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {source ? (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 font-mono"
            title={`${source.repo} at ${source.rev.slice(0, 7)}`}
          >
            {source.repo}
            <span className="opacity-60">@{source.rev.slice(0, 7)}</span>
            <ExternalLinkIcon aria-hidden="true" className="size-3" />
          </a>
        ) : repoUrl ? (
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
          >
            {repoUrl.replace(/^https?:\/\//, "")}
            <ExternalLinkIcon aria-hidden="true" className="size-3" />
          </a>
        ) : null}
        {source?.install ? (
          <Button
            size="xs"
            variant="outline"
            onClick={() => copyInstall(source.install!)}
            title={source.install}
          >
            <CopyIcon aria-hidden="true" />
            Copy install snippet
          </Button>
        ) : null}
      </div>
      {source && source.customFaces > 0 ? (
        <p className="text-muted-foreground mt-2">
          Upstream also defines {source.customFaces} custom{" "}
          {source.customFaces === 1 ? "face" : "faces"} that this editor does not show; install the
          original for the complete look.
        </p>
      ) : null}
    </section>
  );
}

export function LicenseBadge({ license }: { license: string | undefined }) {
  return (
    <span
      className={
        license
          ? "rounded-full border px-2 py-0.5 text-[10px] font-medium"
          : "text-muted-foreground rounded-full border border-dashed px-2 py-0.5 text-[10px]"
      }
      title={license ? `Licensed ${license}` : "The upstream repo declares no license"}
    >
      {licenseLabel(license)}
    </span>
  );
}
