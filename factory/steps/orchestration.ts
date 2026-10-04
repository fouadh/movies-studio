import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Given, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import type { FactoryWorld } from './workspace.ts';


const ordinal: Record<string, number> = { first: 0, second: 1, third: 2 };

Given('a plan whose first task is done', function (this: FactoryWorld) {
  this.givenPlan('- [x] one\n- [ ] two\n- [ ] three\n');
});

Then('the plan shows the first task as done', function (this: FactoryWorld) {
  assert.equal(this.done()[0], true);
});

Then('the plan shows the other two as not done', function (this: FactoryWorld) {
  assert.deepEqual(this.done().slice(1), [false, false]);
});

Then('the plan shows every task as done', function (this: FactoryWorld) {
  assert.ok(this.done().every(Boolean), `not every task is done: ${this.done()}`);
});

Then('there are three new work commits', function (this: FactoryWorld) {
  assert.equal(this.workCommits().length, 3);
});

Then('it contains the work for the {word} task', function (this: FactoryWorld, which: string) {
  const task = this.tasks()[ordinal[which]];
  assert.deepEqual(this.productFiles(this.workCommits()[0]), [`${task}.txt`]);
});

Given('the agent answers in prose, with no result', function (this: FactoryWorld) {
  writeFileSync(join(this.dir, 'agent-prose'), '');
});

Then("it reports that it could not read the agent's result", function (this: FactoryWorld) {
  assert.match(this.output, /could not read the agent's result/);
});
