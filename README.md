# Altal Heatpump Card

![Preview](preview.png)

A theme-aware neumorphic Home Assistant Lovelace card for the **Altal** heat pump.

## Features

- 🖼️ Hero image of the heat pump
- 🌡️ Real-time temperature display (current, target, ΔT)
- 🔥 Heating status with animated indicators
- 📊 ΔT diagnostic panel with smart analysis
- 🎛️ Climate controls (±, quick presets, HVAC modes)
- 🌗 Neumorphic surfaces and colors follow the active Home Assistant theme
- ⚙️ Visual card editor
- 🌡️ Tuya EVI inquiry labels (`c01`–`c31`) and native HVAC mode labels
- 🌀 Instrument-style live animation driven by the machine: the scale lights up to the current temperature, a light trace sweeps it at a pace set by the compressor frequency and fades out as the compressor coasts down, a sheen runs along the pipe from supply to return only while heat is delivered, and the glow follows power
- ⚡ Rendered once, then patched in place — state updates never rebuild the card or replay animations

## Installation (HACS)

1. Open HACS → Frontend → **+ Explore & Download Repositories**
2. Add this repository as a custom repository (category: Lovelace)
3. Install **Altal Heatpump Card**
4. Add the resource if not added automatically

## Manual Installation

1. Download `altal_heater_card.js` from the [latest release](../../releases/latest)
2. Copy to `config/www/altal_heater_card.js`
3. Add resource: **Settings → Dashboards → Resources → Add**
   - URL: `/local/altal_heater_card.js`
   - Type: JavaScript Module

## Usage

```yaml
type: custom:altal-heatpump-card-pro
name: Altal Heat Pump
climate_entity: climate.altal_home_heater
current_temp_entity: sensor.altal_current_temp
target_temp_entity: sensor.altal_target_temp
delta_t_entity: sensor.altal_delta_t
heating_entity: binary_sensor.altal_heating
image: /local/altal-pump.png
telemetry_prefix: altal_t_
show_telemetry: true
```

Optional live readings (each defaults to `sensor.<telemetry_prefix><name>` when it exists):

| Option | Default suffix | Used for |
| --- | --- | --- |
| `supply_entity` | `outlet_temp` | Supply temperature, water loop |
| `return_entity` | `inlet_temp` | Return temperature, water loop |
| `compressor_entity` | `comp_freq` | "Running" state, rotor speed |
| `power_entity` | `power` | Flow speed, glow intensity |
| `tank_entity` | `tank_temp` | DHW tank tile |
| `outdoor_entity` | `outdoor_temp` | Outdoor tile |
| `scale_min` / `scale_max` | `20` / `60` | Dial scale, °C |

"Running" comes from the compressor (frequency or power above zero), or from `heating_entity` when set. Water below the setpoint with the compressor stopped shows as *Ожидание*, and nothing animates then. If `delta_t_entity` is not set, ΔT is computed from supply and return. Animations are disabled when the system asks for reduced motion.

### Tuya Local (v4.6.0)

With the heat pump in [Tuya Local](https://github.com/make-all/tuya-local), the climate entity only knows heat/cool/off and the working mode lives in a separate select (*Combined mode*). Point `climate_entity` at the Tuya Local climate; the card then finds `select.<climate object id>_combined_mode` (a trailing `_2` is ignored) and shows its options as mode buttons: *Отопление*, *ГВС*, *Отопление + ГВС*. Pressing one sets the select and switches the unit on if it was off.

| Option | Default | Used for |
| --- | --- | --- |
| `mode_entity` | auto-detected | Working-mode select |
| `show_cooling` | `false` | Also offer the cooling modes (an active cooling mode is always shown) |

### Setpoint target and defrost (v4.7.0)

Tuya Local's *Temperature target* select decides whether the climate temperature and setpoint are the heating water or the DHW tank. The card shows it as an *Отопление | ГВС* switch above the setpoint (`target_entity`, auto-detected as `select.<climate object id>_temperature_target`). With the tank selected the dial reads *Бак сейчас* / *Уставка бака* and the quick setpoints switch to `dhw_presets` (default `45, 50, 55`); `quick_presets` stay for the heating water. Quick setpoints sit right under the setpoint.

Defrost comes from the climate's `hvac_action: defrosting` (or `binary_sensor.<prefix>defrost`). The badge then reads *Оттайка* in the cool colour and the diagnostics explain that the water cools briefly on purpose.

### Stale Tuya "off" (v4.7.1)

After a power blip the Tuya module can come back reporting the unit off while the controller keeps heating. When the climate says `off` but fresh telemetry (`last_update` younger than 10 min) shows the compressor running, the card trusts the compressor: the badge reads *Работает*, the animation runs, and the hint under the setpoint says *Tuya показывает «выкл»*. The power key still mirrors the Tuya state, because that is what pressing it toggles; pressing it re-syncs Tuya.

The telemetry header shows where the data comes from and how old it is (`локально · 20 с назад`), read from `sensor.<telemetry_prefix>last_update` and its `altal_source` attribute.

The card translates Home Assistant mode values for display (`hot`, `cold`, `hotwater`, `hot_hotwater`, `cold_hotwater`) but sends the original supported value to Home Assistant. The power control uses the entity's `hvac_modes` list and restores the last active mode when possible. The manual's c41/d41 setting controls which mode families are enabled; it is not the current runtime mode.

Tuya telemetry entities should use the configured prefix. For automatic labels/groups, include `cXX` in the entity ID or set `altal_inquire_id`; optional `altal_label` and `altal_group` attributes override the observed map. Inquiry values stay raw unless the integration has applied a verified unit/scale. `c04` is intentionally unmapped until observed.

## Build from Source

```bash
npm install
npm run build
```

Output: `dist/altal_heater_card.js`
