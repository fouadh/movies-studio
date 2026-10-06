#!/usr/bin/env node

// Test double for the doer: does the first task that isn't done. The planner marks it done.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.FACTORY_TEST_DIR;
appendFileSync(join(dir, 'doer.log'), 'called\n');
mkdirSync(join(dir, 'calls'), { recursive: true });
writeFileSync(join(dir, 'calls', `doer-${Date.now()}.txt`), process.argv.slice(2).join(' '));

const lines = readFileSync('.factory/plan.md', 'utf8').split('\n');
const pending = existsSync(join(dir, 'doer-prose-plan')) ? /^(.+) is still to do\.$/ : /^- \[ \] (.+)$/;
const task = lines.map((line) => line.match(pending)?.[1]).find(Boolean);
const writes = join(dir, 'doer-writes');
const file = existsSync(writes) ? readFileSync(writes, 'utf8') : `${task}.txt`;
writeFileSync(file, `work for ${task}\n`);

