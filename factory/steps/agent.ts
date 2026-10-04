import { Given, Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { doubles, type FactoryWorld } from './workspace.ts';

Given('the agent plans the tasks alpha and beta, and does one task a pass', function (this: FactoryWorld) {
  this.agent = join(doubles, 'agent.mjs');
});

Given('no harness is chosen', function (this: FactoryWorld) {
  this.agent = undefined;
});

When('the factory runs one pass', function (this: FactoryWorld) {
  this.runFactory();
});

Then('pi has been called', function (this: FactoryWorld) {
  assert.ok(existsSync(join(this.dir, 'pi.log')), 'pi was not called');
});

Then('the chosen agent has been called', function (this: FactoryWorld) {
  assert.ok(existsSync(join(this.dir, 'agent.log')), 'the chosen agent was not called');
});

Then('pi has not been called', function (this: FactoryWorld) {
  assert.ok(!existsSync(join(this.dir, 'pi.log')), 'pi was called');
});

Given('the agent cannot be run', function (this: FactoryWorld) {
  this.agent = join(this.dir, 'no-such-agent');
});

Given('no plan', function (this: FactoryWorld) {
  rmSync(this.plan(), { force: true });
});

Then('it reports that it could not run the agent', function (this: FactoryWorld) {
  assert.match(this.output, /could not run the agent/);
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


Given('the agent writes a file called {word}', function (this: FactoryWorld, file: string) {
  writeFileSync(join(this.dir, 'agent-writes'), file);
});

Then('there is one new work commit', function (this: FactoryWorld) {
  assert.equal(this.workCommits().length, 1);
});

Then('its only product file is {word}', function (this: FactoryWorld, file: string) {
  assert.deepEqual(this.productFiles(this.workCommits()[0]), [file]);
});

Then('the agent was pointed at the plan and at the seed', function (this: FactoryWorld) {
  const prompt = this.lastPrompt();
  assert.ok(prompt.includes(this.plan()), `the prompt does not mention the plan:\n${prompt}`);
  assert.ok(prompt.includes(join(this.repo, this.seed)), `the prompt does not mention the seed:\n${prompt}`);
});

Then('the agent was asked for a result with the field {string}', function (this: FactoryWorld, field: string) {
  const prompt = this.lastPrompt();
  assert.ok(prompt.includes(`"${field}"`), `the prompt does not ask for "${field}":\n${prompt}`);
});

Given('the agent says {string} before its result', function (this: FactoryWorld, words: string) {
  writeFileSync(join(this.dir, 'agent-says'), words);
});

When('the factory runs to completion', function (this: FactoryWorld) {
  this.runFactory(['--all']);
});

Then('the agent has been called once', function (this: FactoryWorld) {
  const calls = readFileSync(join(this.dir, 'agent.log'), 'utf8').trim().split('\n');
  assert.equal(calls.length, 1);
});

Then('the factory has stopped', function (this: FactoryWorld) {
  assert.ok(this.stopped, 'the factory did not stop');
});

