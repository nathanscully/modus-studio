{
  pkgs,
  node,
  pnpm,
  scripts,
}:

{
  default = {
    packages = [
      node
      pnpm
      pkgs.git
    ];

    devshell = {
      motd = ''

        M O D U S - S T U D I O

        → dev          resolve the theme pointers, then Vite with HMR
        → check        resolve, lint, typecheck, test and build (the CI gate)
        → check-el     load every exported theme in Emacs 31 and 30
        → screenshots  real-Emacs PNG per theme (linux-builder)
        → pin          point at a theme in another repo
        → menu         full command list
      '';
      startup.direnv.text = pkgs.lib.mkForce "";
    };

    env = [
      # Nix owns the runtime; vp must not manage it.
      {
        name = "VP_ENV_MODE";
        value = "off";
      }
      {
        name = "VITE_GIT_HOOKS";
        value = "1";
      }
    ];

    commands = [
      {
        category = "dev";
        name = "dev";
        help = "Resolve the theme pointers, then run Vite with HMR at :3000";
        command = ''
          set -e
          ${scripts.resolve}
          pnpm exec vp dev "$@"
        '';
      }
      {
        category = "dev";
        name = "resolve";
        help = "Fetch the pinned upstream files and write themes/resolved (--update-lock to pin)";
        command = scripts.resolve;
      }
      {
        category = "dev";
        name = "pin";
        help = "Write a pointer for <owner/repo> <theme-symbol> under themes/community";
        command = scripts.pin;
      }
      {
        category = "dev";
        name = "preview";
        help = "Serve the production build";
        command = ''pnpm exec vp preview "$@"'';
      }
      {
        category = "check";
        name = "check";
        help = "Resolve, lint, typecheck, test and build: what CI runs";
        command = ''
          set -e
          ${scripts.resolve}
          lint
          vitest
          build
        '';
      }
      {
        category = "check";
        name = "lint";
        help = "Format, lint and typecheck (vp check; --fix to write)";
        command = ''pnpm exec vp check "$@"'';
      }
      {
        category = "check";
        name = "vitest";
        help = "Run the vitest suite (the name `test` is a shell builtin)";
        command = ''pnpm exec vp test "$@"'';
      }
      {
        category = "check";
        name = "build";
        help = "Production build to dist/";
        command = "pnpm exec vp build";
      }
      {
        category = "emacs";
        name = "check-el";
        help = "Export every theme and load it in Emacs 31 and in Emacs 30 with modus-themes 5";
        command = ''
          set -e
          check-el-31
          check-el-30
        '';
      }
      {
        category = "emacs";
        name = "check-el-31";
        help = "Export every theme and load it in a clean Emacs 31";
        command = scripts.checkEl31;
      }
      {
        category = "emacs";
        name = "check-el-30";
        help = "Export every theme and load it in Emacs 30 with the pinned modus-themes 5";
        command = scripts.checkEl30;
      }
      {
        category = "emacs";
        name = "screenshots";
        help = "Render a PNG of every theme in a real Emacs (Linux; the Mac uses the linux-builder)";
        command = ''
          system=$(nix eval --impure --raw --expr builtins.currentSystem)
          case "$system" in *-darwin) system="aarch64-linux" ;; esac
          nix build ".#packages.$system.themeScreenshots" "$@"
        '';
      }
      {
        category = "dev";
        name = "fmt";
        help = "Format the nix files";
        command = "${pkgs.nixfmt}/bin/nixfmt flake.nix nix/*.nix";
      }
    ];
  };
}
