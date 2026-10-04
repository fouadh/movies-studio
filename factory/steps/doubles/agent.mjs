#!/usr/bin/env node

// Test double for a coding agent: plans alpha and beta, then does one task a pass.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.FACTORY_TEST_DIR;
appendFileSync(join(dir, 'agent.log'), 'called\n');
mkdirSync(join(dir, 'calls'), { recursive: true });
writeFileSync(join(dir, 'calls', `agent-${Date.now()}.txt`), process.argv.slice(2).join(' '));
const says = join(dir, 'agent-says');
if (existsSync(says)) console.log(readFileSync(says, 'utf8'));

const prose = existsSync(join(dir, 'agent-prose-plan'));
const todo = (task) => (prose ? `${task} is still to do.` : `- [ ] ${task}`);
const finished = (task) => (prose ? `${task} is done.` : `- [x] ${task}`);
const pending = prose ? /^(.+) is still to do\.$/ : /^- \[ \] (.+)$/;

function work() {
  const plan = '.factory/plan.md';
  if (!existsSync(plan)) {
    mkdirSync('.factory', { recursive: true });
    writeFileSync(plan, ['alpha', 'beta'].map(todo).join('\n') + '\n');
    return { complete: false };
  }
  const lines = readFileSync(plan, 'utf8').split('\n');
  const next = lines.findIndex((line) => pending.test(line));
  if (next === -1) return { complete: true };
  const task = lines[next].match(pending)[1];
  const writes = join(dir, 'agent-writes');
  const file = existsSync(writes) ? readFileSync(writes, 'utf8') : `${task}.txt`;
  writeFileSync(file, `work for ${task}\n`);
  lines[next] = finished(task);
  writeFileSync(plan, lines.join('\n'));
  return { complete: false, task };
}

const result = work();
if (existsSync(join(dir, 'agent-prose'))) console.log('I did the next task.');
else console.log(JSON.stringify(result));
