#!/usr/bin/env python3
"""Install the adjacent Pixel Meadow files. Install Brewfile separately first.

Preserves existing .zshrc content and snapshots it before adding one managed
block. Does not modify Terminal.app preferences (import the .terminal file).
"""
import argparse
from datetime import datetime
import json
import os
from pathlib import Path
import shutil
import subprocess

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--backup', type=Path, help='Use an existing pre-install snapshot from this machine')
args = parser.parse_args()
home = Path.home()
src = Path(__file__).resolve().parent
target = home / '.config/pixel-shell'
rc = home / '.zshrc'
files = ['pixel.zsh', 'starship.toml', 'btop.conf', 'fastfetch.jsonc', 'help.txt', 'rollback.py', 'Brewfile', 'Pixel Meadow.terminal']
for name in files:
    if not (src / name).is_file():
        raise SystemExit(f'Missing {name}; download the complete config directory first.')
if rc.is_symlink() or target.is_symlink():
    raise SystemExit('Symlinked .zshrc/config directory: install manually to preserve your dotfile manager.')
raw = rc.read_text() if rc.exists() else ''
start, end = '# >>> pixel-shell >>>', '# <<< pixel-shell <<<'
if start in raw or end in raw:
    raise SystemExit('Pixel Meadow is already installed; edit existing files or run rollback.py before reinstalling.')
if args.backup:
    backup = args.backup.expanduser().resolve()
    manifest = json.loads((backup / 'manifest.json').read_text())
    if manifest['home'] != str(home):
        raise SystemExit('The backup belongs to a different user directory.')
else:
    backup = home / '.local/state/pixel-shell/backups' / datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup.mkdir(parents=True, mode=0o700)
    os.chmod(backup, 0o700)
    manifest = {'home': str(home), 'files': {}, 'terminal_defaults': {}}
    for rel in ['.zshrc', '.zprofile', '.zshenv', '.config/pixel-shell']:
        source = home / rel
        manifest['files'][rel] = source.exists()
        if source.exists():
            dest = backup / 'files' / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            if source.is_dir(): shutil.copytree(source, dest)
            else: shutil.copy2(source, dest)
    for key in ['Default Window Settings', 'Startup Window Settings']:
        result = subprocess.run(['defaults', 'read', 'com.apple.Terminal', key], text=True, capture_output=True)
        manifest['terminal_defaults'][key] = result.stdout.strip() if result.returncode == 0 else None
    for flag, name in [('--formula', 'formulae-before.txt'), ('--cask', 'casks-before.txt')]:
        result = subprocess.run(['brew', 'list', flag], text=True, capture_output=True, check=True)
        (backup / name).write_text(result.stdout)
    (backup / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
target.mkdir(parents=True, exist_ok=True)
for name in files:
    shutil.copy2(src / name, target / name)
if not (target / 'local.zsh').exists():
    shutil.copy2(src / 'local.zsh', target / 'local.zsh')
(target / 'backup-path').write_text(str(backup) + '\n')
block = '\n' + start + '''
if [[ ${PIXEL_SHELL_DISABLE:-0} != 1 && -r "$HOME/.config/pixel-shell/pixel.zsh" ]]; then
  source "$HOME/.config/pixel-shell/pixel.zsh"
fi
''' + end + '\n'
temporary = rc.with_name('.zshrc.pixel-install.tmp')
with temporary.open('x') as handle:
    handle.write(raw + block)
if rc.exists(): shutil.copymode(rc, temporary)
else: temporary.chmod(0o644)
temporary.replace(rc)
print('Installed:', target)
print('Backup:', backup)
print('Open a new terminal window. Run pixel-help for shortcuts.')
