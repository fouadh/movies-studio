import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { Given, Then } from '@cucumber/cucumber';
import { join } from 'node:path';
import { doubles, type FactoryWorld } from './workspace.ts';
import assert from 'node:assert/strict';


Given('the planner plans the tasks alpha and beta', function (this: FactoryWorld) {
  this.machines.planner = join(doubles, 'planner.mjs');
});

Given('the doer does the next task in the plan', function (this: FactoryWorld) {
  this.machines.doer = join(doubles, 'doer.mjs');
});

Given('the validator is always satisfied', function (this: FactoryWorld) {
  this.machines.validator = join(doubles, 'validator.mjs');
});

Then("the doer's chosen harness has been called", function (this: FactoryWorld) {
  assert.ok(existsSync(join(this.dir, 'doer.log')), 'the doer was not called');
});

Given('the doer cannot be run', function (this: FactoryWorld) {
  this.machines.doer = join(this.dir, 'no-such-doer');
});

Then('it reports that it could not run the doer', function (this: FactoryWorld) {
  assert.match(this.output, /could not run the doer/);
});

Given('the doer writes a file called {word}', function (this: FactoryWorld, file: string) {
  writeFileSync(join(this.dir, 'doer-writes'), file);
});

Then('the doer was pointed at the plan and at the seed', function (this: FactoryWorld) {
  const prompt = this.lastPrompt('doer');
  assert.ok(prompt.includes(this.plan()), `the prompt does not mention the plan:\n${prompt}`);
  assert.ok(prompt.includes(join(this.repo, this.seed!)), `the prompt does not mention the seed:\n${prompt}`);
});

Then('the planner was asked for a result with the field {string}', function (this: FactoryWorld, field: string) {
  const prompt = this.lastPrompt('planner');
  assert.ok(prompt.includes(`"${field}"`), `the planner was not asked for "${field}":\n${prompt}`);
});

Given('the factory allows at most three attempts per pass', function (this: FactoryWorld) {
  this.attempts = 3;
});

Given('the validator is never satisfied', function (this: FactoryWorld) {
  writeFileSync(join(this.dir, 'validator-never'), '');
});

const calls = (world: FactoryWorld, machine: string) => {
  const log = join(world.dir, `${machine}.log`);
  return existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').length : 0;
};

const times: Record<string, number> = { once: 1, twice: 2, 'three times': 3 };

Then(/^the doer has been called (once|twice|three times)$/, function (this: FactoryWorld, count: string) {
  assert.equal(calls(this, 'doer'), times[count]);
});

Then('the doer has not been called', function (this: FactoryWorld) {
  assert.equal(calls(this, 'doer'), 0);
});

Then('the validator was asked for a result with the fields {string} and {string}', function (this: FactoryWorld, first: string, second: string) {
  const prompt = this.lastPrompt('validator');
  for (const field of [first, second]) assert.ok(prompt.includes(`"${field}"`), `the validator was not asked for "${field}":\n${prompt}`);
});

Given('the validator says {string} before its result', function (this: FactoryWorld, words: string) {
  writeFileSync(join(this.dir, 'validator-says'), words);
});

Given('the validator is not satisfied the first time', function (this: FactoryWorld) {
  writeFileSync(join(this.dir, 'validator-not-first'), '');
});

Then('it reports that the pass hit its limit', function (this: FactoryWorld) {
  assert.match(this.output, /hit its limit/);
});

Given('the validator answers in prose, with no result', function (this: FactoryWorld) {
  writeFileSync(join(this.dir, 'validator-prose'), '');
});

Then("it reports that it could not read the validator's result", function (this: FactoryWorld) {
  assert.match(this.output, /could not read the validator's result/);
});

Given('the planner keeps its plan in prose', function (this: FactoryWorld) {
  writeFileSync(join(this.dir, 'planner-prose-plan'), '');
});

Given('the doer keeps its plan in prose', function (this: FactoryWorld) {
  writeFileSync(join(this.dir, 'doer-prose-plan'), '');
});

Then('the validator was given the work for the second task', function (this: FactoryWorld) {
  const prompt = this.lastPrompt('validator');
  assert.ok(prompt.includes(`work for ${this.tasks()[1]}`), `the validator was not given the second task's work:\n${prompt}`);
});

Then('it was not given the work for the first task', function (this: FactoryWorld) {
  const prompt = this.lastPrompt('validator');
  assert.ok(!prompt.includes(`work for ${this.tasks()[0]}`), `the validator was given the first task's work:\n${prompt}`);
});

Given("the validator's lens is {word}", function (this: FactoryWorld, lens: string) {
  this.lens = lens;
});

Then('the validator was given {string}', function (this: FactoryWorld, lens: string) {
  const prompt = this.lastPrompt('validator');
  assert.ok(prompt.includes(lens), `the validator was not given "${lens}":\n${prompt}`);
});

Then("the doer was given the validator's findings", function (this: FactoryWorld) {
  const prompt = this.lastPrompt('doer');
  assert.ok(prompt.includes('the work is not good enough'), `the doer was not given the findings:\n${prompt}`);
});
