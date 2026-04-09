{
  description = "MediaTracker development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        lib = pkgs.lib;

        webkitgtk =
          if pkgs ? webkitgtk_4_1 then pkgs.webkitgtk_4_1 else pkgs.webkitgtk;
        libsoup =
          if pkgs ? libsoup_3 then pkgs.libsoup_3 else pkgs.libsoup;
      in
      {
        devShells.default = pkgs.mkShell {
          packages = with pkgs; [
            nodejs_22
            # Use rustup (not nixpkgs rustc/cargo): Tauri installs Android targets via
            # rustup; a separate nix Rust on PATH makes rustc miss std for those triples.
            rustup
            pkg-config
            openssl
            sqlite
            gtk3
            glib
            gobject-introspection
            cairo
            pango
            atk
            libsoup
            webkitgtk
            libayatana-appindicator
          ];

          OPENSSL_DIR = "${pkgs.openssl.dev}";
          PKG_CONFIG_PATH = lib.makeSearchPath "lib/pkgconfig" [
            pkgs.openssl.dev
            libsoup.dev
            webkitgtk.dev
            pkgs.gtk3.dev
          ];

          shellHook = ''
            export PATH="$HOME/.cargo/bin:$PATH"
            echo "MediaTracker dev shell"
            echo "Run: npm ci && npm run tauri dev"
            echo "Rust: rustup default stable && rustup component add rustfmt clippy && rustup target add aarch64-linux-android"
            echo "OneDrive: set MEDIATRACKER_ONEDRIVE_CLIENT_ID when running cargo/tauri build (compile-time only)."

            exec zsh
          '';
        };
      });
}
