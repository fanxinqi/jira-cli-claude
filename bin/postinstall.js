#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// INIT_CWD is set by npm to the directory where `npm install` was run
const projectRoot = process.env.INIT_CWD;
if (!projectRoot) process.exit(0);

const packageRoot = path.resolve(__dirname, '..');

// Skip: running in the package's own directory (development)
if (path.resolve(projectRoot) === packageRoot) process.exit(0);

// Only copy if INIT_CWD looks like a project (.git or package.json exists)
const isProject = fs.existsSync(path.join(projectRoot, '.git'))
  || fs.existsSync(path.join(projectRoot, 'package.json'));
if (!isProject) process.exit(0);

const skills = ['jira-workflow', 'jira-setup'];
const srcBase = path.join(packageRoot, '.claude', 'skills');
const destBase = path.join(projectRoot, '.claude', 'skills');

let copied = 0;

for (const skill of skills) {
  const src = path.join(srcBase, skill, 'SKILL.md');
  const dest = path.join(destBase, skill, 'SKILL.md');

  if (!fs.existsSync(src)) continue;

  fs.mkdirSync(path.join(destBase, skill), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

if (copied > 0) {
  console.log('jira-cli: Skill files copied to .claude/skills/ — Claude Code will auto-detect them.');
}
