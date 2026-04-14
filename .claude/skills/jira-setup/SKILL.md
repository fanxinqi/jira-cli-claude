---
name: jira-setup
description: Install and configure jira-cli for AI-driven Jira workflows (安装和配置 jira-cli). Use when user wants to install jira CLI, set up Jira integration, or connect Jira to their project. 当用户想安装 jira CLI、配置 Jira 集成、或在项目中接入 Jira 时触发。关键词：安装jira、配置jira、接入jira、setup jira、install jira。
---

# Purpose

Automatically install jira-cli and configure Jira authentication, so the AI can directly operate Jira issues within the current project.

自动安装 jira-cli 并配置 Jira 认证，让 AI 能在当前项目中直接操作 Jira。

# Use this skill when

- User wants to install or set up the Jira CLI tool
- User wants to connect their project to Jira
- User says "install jira", "set up jira", "configure jira"
- jira-workflow skill reports "command not found"
- 用户想安装或配置 Jira CLI 工具
- 用户说"安装 jira"、"配置 jira"、"接入 jira"

Examples / 示例:

- "Help me install jira-cli"
- "Set up Jira integration for this project"
- "帮我安装 jira"
- "给这个项目配一下 Jira"
- "接入 Jira CLI"

# Workflow / 工作流

## Step 1: Check current state / 第一步：检查当前状态

Run these checks:

```bash
which jira 2>/dev/null && jira help 2>&1 | head -1
```

- If `jira` command exists and outputs help → skip to Step 3 (already installed)
- If `jira` command not found → proceed to Step 2

## Step 2: Install jira-cli / 第二步：安装

### Detect environment / 检测环境

Check if we are inside a Node.js project:

```bash
test -f package.json && echo "has-package-json" || echo "no-package-json"
```

### Install method A: npm project (has package.json)

Try internal registry first, fall back to public npm:

```bash
npm install --save-dev jira-cli --registry=https://nexus.int.taou.com/repository/npm-hosted/ || npm install --save-dev jira-cli
```

Then verify:

```bash
npx jira help 2>&1 | head -1
```

If `npx jira` works, also make it globally accessible in this shell:

```bash
export PATH="./node_modules/.bin:$PATH"
```

### Install method B: no package.json (global install)

```bash
npm install -g jira-cli --registry=https://nexus.int.taou.com/repository/npm-hosted/ || npm install -g jira-cli
```

Then verify:

```bash
jira help 2>&1 | head -1
```

### Install method C: npm not available (fallback)

```bash
git clone https://github.com/fanxinqi/jira-cli.git /tmp/jira-cli
cd /tmp/jira-cli && npm link
```

### Verify installation / 验证安装

After any install method, confirm:

```bash
jira help 2>&1 | head -3
```

If it outputs the help text, installation succeeded. Tell the user:
> jira-cli installed successfully.
> jira-cli 安装成功。

If it fails, report the error and stop.

## Step 3: Copy skill files to project / 第三步：复制 Skill 文件到项目

Check if the jira-workflow skill already exists in the current project:

```bash
test -f .claude/skills/jira-workflow/SKILL.md && echo "skill-exists" || echo "no-skill"
```

If skill does NOT exist, copy it:

```bash
mkdir -p .claude/skills/jira-workflow

# Try from node_modules first
if [ -f node_modules/jira-cli/.claude/skills/jira-workflow/SKILL.md ]; then
  cp node_modules/jira-cli/.claude/skills/jira-workflow/SKILL.md .claude/skills/jira-workflow/
# Try from global install
elif [ -f "$(npm root -g)/jira-cli/.claude/skills/jira-workflow/SKILL.md" ]; then
  cp "$(npm root -g)/jira-cli/.claude/skills/jira-workflow/SKILL.md" .claude/skills/jira-workflow/
fi
```

Also copy the setup skill itself:

```bash
mkdir -p .claude/skills/jira-setup

if [ -f node_modules/jira-cli/.claude/skills/jira-setup/SKILL.md ]; then
  cp node_modules/jira-cli/.claude/skills/jira-setup/SKILL.md .claude/skills/jira-setup/
elif [ -f "$(npm root -g)/jira-cli/.claude/skills/jira-setup/SKILL.md" ]; then
  cp "$(npm root -g)/jira-cli/.claude/skills/jira-setup/SKILL.md" .claude/skills/jira-setup/
fi
```

Verify:

```bash
test -f .claude/skills/jira-workflow/SKILL.md && echo "skill copied" || echo "skill copy failed"
```

Tell the user:
> Skill files copied to `.claude/skills/`. Claude Code will auto-detect them.
> Skill 文件已复制到 `.claude/skills/`，Claude Code 会自动识别。

## Step 4: Authentication / 第四步：认证配置

Check if already authenticated:

```bash
jira list 2>&1 | head -3
```

### Already authenticated / 已认证

If the output shows issues (not an error), tell the user:
> Jira is already authenticated and working. You're all set!
> Jira 认证正常，可以直接使用了！

### Not configured / 未配置

If output says "not configured" or similar:

Try auto-cookie first (macOS):

```bash
jira ac 2>&1
```

If `jira ac` succeeds (shows "Success" / "成功"), done.

If `jira ac` fails:

1. **First priority**: Ask the user to log in to Jira in Chrome, then retry:
   > Please log in to Jira in Chrome (e.g. via Feishu SSO), then tell me to retry.
   > 请在 Chrome 中登录 Jira（如飞书 SSO 登录），完成后告诉我重试。

   After user confirms, run `jira ac` again.

2. **Second priority**: Manual cookie or interactive config:
   > Auto-cookie failed. Please run `! jira cookie` to paste Cookie manually, or `! jira config` for full setup.
   > 自动读取失败。请运行 `! jira cookie` 手动粘贴 Cookie，或 `! jira config` 进行完整配置。

### Auth failed (401) / 认证过期

If output shows HTTP 401, same flow as "Not configured" above — try `jira ac`, then escalate.

## Step 5: Final verification / 第五步：最终验证

After auth succeeds, run a quick smoke test:

```bash
jira list 2>&1 | head -5
```

If it shows issues, report success to the user:

> Setup complete! You can now use Jira with AI. Try:
> - "查一下我的待办" / "Check my Jira backlog"
> - "看看 PROJ-123" / "View PROJ-123"
> - "修一下 PROJ-123" / "Fix PROJ-123"
>
> 安装完成！现在可以用 AI 操作 Jira 了。试试：
> - "查一下我的待办"
> - "看看 PROJ-123"
> - "修一下 PROJ-123"

# Important constraints / 重要约束

- Do NOT ask the user for Jira URL, password, or tokens interactively — use `jira ac` for auto-auth, or direct user to `! jira config` / `! jira cookie` for manual input (these need real stdin)
- Prefer `npm install --save-dev` over global install when inside a Node.js project
- Always copy skill files to the project `.claude/skills/` directory so Claude Code can auto-detect them
- On auth failure, prioritize asking user to re-login in Chrome over manual cookie paste
- If the user's language is Chinese, respond in Chinese throughout

# Output requirements / 输出要求

At the end, summarize (in user's language):

## Installation / 安装
- Install method used / 安装方式
- Install path / 安装路径

## Skill / 技能
- Whether skill files were copied / 是否已复制 Skill 文件
- Skill location / Skill 位置

## Authentication / 认证
- Auth method used / 认证方式
- Auth status / 认证状态

## Next steps / 下一步
- Example commands to try / 可以尝试的命令示例
