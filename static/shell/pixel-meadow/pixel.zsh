# Meadow v2 — native zsh + maintained upstream tools; no font dependency.
[[ -o interactive && ${TERM:-dumb} != dumb && ${PIXEL_SHELL_DISABLE:-0} != 1 ]] || return

# Optional overrides survive updates. Set a flag to 1 to disable one module.
[[ -r "$HOME/.config/pixel-shell/local.zsh" ]] && source "$HOME/.config/pixel-shell/local.zsh"

typeset -g PIXEL_SHELL_HOME="$HOME/.config/pixel-shell"
typeset -g _pixel_brew=/opt/homebrew
[[ -d $_pixel_brew ]] || _pixel_brew=/usr/local

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
    alias l='eza --group-directories-first'
    alias ll='eza -lh --group-directories-first --time-style=long-iso'
    alias la='eza -lah --group-directories-first --time-style=long-iso'
    alias lt='eza --tree --level=2 --group-directories-first'
  }
  (( $+commands[bat] )) && alias c='bat --theme=ansi --paging=auto --style=numbers,changes,header'
  (( $+commands[dust] )) && alias usage='dust -d 2 -r'
  (( $+commands[duf] )) && alias disks='duf --only local --theme ansi'
  (( $+commands[btop] )) && alias monitor='btop --config "$HOME/.config/pixel-shell/btop.conf"'
  (( $+commands[fastfetch] )) && alias sysinfo='fastfetch --config "$HOME/.config/pixel-shell/fastfetch.jsonc" --structure os:host:kernel:uptime:shell:terminal:cpu:gpu:memory:swap:disk:battery'
  # Full status is an explicit request; the prompt and ordinary listings stay fast.
  alias gs='git status --short --branch --untracked-files=no --ignore-submodules=all'
fi

# [fzf] Safe shell integration provided by upstream; previews treat names as data.
if [[ ${PIXEL_DISABLE_FZF:-0} != 1 ]] && (( $+commands[fzf] )); then
  export FZF_DEFAULT_OPTS='--height=55% --layout=reverse --border=sharp --info=inline --color=bg+:8,fg:7,fg+:15,hl:6,hl+:6,pointer:2,marker:5,spinner:2,header:2,prompt:2'
  if (( $+commands[fd] )); then
    export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git'
    export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
    export FZF_ALT_C_COMMAND='fd --type d --hidden --exclude .git'
  fi
  if (( $+commands[bat] )); then
    export FZF_CTRL_T_OPTS='--preview "bat --theme=ansi --color=always --style=numbers --line-range=:200 -- {}" --preview-window=right,55%,border-left'
  fi
  if (( $+commands[eza] )); then
    export FZF_ALT_C_OPTS='--preview "eza --tree --level=2 --color=always -- {}"'
  fi
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
