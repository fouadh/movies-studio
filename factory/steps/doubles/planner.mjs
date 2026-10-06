#!/usr/bin/env node

// Test double for the planner: plans alpha and beta, marks a task done once its work is committed,
// and says whether the plan is complete.
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.FACTORY_TEST_DIR;
appendFileSync(join(dir, 'planner.log'), 'called\n');
mkdirSync(join(dir, 'calls'), { recursive: true });
writeFileSync(join(dir, 'calls', `planner-${Date.now()}.txt`), process.argv.slice(2).join(' '));

const prose = existsSync(join(dir, 'planner-prose-plan'));
const todo = (task) => (prose ? `${task} is still to do.` : `- [ ] ${task}`);
const finished = (task) => (prose ? `${task} is done.` : `- [x] ${task}`);
const pending = prose ? /^(.+) is still to do\.$/ : /^- \[ \] (.+)$/;

const plan = '.factory/plan.md';
if (!existsSync(plan)) {
  mkdirSync('.factory', { recursive: true });
  writeFileSync(plan, ['alpha', 'beta'].map(todo).join('\n') + '\n');
}
const committed = (task) => execFileSync('git', ['ls-files', `${task}.txt`], { encoding: 'utf8' }) !== '';
const lines = readFileSync(plan, 'utf8').split('\n').map((line) => {
  const task = line.match(pending)?.[1];
  return task && committed(task) ? finished(task) : line;
});
writeFileSync(plan, lines.join('\n'));
console.log(JSON.stringify({ complete: !lines.some((line) => pending.test(line)) }));
