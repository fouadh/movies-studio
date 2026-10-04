import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { existsSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FactoryWorld } from './workspace.ts';
import { execFileSync } from 'node:child_process';

Given('no seed is chosen', function (this: FactoryWorld) {
  this.seed = undefined;
});

Given('the seed has been deleted', function (this: FactoryWorld) {
  rmSync(join(this.repo, this.seed!));
});

Then('it reports that there is no seed', function (this: FactoryWorld) {
  assert.match(this.output, /no seed/);
});

Then('no agent has been called', function (this: FactoryWorld) {
  assert.ok(!existsSync(join(this.dir, 'agent.log')), 'the chosen agent was called');
  assert.ok(!existsSync(join(this.dir, 'pi.log')), 'pi was called');
});

Then('there is a plan', function (this: FactoryWorld) {
  assert.ok(existsSync(this.plan()), 'there is no plan');
});

Then('the plan shows every task as not done', function (this: FactoryWorld) {
  assert.ok(this.done().every((done) => !done), `some tasks are done: ${this.done()}`);
});

Then('the plan shows the first two tasks as done', function (this: FactoryWorld) {
  assert.deepEqual(this.done().slice(0, 2), [true, true]);
});

Then('there are no new work commits', function (this: FactoryWorld) {
  assert.equal(this.workCommits().length, 0);
});

Then('the committed plan matches the plan on disk', function (this: FactoryWorld) {
  assert.equal(this.committedPlan(), readFileSync(this.plan(), 'utf8'));
});

Then('the target has no uncommitted changes', function (this: FactoryWorld) {
  assert.equal(this.uncommitted(), '');
});

Then('the plan still has those three tasks', function (this: FactoryWorld) {
  assert.deepEqual(this.tasks(), ['one', 'two', 'three']);
});

Then('the plan is .factory\\/plan.md in the target', function (this: FactoryWorld) {
  assert.ok(existsSync(this.plan()), 'there is no .factory/plan.md in the target');
});

Then("there is no plan in the factory's folder", function (this: FactoryWorld) {
  assert.ok(!existsSync(join(this.factory, '.factory', 'plan.md')), "there is a plan in the factory's folder");
});

Given('the agent keeps its plan in prose', function (this: FactoryWorld) {
  writeFileSync(join(this.dir, 'agent-prose-plan'), '');
});

Then('the work for {word} and {word} has been committed', function (this: FactoryWorld, first: string, second: string) {
  const files = execFileSync('git', ['ls-files', '--', this.target], { cwd: this.repo, encoding: 'utf8' });
  assert.ok(files.includes(`${this.target}/${first}.txt`), `${first} was not committed:\n${files}`);
  assert.ok(files.includes(`${this.target}/${second}.txt`), `${second} was not committed:\n${files}`);
});
