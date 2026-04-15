# jira-cli

零依赖 Jira 命令行工具，内置 Claude Code Skill，让 AI 直接操作 Jira。

Zero-dependency Jira CLI with built-in Claude Code Skill for AI-driven issue workflows.

## 功能特性

- **零依赖** -- 纯 Node.js 实现，无需安装任何第三方包
- **多平台支持** -- 兼容 Jira Server、Data Center、Cloud
- **四种认证方式** -- Cookie（SSO）、用户名密码、邮箱 + API Token、Personal Access Token
- **macOS 自动读取 Chrome Cookie** -- 支持飞书 SSO、Okta、Azure AD 等企业登录，一条命令完成认证
- **内置 Claude Code Skill** -- 安装即获得 `jira-workflow` 技能，AI 自动读取问题、创建分支、修复代码、更新状态
- **中英文双语（i18n）** -- 根据系统 locale 或手动配置自动切换语言

## AI Coding 工具安装教程

本工具可配合 Claude Code、Cursor、Windsurf 等 AI coding 工具使用。安装后，AI 可以直接通过命令行操作 Jira。

### 方式一：npm 全局安装（推荐）

```bash
npm install -g jira-cli
```

公司内部 npm 源：

```bash
npm install -g jira-cli --registry=https://nexus.int.taou.com/repository/npm-hosted/
```

### 方式二：作为项目开发依赖

```bash
npm install --save-dev jira-cli
```

### 方式三：手动 clone + npm link

```bash
git clone https://github.com/fanxinqi/jira-cli.git
cd jira-cli
npm link
```

### 验证安装

安装完成后，运行以下命令确认 CLI 可用：

```bash
jira help
```

输出类似如下内容即表示安装成功：

```
Jira CLI
零依赖 Jira 命令行工具

配置:
  jira config                    配置 Jira 连接
  jira auto-cookie               从 Chrome 自动读取 Cookie (macOS)
  jira cookie                    手动粘贴 Cookie
...
```

## 配置

首次使用需要配置 Jira 连接信息。

### 交互式配置（推荐首次使用）

```bash
jira config
```

按提示输入 Jira 地址并选择认证方式。

### 认证方式一览

| 方式 | 适用场景 | 命令 |
|------|----------|------|
| Auto Cookie (`jira ac`) | SSO 登录（飞书、Okta、Azure AD 等） | 在 Chrome 中登录 Jira，然后运行 `jira ac` |
| 手动 Cookie | SSO 登录但自动读取失败时 | `jira config` 选择方式 1，或 `jira cookie` 更新 |
| 用户名 + 密码 | Jira Server | `jira config` 选择方式 2 |
| 邮箱 + API Token | Jira Cloud | `jira config` 选择方式 3 |
| Personal Access Token | Jira Server/DC 8.14+ | `jira config` 选择方式 4 |

### Auto Cookie（macOS）

`jira ac` 命令可以直接从 Chrome 的加密数据库中读取 Cookie，免去手动复制的麻烦：

```bash
# 1. 在 Chrome 中登录 Jira（通过飞书 SSO 或其他方式）
# 2. 运行以下命令
jira ac
# 3. macOS 可能弹出钥匙串访问提示，点击"允许"
# 4. 完成，Cookie 已保存并验证
```

Chrome 运行时即可读取，无需关闭浏览器。

### 语言设置

CLI 支持中文和英文，默认根据系统 locale 自动检测。也可以在 `jira config` 时手动选择：

```bash
jira config
# 最后一步会提示：语言 / Language (en/zh, 默认自动检测)
```

配置文件存储在 `~/.jira-cli/config.json`，权限为 600。

## 命令参考

### 配置

| 命令 | 说明 |
|------|------|
| `jira config` | 交互式配置 Jira 连接 |
| `jira auto-cookie` / `jira ac` | 从 Chrome 自动读取 Cookie（macOS） |
| `jira cookie` | 手动粘贴更新 Cookie |

### 查看

| 命令 | 说明 |
|------|------|
| `jira view <ISSUE-KEY>` | 查看问题详情 |
| `jira <ISSUE-KEY>` | 同上（简写） |
| `jira open <ISSUE-KEY>` | 在浏览器中打开问题 |

### 搜索

| 命令 | 说明 |
|------|------|
| `jira list` | 列出我的未解决问题 |
| `jira list mine` | 同上 |
| `jira list my-bugs` | 我的未解决 Bug |
| `jira list recent` | 最近 7 天更新的问题 |
| `jira list todo` | 我的待办事项 |
| `jira list "<JQL>"` | 自定义 JQL 查询 |
| `jira search <keyword>` | 按关键词全文搜索 |

### 操作

| 命令 | 说明 |
|------|------|
| `jira assign <KEY> <name>` | 分配问题给某人 |
| `jira comment <KEY> [message]` | 添加评论 |
| `jira move <KEY> [status]` | 转换问题状态 |
| `jira branch <KEY>` | 从问题创建 Git 分支 |
| `jira fixlog <KEY> [desc]` | 记录修复并可选更新状态 |

### 用法示例

```bash
jira list                          # 列出我的未解决问题
jira list my-bugs                  # 列出我的 Bug
jira view PROJ-123                 # 查看问题详情
jira PROJ-123                      # 简写方式查看
jira search "login failed"         # 全文搜索
jira branch PROJ-123               # 创建 fix/PROJ-123-summary 分支
jira comment PROJ-123 "Fixed it"   # 添加评论
jira move PROJ-123 Done            # 转换状态为 Done
jira fixlog PROJ-123 "Fixed NPE"  # 记录修复，可选更新状态
jira assign PROJ-123 zhangsan      # 分配给某人
```

## Claude Code Skill 集成

安装本工具后，Claude Code 会自动识别 `.claude/skills/` 下的技能文件。本工具内置 `jira-workflow` Skill：AI 自动读取问题、创建分支、修复代码、更新 Jira 状态。

### Skill 安装方式

通过 npm 安装时，postinstall 脚本会自动把 `jira-workflow/SKILL.md` 复制到当前项目的 `.claude/skills/`。如果你是手动 clone 或 npm link，可运行：

```bash
jira init
```

该命令会把内置 Skill 文件复制到当前项目。也可以手动拷贝：

```bash
mkdir -p .claude/skills/jira-workflow
cp node_modules/jira-cli/.claude/skills/jira-workflow/SKILL.md .claude/skills/jira-workflow/
```

### jira-workflow 工作流

`jira-workflow` 技能自动化完整的问题修复流程：

1. **认证** -- 通过 `jira ac` 自动认证，失败时引导重新登录
2. **读取** -- 从 Jira 获取问题详情（标题、描述、状态、评论等）
3. **分析** -- 判断问题是否属于当前代码库
4. **修复** -- 创建分支、定位问题、修复代码、提交（commit message 包含问题编号）
5. **更新** -- 添加评论并转换 Jira 状态

### 自然语言触发

在 Claude Code 中直接用自然语言触发：

**中文：**

```
看看我的 Jira
查一下 PROJ-123
修一下 PROJ-123
帮我处理一下这个 Jira
搜一下登录相关的 bug
把 PROJ-123 分配给张三
给这个工单加个评论
查一下我的待办
```

**English:**

```
Handle PROJ-123
Check my Jira backlog
Search for auth-related bugs
Fix this issue PROJ-456
This issue isn't a frontend problem, reassign it
```

## 系统要求

- Node.js >= 14
- macOS（Auto Cookie 功能需要，其他认证方式不限操作系统）

## License

MIT
