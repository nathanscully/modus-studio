{
  description = "modus-studio — gallery + editor for Emacs themes built on modus-themes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      ...
    }:
    # x86_64-darwin is dropped: nixpkgs 26.11 no longer supports it.
    flake-utils.lib.eachSystem [ "aarch64-darwin" "aarch64-linux" "x86_64-linux" ] (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = nixpkgs.lib;
        node = pkgs.nodejs_24;
        pnpm = pkgs.pnpm.override { withNode = false; };
      in
      {
        devShells.default = pkgs.mkShell {
          packages = [
            node
            pnpm
            pkgs.git
          ];

          env.VITE_GIT_HOOKS = "1";

          shellHook = ''
            export VP_ENV_MODE=off          # Nix owns the runtime; vp must not manage it
            echo "modus-studio devshell — node $(node --version), pnpm $(pnpm --version)"
            echo "  pnpm install        install deps"
            echo "  pnpm dev            Vite dev server (HMR)"
            echo "  pnpm exec vp check  format + lint + typecheck"
            echo "  pnpm exec vp test   run tests"
            echo "  pnpm run build      production build to dist/"
            echo "  pnpm run preview    serve the production build"
            echo "  nix build .#packages.aarch64-linux.themeScreenshots"
            echo "                      real-Emacs PNG per theme (linux-builder)"
          '';
        };
      }
      // lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
        # Real-Emacs screenshots of every theme (x-export-frames under Xvfb).
        # Linux-only; from the Mac it builds via the linux-builder.
        packages.themeScreenshots = import ./nix/screenshots.nix {
          inherit pkgs;
          src = lib.fileset.toSource {
            root = ./.;
            fileset = lib.fileset.unions [
              ./themes
              ./src
              ./screenshots
              ./README.md
              ./LICENSE
              ./CONTRIBUTING.md
              ./flake.nix
            ];
          };
        };
      }
    );
}
