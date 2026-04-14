# jira-cli-claude

Zero-dependency Jira CLI + Claude Code skill for AI-driven issue workflows.

A lightweight command-line tool for Jira that works standalone **and** as a [Claude Code](https://claude.ai/code) skill — letting Claude automatically read issues, create branches, fix code, and update Jira status.

## Features

- **Zero dependencies** — pure Node.js, no npm install needed
- **4 auth methods** — Cookie (SSO), username/password, email/API token, Personal Access Token
- **Auto Cookie** — reads Chrome cookies automatically on macOS (no manual copy-paste)
- **Claude Code skill** — includes a ready-to-use skill that drives the full fix workflow
- **Works everywhere** — Jira Server, Data Center, and Cloud

## Quick Start

### Install globally

```bash
npm install -g jira-cli-claude
```

### Or use in a project

```bash
npm install --save-dev jira-cli-claude
```

### Or just clone and link

```bash
git clone https://github.com/fanxinqi/jira-cli-claude.git
cd jira-cli-claude
npm link
```

### Configure

```bash
# Interactive setup (recommended for first time)
jira config

# Or auto-read Cookie from Chrome (macOS, one command)
jira ac
```

## CLI Usage

```
Setup:
  jira config                    Configure Jira connection
  jira auto-cookie / jira ac     Auto-read Cookie from Chrome (macOS)
  jira cookie                    Manually paste Cookie

View:
  jira view   <ISSUE-KEY>        View issue details
  jira open   <ISSUE-KEY>        Open issue in browser

Search:
  jira list                      List my unresolved issues
  jira list   mine               Same as above
  jira list   my-bugs            My unresolved bugs
  jira list   recent             Updated in last 7 days
  jira list   todo               My to-do items
  jira list   "<JQL>"            Custom JQL query
  jira search <keyword>          Search by keyword

Actions:
  jira assign  <KEY> <name>      Assign issue to someone
  jira comment <KEY> [message]   Add comment
  jira move    <KEY> [status]    Transition issue status
  jira branch  <KEY>             Create git branch from issue
  jira fixlog  <KEY> [desc]      Log fix and optionally update status
```

### Examples

```bash
jira list                          # My unresolved issues
jira list my-bugs                  # My bugs
jira view PROJ-123                 # View issue details
jira PROJ-123                      # Shorthand for view
jira search "login failed"         # Full-text search
jira branch PROJ-123               # Create fix/PROJ-123-summary branch
jira comment PROJ-123 "Fixed it"   # Add comment
jira move PROJ-123 Done            # Transition to Done
jira fixlog PROJ-123 "Fixed NPE"   # Log fix + optional status change
```

## Claude Code Skill

This package includes a Claude Code skill at `.claude/skills/jira-workflow/SKILL.md` that automates the entire issue-fixing workflow:

1. **Auth** — auto-authenticates via `jira ac`
2. **Read** — fetches issue details from Jira
3. **Analyze** — determines if the issue belongs to your codebase
4. **Fix** — creates branch, fixes code, commits with issue key
5. **Update** — adds comment and transitions Jira status

### Setup for Claude Code

After installing, tell Claude Code about the skill:

```bash
# In your project directory
claude

# Then just say:
> Handle PROJ-123
> Check my Jira backlog
> Search for auth-related bugs
```

Or copy the skill file to your project:

```bash
mkdir -p .claude/skills/jira-workflow
cp node_modules/jira-cli-claude/.claude/skills/jira-workflow/SKILL.md .claude/skills/jira-workflow/
```

## Authentication Methods

| Method | Best For | Setup |
|--------|----------|-------|
| Auto Cookie (`jira ac`) | SSO login (Okta, Azure AD, etc.) | Login in Chrome, run `jira ac` |
| Manual Cookie | SSO when auto fails | Copy from DevTools |
| Username + Password | Jira Server | `jira config` → option 2 |
| Email + API Token | Jira Cloud | `jira config` → option 3 |
| Personal Access Token | Jira Server/DC 8.14+ | `jira config` → option 4 |

Config is stored at `~/.jira-cli/config.json` (permissions: 600).

## Auto Cookie (macOS)

The `jira ac` command reads cookies directly from Chrome's encrypted database:

1. Login to Jira in Chrome (via SSO, password, whatever)
2. Run `jira ac`
3. macOS may prompt for Keychain access — click "Allow"
4. Done! Cookie is saved and verified.

Works while Chrome is running. No need to close it.

## Requirements

- Node.js >= 14
- macOS for auto-cookie feature (other auth methods work on any OS)

## License

MIT
# jira-cli-claude
