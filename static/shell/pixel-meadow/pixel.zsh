# Meadow v2 — native zsh + maintained upstream tools; no font dependency.
[[ -o interactive && ${TERM:-dumb} != dumb && ${PIXEL_SHELL_DISABLE:-0} != 1 ]] || return

# Optional overrides survive updates. Set a flag to 1 to disable one module.
[[ -r "$HOME/.config/pixel-shell/local.zsh" ]] && source "$HOME/.config/pixel-shell/local.zsh"

typeset -g PIXEL_SHELL_HOME="$HOME/.config/pixel-shell"
typeset -g _pixel_brew=/opt/homebrew
[[ -d $_pixel_brew ]] || _pixel_brew=/usr/local

# The macOS helper is compiled once at install time, never at shell start.
typeset -g _meadow_local_bin=''
if [[ $OSTYPE == darwin* && ${PIXEL_ALLOW_MATERIALIZE:-0} != 1 && -x $PIXEL_SHELL_HOME/local-only ]]; then
  _meadow_local_bin="$PIXEL_SHELL_HOME/local-only"
fi
_meadow_local() {
  if [[ -n $_meadow_local_bin ]]; then
    command "$_meadow_local_bin" "$@"
  else
    # Without the macOS helper, discard its optional file prechecks.
    while [[ $1 == --check-file ]]; do
      (( $# >= 3 )) || return 2
      shift 2
    done
    command "$@"
  fi
}

# Ignore invalid editing/history/completion keys without a bell or screen flash.
unsetopt BEEP HIST_BEEP LIST_BEEP

# [history] Keep the existing history file, including macOS Terminal sessions.
if [[ ${PIXEL_DISABLE_HISTORY:-0} != 1 ]]; then
  HISTFILE=${HISTFILE:-$HOME/.zsh_history}
  HISTSIZE=50000
  SAVEHIST=50000
  setopt EXTENDED_HISTORY SHARE_HISTORY HIST_IGNORE_SPACE HIST_IGNORE_ALL_DUPS
  setopt HIST_SAVE_NO_DUPS HIST_REDUCE_BLANKS HIST_EXPIRE_DUPS_FIRST
fi

# [completion] Audit permissions normally; do not bypass compinit's checks.
if [[ ${PIXEL_DISABLE_COMPLETION:-0} != 1 ]]; then
  [[ -d $_pixel_brew/share/zsh-completions ]] && fpath=("$_pixel_brew/share/zsh-completions" $fpath)
  [[ -d $_pixel_brew/share/zsh/site-functions ]] && fpath=("$_pixel_brew/share/zsh/site-functions" $fpath)
  autoload -Uz compinit
  mkdir -p "$HOME/.cache/pixel-shell"
  compinit -d "$HOME/.cache/pixel-shell/zcompdump-$ZSH_VERSION"
  zmodload zsh/complist
  zstyle ':completion:*' menu select
  zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}' 'r:|[._-]=* r:|=*'
  zstyle ':completion:*' group-name ''
  zstyle ':completion:*:descriptions' format '%F{cyan}[%d]%f'
  zstyle ':completion:*' list-colors 'di=1;36' 'ln=35' 'ex=32'
fi

# [keys] Emacs editing plus prefix search with the arrow keys.
if [[ ${PIXEL_DISABLE_KEYS:-0} != 1 ]]; then
  bindkey -e
  autoload -Uz up-line-or-beginning-search down-line-or-beginning-search
  zle -N up-line-or-beginning-search
  zle -N down-line-or-beginning-search
  bindkey '^[[A' up-line-or-beginning-search
  bindkey '^[[B' down-line-or-beginning-search
  bindkey '^[OA' up-line-or-beginning-search
  bindkey '^[OB' down-line-or-beginning-search
  bindkey '^[[H' beginning-of-line
  bindkey '^[[F' end-of-line
  bindkey '^[[3~' delete-char
fi

# [helpers] Add new names; leave ls/cat/cd/du/df/top/find unchanged.
if [[ ${PIXEL_DISABLE_HELPERS:-0} != 1 ]]; then
  alias ..='cd ..'
  alias ...='cd ../..'
  mkcd() { (( $# == 1 )) || { print -u2 'usage: mkcd <directory>'; return 2; }; mkdir -p -- "$1" && cd -- "$1"; }
  (( $+commands[eza] )) && {
    alias l='_meadow_local eza --group-directories-first'
    alias ll='_meadow_local eza -lh --group-directories-first --time-style=long-iso'
    alias la='_meadow_local eza -lah --group-directories-first --time-style=long-iso'
    alias lt='_meadow_local eza --tree --level=2 --group-directories-first'
  }
  if (( $+commands[bat] )); then
    c() {
      local -a checks=()
      local last=${argv[-1]-}
      # The usual `c [options] FILE` form gets an explicit placeholder message.
      [[ -n $last && $last != '-' && $last != --* ]] && checks=(--check-file "$last")
      _meadow_local "${checks[@]}" bat --theme=ansi --paging=auto --style=numbers,header "$@"
    }
  fi
  if (( $+commands[dust] )); then
    usage() {
      local -a size=()
      if [[ $1 == --logical ]]; then
        shift
        size=(--apparent-size)
        print -ru2 -- 'Logical file size (includes known sizes of cloud-only files).'
      else
        print -ru2 -- 'Local disk blocks (cloud-only files may occupy little or no space).'
      fi
      _meadow_local dust -x -d 2 -r -n 25 "${size[@]}" "$@"
    }
  fi
  if (( $+commands[duf] )); then
    disks() {
      if [[ $1 == --all ]]; then
        shift
        command duf --only local --output mountpoint,avail,usage --theme ansi "$@"
      elif (( $# == 0 )); then
        if [[ $OSTYPE == darwin* && -d /System/Volumes/Data ]]; then
          local table
          table=$(command duf --only local --only-mp /System/Volumes/Data --theme ansi) || return
          if [[ -n $table ]]; then
            print -r -- "$table"
          else
            command /bin/df -h /System/Volumes/Data
          fi
        else
          command duf --theme ansi .
        fi
      else
        command duf --theme ansi "$@"
      fi
    }
  fi
  if [[ $OSTYPE == darwin* ]]; then
    cloudcheck() {
      (( $# <= 1 )) || { print -ru2 'usage: cloudcheck [DIR]'; return 2; }
      local directory=${1:-.}
      [[ $directory == /* ]] || directory=$PWD/$directory
      _meadow_local /usr/bin/find -P "$directory" -xdev -flags +dataless -print -prune
    }
  fi
  (( $+commands[btop] )) && alias monitor='btop --config "$HOME/.config/pixel-shell/btop.conf"'
  (( $+commands[fastfetch] )) && alias sysinfo='fastfetch --config "$HOME/.config/pixel-shell/fastfetch.jsonc" --structure os:host:kernel:uptime:shell:terminal:cpu:gpu:memory:swap:disk:battery'
  # Full status is an explicit request; the prompt and ordinary listings stay fast.
  alias gs='_meadow_local git --no-optional-locks status --short --branch --untracked-files=no --ignore-submodules=all'
fi

# [fzf] Safe shell integration provided by upstream; previews treat names as data.
if [[ ${PIXEL_DISABLE_FZF:-0} != 1 ]] && (( $+commands[fzf] )); then
  typeset _meadow_prefix=''
  [[ -n $_meadow_local_bin ]] && _meadow_prefix="${(q)_meadow_local_bin} "
  export FZF_DEFAULT_OPTS='--height=55% --layout=reverse --border=sharp --info=inline --color=bg+:8,fg:7,fg+:15,hl:6,hl+:6,pointer:2,marker:5,spinner:2,header:2,prompt:2'
  if (( $+commands[fd] )); then
    typeset _meadow_fd='--one-file-system -E .git -E node_modules -E target -E .venv -E .next -E .cache'
    typeset _meadow_home='--max-depth 4 -E /Library -E /.Trash'
    export FZF_CTRL_T_COMMAND="if [ \"\$PWD\" = \"\$HOME\" ]; then ${_meadow_prefix}fd --type f ${_meadow_fd} ${_meadow_home}; else ${_meadow_prefix}fd --type f --hidden ${_meadow_fd}; fi"
    export FZF_DEFAULT_COMMAND="$FZF_CTRL_T_COMMAND"
    export FZF_ALT_C_COMMAND="if [ \"\$PWD\" = \"\$HOME\" ]; then ${_meadow_prefix}fd --type d ${_meadow_fd} ${_meadow_home}; else ${_meadow_prefix}fd --type d --hidden ${_meadow_fd}; fi"
    unset _meadow_fd _meadow_home
  fi
  if (( $+commands[bat] )); then
    typeset _meadow_preview='bat --theme=ansi --color=always --paging=never --style=numbers --line-range=:200 -- {}'
    [[ -n $_meadow_prefix ]] && _meadow_preview="${_meadow_prefix}--check-file {} $_meadow_preview"
    export FZF_CTRL_T_OPTS="--preview ${(q)_meadow_preview} --preview-window=right,55%,border-left"
    unset _meadow_preview
  fi
  if (( $+commands[eza] )); then
    typeset _meadow_preview="${_meadow_prefix}eza --tree --level=2 --color=always -- {}"
    export FZF_ALT_C_OPTS="--preview ${(q)_meadow_preview}"
    unset _meadow_preview
  fi
  unset _meadow_prefix
  # fzf restores ZLE options; only initialize its widgets on a real terminal.
  [[ -t 0 ]] && eval "$(fzf --zsh)"
fi

# [zoxide] Learns directories as you visit them. z / zi are additional commands.
if [[ ${PIXEL_DISABLE_ZOXIDE:-0} != 1 ]] && (( $+commands[zoxide] )); then
  eval "$(zoxide init zsh)"
fi

# [autosuggestions] Right arrow accepts; suggestions never execute themselves.
if [[ ${PIXEL_DISABLE_AUTOSUGGEST:-0} != 1 && -r $_pixel_brew/share/zsh-autosuggestions/zsh-autosuggestions.zsh ]]; then
  ZSH_AUTOSUGGEST_HIGHLIGHT_STYLE='fg=8'
  ZSH_AUTOSUGGEST_STRATEGY=(history)
  source "$_pixel_brew/share/zsh-autosuggestions/zsh-autosuggestions.zsh"
fi

# [prompt] ASCII symbols work with the system monospace font.
if [[ ${PIXEL_DISABLE_PROMPT:-0} != 1 ]] && (( $+commands[starship] )); then
  export STARSHIP_CONFIG="$PIXEL_SHELL_HOME/starship.toml"
  eval "$(starship init zsh)"
  # Wrap the command substitutions installed by Starship, preserving its hooks.
  if [[ -n $_meadow_local_bin ]]; then
    [[ $PROMPT == '$('* ]] && PROMPT='$(_meadow_local '${PROMPT[3,-1]}
    [[ $RPROMPT == '$('* ]] && RPROMPT='$(_meadow_local '${RPROMPT[3,-1]}
  fi
fi

# [banner] Fastfetch chooses a small logo for the current OS. No network modules.
# Login shells with a real output terminal only; scripts and regular subshells stay quiet.
if [[ ${PIXEL_DISABLE_BANNER:-0} != 1 && -o login && -t 1 ]] && (( $+commands[fastfetch] )); then
  command fastfetch --config "$PIXEL_SHELL_HOME/fastfetch.jsonc"
fi

# Always keep syntax highlighting after widgets and other plugin initialization.
if [[ ${PIXEL_DISABLE_HIGHLIGHT:-0} != 1 && -r $_pixel_brew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh ]]; then
  source "$_pixel_brew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
fi

pixel-help() { command cat "$PIXEL_SHELL_HOME/help.txt"; }
pixel-config() { local -a editor; editor=("${(@Q)${(z)${EDITOR:-vi}}}"); "${editor[@]}" "$PIXEL_SHELL_HOME/local.zsh"; }
unset _pixel_brew
