import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    seed: { type: 'string' },
    target: { type: 'string' },
    planner: { type: 'string', default: 'pi' },
    doer: { type: 'string', default: 'pi' },
    validator: { type: 'string', default: 'pi' },
    attempts: { type: 'string', default: '3' },
    lens: { type: 'string', default: 'testability' },
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

const doPrompt = (findings: string[]) => `The seed is ${seed}. The plan is ${plan}.
Pick the first task in the plan that isn't done and implement it in real code in the current folder. Don't mark it done.` +
  (findings.length ? `\nYour last attempt at it was checked, and these findings came back. Record each one in the plan as a subtask of that task, not as a new task, then fix them:\n- ${findings.join('\n- ')}` : '');

const donePrompt = `The plan is ${plan}. The work for its first task that isn't done has just been committed: mark that task done, and do nothing else.
End your answer with one line of JSON, your result: {"complete": true} if no task is left to do, otherwise {"complete": false}.`;

const planPrompt = `The seed is ${seed}. Write the plan at ${plan}: the seed broken into a few tasks, none done. Do nothing else.
End your answer with one line of JSON, your result: {"complete": false}.`;

const statusPrompt = `The plan is ${plan}. Change nothing, and judge from the plan alone: a task is left to do if the plan doesn't mark it done, even if its work looks done already.
End your answer with one line of JSON, your result: {"complete": true} if every task in the plan is marked done, otherwise {"complete": false}.`;

const validatePrompt = (work: string) => `Check this work for ${values.lens}, and nothing else. It was just done on a task of the plan at ${plan}:
${work}
Don't change the plan or the work. End your answer with one line of JSON, your result: {"satisfied": true, "findings": []} if the work is good enough, otherwise {"satisfied": false, "findings": ["<what is wrong>", ...]}.`;

const git = (...args: string[]) => spawnSync('git', args, { cwd: target, stdio: 'inherit' });

const commit = (message: string) => {
  git('add', '--all', '--', '.');
  git('commit', '--quiet', '--message', message, '--', '.');
};

const work = () => {
  git('add', '--all', '--', '.');
  return spawnSync('git', ['diff', '--cached', '--', '.'], { cwd: target, encoding: 'utf8' }).stdout;
};

mkdirSync(target, { recursive: true });
if (spawnSync('git', ['rev-parse'], { cwd: target }).status !== 0) git('init', '--quiet');

const lastJson = (text: string) => {
  for (const line of text.trim().split('\n').reverse()) {
    try { return JSON.parse(line); } catch { }
  }
};

function run(machine: 'planner' | 'doer' | 'validator', prompt: string) {
  const answer = spawnSync(values[machine]!, ['-p', prompt], { cwd: target, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] });
  if (answer.error) {
    console.error(`could not run the ${machine}: ${answer.error.message}`);
    process.exit(1);
  }
  return answer.stdout;
}

function ask(machine: 'planner' | 'validator', prompt: string) {
  const result = lastJson(run(machine, prompt));
  if (result === undefined) {
    console.error(`could not read the ${machine}'s result`);
    process.exit(1);
  }
  return result;
}

function pass() {
  if (!existsSync(plan)) {
    const result = ask('planner', planPrompt);
    commit('Factory plan');
    return result;
  }
  const status = ask('planner', statusPrompt);
  if (status.complete) {
    console.log(JSON.stringify(status));
    return status;
  }

  let findings: string[] = [];
  for (let attempt = 1; attempt <= Number(values.attempts); attempt++) {
    run('doer', doPrompt(findings));
    const verdict = ask('validator', validatePrompt(work()));
    if (verdict.satisfied) {
      commit('Factory pass');
      const result = ask('planner', donePrompt);
      commit('Factory plan');
      console.log(JSON.stringify(result));
      return result;
    }
    findings = verdict.findings;
  }

  console.error('the pass hit its limit');
  process.exit(1);
}

let result;
do {
  result = pass();
} while (values.all && !result.complete);
if (values.all) console.log('factory stopped');
