---
title: "macOS zsh 实用改造手册：清晰字体、快速提示符与系统查询"
date: 2026-11-11 09:28:04
tags:
  - 终端
categories:
  - 技术
description: "基于 Starship、zsh-users、fzf 和 Fastfetch，保留轻量交互，修复大仓库提示符延迟，并记录使用、清理与回退方法。"
updated: 2026-11-12 14:57:03
---

这篇文章记录本机的 shell 改造，也作为使用和回退手册。**当前版本为 Meadow v2：使用系统 SF Mono 13 pt，提示符只显示路径、Git 分支、虚拟环境与必要状态，开启终端时显示操作系统对应的小型 ASCII 图标。**

2026 年 11 月 11 日的第一版尝试了 Monocraft 像素字体和自动 Git 状态统计。实际使用发现字体偏大、辨识度不足，进入 Mega 这样的大仓库还会出现 Starship 调用 Git 超时。因此本次回退字体，并把工作区扫描从日常提示符中移除。文章地址、配置目录和 Terminal 描述文件名称沿用旧值，避免破坏已有入口；名称里的 Pixel Meadow 不再代表使用像素字体。

## 先让新配置生效

**保存工作后，完全退出 Terminal，再重新打开。** 字体属于终端应用的设置，已经打开的窗口可能缓存旧字体；仅执行 `source ~/.zshrc` 无法改变这个窗口的字体。若系统仍显示旧字体，可打开随文提供的 [Terminal 描述文件](/shell/pixel-meadow/Pixel%20Meadow.terminal)，在设置中选择 Pixel Meadow。该文件现在使用 SF Mono 13 pt，并开启抗锯齿。

```sh
pixel-help          # 快捷键和命令速查
ll                  # 可读的文件大小、权限和时间；不查询 Git
lt                  # 两层目录树
c README.md         # 代码高亮、行号和分页阅读
usage .             # 目录空间分布
disks               # 文件系统容量和剩余空间
monitor             # 运行状态面板；q 退出
sysinfo             # 完整机器摘要和当前操作系统的图标
gs                  # 主动查看已跟踪文件的 Git 状态
```

## 这次保留哪些开源基础

shell 仍是 macOS 自带的 `/bin/zsh`。交互层采用维护成熟的上游组件，个性化部分集中在一份配置里：

| 基础 | 职责 | 本次配置 |
| --- | --- | --- |
| [Starship](https://starship.rs/config/) | 提示符框架 | 路径、分支、虚拟环境、退出码、长命令耗时 |
| [zsh-users](https://github.com/zsh-users) | 补全、灰字建议、语法着色 | 保留三个插件，按官方顺序加载 |
| [fzf 官方集成](https://github.com/junegunn/fzf#setting-up-shell-integration) | 历史、文件与目录选择 | 使用上游按键，接入 fd、bat 和 eza 预览 |
| [zoxide](https://github.com/ajeetdsouza/zoxide) | 按访问记录跳转目录 | 新增 `z`、`zi`，普通 `cd` 不变 |
| [Fastfetch](https://github.com/fastfetch-cli/fastfetch/wiki/Configuration) | 系统信息和 OS 图标 | 登录终端显示小图标，完整摘要按需查看 |

没有新增包管理层。13 个直接安装的 Homebrew formula 都仍有实际用途：

```text
starship
zsh-autosuggestions  zsh-syntax-highlighting  zsh-completions
fzf  fd  zoxide  eza  bat  btop  duf  dust  fastfetch
```

它们的依赖 `libgit2`、`libssh2`、`oniguruma`、`yyjson` 继续被保留的工具使用。第一版安装的 `font-monocraft` 已卸载。原先就有的 ncdu、ripgrep、tree 等没有在这次清理中卸掉。

## 1. 字体和外观回档

| 设置 | 第一版 | 当前 |
| --- | --- | --- |
| 字体 | Monocraft 像素字体 | 系统 SF Mono，即 `SFMono-Regular` |
| 字号 | 16 pt | 13 pt |
| 字体抗锯齿 | 关闭 | 开启 |
| 配色 | 深绿底、绿青紫点缀 | 保留 |
| 光标 | 不闪烁的方块 | 保留 |
| Option 键 | 发送 Meta/Esc | 保留，支持 Option-C 等按键 |
| 额外字体包 | Monocraft | 无 |

Terminal 的 Basic 描述文件仍保留原样。这里只修改了自己的 Pixel Meadow 描述文件，不安装 Nerd Font，提示符符号使用普通字符。

**单独回退或调整：**在 Terminal → 设置 → 描述文件 → 文本中选择字体和字号；想回到系统原来的外观，可以把默认和启动描述文件都切回 Basic。字体不由 zsh 控制。

## 2. 修复进入大 Git 仓库时的停顿

第一版的提示符包含 `$git_status`。进入仓库后，`cd` 本身已经完成，但提示符还在等待工作区和 Git 状态查询，表现为输入下一条命令前长时间没有响应，并可能打印：

```text
[WARN] - (starship::utils): Executing command "/usr/bin/git" timed out.
```

本次删除格式中的 `$git_status`，并显式设置：

```toml
format = '$directory$git_branch$python$cmd_duration$status$line_break$character'

[directory]
truncate_to_repo = false

[git_status]
disabled = true
```

`command_timeout` 仍保持 500 ms。性能改进来自移除每次提示符绘制时的完整状态查询，没有通过延长等待时间或屏蔽日志来处理警告。Git 分支显示仍然保留。[Starship 官方说明](https://starship.rs/config/#git-status)列出了 `git_status` 的状态查询职责和配置方式。

现在的提示符示意：

```text
job/proj/mega git:main
>>
```

失败时显示退出码并把 `>>` 变红；超过两秒的命令显示耗时；激活 Python 虚拟环境时显示环境名。不会在每条命令后自动查询 CPU、内存或完整 Git 状态。

文件列表也做了同样的精简：`ll`、`la` 不再带 eza 的 `--git` 参数。需要查 Git 时明确调用：

```sh
gs                   # 已跟踪文件；跳过未跟踪文件和子模块检查
git status           # 完整状态，包括新文件与子模块
```

`gs` 等价于 `git status --short --branch --untracked-files=no --ignore-submodules=all`，因此**不能用它判断是否有新文件尚未加入 Git**。完整状态查询仍可能随仓库规模花费较长时间，但发生在主动请求时。

**单独回退：**编辑 `starship.toml` 重新加入 `$git_status` 并取消禁用即可；大仓库会重新承担查询成本。只想关闭整个提示符，则在 `local.zsh` 中设 `PIXEL_DISABLE_PROMPT=1`。

## 3. 开启终端时显示系统标识

登录式交互终端会运行一次 Fastfetch，自动选择当前系统的小型 ASCII 图标：macOS 使用对应的 Apple 图案；迁移到受支持的 Linux 发行版后，由 Fastfetch 选择发行版图案。不是固定写死一张像素图片。

开屏只显示 OS、内核、运行时长、shell、CPU 和内存，不配置联网查询。普通非登录子 shell 和不连接输出终端的脚本不会显示。要查看机型、GPU、磁盘、电池等更多信息，运行 `sysinfo`。

```sh
sysinfo
```

这是主动运行的瞬时摘要。实时变化则使用 `monitor`。传感器或硬件指标是否完整取决于系统与工具支持，不为显示额外数据而启用 sudo。

**单独关闭：**在 `~/.config/pixel-shell/local.zsh` 写入 `PIXEL_DISABLE_BANNER=1`，然后打开新 shell。`sysinfo` 仍然可用。

## 4. 补全、历史与编辑快捷键

Tab 补全使用 zsh 自带 compinit 和 zsh-completions，保留权限检查、菜单选择及宽松的大小写匹配。灰字建议来自 [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)，语法着色来自 [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting)。灰字不会自己执行，在行尾按右箭头接受后仍需回车。

| 按键 | 操作 |
| --- | --- |
| Tab | 补全并选择候选项 |
| `↑` / `↓` | 根据已输入的前缀找历史；多行输入保留上下移动 |
| `Ctrl-R` | 模糊搜索历史，回车放回输入行，再次回车执行 |
| `Ctrl-T` | 选择文件，右侧预览前 200 行；回车插入转义后的路径，Tab 可多选 |
| `Option-C` | 预览并选择目录，回车直接进入；也可依次按 Esc、c |
| `Ctrl-A` / `Ctrl-E` | 行首 / 行尾 |
| `Ctrl-U` / `Ctrl-K` | 剪切光标前 / 后的内容 |
| `Ctrl-W` / `Ctrl-Y` | 剪切前一词 / 粘回剪切内容 |
| `Ctrl-L` | 清屏 |
| `Option-B` / `Option-F` | 按词移动 |

文件枚举使用 fd，包含隐藏文件、排除 `.git`，并保留默认 ignore 规则。临时查找被忽略的文件可运行 `fd --hidden --no-ignore --exclude .git | fzf`。路径有空格、中文或单引号时，预览和插入会按数据处理路径。

历史沿用原文件，内存和保存容量均为 50,000 条，开启去重与跨窗口共享。行首加空格会让该条命令不进入 zsh 历史；这不会改变程序本身的日志行为。

**单独回退：**在 `local.zsh` 中分别设置 `PIXEL_DISABLE_COMPLETION`、`PIXEL_DISABLE_KEYS`、`PIXEL_DISABLE_HISTORY`、`PIXEL_DISABLE_FZF`、`PIXEL_DISABLE_AUTOSUGGEST` 或 `PIXEL_DISABLE_HIGHLIGHT` 为 `1`。删除、注释或改为 `0` 则恢复。保存后新开窗口，避免在已经加载插件的窗口反复 source。

第一版曾将 `/opt/homebrew/share` 从 775 改为 755，使 compinit 权限检查通过；本次保留该设置，不绕过审计。需要重建补全缓存时，只处理 `~/.cache/pixel-shell/` 下对应的 zcompdump。

### 关闭错误按键的闪屏反馈（2026-11-12）

空输入行按下方向键、查找不存在的历史或补全没有匹配项时，保持输入行不动，不鸣响、不闪屏。zsh 配置加入：

```zsh
unsetopt BEEP HIST_BEEP LIST_BEEP
```

同时关闭 Terminal 的 Pixel Meadow 描述文件中的声音铃声与视觉铃声（`Bell = false`、`VisualBell = false`），避免其他程序发出的铃声触发整窗闪烁。命令真正执行失败时，错误文字和退出码照常显示。

新 shell 自动生效；已经打开的窗口可以直接运行上面的 `unsetopt` 命令，无需重载全部插件。若要恢复，删除配置中的这一行，并在新 shell 中使用 `setopt BEEP HIST_BEEP LIST_BEEP`；Terminal 的视觉/声音铃声可在描述文件的高级设置中重新开启。

## 5. 目录、代码和系统查询

| 命令 | 作用 | 使用与退出 |
| --- | --- | --- |
| `z blog` / `zi blog` | 按访问记录跳转 / 选择目录 | 首次先正常 cd 一次 |
| `..` / `...` | 上一级 / 上两级 | 普通 cd 语义不变 |
| `mkcd "notes/新目录"` | 创建目录并进入 | 含空格时加引号 |
| `l` / `ll` / `la` | 普通 / 详细 / 包含隐藏文件的 eza 列表 | 不查询 Git |
| `lt [目录]` | 两层目录树 | 限制输出深度 |
| `c 文件` | bat 高亮、行号和分页 | q 退出分页；`--paging=never` 禁止分页 |
| `usage [目录]` | dust 空间树和占比 | 等价于 `dust -d 2 -r` |
| `disks` | duf 本地文件系统表格和容量条 | 等价于 `duf --only local --theme ansi` |
| `monitor` | btop 的 CPU、内存、网络、磁盘、进程面板 | 两秒刷新，q 退出 |
| `sysinfo` | 完整机器摘要 | 使用自动 OS 图标 |
| `ncdu -r 目录` | 原先已安装的只读空间浏览器 | q 退出 |

```sh
usage ~/Downloads
dust -F -n 15 .               # 查看大文件
duf /System/Volumes/Data      # 查看用户数据卷
c --paging=never ~/.zshrc
```

注意 dust 的 `-d 2` 只限制显示层数，统计仍会递归扫描。APFS 卷可能共享容器空间，快照和克隆也会影响目录占用的解释，不能简单把多个卷的容量相加。

原生命令 `ls`、`cat`、`cd`、`du`、`df`、`top`、`find` 都保留。**关闭这些辅助命令：**设置 `PIXEL_DISABLE_HELPERS=1`，或删除对应别名；关闭 zoxide 则设置 `PIXEL_DISABLE_ZOXIDE=1`。zoxide 数据位于 `~/.local/share/zoxide/`，不随关闭模块而删除。

## 6. 减少 shell 初始化的重复工作

本机原先连续执行 `pyenv init --path` 和 `pyenv init -`，并在每次开 shell 时重复重建 Python/Ruby shims。本次合并为：

```zsh
eval "$(pyenv init - --no-rehash zsh)"
eval "$(rbenv init - --no-rehash zsh)"
```

shims 路径、版本选择、`pyenv shell` 和 `rbenv shell` 的交互函数仍保留。新装命令若尚未出现在 shims 中，主动运行 `pyenv rehash` 或 `rbenv rehash` 即可。[rbenv 官方文档](https://github.com/rbenv/rbenv#how-rbenv-hooks-into-your-shell)也说明了 `--no-rehash` 的用途；pyenv 参数同时按本机 `pyenv init --help` 核对。

另外把原先的 `export export GPG_TTY=$(tty)` 修正为仅在输入为 TTY 时设置：

```zsh
if [[ -t 0 ]]; then
  export GPG_TTY=$(tty)
fi
```

**回退这些原有配置的优化：**恢复为之前的两条 pyenv 初始化语句、去掉 rbenv 的 `--no-rehash`；完整改前文件保存在本次备份的 `zshrc-before`。这几处在原有 `.zshrc` 内，移除 Meadow 加载块不会自动撤销它们。

## 文件、开关与清理记录

当前新增配置集中在 `~/.config/pixel-shell/`：

```text
pixel.zsh             模块初始化和工具别名
local.zsh             个人开关，pixel-config 打开它
starship.toml         精简提示符
fastfetch.jsonc       自动 OS 图标和开屏摘要
btop.conf             monitor 专用配置
help.txt              pixel-help 速查
rollback.py           仍然有用的回退脚本
backup-path           第一版原始备份引用
Brewfile               当前仍使用的直接依赖
Pixel Meadow.terminal SF Mono 13 pt 的可导入描述文件
```

本次清理了：

- 不再使用的 `font-monocraft` cask 和用户字体文件。
- 配置附件中的旧 `install.py` 和 `make-terminal.swift`，不再维护额外的一次性安装/生成流程。
- 上一轮 `/tmp/pixel-shell-work/` 中约 192 MB 的临时脚本、原始日志和测试文件。
- 提示符的 Git 状态展示，以及普通列表中隐含的 Git 查询。

所有仍在使用的工具、配置和回退脚本保留。没有执行全局 `brew autoremove` 或卸载系统原有开发工具。回退备份属于有意保留的恢复依据，不参与临时文件清理。

## 回退与重新部署

### 临时绕开配置

```sh
PIXEL_SHELL_DISABLE=1 /bin/zsh -l
/bin/zsh -f
```

第一条保留原有环境，只跳过 Meadow；第二条跳过用户 `.zshrc` 等常规启动文件，但仍会读取 zshenv。它们不卸载软件。

### 永久停止加载 Meadow

```sh
python3 ~/.config/pixel-shell/rollback.py          # 只预览
python3 ~/.config/pixel-shell/rollback.py --apply  # 备份当前文件后移除标记块
```

回退脚本只处理 `.zshrc` 中 `# >>> pixel-shell >>>` 到 `# <<< pixel-shell <<<` 的块，保留其他设置和后续个人编辑。`--terminal --apply` 还可以把仍指向 Pixel Meadow 的默认/启动描述文件恢复成第一版之前的 Basic。Terminal 正在运行时可能缓存偏好，图形界面选回 Basic 最直接。

### 找到两个版本的备份

- 第一版之前：`~/.local/state/pixel-shell/backups/20261111-091237/`。
- 本次修改之前：`~/.local/state/pixel-shell/backups/20261111-095827-v2/`，包含 `zshrc-before`、`config-before/`、Terminal 偏好、包清单差集及性能记录。

这些是本机私有备份，没有随博客上传。如果要精确回到本次修改前的 `.zshrc`，先保留当前文件，再复制备份：

```sh
cp -p ~/.zshrc ~/.zshrc.before-manual-restore
cp -p ~/.local/state/pixel-shell/backups/20261111-095827-v2/zshrc-before ~/.zshrc
```

这会覆盖本次修改后在 `.zshrc` 中追加的个人设置。`config-before/` 可逐个取回旧模块；旧提示符也会重新带回大仓库状态查询。如果确实需要旧像素字体，可以重新安装 `brew install --cask font-monocraft`；通常直接在 Terminal 中选择 SF Mono 的合适字号更实用。

第一版权限改动的原值在原始备份的 `permissions-before.json` 中。恢复 775 会重新触发组写权限检查问题，因此保留 755 更合适。需要完整恢复 Terminal 偏好时，应先退出 Terminal，并注意整个快照会覆盖后来的终端设置。

### 配置下载和在其他机器上使用

[完整配置包](/shell/pixel-meadow.zip)、[校验清单](/shell/pixel-meadow/SHA256SUMS)、[shell 配置](/shell/pixel-meadow/pixel.zsh)、[提示符配置](/shell/pixel-meadow/starship.toml)、[速查表](/shell/pixel-meadow/help.txt)、[回退脚本](/shell/pixel-meadow/rollback.py)均已更新为 v2。

解压后阅读配置和 README，再安装依赖并复制文件；不要覆盖已经存在的 `local.zsh`：

```sh
brew bundle --file=Brewfile
mkdir -p ~/.config/pixel-shell
cp pixel.zsh starship.toml fastfetch.jsonc btop.conf help.txt rollback.py Brewfile "Pixel Meadow.terminal" ~/.config/pixel-shell/
```

首次配置时，另存自己的 `.zshrc`，创建 `local.zsh`，然后只追加一次：

```zsh
# >>> pixel-shell >>>
if [[ ${PIXEL_SHELL_DISABLE:-0} != 1 && -r "$HOME/.config/pixel-shell/pixel.zsh" ]]; then
  source "$HOME/.config/pixel-shell/pixel.zsh"
fi
# <<< pixel-shell <<<
```

已经使用第一版的机器直接替换模块文件即可，不再追加第二个入口。全新机器如果没有本机的 `backup-path`，回退脚本仍可移除加载块，但 Terminal 的默认描述文件应自行切回之前的选择。其他机器不应照搬本机的 Python/Ruby 初始化或权限修改。

## 本次验证与测量

测量均在本机 Apple Silicon、macOS 26.3、zsh 5.9 上进行，每组五次，取中位数：

| 检查 | 第一版 | 当前 v2 |
| --- | --- | --- |
| 在真实 Mega 仓库绘制 Starship 提示符 | 534.0 ms，复现 Git 超时警告 | 22.9 ms，无警告 |
| 交互 shell 初始化，v2 包含 OS 开屏摘要 | 476.9 ms | 270.3 ms |
| 实际 `cd proj/mega` 至输入行准备好 | 未测量 | 59.6 ms，无警告 |

第一行只测提示符渲染，第二行测初始化且不包含首次完整提示符绘制，第三行包含真实 cd、目录钩子和提示符，三种数据不能混为同一种指标。结果是本机测量，不代表所有仓库和设备的性能。

另外核对了：自动 macOS 小图标、fzf/灰字/高亮函数仍加载、`ll/la` 没有 Git 查询参数、原先选择的 Python/Ruby/Java 命令和版本保持一致、SF Mono 13 pt 偏好已写入、Monocraft 和旧临时目录已清理。图标的 Linux 自动选择沿用 Fastfetch 官方能力，本次没有在 Linux 实机运行验证。

Terminal 字体设置已写入并读回确认；当前工具不能读取 Terminal 的图形界面，故没有宣称完成实际窗口截图验收。最终字号和抗锯齿观感，以退出并重开 Terminal 后的显示为准。
