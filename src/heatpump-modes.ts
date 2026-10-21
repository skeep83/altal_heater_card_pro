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
