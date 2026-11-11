# Pixel Meadow v1

macOS system zsh + Homebrew, with a pixel-style Terminal.app profile.

1. Read `install.py`, `pixel.zsh`, and `rollback.py` before running them.
2. Run `python3 install.py` to snapshot your current config and add a managed
   block to `.zshrc`. Existing content is retained. Symlinked entry points
   are rejected so a dotfile manager can remain in control.
3. Run `brew bundle --file=Brewfile` to install the tools and Monocraft font.
4. Open `Pixel Meadow.terminal`, then select it as the default and startup
   profile in Terminal settings. The installer does not change these settings.
5. Open a new terminal window and run `pixel-help`.

Runtime files live in `~/.config/pixel-shell/`. Uncomment a disable flag in
`local.zsh` and open a new window to switch off one module. Edit `starship.toml`
for the prompt, `btop.conf` for `monitor`, and `fastfetch.jsonc` for `sysinfo`.
No Nerd Font is required. Monocraft is installed separately from Homebrew;
the font itself is not distributed in this package. Chinese uses font fallback.

Recovery:

```sh
PIXEL_SHELL_DISABLE=1 /bin/zsh -l
/bin/zsh -f
python3 ~/.config/pixel-shell/rollback.py
python3 ~/.config/pixel-shell/rollback.py --apply
```

The rollback preview changes nothing. `--apply` saves the current `.zshrc`
and removes only the managed block. `--terminal` also restores the original
default/startup profile pointers if they are still set to Pixel Meadow.
For Terminal preference changes, quit Terminal first and run the command
from another command environment, or choose the old profiles in its UI.
Packages, history, navigation records, and configuration files are retained.

If compinit reports insecure directories, use `autoload -Uz compaudit;
compaudit` to inspect the exact paths. Do not bypass the audit or recursively
change Homebrew permissions. This installer does not change permissions.

`make-terminal.swift` generates the included profile from declared colors
and the installed font. To regenerate it on macOS with Swift available:

```sh
swift make-terminal.swift "Pixel Meadow.terminal"
```

The full change and rollback manual is published at:
https://231220075.github.io/2026/11/11/macos-zsh-pixel-meadow/
