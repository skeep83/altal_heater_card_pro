import test from 'node:test';
import assert from 'node:assert/strict';
import { choosePowerOnMode, getModeClass, getModeLabel } from '../src/heatpump-modes.ts';
import { getTuyaInquiryGroup, getTuyaInquiryLabel } from '../src/tuya-inquiry-map.ts';
import { formatTuyaSettingValue, getTuyaSettingLabel } from '../src/tuya-setting-map.ts';

test('labels Tuya working-mode enum values without changing service values', () => {
  assert.equal(getModeLabel('hot'), 'Отопление');
  assert.equal(getModeLabel('cold'), 'Охлаждение');
  assert.equal(getModeLabel('hotwater'), 'ГВС');
  assert.equal(getModeLabel('hot_hotwater'), 'Отопление + ГВС');
  assert.equal(getModeLabel('cold_hotwater'), 'Охлаждение + ГВС');
});

test('classifies mode values for theme-aware active colors', () => {
  assert.equal(getModeClass('hot'), 'heat');
  assert.equal(getModeClass('cold'), 'cool');
  assert.equal(getModeClass('hotwater'), 'water');
  assert.equal(getModeClass('hot_hotwater'), 'heat-water');
  assert.equal(getModeClass('cold_hotwater'), 'cool-water');
  assert.equal(getModeClass('off'), 'off');
});

test('restores the last supported non-off mode, otherwise prefers heating', () => {
  assert.equal(choosePowerOnMode(['hot', 'cold', 'hotwater', 'off'], 'cold'), 'cold');
  assert.equal(choosePowerOnMode(['hot', 'cold', 'hotwater', 'off'], 'off'), 'hot');
  assert.equal(choosePowerOnMode(['cold', 'hotwater', 'off']), 'hotwater');
  assert.equal(choosePowerOnMode(['off']), null);
});

test('keeps unknown Home Assistant mode names visible instead of guessing', () => {
  assert.equal(getModeLabel('heat_cool'), 'heat_cool');
  assert.equal(getModeClass('heat_cool'), 'other');
});

test('uses observed Tuya inquiry labels and leaves unobserved c04 unmapped', () => {
  assert.equal(getTuyaInquiryLabel('c03'), 'Water Tank Temp.');
  assert.equal(getTuyaInquiryLabel('c10'), 'IPM Module Temp.');
  assert.equal(getTuyaInquiryLabel('c31'), 'Error History');
  assert.equal(getTuyaInquiryLabel('c04'), null);
});

test('groups mapped Tuya inquiry points without overriding explicit labels', () => {
  assert.equal(getTuyaInquiryGroup('c03'), 'dhw');
  assert.equal(getTuyaInquiryGroup('c10'), 'comp');
  assert.equal(getTuyaInquiryGroup('c16'), 'elec');
  assert.equal(getTuyaInquiryGroup('c04'), null);
});

test('maps installer mode-availability parameter c41/d41 separately from runtime modes', () => {
  assert.equal(getTuyaSettingLabel('d41'), 'Допустимые режимы системы');
  assert.equal(getTuyaSettingLabel('c41'), 'Допустимые режимы системы');
  assert.equal(formatTuyaSettingValue('d41', '0'), 'Охлаждение');
  assert.equal(formatTuyaSettingValue('d41', '3'), 'Охлаждение + отопление + ГВС');
  assert.equal(formatTuyaSettingValue('d41', '5'), 'Отопление + ГВС');
  assert.equal(formatTuyaSettingValue('d41', '6'), 'Охлаждение + ГВС');
  assert.equal(formatTuyaSettingValue('d41', '9'), null);
  assert.equal(getTuyaSettingLabel('d15'), null);
});
