import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { type FactoryWorld } from './workspace.ts';

Given('no harness is chosen', function (this: FactoryWorld) {
  this.machines = {};
});

When('the factory runs one pass', function (this: FactoryWorld) {
  this.runFactory();
});

Then('pi has been called', function (this: FactoryWorld) {
  assert.ok(existsSync(join(this.dir, 'pi.log')), 'pi was not called');
});

Then('pi has not been called', function (this: FactoryWorld) {
  assert.ok(!existsSync(join(this.dir, 'pi.log')), 'pi was called');
});

Given('no plan', function (this: FactoryWorld) {
  rmSync(this.plan(), { force: true });
});

Then('there is no plan', function (this: FactoryWorld) {
  assert.ok(!existsSync(this.plan()), 'there is a plan');
});

Then('there are no new commits', function (this: FactoryWorld) {
  assert.equal(this.commits(), this.commitsBefore);
});

Then('the plan has the tasks {string} and {string}, and no others', function (this: FactoryWorld, first: string, second: string) {
  assert.deepEqual(this.tasks(), [first, second]);
});

Given('a plan with three tasks, none of them done', function (this: FactoryWorld) {
  this.givenPlan('- [ ] one\n- [ ] two\n- [ ] three\n');
});

Given('a plan in which every task is done', function (this: FactoryWorld) {
  this.givenPlan('- [x] one\n- [x] two\n- [x] three\n');
});

Then('there is one new work commit', function (this: FactoryWorld) {
  assert.equal(this.workCommits().length, 1);
});

Then('its only product file is {word}', function (this: FactoryWorld, file: string) {
  assert.deepEqual(this.productFiles(this.workCommits()[0]), [file]);
});

When('the factory runs to completion', function (this: FactoryWorld) {
  this.runFactory(['--all']);
});

Then('the factory has stopped', function (this: FactoryWorld) {
  assert.ok(this.stopped, 'the factory did not stop');
});

