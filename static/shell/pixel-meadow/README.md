# Meadow v2

Native zsh with Starship, zsh-users plugins, fzf, zoxide and focused CLI tools.
Uses macOS SF Mono 13 pt with antialiasing. No custom font is installed.
Historical directory/profile names remain `pixel-shell` / `Pixel Meadow` so
existing paths and rollback references continue to work.

The prompt reads the path and Git branch; `git_status` is disabled. Ordinary
`ll`/`la` listings do not scan Git. Use `gs` for tracked-file status, or
`git status` for a complete check including new files and submodules.
Login terminals show Fastfetch's automatically selected small OS logo and
six local facts. `sysinfo` displays the fuller machine summary on demand.

For a fresh installation, review `pixel.zsh`, then:

```sh
brew bundle --file=Brewfile
mkdir -p ~/.config/pixel-shell
cp pixel.zsh starship.toml fastfetch.jsonc btop.conf help.txt rollback.py Brewfile "Pixel Meadow.terminal" ~/.config/pixel-shell/
```

Create `~/.config/pixel-shell/local.zsh` from `local.zsh` only if it does not
already exist. Back up `.zshrc` and append the managed block from the manual
once. Do not duplicate it on machines which already use v1. Open the included
`.terminal` profile and select it in Terminal settings. Existing Terminal
windows can cache the old font; quit and reopen Terminal or reimport the file.

The unused v1 installer and Swift profile generator have been removed.
The package is simply the files above, an optional local switch template,
the checksum list and this guide. No setup process runs during shell startup.

Daily guide: `pixel-help`. Edit switches with `pixel-config`, then open a new
shell. `PIXEL_DISABLE_BANNER=1` switches off the startup logo.

Recovery:

```sh
PIXEL_SHELL_DISABLE=1 /bin/zsh -l
/bin/zsh -f
python3 ~/.config/pixel-shell/rollback.py
python3 ~/.config/pixel-shell/rollback.py --apply
```

The rollback script previews by default; `--apply` removes only the managed
`.zshrc` block, preserving other settings and saving a pre-rollback copy.
`--terminal` also restores the original default/startup profile pointers if
still set to Pixel Meadow and the original backup reference exists.
Packages, history and navigation records are retained. The v2 manual lists
separate steps for reverting the font and Python/Ruby initialization edits.

Full change log, install block, measurements and rollback manual:
https://231220075.github.io/2026/11/11/macos-zsh-pixel-meadow/
