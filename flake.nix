{
  description = "Vite 8 + TanStack Router SPA (vite+ toolchain, Nix-pinned runtime)";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      nixpkgs,
      flake-utils,
      ...
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
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
            echo "spa devshell — node $(node --version), pnpm $(pnpm --version)"
            echo "  pnpm install        install deps"
            echo "  pnpm dev            Vite dev server (HMR)"
            echo "  pnpm exec vp check  format + lint + typecheck"
            echo "  pnpm exec vp test   run tests"
            echo "  pnpm run build      production build to dist/"
            echo "  pnpm run preview    serve the production build"
          '';
        };
      }
    );
}
