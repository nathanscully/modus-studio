// Single source of truth for the repo's public URL. Update this ONE constant
// once the repo is pushed/renamed; everything else (contribution links, PR
// deep-links) derives from it.

export const REPO_URL = "https://github.com/nathanscully/modus-studio";

export function communityPrUrl(id: string): string {
  return `${REPO_URL}/new/main?filename=themes/community/${id}.json`;
}
