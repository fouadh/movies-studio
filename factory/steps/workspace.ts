import { After, Before, Given, World, setWorldConstructor } from '@cucumber/cucumber';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, readFileSync, writeFileSync, realpathSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';

const factorySource = resolve(import.meta.dirname, '..');
export const doubles = resolve(import.meta.dirname, 'doubles');

export class FactoryWorld extends World {
  dir = '';            // this example's temporary folder
  repo = '';           // the test repository inside it
  factory = '';        // the copy of the factory
  target?: string = 'target';  // relative to repo, or absolute
  unrelatedBefore = '';        // the factory's own changes before the run
  seed?: string = 'seed.md';  // relative to repo, if chosen
  machines: Record<string, string | undefined> = {};  // the harness chosen for each machine, if any
  attempts?: number;   // the attempt limit per pass, if chosen
  lens?: string;       // the validator's lens, if chosen
  output = '';         // what the factory printed
  commitsBefore = 0;   // commits in the repo before the last run
  stopped = false;     // whether the factory stopped on its own
  headBefore = '';     // HEAD before the last build

  head() {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: this.repo, encoding: 'utf8' }).trim();
  }

  runFactory(extra: string[] = []) {
    this.commitsBefore = this.commits();
    const args = [...extra];
    if (this.target) args.push('--target', this.target);
    if (this.seed) args.push('--seed', this.seed);
    for (const [machine, harness] of Object.entries(this.machines)) if (harness) args.push(`--${machine}`, harness);
    if (this.attempts) args.push('--attempts', String(this.attempts));
    if (this.lens) args.push('--lens', this.lens);

    const result = spawnSync(join(this.factory, 'factory'), args, {
      cwd: this.repo,
      encoding: 'utf8',
      timeout: 10_000,
      env: { ...process.env, FACTORY_TEST_DIR: this.dir, PATH: `${doubles}/bin:${process.env.PATH}` },
    });
    this.output = result.stdout + result.stderr;
    this.stopped = !result.error;
  }

  commits() {
    return Number(execFileSync('git', ['rev-list', '--count', '--all'], { cwd: this.repo, encoding: 'utf8' }));
  }

  plan(target = this.target!) {
    return resolve(this.repo, target, '.factory', 'plan.md');
  }

  givenPlan(text: string) {
    mkdirSync(dirname(this.plan()), { recursive: true });
    writeFileSync(this.plan(), text);
    execFileSync('git', ['add', this.plan()], { cwd: this.repo });
    execFileSync('git', ['commit', '-q', '-m', 'Given plan', '--', this.plan()], { cwd: this.repo });
  }

  tasks(target = this.target!) {
    const lines = readFileSync(this.plan(target), 'utf8').split('\n');
    return readFileSync(this.plan(), 'utf8')
      .split('\n')
      .flatMap((line) => line.match(/^- \[([ x])\] (.+)$/) ?? [])
      .filter((_, i) => i % 3 === 2);
  }

  productFiles(commit: string) {
    const files = execFileSync('git', ['show', '--name-only', '--format=', commit], { cwd: this.repo, encoding: 'utf8' });
    return files.split('\n')
      .filter((file) => file.startsWith(`${this.target}/`) && !file.includes('/.factory/'))
      .map((file) => file.slice(this.target.length + 1));
  }

  workCommits() {
    const count = this.commits() - this.commitsBefore;
    if (count === 0) return [];
    const log = execFileSync('git', ['rev-list', `--max-count=${count}`, 'HEAD'], { cwd: this.repo, encoding: 'utf8' });
    return log.trim().split('\n').reverse().filter((commit) => this.productFiles(commit).length > 0);
  }

  lastPrompt(machine: string) {
    const calls = join(this.dir, 'calls');
    const last = readdirSync(calls).filter((file) => file.startsWith(`${machine}-`)).sort().at(-1)!;
    return readFileSync(join(calls, last), 'utf8');
  }

  done(target = this.target!) {
    const lines = readFileSync(this.plan(target), 'utf8').split('\n');
    return lines.filter((line) => /^- \[[ x]\] /.test(line)).map((line) => line[3] === 'x');
  }

  committedPlan() {
    return execFileSync('git', ['show', `HEAD:${this.target}/.factory/plan.md`], { cwd: this.repo, encoding: 'utf8' });
  }

  uncommitted() {
    return execFileSync('git', ['status', '--porcelain', '--', this.target], { cwd: this.repo, encoding: 'utf8' });
  }

  unrelated() {
    const git = (...args: string[]) => execFileSync('git', args, { cwd: this.repo, encoding: 'utf8' });
    return git('status', '--porcelain', '--', 'factory') + git('diff', '--', 'factory') + git('diff', '--cached', '--', 'factory');
  }

  toplevel() {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: resolve(this.repo, this.target!), encoding: 'utf8' }).trim();
  }
}
setWorldConstructor(FactoryWorld);

Before(function (this: FactoryWorld) {
  this.dir = realpathSync(mkdtempSync(join(tmpdir(), 'factory-')));
  this.repo = join(this.dir, 'repo');
  mkdirSync(this.repo);
  execFileSync('git', ['init', '-q'], { cwd: this.repo });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: this.repo });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: this.repo });
});

After(function (this: FactoryWorld) {
  rmSync(this.dir, { recursive: true, force: true });
});

Given('a copy of the factory', function (this: FactoryWorld) {
  this.factory = join(this.repo, 'factory');
  for (const file of ['factory', 'src', 'package.json']) {
    cpSync(join(factorySource, file), join(this.factory, file), { recursive: true });
  }
  symlinkSync(join(factorySource, 'node_modules'), join(this.factory, 'node_modules'));
});

Given('a new target', function (this: FactoryWorld) {
  mkdirSync(join(this.repo, this.target));
});

Given('a seed describing a game of Tetris', function (this: FactoryWorld) {
  writeFileSync(join(this.repo, this.seed), '# Tetris\n\nBuild a game of Tetris that runs in the terminal.\n');
});