/**
 * Runtime mode helpers for the Tuya climate entity.
 * These are Home Assistant hvac_mode strings; do not convert them to the
 * manufacturer's numeric installer parameter (c41), which is a separate setting.
 */
const MODE_LABELS: Record<string, string> = {
  heat: 'Отопление',
  hot: 'Отопление',
  cool: 'Охлаждение',
  cold: 'Охлаждение',
  hotwater: 'ГВС',
  dhw: 'ГВС',
  hot_hotwater: 'Отопление + ГВС',
  cold_hotwater: 'Охлаждение + ГВС',
  auto: 'Авто',
  off: 'Выкл',
};

const MODE_CLASSES: Record<string, string> = {
  heat: 'heat',
  hot: 'heat',
  cool: 'cool',
  cold: 'cool',
  hotwater: 'water',
  dhw: 'water',
  hot_hotwater: 'heat-water',
  cold_hotwater: 'cool-water',
  auto: 'auto',
  off: 'off',
};

export function getModeLabel(mode: string): string {
  return MODE_LABELS[mode.toLowerCase()] ?? mode;
}

export function getModeClass(mode: string): string {
  return MODE_CLASSES[mode.toLowerCase()] ?? 'other';
}

/**
 * Tuya Local exposes the working mode as a select ("Combined mode") next to a
 * plain heat/cool/off climate entity. Its options map onto the same codes the
 * cloud climate used, so labels, icons and colours stay shared.
 */
const LOCAL_MODE_CODES: Record<string, string> = {
  'heating only': 'hot',
  'cooling only': 'cold',
  'hot water only': 'hotwater',
  'hot water + heating': 'hot_hotwater',
  'hot water + cooling': 'cold_hotwater',
};

export function localModeCode(option: string | null | undefined): string | null {
  if (typeof option !== 'string') return null;
  return LOCAL_MODE_CODES[option.trim().toLowerCase()] ?? null;
}

export function isCoolingMode(code: string | null | undefined): boolean {
  return typeof code === 'string' && /^(cold|cool)/.test(code.toLowerCase());
}

/**
 * Mode buttons for the combined-mode select. Cooling options are hidden unless
 * asked for or currently active, because most installations only heat.
 */
export function localModeButtons(
  options: unknown,
  current: string | null | undefined,
  showCooling = false,
): { option: string; code: string }[] {
  if (!Array.isArray(options)) return [];
  const currentCode = localModeCode(current);
  return options
    .filter((o): o is string => typeof o === 'string')
    .map((option) => ({ option, code: localModeCode(option) }))
    .filter((b): b is { option: string; code: string } => b.code !== null)
    .filter((b) => showCooling || !isCoolingMode(b.code) || b.code === currentCode);
}

/** The combined-mode select that belongs to a Tuya Local climate entity, if Home Assistant has one. */
export function findModeSelect(climateId: string, states: Record<string, unknown>): string | null {
  const obj = climateId.split('.')[1] ?? '';
  for (const base of [obj, obj.replace(/_\d+$/, '')]) {
    const id = `select.${base}_combined_mode`;
    if (base && states[id]) return id;
  }
  return null;
}

/** Return an allowed native HA mode, never a translated/display label. */
export function choosePowerOnMode(modes: string[], lastMode?: string | null): string | null {
  const usable = modes.filter((mode) => typeof mode === 'string' && mode.toLowerCase() !== 'off');
  if (!usable.length) return null;

  if (lastMode) {
    const remembered = usable.find((mode) => mode.toLowerCase() === lastMode.toLowerCase());
    if (remembered) return remembered;
  }

  const preference = ['hot', 'heat', 'hot_hotwater', 'hotwater', 'dhw', 'auto', 'heat_cool', 'cold', 'cool', 'cold_hotwater'];
  for (const wanted of preference) {
    const match = usable.find((mode) => mode.toLowerCase() === wanted);
    if (match) return match;
  }
  return usable[0];
}
