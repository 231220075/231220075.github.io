#!/usr/bin/env python3
"""Remove the Pixel Meadow entry point, preserving subsequent user edits.

Default: preview. --apply: disable shell additions. --terminal: also revert
Terminal's default/startup profile pointers if still set to Pixel Meadow.
Does not remove packages, history, navigation databases, or backup files.
"""
import argparse
import json
from pathlib import Path
import re
import shutil
import subprocess
from datetime import datetime

START = '# >>> pixel-shell >>>'
END = '# <<< pixel-shell <<<'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--apply', action='store_true')
parser.add_argument('--terminal', action='store_true')
parser.add_argument('--backup', type=Path, help='Original backup directory; defaults to installed backup reference')
args = parser.parse_args()
home = Path.home()
ref = home / '.config/pixel-shell/backup-path'
backup = args.backup or (Path(ref.read_text().strip()) if ref.exists() else None)
rc = home / '.zshrc'
raw = rc.read_text() if rc.exists() else ''
pattern = re.compile(r'(?m)\n?^' + re.escape(START) + r'\n.*?^' + re.escape(END) + r'\n?', re.S)
matches = list(pattern.finditer(raw))
if raw.count(START) != len(matches) or raw.count(END) != len(matches) or len(matches) > 1:
    raise SystemExit('Ambiguous markers in .zshrc; no files changed. Inspect the file manually.')
print('Shell:', 'remove managed .zshrc block' if matches else 'no managed block found')
if args.terminal:
    if not backup or not (backup / 'manifest.json').is_file():
        raise SystemExit('Terminal restore needs a valid original backup; use --backup PATH.')
    defaults = json.loads((backup / 'manifest.json').read_text())['terminal_defaults']
    for key, old in defaults.items():
        current = subprocess.run(['defaults', 'read', 'com.apple.Terminal', key], capture_output=True, text=True)
        if current.stdout.strip() == 'Pixel Meadow':
            print(f'Terminal: {key} -> {old or "(unset)"}')
            if args.apply:
                if old is None:
                    subprocess.run(['defaults', 'delete', 'com.apple.Terminal', key], check=True)
                else:
                    subprocess.run(['defaults', 'write', 'com.apple.Terminal', key, '-string', old], check=True)
        else:
            print(f'Terminal: keep current {key} (changed separately)')
if args.apply and matches:
    stamp = datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    saved = home / '.local/state/pixel-shell' / f'zshrc-before-rollback-{stamp}'
    saved.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(rc, saved)
    saved.chmod(0o600)
    updated = pattern.sub('', raw)
    temporary = rc.with_name('.zshrc.pixel-rollback.tmp')
    with temporary.open('x') as handle:
        handle.write(updated)
    shutil.copymode(rc, temporary)
    temporary.replace(rc)
    print('Saved current .zshrc:', saved)
print('Applied; open a fresh terminal window.' if args.apply else 'Preview only. Add --apply to make these changes.')
