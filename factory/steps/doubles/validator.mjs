#!/usr/bin/env node

// Test double for the validator: satisfied, unless told otherwise.
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.env.FACTORY_TEST_DIR;
appendFileSync(join(dir, 'validator.log'), 'called\n');
const calls = readFileSync(join(dir, 'validator.log'), 'utf8').trim().split('\n').length;
mkdirSync(join(dir, 'calls'), { recursive: true });
writeFileSync(join(dir, 'calls', `validator-${Date.now()}.txt`), process.argv.slice(2).join(' '));

const satisfied = !existsSync(join(dir, 'validator-never')) && !(calls === 1 && existsSync(join(dir, 'validator-not-first')));

const says = join(dir, 'validator-says');
if (existsSync(says)) console.log(readFileSync(says, 'utf8'));

if (existsSync(join(dir, 'validator-prose'))) console.log('The work looks fine to me.');
else console.log(JSON.stringify(satisfied ? { satisfied: true, findings: [] } : { satisfied: false, findings: ['the work is not good enough'] }));

