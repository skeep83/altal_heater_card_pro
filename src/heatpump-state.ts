/**
 * Pure helpers that turn raw heat-pump readings into what the card shows and
 * how fast its animations move. Kept free of DOM/HA types so they can be tested.
 */

export interface RunInputs {
  off: boolean;
  /** Compressor running frequency, Hz (null when no telemetry). */
  freq: number | null;
  /** Electrical/output power, kW (null when no telemetry). */
  power: number | null;
  /** State of an explicit heating binary_sensor, if configured. */
  heatingEntity: 'on' | 'off' | null;
  hvacAction: string | null;
  current: number | null;
  target: number | null;
}

export type RunKind = 'off' | 'running' | 'waiting' | 'reached';

export interface RunState {
  kind: RunKind;
  /** The compressor is actually doing work right now. */
  running: boolean;
  /** Water is below the setpoint, so heat is wanted. */
  demand: boolean;
  label: string;
}

const REACHED_BAND = 0.5;

/**
 * "Running" is decided by the machine itself (compressor frequency / power),
 * not by "water is colder than the setpoint": a heat pump often sits idle
 * between cycles while still below target, and the card must not animate then.
 */
export function computeRunState(i: RunInputs): RunState {
  if (i.off) return { kind: 'off', running: false, demand: false, label: 'Выкл' };

  const demand = i.current !== null && i.target !== null && i.current < i.target - REACHED_BAND;

  let running: boolean;
  if (i.heatingEntity !== null) running = i.heatingEntity === 'on';
  else if (i.freq !== null || i.power !== null) running = (i.freq ?? 0) > 0 || (i.power ?? 0) > 0.05;
  else if (i.hvacAction) running = i.hvacAction === 'heating' || i.hvacAction === 'cooling';
  else running = demand;

  if (running) return { kind: 'running', running, demand, label: 'Работает' };
  if (demand) return { kind: 'waiting', running, demand, label: 'Ожидание' };
  return { kind: 'reached', running, demand, label: 'Уставка достигнута' };
}

/** Rotor speed in degrees per second: ~1 rev/s at 60 Hz, never a frozen-looking crawl. */
export function rotorSpeed(running: boolean, freq: number | null): number {
  if (!running) return 0;
  const hz = freq !== null && freq > 0 ? freq : 30;
  return Math.max(40, Math.min(420, hz * 6));
}

/** Water flow speed along the pipe in SVG units per second, grows with delivered power. */
export function flowSpeed(running: boolean, power: number | null): number {
  if (!running) return 0;
  const kw = power !== null && power > 0 ? power : 3;
  return Math.max(14, Math.min(90, 12 + kw * 7));
}

/** Position of a value on a gauge scale, clamped to [0, 1]. */
export function scaleFraction(value: number | null, min: number, max: number): number {
  if (value === null || !Number.isFinite(value) || max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/** ΔT quality bucket used for colouring: 4–7 °C is the healthy band. */
export function deltaClass(dt: number | null): 'ok' | 'mid' | 'bad' | 'none' {
  if (dt === null || !Number.isFinite(dt)) return 'none';
  if (dt >= 4 && dt <= 7) return 'ok';
  if (dt < 3 || dt > 9) return 'bad';
  return 'mid';
}
