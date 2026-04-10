---
name: jira-workflow
description: Jira-driven issue fixing workflow. Auto-authenticate, read issues, analyze ownership, create branches, fix code, and update Jira status. Use when the user mentions Jira issue keys or asks to fix/view/manage Jira issues.
---

# Purpose

Provides a complete Jira-driven issue fixing workflow: authenticate → read issue → analyze ownership → create branch → fix code → update Jira status.

# Use this skill when

- User mentions a Jira issue key (e.g. PROJ-123, TEAM-456)
- User says "check my Jira", "fix this issue", "handle this bug"
- User wants to read issues from Jira and fix them
- User wants to batch-process Jira issues
- User wants to assign, comment, or update Jira issues

Examples:

- "Handle PROJ-123"
- "Check my Jira backlog"
- "Search for login-related bugs"
- "This issue isn't a frontend problem, reassign it"

# Workflow

Follow these steps strictly. Confirm each step succeeds before moving on.

## Step 1: Authentication Check

Run `jira list 2>&1 | head -3` to verify the CLI is available and authenticated.

### Command not found

Run `npm link` in the jira-cli directory, then retry.

### Auth failed (HTTP 401 / not configured)

Run auto-cookie login:

```bash
jira ac
```

If `jira ac` also fails, prompt the user:

> Auto-login failed. Please log into Jira in your browser, then run `! jira cookie` to paste your Cookie manually.

Authentication MUST succeed before continuing.

### Auth succeeded

Proceed to Step 2.

## Step 2: Read Issue

Choose the operation based on user intent:

- Specific key → `jira view <ISSUE-KEY>`
- View backlog → `jira list todo`
- Search → `jira search "<keyword>"`
- List all → `jira list`

Show the user: title, status, priority, description, recent comments.

## Step 3: Analyze Ownership

Analyze the issue description to determine if it belongs to your codebase.

### Belongs to this repo

- UI / interaction / styling / component issues
- Frontend routing, state management, API calls
- The affected module exists in the codebase

### Does NOT belong

- Backend API / server-side logic
- Native client (iOS / Android)
- Data / algorithm / ML
- DevOps / infrastructure
- Product / design / copy

Share your analysis with the user and get confirmation before proceeding.

## Step 4a: Fix the Issue (if it belongs here)

### Create a fix branch

Run `jira branch <ISSUE-KEY>` to auto-generate and create a branch.

### Locate and fix

Find the target module and fix with minimal changes:

- Stay within the target package
- Search for existing patterns first
- Match existing code style
- No unrelated refactoring

### Verify

Run the minimum necessary verification for the change type.

### Commit

```bash
git add <changed files>
git commit -m "fix(<package>): <description> (#<ISSUE-KEY>)"
```

### Update Jira

1. Add comment: `jira comment <ISSUE-KEY> "Fixed: <brief description>"`
2. Move to Done: `jira move <ISSUE-KEY> Done`
3. If "Done" isn't available, use `jira move <ISSUE-KEY>` to interactively select

Tell the user what files changed, the fix approach, and whether they need to push.

## Step 4b: Reassign (if it doesn't belong here)

1. Explain to the user why this isn't a frontend issue
2. Ask who to assign it to
3. Run `jira assign <ISSUE-KEY> <name>`
4. Add comment: `jira comment <ISSUE-KEY> "This is a <domain> issue, reassigned for handling."`

# Important constraints

- Default to `jira ac` (auto-cookie) for auth — don't ask for manual steps unless auto fails
- Auth MUST succeed before proceeding — don't continue with a failed state
- Get user confirmation after ownership analysis before taking action
- Follow minimal-change strategy when fixing — don't refactor while fixing bugs
- Commit messages must include the Jira issue key
- If status transition fails, use interactive selection — don't guess status names
- On cookie expiry, try `jira ac` first, then fall back to manual paste

# Output requirements

Every use of this skill should include:

## Issue Info
- Key, title, status, priority
- Description summary

## Ownership Analysis
- Belongs to this repo / doesn't
- Reasoning

## Result
- If fixed: files changed, fix approach, Jira status updated
- If reassigned: assigned to whom, reason for reassignment

## Remaining Risks
- Unverified areas
- Items needing user confirmation
