/**
 * Tuya app setup-parameter translations from the heat-pump manual.
 * c41 is the controller's installer parameter; Tuya app names that parameter d41.
 * It selects enabled operating-mode families, not the current climate hvac_mode.
 */
const MODE_AVAILABILITY_LABEL = 'Допустимые режимы системы';
const MODE_AVAILABILITY_OPTIONS: Record<string, string> = {
  '0': 'Охлаждение',
  '1': 'Охлаждение + отопление',
  '2': 'Отопление',
  '3': 'Охлаждение + отопление + ГВС',
  '4': 'Отопление',
  '5': 'Отопление + ГВС',
  '6': 'Охлаждение + ГВС',
};

function isModeAvailabilityParameter(parameterId: string | number): boolean {
  const normalized = String(parameterId).trim().toLowerCase();
  return normalized === 'c41' || normalized === 'd41' || normalized === '41';
}

export function getTuyaSettingLabel(parameterId: string | number): string | null {
  return isModeAvailabilityParameter(parameterId) ? MODE_AVAILABILITY_LABEL : null;
}

export function formatTuyaSettingValue(parameterId: string | number, value: string | number): string | null {
  if (!isModeAvailabilityParameter(parameterId)) return null;
  return MODE_AVAILABILITY_OPTIONS[String(value).trim()] ?? null;
}
