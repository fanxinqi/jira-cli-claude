---
name: jira-workflow
description: Jira-driven issue fixing workflow (Jira 问题修复工作流). Auto-authenticate, read issues, analyze ownership, create branches, fix code, and update Jira status. Use when the user mentions Jira issue keys (e.g. PROJ-123) or asks to fix/view/manage Jira issues. 当用户提到 Jira 问题编号、或要求查看/修复/管理 Jira 问题时触发。关键词：看看Jira、查一下、修一下、处理、分配、我的待办、搜索问题、Jira工单。
---

# Purpose

Provides a complete Jira-driven issue fixing workflow: authenticate → read issue → analyze ownership → create branch → fix code → update Jira status.

提供完整的 Jira 问题修复工作流：认证 → 读取问题 → 分析归属 → 创建分支 → 修复代码 → 更新 Jira 状态。

# Use this skill when

- User mentions a Jira issue key (e.g. PROJ-123, TEAM-456)
- User says "check my Jira", "fix this issue", "handle this bug"
- User wants to read issues from Jira and fix them
- User wants to batch-process Jira issues
- User wants to assign, comment, or update Jira issues
- 用户提到 Jira 问题编号（如 PROJ-123、TEAM-456）
- 用户说"看看我的 Jira"、"查一下这个问题"、"修一下这个 bug"、"处理这个工单"
- 用户想从 Jira 读取问题并修复
- 用户想批量处理 Jira 问题
- 用户想分配、评论或更新 Jira 问题状态

Examples / 示例:

- "Handle PROJ-123"
- "Check my Jira backlog"
- "Search for login-related bugs"
- "This issue isn't a frontend problem, reassign it"
- "看看 PROJ-123"
- "帮我处理一下这个 Jira"
- "查一下我的待办"
- "搜一下登录相关的 bug"
- "这个问题不是前端的，转给别人"
- "把 PROJ-123 分配给张三"
- "给这个工单加个评论"
- "修一下 PROJ-123"

# Workflow / 工作流

Follow these steps strictly. Confirm each step succeeds before moving on.
严格按以下步骤执行，每步确认成功后再继续。

## Step 1: Authentication Check / 第一步：认证检查

Run `jira list 2>&1 | head -3` to verify the CLI is available and authenticated.

### Command not found / 命令未找到

Ask the user to install jira-cli (`npm i -D jira-cli` or see the install wiki), then retry.

### Auth failed (HTTP 401 / not configured) / 认证失败

Silently run `jira ac` — auto-cookie is the default and only recovery path:

```bash
jira ac
```

If `jira ac` still fails, ask the user to re-login in Chrome **once**, then retry `jira ac`:

> Jira session expired. Please re-login to Jira in Chrome (e.g. via Feishu SSO), then tell me to retry.
> Jira 会话已过期。请在 Chrome 中重新登录 Jira（如通过飞书 SSO），完成后告诉我重试。

Do NOT walk the user through `jira cookie` or `jira config` — `jira ac` covers the normal case and the user can invoke those manually if they need a different auth method.

Authentication MUST succeed before continuing.

### Auth succeeded / 认证成功

Proceed to Step 2.

## Step 2: Read Issue / 第二步：读取问题

Choose the operation based on user intent:

- Specific key / 指定编号 → `jira view <ISSUE-KEY>`
- View backlog / 查看待办 → `jira list todo`
- Search / 搜索 → `jira search "<keyword>"`
- List all / 列出全部 → `jira list`

Show the user: title, status, priority, description, recent comments.
向用户展示：标题、状态、优先级、描述、最近评论。

## Step 3: Analyze Ownership / 第三步：分析归属

Analyze the issue description to determine if it belongs to your codebase.
分析问题描述，判断是否属于当前代码库。

### Belongs to this repo / 属于本仓库

- UI / interaction / styling / component issues / UI、交互、样式、组件问题
- Frontend routing, state management, API calls / 前端路由、状态管理、API 调用
- The affected module exists in the codebase / 受影响的模块存在于代码库中

### Does NOT belong / 不属于本仓库

- Backend API / server-side logic / 后端 API、服务端逻辑
- Native client (iOS / Android) / 原生客户端
- Data / algorithm / ML / 数据、算法、机器学习
- DevOps / infrastructure / 运维、基础设施
- Product / design / copy / 产品、设计、文案

Share your analysis with the user and get confirmation before proceeding.
将分析结果告知用户，确认后再继续。

## Step 4a: Fix the Issue (if it belongs here) / 第四步 a：修复问题

### Create a fix branch / 创建修复分支

Run `jira branch <ISSUE-KEY>` to auto-generate and create a branch.

### Locate and fix / 定位并修复

Find the target module and fix with minimal changes:

- Stay within the target package / 在目标包内修改
- Search for existing patterns first / 先搜索已有模式
- Match existing code style / 匹配现有代码风格
- No unrelated refactoring / 不做无关重构

### Verify / 验证

Run the minimum necessary verification for the change type.

### Commit / 提交

```bash
git add <changed files>
git commit -m "fix(<package>): <description> (#<ISSUE-KEY>)"
```

### Update Jira / 更新 Jira

1. Add comment / 添加评论: `jira comment <ISSUE-KEY> "Fixed: <brief description>"`
2. Move to Done / 移至完成: `jira move <ISSUE-KEY> Done`
3. If "Done" isn't available, use `jira move <ISSUE-KEY>` to interactively select

Tell the user what files changed, the fix approach, and whether they need to push.
告知用户修改了哪些文件、修复方案以及是否需要 push。

## Step 4b: Reassign (if it doesn't belong here) / 第四步 b：转派

1. Explain to the user why this isn't a frontend issue / 向用户解释为什么不是前端问题
2. Ask who to assign it to / 询问转派给谁
3. Run `jira assign <ISSUE-KEY> <name>`
4. Add comment / 添加评论: `jira comment <ISSUE-KEY> "This is a <domain> issue, reassigned for handling."`

# Important constraints / 重要约束

- Auth = `jira ac` only. Do not mention `jira cookie` / `jira config` to the user — if `jira ac` fails, the only recovery is a Chrome re-login
- Auth MUST succeed before proceeding — don't continue with a failed state
- Get user confirmation after ownership analysis before taking action
- Follow minimal-change strategy when fixing — don't refactor while fixing bugs
- Commit messages must include the Jira issue key
- If status transition fails, use interactive selection — don't guess status names

# Language / 语言

- If the user communicates in Chinese, respond in Chinese (用中文回复)
- If the user communicates in English, respond in English
- CLI output language follows the user's `jira config` locale setting

# Output requirements / 输出要求

Every use of this skill should include (respond in the user's language):
每次使用此技能时应包含以下内容（使用用户的语言回复）：

## Issue Info / 问题信息
- Key, title, status, priority / 编号、标题、状态、优先级
- Description summary / 描述摘要

## Ownership Analysis / 归属分析
- Belongs to this repo / doesn't / 是否属于本仓库
- Reasoning / 理由

## Result / 结果
- If fixed: files changed, fix approach, Jira status updated / 修复：改了哪些文件、修复方案、Jira 状态已更新
- If reassigned: assigned to whom, reason for reassignment / 转派：转给了谁、转派原因

## Remaining Risks / 遗留风险
- Unverified areas / 未验证的区域
- Items needing user confirmation / 需要用户确认的事项
