import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { FactoryWorld } from './workspace.ts';

Given('the factory has staged and unstaged changes', function (this: FactoryWorld) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: this.repo });
  writeFileSync(join(this.factory, 'NOTES.md'), 'notes\n');
  git('add', '--', 'factory');
  git('commit', '-q', '-m', 'The factory');
  writeFileSync(join(this.factory, 'NOTES.md'), 'notes, edited\n');
  writeFileSync(join(this.factory, 'STAGED.md'), 'staged\n');
  git('add', '--', 'factory/STAGED.md');
  this.unrelatedBefore = this.unrelated();
});

Given('no target is chosen', function (this: FactoryWorld) {
  this.target = undefined;
});

Given('the target folder does not exist', function (this: FactoryWorld) {
  rmSync(resolve(this.repo, this.target!), { recursive: true, force: true });
});

Given('the target is outside any Git repository', function (this: FactoryWorld) {
  this.target = join(this.dir, 'standalone');
  mkdirSync(this.target);
});

Then('it reports that a target is required', function (this: FactoryWorld) {
  assert.match(this.output, /target is required/);
});

Then("the factory's own files and unrelated uncommitted changes are as they were", function (this: FactoryWorld) {
  assert.equal(this.unrelated(), this.unrelatedBefore);
});

Then('the target uses the containing repository', function (this: FactoryWorld) {
  assert.equal(this.toplevel(), this.repo);
});

Then('the target is a Git repository', function (this: FactoryWorld) {
  assert.equal(this.toplevel(), resolve(this.repo, this.target!));
});

When('the factory builds the target {string} to completion', function (this: FactoryWorld, target: string) {
  this.headBefore = this.head();
  this.target = target;
  this.runFactory(['--all']);
});

When('the factory builds the same target using its absolute path', function (this: FactoryWorld) {
  this.headBefore = this.head();
  this.target = resolve(this.repo, this.target!);
  this.runFactory(['--all']);
});

Then('the target {string} is unchanged', function (this: FactoryWorld, target: string) {
  const git = (...args: string[]) => execFileSync('git', args, { cwd: this.repo, encoding: 'utf8' });
  assert.equal(git('diff', this.headBefore, '--', target), '', `${target} changed since the build`);
  assert.equal(git('status', '--porcelain', '--', target), '', `${target} has uncommitted changes`);
});

Then('the targets {string} and {string} each have their own completed plan and committed work', function (this: FactoryWorld, first: string, second: string) {
  for (const target of [first, second]) {
    assert.deepEqual(this.tasks(target), ['alpha', 'beta']);
    assert.ok(this.done(target).every(Boolean), `${target}'s plan is not complete`);
    const files = execFileSync('git', ['ls-files', '--', target], { cwd: this.repo, encoding: 'utf8' });
    assert.ok(files.includes(`${target}/alpha.txt`) && files.includes(`${target}/beta.txt`), `${target}'s work is not committed:\n${files}`);
  }
});
