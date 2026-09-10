// Single source of truth for the repo's public URL. Update this ONE constant
// once the repo is pushed/renamed; everything else (contribution links, PR
// deep-links) derives from it.

export const REPO_URL = "https://github.com/nathanscully/modus-studio";

/**
 * GitHub's new-file page for a community pointer, with the file contents
 * prefilled. A pointer is a few hundred bytes, so it fits the `value` param.
 */
export function communityPrUrl(id: string, contents?: string): string {
  const params = new URLSearchParams({ filename: `themes/community/${id}.json` });
  if (contents) params.set("value", contents);
  return `${REPO_URL}/new/main?${params}`;
}
