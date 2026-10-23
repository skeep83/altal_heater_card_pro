import test from 'node:test';
import assert from 'node:assert/strict';
import { computeRunState, deltaClass, flowSpeed, rotorSpeed, scaleFraction } from '../src/heatpump-state.ts';

const base = { off: false, freq: null, power: null, heatingEntity: null, hvacAction: null, current: 31, target: 35 };

test('compressor telemetry decides "running", not water below setpoint', () => {
  assert.equal(computeRunState({ ...base, freq: 0, power: 0 }).kind, 'waiting');
  assert.equal(computeRunState({ ...base, freq: 50, power: 9.8 }).kind, 'running');
  assert.equal(computeRunState({ ...base, freq: 0, power: 0, current: 35 }).kind, 'reached');
});

test('explicit heating entity wins over telemetry', () => {
  assert.equal(computeRunState({ ...base, freq: 50, heatingEntity: 'off' }).running, false);
  assert.equal(computeRunState({ ...base, freq: 0, heatingEntity: 'on' }).running, true);
});

test('without telemetry falls back to hvac_action, then to demand', () => {
  assert.equal(computeRunState({ ...base, hvacAction: 'idle' }).running, false);
  assert.equal(computeRunState({ ...base, hvacAction: 'heating' }).running, true);
  assert.equal(computeRunState({ ...base }).running, true);
});

test('off mode is never running', () => {
  assert.deepEqual(computeRunState({ ...base, off: true, freq: 50 }).kind, 'off');
});

test('animation speeds stop when idle and grow with load', () => {
  assert.equal(rotorSpeed(false, 60), 0);
  assert.equal(flowSpeed(false, 9), 0);
  assert.ok(rotorSpeed(true, 70) > rotorSpeed(true, 30));
  assert.ok(flowSpeed(true, 10) > flowSpeed(true, 2));
  assert.ok(rotorSpeed(true, 1) >= 40, 'never a frozen-looking crawl');
});

test('gauge fraction and ΔT bands', () => {
  assert.equal(scaleFraction(40, 20, 60), 0.5);
  assert.equal(scaleFraction(80, 20, 60), 1);
  assert.equal(scaleFraction(null, 20, 60), 0);
  assert.equal(deltaClass(5), 'ok');
  assert.equal(deltaClass(8), 'mid');
  assert.equal(deltaClass(14.8), 'bad');
  assert.equal(deltaClass(null), 'none');
});
