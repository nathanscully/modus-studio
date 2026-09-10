{
  description = "modus-studio — gallery + editor for Emacs themes built on modus-themes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    # Emacs 30 for the export check: nixpkgs-unstable only ships Emacs 31.
    nixpkgs-emacs30.url = "github:NixOS/nixpkgs/nixos-25.05";
    flake-parts.url = "github:hercules-ci/flake-parts";
    devshell = {
      url = "github:numtide/devshell";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, devshell, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      imports = [ devshell.flakeModule ];

      # x86_64-darwin is dropped: nixpkgs 26.11 no longer supports it.
      systems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];

      perSystem =
        {
          pkgs,
          lib,
          system,
          ...
        }:
        let
          node = pkgs.nodejs_24;
          pnpm = pkgs.pnpm.override { withNode = false; };
          emacs31 = pkgs.emacs;
          emacs30 = inputs.nixpkgs-emacs30.legacyPackages.${system}.emacs30-nox;
          scripts = import ./nix/scripts.nix { inherit pkgs emacs31 emacs30; };

          # What the sandboxed builds see: the theme data, the dependency-free
          # engine and the two node scripts, nothing from node_modules.
          src = lib.fileset.toSource {
            root = ./.;
            fileset = lib.fileset.unions [
              ./themes
              ./src
              ./scripts
              ./screenshots
              ./README.md
              ./LICENSE
              ./CONTRIBUTING.md
              ./flake.nix
            ];
          };
          themeCache = import ./nix/theme-cache.nix { inherit pkgs src; };
        in
        {
          # `nix develop` drops into the shell; every command is also reachable
          # as `nix develop -c <name>`.
          devshells = import ./nix/devshell.nix {
            inherit
              pkgs
              node
              pnpm
              scripts
              ;
          };

          # `nix flake check`: resolve every pointer from the hash-pinned cache,
          # export every theme, and load each one in a store Emacs 31 and in
          # Emacs 30 with the pinned modus-themes 5. Nothing from the host.
          checks.themeExports = pkgs.stdenvNoCC.mkDerivation {
            name = "modus-studio-theme-exports";
            inherit src;
            nativeBuildInputs = [ node ];
            buildPhase = ''
              runHook preBuild
              export HOME=$TMPDIR
              mkdir -p themes/.cache
              cp -r ${themeCache}/. themes/.cache/
              chmod -R u+w themes
              node scripts/resolve-themes.ts --offline
              ${scripts.checkEl31}
              ${scripts.checkEl30}
              runHook postBuild
            '';
            installPhase = "touch $out";
          };

          formatter = pkgs.nixfmt;

          # Real-Emacs screenshots of every theme (x-export-frames under Xvfb).
          # Linux-only; from the Mac it builds via the linux-builder.
          packages = lib.optionalAttrs pkgs.stdenv.hostPlatform.isLinux {
            themeScreenshots = import ./nix/screenshots.nix { inherit pkgs src themeCache; };
          };
        };
    };
}
