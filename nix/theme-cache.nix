# The upstream .el files every pointer theme needs, fetched by the hashes in
# themes/lock.json and laid out the way scripts/resolve-themes.ts caches them
# (themes/.cache/<repo>/<rev>/<path>), so the resolver can run --offline inside
# a sandbox. Shared by the screenshot build and the export check.
{ pkgs, src }:

let
  lock = builtins.fromJSON (builtins.readFile (src + "/themes/lock.json"));
  # Many pointers share a file (every Ef theme lists ef-themes.el), so
  # deduplicate before fetching.
  cacheFiles = pkgs.lib.unique (
    pkgs.lib.concatLists (
      pkgs.lib.mapAttrsToList (
        _id: entry:
        pkgs.lib.mapAttrsToList (path: hash: {
          inherit path hash;
          inherit (entry) repo rev;
        }) entry.files
      ) lock
    )
  );
in
pkgs.runCommand "modus-studio-theme-cache" { } (
  pkgs.lib.concatMapStringsSep "\n" (
    f:
    let
      fetched = pkgs.fetchurl {
        url = "https://raw.githubusercontent.com/${f.repo}/${f.rev}/${f.path}";
        inherit (f) hash;
      };
    in
    ''
      install -D -m644 ${fetched} "$out/${f.repo}/${f.rev}/${f.path}"
    ''
  ) cacheFiles
)
