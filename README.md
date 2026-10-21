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

The card translates Home Assistant mode values for display (`hot`, `cold`, `hotwater`, `hot_hotwater`, `cold_hotwater`) but sends the original supported value to Home Assistant. The power control uses the entity's `hvac_modes` list and restores the last active mode when possible. The manual's c41/d41 setting controls which mode families are enabled; it is not the current runtime mode.

Tuya telemetry entities should use the configured prefix. For automatic labels/groups, include `cXX` in the entity ID or set `altal_inquire_id`; optional `altal_label` and `altal_group` attributes override the observed map. Inquiry values stay raw unless the integration has applied a verified unit/scale. `c04` is intentionally unmapped until observed.

## Build from Source

```bash
npm install
npm run build
```

Output: `dist/altal_heater_card.js`
