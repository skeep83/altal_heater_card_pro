/**
 * Labels observed in Tuya Device Logs for this EVI heat pump's Para. Inquiry DP.
 * This c01-c31 map is separate from the manufacturer's c01-c41 installer
 * parameter table. c04 was not observed in the Tuya inquiry log, so it stays
 * deliberately unmapped until the device reports it.
 */
const TUYA_INQUIRY_LABELS: Record<string, string> = {
  c01: 'Version No.',
  c02: 'Ambient Temp.',
  c03: 'Water Tank Temp.',
  c05: 'Inlet Water Temp.',
  c06: 'Evaporator Coil Temp.',
  c07: 'Exhaust Temp.',
  c08: 'Condenser Coil Temp.',
  c09: 'Suction Temp.',
  c10: 'IPM Module Temp.',
  c11: 'Main EEV Steps',
  c12: 'Auxiliary EEV Steps',
  c13: 'Exhaust Valve Steps',
  c14: 'Target Frequency',
  c15: 'Running Frequency',
  c16: 'AC Voltage',
  c17: 'DC Voltage',
  c18: 'Input Current',
  c19: 'Compressor Current',
  c20: 'Output Power',
  c21: 'Temp. before Auxiliary EEV',
  c22: 'Temp. after Auxiliary EEV',
  c23: 'Low Pressure',
  c24: 'High Pressure',
  c25: 'Error Code',
  c26: 'Limited Frequency Code',
  c27: 'Wire Controller Version',
  c28: 'MCU1 Version',
  c29: 'MCU2 Version',
  c30: 'MCU3 Version',
  c31: 'Error History',
};

const TUYA_INQUIRY_GROUPS: Record<string, string> = {
  c01: 'service',
  c02: 'other',
  c03: 'dhw',
  c05: 'heat',
  c06: 'refr',
  c07: 'refr',
  c08: 'refr',
  c09: 'refr',
  c10: 'comp',
  c11: 'comp',
  c12: 'comp',
  c13: 'comp',
  c14: 'comp',
  c15: 'comp',
  c16: 'elec',
  c17: 'elec',
  c18: 'elec',
  c19: 'elec',
  c20: 'elec',
  c21: 'refr',
  c22: 'refr',
  c23: 'refr',
  c24: 'refr',
  c25: 'service',
  c26: 'service',
  c27: 'service',
  c28: 'service',
  c29: 'service',
  c30: 'service',
  c31: 'service',
};

function normalizeInquiryCode(code: string | number): string | null {
  const match = String(code).trim().match(/^c?0*(\d{1,2})$/i);
  if (!match) return null;
  const id = Number(match[1]);
  if (!Number.isInteger(id) || id < 1 || id > 31) return null;
  return `c${String(id).padStart(2, '0')}`;
}

export function getTuyaInquiryLabel(code: string | number): string | null {
  const normalized = normalizeInquiryCode(code);
  return normalized ? TUYA_INQUIRY_LABELS[normalized] ?? null : null;
}

export function getTuyaInquiryGroup(code: string | number): string | null {
  const normalized = normalizeInquiryCode(code);
  return normalized ? TUYA_INQUIRY_GROUPS[normalized] ?? null : null;
}
