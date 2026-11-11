---
title: "把 macOS 原生 zsh 改造成像素工作台：配置、使用与回退手册"
date: 2026-11-11 09:28:04
tags:
  - "macOS"
  - "zsh"
  - "效率工具"
  - "像素风"
categories:
  - "技术实践"
description: "保留系统 zsh，加入像素主题、补全、历史搜索与系统监控；逐项记录配置、使用方法、验证结果和回退步骤。"
updated: 2026-11-11 09:30:06
---

这次在 macOS 自带的 `/bin/zsh` 上，整理了一套叫 **Pixel Meadow** 的日常终端配置：像素字体、草绿色提示符、灰字建议、模糊搜索，以及更直观的磁盘和进程面板。这篇文章同时是本机的更改记录、使用说明和回退手册。

配置完成日期为 **2026 年 11 月 11 日**。本机是 Apple Silicon，系统为 macOS 26.3，zsh 5.9，Homebrew 位于 `/opt/homebrew`。检查发现原来已有 Python、Ruby、Java 等工具添加的 PATH 和初始化语句，因此是在现有配置末尾追加入口，保留这些环境。

## 先用起来

**打开一个新的 Terminal 窗口**，新配置就会加载。已有窗口保留原先状态；需要更新时直接新开窗口，比反复 `source ~/.zshrc` 更容易避免重复初始化。

```sh
pixel-help          # 随时查看快捷键和命令
ll                  # 带文件大小、时间和 Git 状态的目录列表
lt                  # 两层目录树
c README.md         # 有语法高亮和行号的文件预览
usage .             # 当前目录由谁占空间
disks               # 本地文件系统还剩多少空间
monitor             # CPU、内存、网络、磁盘和进程；q 退出
sysinfo             # 一屏机器摘要和像素图案
```

还可以试试：输入一部分旧命令后按右箭头、按 `Ctrl-R` 查历史、按 `Ctrl-T` 选文件，或用 `z blog` 回到访问过的博客目录。

## 更改清单与文件位置

所有新增 shell 配置集中放在 `~/.config/pixel-shell/`。`~/.zshrc` 只追加一个带边界标记的加载块：

```zsh
# >>> pixel-shell >>>
if [[ ${PIXEL_SHELL_DISABLE:-0} != 1 && -r "$HOME/.config/pixel-shell/pixel.zsh" ]]; then
  source "$HOME/.config/pixel-shell/pixel.zsh"
fi
# <<< pixel-shell <<<
```

| 项目 | 实际改动 | 体验变化 | 单独回退入口 |
| --- | --- | --- | --- |
| 像素外观 | 安装 Monocraft；新增 Terminal 的 Pixel Meadow 描述文件 | 像素字形、深绿底、绿青紫色点缀、方块光标 | Terminal 设置中切回 Basic |
| 提示符 | Starship 加载专用 `starship.toml` | 当前路径、Git、退出码、长命令耗时 | `PIXEL_DISABLE_PROMPT=1` |
| 历史 | 扩大容量、跨窗口共享、去重、忽略行首空格 | 少重复输入，多个窗口共用历史 | `PIXEL_DISABLE_HISTORY=1` |
| 补全 | zsh-completions 与 zsh 自带 compinit | Tab 菜单、参数补全、大小写宽松匹配 | `PIXEL_DISABLE_COMPLETION=1` |
| 编辑键 | Emacs 按键、上下键按前缀找历史 | 长命令编辑更顺手 | `PIXEL_DISABLE_KEYS=1` |
| 灰字建议 | zsh-autosuggestions | 从历史预测后续内容，右箭头接受 | `PIXEL_DISABLE_AUTOSUGGEST=1` |
| 输入高亮 | zsh-syntax-highlighting | 命令、参数和路径在输入时着色 | `PIXEL_DISABLE_HIGHLIGHT=1` |
| 模糊选择 | fzf，配合 fd、bat、eza | 历史搜索、文件预览、目录选择 | `PIXEL_DISABLE_FZF=1` |
| 目录跳转 | zoxide 的 `z`、`zi` | 记住常去目录，按关键词跳转 | `PIXEL_DISABLE_ZOXIDE=1` |
| 查看工具 | eza、bat、dust、duf、btop、fastfetch 及新别名 | 文件、代码、磁盘和运行状态更直观 | `PIXEL_DISABLE_HELPERS=1`，或只删除对应别名 |
| 补全权限 | `/opt/homebrew/share` 从 775 改为 755 | compinit 权限检查能够通过 | 原权限已记录，见回退章节 |

没有安装 shell 框架或插件管理器；所有插件都来自 Homebrew。安装了 13 个直接 formula：

```text
starship                  1.26.0
zsh-autosuggestions       0.7.1
zsh-syntax-highlighting   0.8.0
zsh-completions           0.36.0
fzf                       0.74.5
fd                        10.5.0
zoxide                    0.10.0
eza                       0.23.5
bat                       0.26.1
btop                      1.4.7
duf                       0.9.1
dust                      1.2.6
fastfetch                 2.69.0
```

字体为 `font-monocraft 4.2.1`。Homebrew 另外安装了 `libgit2`、`libssh2`、`oniguruma`、`yyjson` 四个依赖；本次没有升级原有软件或清理已有包。机器原先已有的 `ncdu`、`ripgrep`、`tree` 等继续保留。

```text
~/.config/pixel-shell/
  pixel.zsh           # 模块初始化、快捷键和工具别名
  local.zsh           # 自己的开关；日后改这里
  starship.toml       # 专用提示符主题
  btop.conf           # monitor 的专用配置
  fastfetch.jsonc     # sysinfo 的专用配置
  help.txt            # pixel-help 的速查表
  rollback.py         # 默认只预览的回退脚本
  backup-path         # 本机原始备份位置
  Brewfile            # 直接依赖清单
  Pixel Meadow.terminal
```

Starship、btop、fastfetch 都使用显式指定的配置文件，不需要占用各工具原本的默认配置。`ls`、`cat`、`cd`、`du`、`df`、`top`、`find` 的名称与原有行为保持不变，脚本仍可以调用系统工具。

## 1. 像素外观与提示符

Terminal 新增并默认选择了 **Pixel Meadow**，同时设置为启动时使用的描述文件。原有的 Basic 和其他描述文件仍在。

- 字体：Monocraft，16 pt，关闭字体抗锯齿，保留清晰像素边缘。
- 背景：`#141d19`，正文：`#d9e4d5`；绿色、青色、紫色用于区分提示信息。
- 光标：不闪烁的方块；初始窗口为 110 列、32 行。
- Option 键发送 Meta/Esc，便于使用 `Option-C` 和按词移动。
- 使用标准 ANSI 色号；提示符不依赖 Nerd Font 图标，也不强制设置 `COLORTERM=truecolor`。

Monocraft 是受 Minecraft 字体启发的等宽编程字体。中文字符会使用系统回退字体，因此中文部分不保证统一呈现像素字形。字体与安装方式见 [Monocraft 项目](https://github.com/IdreesInc/Monocraft) 和 [Homebrew cask](https://formulae.brew.sh/cask/font-monocraft)。

提示符大致如下，这只是显示示意：

```text
+ blog git:main !1 ?2 took 3s exit:1
>>
```

`!1` 表示一项已修改内容，`?2` 表示两项未跟踪内容；暂存、删除、stash、领先或落后远端也有对应提示。失败后 `>>` 变红并显示退出码；超过两秒的命令显示耗时。激活 Python 虚拟环境时显示环境名。没有把 CPU、天气或机器摘要塞进每一次提示符。

想调色或精简模块，编辑 `~/.config/pixel-shell/starship.toml`。耗时阈值是 `[cmd_duration]` 的 `min_time = 2000`；格式和模块定义可查 [Starship 官方配置说明](https://starship.rs/config/)。

**回退这一项：**在 Terminal → 设置 → 描述文件中选择 Basic 并设为默认；“通用”中的启动描述文件也切回 Basic。只关闭提示符则在 `local.zsh` 写入 `PIXEL_DISABLE_PROMPT=1`。字体可以暂时保留，确认不用后再卸载 `font-monocraft`。

## 2. 补全、历史、灰字建议与输入高亮

现在按 Tab 会出现可选择的补全菜单，可用 Tab 或方向键选择，回车确认。匹配允许忽略大小写，并放宽部分路径片段的匹配。

历史容量设为内存 50,000 条、保存 50,000 条；沿用已有历史文件，开启去重、时间记录和跨窗口共享。**行首加一个空格的命令不会写入 zsh 历史**，但这不影响程序自身日志或其他记录方式。

输入时，光标后可能出现灰色的历史建议。在行尾按右箭头接受；接受以后仍要按回车才执行。这一行为来自 [zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions)。输入高亮由 [zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) 提供，加载顺序放在其他插件和按键初始化之后。颜色表示语法和命令识别状态，不代表命令执行一定成功。

| 按键 | 用法 |
| --- | --- |
| `↑` / `↓` | 输入 `git` 后，按前缀浏览历史；多行命令中保留上下移动能力 |
| `Ctrl-A` / `Ctrl-E` | 移到行首 / 行尾 |
| `Ctrl-U` / `Ctrl-K` | 剪切光标前 / 后的内容 |
| `Ctrl-W` | 剪切前一个单词 |
| `Ctrl-Y` | 粘回刚才剪切的内容 |
| `Ctrl-L` | 清屏 |
| `Option-B` / `Option-F` | 按词向前 / 向后移动 |

**回退这一项：**在 `local.zsh` 分别启用 `PIXEL_DISABLE_HISTORY`、`PIXEL_DISABLE_COMPLETION`、`PIXEL_DISABLE_KEYS`、`PIXEL_DISABLE_AUTOSUGGEST` 或 `PIXEL_DISABLE_HIGHLIGHT` 开关，然后打开新窗口。关闭历史模块会恢复原先的选项行为，但不会删除已经写入的历史；原历史内容没有被清空。

补全初次加载会生成 `~/.cache/pixel-shell/zcompdump-5.9`。本机原有 `/opt/homebrew/share` 为 775，compinit 因组写权限拒绝初始化。本次仅将这一个目录改为 755，没有递归修改 Homebrew，也没有绕过权限检查。原模式记在备份的 `permissions-before.json` 中。

## 3. 用 fzf 找历史、文件和目录

本次使用 [fzf 官方 zsh 集成](https://github.com/junegunn/fzf#setting-up-shell-integration)，没有额外安装 fzf 的第三方插件。

| 按键 | 操作 | 确认后的行为 |
| --- | --- | --- |
| `Ctrl-R` | 输入几个关键词，搜索历史命令 | 回车把命令放回输入行，再按一次回车才执行 |
| `Ctrl-T` | 模糊查找文件，右侧显示前 200 行代码 | 回车插入正确转义的路径；可先按 Tab 多选 |
| `Option-C` | 模糊选择目录，预览两层目录树 | 回车直接进入选中的目录 |
| `Esc` | 取消选择 | 返回 shell |

Option 键的行为取决于终端设置。本次 Terminal 描述文件已启用 Meta；其他终端没有配置时，可以依次按 `Esc`、`c` 来触发目录选择。

文件枚举使用 fd，包含隐藏文件、排除 `.git`，并保留 fd 默认的 ignore 规则。因而 `.gitignore` 中的文件不保证出现；临时需要忽略这些规则时，可以这样单次调用：

```sh
fd --hidden --no-ignore --exclude .git | fzf
```

预览使用 bat 和 eza。文件名含中文、空格或单引号时，路径按数据传入预览程序，而不是直接拼成命令。

**回退这一项：**在 `local.zsh` 写入 `PIXEL_DISABLE_FZF=1` 后打开新窗口，恢复没有这三个 fzf 按键的状态。只想去掉预览，可以删除 `pixel.zsh` 中 `FZF_CTRL_T_OPTS`、`FZF_ALT_C_OPTS` 的对应设置。fzf 本体仍然可以单独运行。

## 4. 常去目录交给 zoxide

[zoxide](https://github.com/ajeetdsouza/zoxide) 会在访问目录后积累记录，再按关键词匹配。首次没有记录时，先正常 `cd` 一次。

```sh
cd ~/Desktop/code/blog
cd ~
z blog                 # 回到之前访问过的 blog
zi blog                # 多个匹配时打开交互选择器
..                     # 上一级
...                    # 上两级
mkcd "notes/新目录"      # 创建目录并进入；路径有空格时加引号
```

普通 `cd` 的含义没有变化。zoxide 的默认本机数据库位于 `~/.local/share/zoxide/`，只积累目录访问记录，不上传这些记录。

**回退这一项：**启用 `PIXEL_DISABLE_ZOXIDE=1`，新开 shell 后停止加载 `z`、`zi` 和记录钩子。数据库可留作以后恢复使用；要纠正某个目录的记录，可以运行 `zoxide remove "目录路径"`。`..`、`...`、`mkcd` 属于 helpers 模块，需要关闭 helpers 或删除对应定义。

## 5. 文件和代码看得更清楚

| 命令 | 展示内容 | 适合的场景 |
| --- | --- | --- |
| `l` | 带颜色、目录优先的文件列表 | 日常浏览 |
| `ll` | 大小、权限、修改时间、Git 状态 | 判断哪个文件刚刚改过 |
| `la` | 在 `ll` 基础上包含隐藏文件 | 看 `.github`、`.gitignore` 等 |
| `lt [目录]` | 限制两层的目录树 | 快速熟悉项目结构 |
| `c 文件` | 语法高亮、行号、文件头和修改标记 | 阅读源码和配置 |

列表由 [eza](https://github.com/eza-community/eza) 提供，代码预览由 [bat](https://github.com/sharkdp/bat) 提供。长文件进入分页器后按 `q` 退出；`c --paging=never 文件` 可禁止分页。普通 `cat` 继续适合原样输出、管道或脚本。

**回退这一项：**删除 `pixel.zsh` 中相应别名，或者关闭整个 helpers 模块。新窗口中也可以直接调用 `eza`、`bat`，不会影响系统 `ls` 和 `cat`。

## 6. du、df、top 的直观搭档

### 目录空间：usage / dust

原来 `du -sh` 适合回答“总共多大”，而 `usage` 会显示树、大小和占比，方便找出最大的部分。

```sh
usage .                    # 等价于 dust -d 2 -r .
usage ~/Downloads
dust -d 3 -n 20 .          # 三层、最多显示 20 项
dust -F -n 15 .            # 关注占空间最大的文件
ncdu -r ~/Downloads        # 原先已有的 ncdu，只读交互浏览
/usr/bin/du -sh .          # 仍可使用原生命令
```

`-d 2` 只限制**显示层数**，不会把递归统计限制为两层；扫描很大的目录仍可能花时间。dust 是目录占用工具，APFS 的共享空间、快照和克隆也会使目录统计与文件系统剩余容量不能直接相减。具体选项可查 [dust 项目](https://github.com/bootandy/dust)。

### 文件系统容量：disks / duf

```sh
disks                      # 等价于 duf --only local --theme ansi
duf /System/Volumes/Data   # 查看存放用户数据的 APFS 卷
/bin/df -h                 # 原生视图
```

[duf](https://github.com/muesli/duf) 用表格和进度条展示总量、已用、可用和挂载点。macOS 会列出多个 APFS 卷，其中一些共享容器空间，不能把每一行当成独立硬盘后直接相加。

### 运行状态：monitor / btop

```sh
monitor
```

这里启动的是使用专用配置的 [btop](https://github.com/aristocratos/btop)：CPU 趋势、内存和交换区、网络吞吐、磁盘、进程列表集中在一屏。两秒刷新一次，进程默认按 CPU 使用情况排序，图表使用块状字符，关闭圆角与真彩色，便于配合 Terminal 的像素主题。按 `q` 退出。

它适合回答“此刻是 CPU 忙、内存紧张，还是某个进程在工作”。传感器、GPU 和磁盘 I/O 等指标是否可用，取决于 macOS 与工具支持；没有为了显示更多数据而配置 sudo 或提权运行。

### 机器摘要：sysinfo / fastfetch

```sh
sysinfo
```

[fastfetch](https://github.com/fastfetch-cli/fastfetch) 输出操作系统、机型、内核、运行时长、shell、终端、CPU、GPU、内存、交换区、磁盘和电池信息，左侧使用自定义方块像素图案。它只在主动运行时显示，避免每次开终端都刷一屏。

**回退这些工具：**可以只删掉 `usage`、`disks`、`monitor`、`sysinfo` 对应别名；或设置 `PIXEL_DISABLE_HELPERS=1`。回退 btop 的外观时直接运行 `btop`，不再指定本次的 `btop.conf`；回退机器摘要外观时直接运行 `fastfetch`。要回到熟悉的统计方式，随时运行 `du`、`df`、`top`。

## 个性化开关

运行 `pixel-config` 会用 `$EDITOR` 指定的编辑器打开 `local.zsh`，未设置编辑器时使用 vi。也可以手动打开：

```sh
open -t ~/.config/pixel-shell/local.zsh
```

例如只关闭灰字建议和提示符：

```zsh
PIXEL_DISABLE_AUTOSUGGEST=1
PIXEL_DISABLE_PROMPT=1
```

保存后**新开窗口**。设为 `1` 表示禁用；删除该行、注释该行或改成 `0` 表示恢复。开关控制下次 shell 是否加载模块，不会动态卸载当前窗口中已经注册的按键、别名和钩子。

## 回退手册

### 临时绕开新配置

```sh
PIXEL_SHELL_DISABLE=1 /bin/zsh -l
```

这会启动一个保留原有语言环境、跳过 Pixel Meadow 的新 shell。输入 `exit` 可以回到父 shell。如果 `.zshrc` 本身有语法错误，则使用：

```sh
/bin/zsh -f
```

`-f` 跳过用户 `.zshrc` 等启动文件，仍会读取系统和用户的 zshenv；适合进入后修复配置。它不会卸载软件或删除配置文件。

### 永久停止加载

脚本默认只展示计划，不修改文件：

```sh
python3 ~/.config/pixel-shell/rollback.py
python3 ~/.config/pixel-shell/rollback.py --apply
```

它只移除 `~/.zshrc` 中被标记的加载块，并先另存一份回退当时的 `.zshrc`。其他配置，包括后来追加的个人设置，都保留。脚本遇到不成对或重复标记时会停止，避免误删内容。

这一步不卸载软件、不删历史、不清理 zoxide 数据库，也不删除本次配置目录，因此以后仍可恢复。

### 同时恢复 Terminal 默认描述文件

```sh
python3 ~/.config/pixel-shell/rollback.py --terminal
python3 ~/.config/pixel-shell/rollback.py --terminal --apply
```

本机原先的默认与启动描述文件都是 **Basic**。只有当前指针仍为 Pixel Meadow 时，脚本才恢复对应旧值；如果后来自己选了别的主题，就保留那个选择。

Terminal 正在运行时可能缓存偏好。图形界面中回退最直接的方式是：Terminal → 设置 → 描述文件 → Basic → 默认，再把“通用”中的启动描述文件切回 Basic，之后新开窗口。脚本修改偏好时可从 Codex 的命令环境运行，并先退出 Terminal。回退默认指针不会修改已打开窗口的外观；Pixel Meadow 描述文件可以留着备用。

### 找到原始备份，或精确恢复旧文件

本次备份目录为：

```text
~/.local/state/pixel-shell/backups/20261111-091237/
```

也可以随时读取：

```sh
cat ~/.config/pixel-shell/backup-path
```

其中保存了原 `.zshrc`、`.zprofile`、`.zshenv`，已有相关配置的快照、Terminal 改造前的完整偏好、包清单、原权限、安装后版本和验证结果。**这些是本机私有备份，没有随文章发布。**

如果确实要恢复最初的 `.zshrc`，下面的方式会覆盖改造之后自己加进去的设置，执行前先另存当前文件：

```sh
cp -p ~/.zshrc ~/.zshrc.before-manual-restore
cp -p ~/.local/state/pixel-shell/backups/20261111-091237/files/.zshrc ~/.zshrc
```

通常优先用移除标记块的脚本。完整恢复 Terminal 偏好也会覆盖后来做过的终端设置；只有明确想要整个旧快照时，先退出 Terminal，再从其他命令环境执行：

```sh
defaults import com.apple.Terminal ~/.local/state/pixel-shell/backups/20261111-091237/Terminal-before.plist
```

若连 Homebrew 的原始目录权限也要恢复，本机记录的原值是 775，对应命令为 `chmod 775 /opt/homebrew/share`。这会重新带回 compinit 报告的组写权限问题，应在不再加载这些补全后再考虑恢复；一般保留当前 755 即可。

### 卸载新增软件

配置回退与卸载软件是两件事。确认以后没有其他用途时，可以卸载本次直接安装的工具：

```sh
brew uninstall starship zsh-autosuggestions zsh-syntax-highlighting zsh-completions fzf fd zoxide eza bat btop duf dust fastfetch
brew uninstall --cask font-monocraft
```

不要把本机原有的 ncdu、ripgrep 或其他工具一起卸掉。本次新增包的完整差集保存在备份的 `formulae-added.txt` 和 `casks-added.txt` 中。四个间接依赖只有在确认没有被其他软件使用后才考虑卸载；Homebrew 的依赖检查应保留，不使用 `--ignore-dependencies`，也不为了回退执行全局 `autoremove`。

## 配置下载与复用

- [完整配置包](/shell/pixel-meadow.zip)：配置、快捷键速查、安装与回退脚本、Terminal 描述文件、生成描述文件的 Swift 源码及 Brewfile。
- [Terminal 描述文件](/shell/pixel-meadow/Pixel%20Meadow.terminal)
- [shell 配置](/shell/pixel-meadow/pixel.zsh)、[提示符配置](/shell/pixel-meadow/starship.toml)、[速查表](/shell/pixel-meadow/help.txt)
- [安装脚本](/shell/pixel-meadow/install.py)、[回退脚本](/shell/pixel-meadow/rollback.py)、[Brewfile](/shell/pixel-meadow/Brewfile)

在另一台 macOS 上复用时，解压配置包，先阅读脚本，再在解压目录运行：

```sh
python3 install.py            # 先备份原配置，再追加加载入口
brew bundle --file=Brewfile   # 安装工具和字体
open "Pixel Meadow.terminal" # 导入描述文件，再到 Terminal 设置中选为默认
```

安装脚本不自动修改 Terminal 默认描述文件；这台机器的主题设置是在应用过程中单独完成的。它也不会自动修复其他机器的 Homebrew 权限；若出现 compinit 提示，先运行 `autoload -Uz compaudit; compaudit`，检查列出的具体目录，不直接照抄递归 chmod 命令。

## 验证记录与体验边界

本次已完成的检查包括：

- zsh、Python、TOML 配置解析及 Terminal plist 格式检查。
- 在真实用户环境验证加载入口、补全权限、模块、按键映射和原生命令的名称。
- 用独立历史文件的伪终端实际检查右箭头建议接受、Tab 补全、Ctrl-R 历史搜索、Ctrl-T 文件预览与插入、Option-C 目录选择；文件名包含中文、空格和单引号。
- btop 实际绘制运行面板，按 `q` 正常退出，退出码为 0。
- `ll`、代码预览、磁盘树、磁盘容量、机器摘要、中文与空格路径、zoxide 跳转正常执行。
- 在临时目录实际执行安装、预览和回退，确认后续用户编辑保留；两个救援入口正常。

启动耗时使用原始配置备份和新配置，在相同环境下交替测量五轮：

| 条件 | 原配置中位数 | 新配置中位数 | 增加 |
| --- | --- | --- | --- |
| 接入伪终端，完整初始化交互插件 | 385.9 ms | 463.4 ms | 77.5 ms |
| 不接 TTY，跳过 fzf 按键初始化 | 337.2 ms | 413.2 ms | 76.0 ms |

这衡量的是 shell 启动与初始化，不包含完整首次提示符绘制，也不能等同于键入延迟；初次生成补全缓存可能更慢。数据保存在本机备份的 `paired-benchmark.json`，属于这台机器上的一次测量，不是对其他设备的性能保证。

Terminal 的配置已写入并读回核对，包括 Monocraft 字体、16 pt 字号、颜色、Meta 键和默认描述文件。当前自动化工具禁止读取 Terminal 图形界面，因此**没有完成实际窗口的截图验收**。如果像素边缘或中文回退字体不合口味，可以在 Terminal 设置里调整字号与抗锯齿，或直接切回 Basic。
