import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    seed: { type: 'string' },
    target: { type: 'string' },
    agent: { type: 'string', default: 'pi' },
    all: { type: 'boolean', default: false },
  }
});

if (!values.target) {
  console.error('a target is required');
  process.exit(1);
}

if (!values.seed || !existsSync(values.seed)) {
  console.error('there is no seed');
  process.exit(1);
}


const target = resolve(values.target!);
const seed = resolve(values.seed!);
const plan = join(target, '.factory', 'plan.md');

const prompt = `The seed is ${seed}. The plan is ${plan}.
If there is no plan, write one: the seed broken into a few tasks, none done, and do nothing else.
Otherwise, pick the first task that isn't done, implement it in real code in the current folder, and mark it done in the plan.
End your answer with one line of JSON, your result: {"complete": true} if no task was left to do, otherwise {"complete": false, "task": "<the task you did, if any>"}.`;

const git = (...args: string[]) => spawnSync('git', args, { cwd: target, stdio: 'inherit' });
mkdirSync(target, { recursive: true });
if (spawnSync('git', ['rev-parse'], { cwd: target }).status !== 0) git('init', '--quiet');

const lastJson = (text: string) => {
  for (const line of text.trim().split('\n').reverse()) {
    try { return JSON.parse(line); } catch { }
  }
};

function pass() {
  const answer = spawnSync(values.agent!, ['-p', prompt], { cwd: target, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] });
  if (answer.error) {
    console.error(`could not run the agent: ${answer.error.message}`);
    process.exit(1);
  }
  const result = lastJson(answer.stdout);
  if (result === undefined) {
    console.error("could not read the agent's result");
    process.exit(1);
  }
  git('add', '--all', '--', '.');
  git('commit', '--quiet', '--message', 'Factory pass', '--', '.');
  console.log(JSON.stringify(result));
  return result;
}

let result;
do {
  result = pass();
} while (values.all && !result.complete);
if (values.all) console.log('factory stopped');
