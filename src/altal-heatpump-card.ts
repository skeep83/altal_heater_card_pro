/**
 * Altal Heater Card — Home Assistant Lovelace Custom Card
 * Premium neumorphic card — Smart Home App style
 * v4.5.0 — built once, then patched in place; animations follow the compressor
 */

import './altal-heatpump-card-editor';
import { choosePowerOnMode, getModeClass, getModeLabel } from './heatpump-modes';
import { getTuyaInquiryGroup, getTuyaInquiryLabel } from './tuya-inquiry-map';
import { formatTuyaSettingValue, getTuyaSettingLabel } from './tuya-setting-map';
import { computeRunState, deltaClass, flowSpeed, rotorSpeed, scaleFraction, type RunState } from './heatpump-state';

/* ═══════════════════ Types ═══════════════════ */

interface CardConfig {
  climate_entity: string;
  current_temp_entity: string;
  target_temp_entity: string;
  delta_t_entity: string;
  heating_entity: string;
  name?: string;
  image?: string;
  quick_presets?: number[];
  step?: number;
  show_diagnostics?: boolean;
  show_presets?: boolean;
  show_controls?: boolean;
  show_image?: boolean;
  compact?: boolean;

  // v4.2.0 Additions
  text_color?: string;
  animation_color?: string;

  // Tuya inquiry entities; the daemon supplies raw values and optional metadata.
  telemetry_prefix?: string;   // default 'altal_t_'
  show_telemetry?: boolean;

  // v4.5.0: live readings that drive the animations. Each defaults to
  // sensor.<telemetry_prefix><name> when that entity exists.
  supply_entity?: string;      // outlet_temp
  return_entity?: string;      // inlet_temp
  compressor_entity?: string;  // comp_freq
  power_entity?: string;       // power
  tank_entity?: string;        // tank_temp
  outdoor_entity?: string;     // outdoor_temp
  scale_min?: number;          // dial scale, °C (default 20)
  scale_max?: number;          // dial scale, °C (default 60)
}

interface HassEntity {
  state: string;
  attributes: Record<string, any>;
  entity_id: string;
  last_changed?: string;
}

interface Hass {
  states: Record<string, HassEntity>;
  callService: (domain: string, service: string, data: Record<string, unknown>) => Promise<void>;
  config: { unit_system: { temperature: string } };
}

/* ═══════════════════ Card ═══════════════════ */

class AltalHeatpumpCard extends HTMLElement {
  private _config!: CardConfig;
  private _hass!: Hass;
  private _root!: ShadowRoot;
  private _history: { t: number; ts: number }[] = [];
  private _pendingTarget: number | null = null;
  private _svcTimer: ReturnType<typeof setTimeout> | null = null;
  private _cachedGraph: Record<string, { time: number; svg: string; min: number; max: number }> = {};
  private _activeGraphEntity: string | null = null;
  private _telOpen = false;
  private _paramsOpen = false;
  private _lastActiveMode: string | null = null;

  // DOM is rebuilt only when this key changes; everything else is patched in place
  private _structKey = '';
  private _lastTelHtml = '';
  private _numTweens = new WeakMap<Element, { from: number; to: number; raf: number }>();

  // Physics-driven animation: rotor angle and water flow integrate a speed that
  // eases toward the live target, so the pump visibly spins up and coasts down.
  private _anim = { rot: 0, sweep: 0, flow: 0, spd: 0, flowSpd: 0, tgtSpd: 0, tgtFlow: 0, raf: 0, last: 0 };
  private _comets: SVGElement[] = [];
  private _sheen: SVGElement | null = null;
  private _sheenGrad: SVGElement | null = null;
  private _reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor() {
    super();
    this._root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (this._anim.tgtSpd || this._anim.tgtFlow) this._kick();
  }

  disconnectedCallback() {
    if (this._anim.raf) cancelAnimationFrame(this._anim.raf);
    this._anim.raf = 0;
    this._anim.last = 0;
  }

  static getConfigElement() { return document.createElement('altal-heatpump-card-editor'); }

  static getStubConfig() {
    return {
      climate_entity: 'climate.altal_home_heater',
      current_temp_entity: 'sensor.altal_current_temp',
      target_temp_entity: 'sensor.altal_target_temp',
      delta_t_entity: 'sensor.altal_delta_t',
      heating_entity: 'binary_sensor.altal_heating',
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: true, show_presets: true,
      show_controls: true, show_image: true, compact: false,
      text_color: '',
      animation_color: ''
    };
  }

  setConfig(config: CardConfig) {
    if (!config.climate_entity) throw new Error('Укажите climate_entity');
    this._config = {
      step: 0.5, quick_presets: [19, 20, 22, 24],
      show_diagnostics: true, show_presets: true,
      show_controls: true, show_image: true, compact: false,
      ...config,
    };
    this._structKey = '';
    if (this._hass) this._render();
  }

  set hass(hass: Hass) {
    const prev = this._hass;
    this._hass = hass;

    const c = this._v(hass, this._config.current_temp_entity);
    if (c !== null) {
      const now = Date.now();
      this._history.push({ t: c, ts: now });
      this._history = this._history.filter(r => r.ts > now - 30 * 60_000);
    }

    if (this._pendingTarget !== null) {
      const haT = hass.states[this._config.climate_entity]?.attributes?.temperature;
      if (haT != null && Math.abs(parseFloat(haT) - this._pendingTarget) < 0.01)
        this._pendingTarget = null;
    }

    const chg = !prev ||
      prev.states[this._config.climate_entity] !== hass.states[this._config.climate_entity] ||
      prev.states[this._config.current_temp_entity] !== hass.states[this._config.current_temp_entity] ||
      prev.states[this._config.target_temp_entity] !== hass.states[this._config.target_temp_entity] ||
      prev.states[this._config.delta_t_entity] !== hass.states[this._config.delta_t_entity] ||
      prev.states[this._config.heating_entity] !== hass.states[this._config.heating_entity] ||
      [this._config.supply_entity, this._config.return_entity, this._config.compressor_entity,
        this._config.power_entity, this._config.tank_entity, this._config.outdoor_entity]
        .some(id => id && prev.states[id] !== hass.states[id]) ||
      this._telSignature(prev) !== this._telSignature(hass);

    if (chg) this._render();
  }

  /* ── Live entity resolution ────────────── */

  /** Configured entity, else sensor.<prefix><suffix> if Home Assistant has it. */
  private _ent(configured: string | undefined, suffix: string): string | null {
    if (configured) return configured;
    const id = `sensor.${this._config.telemetry_prefix || 'altal_t_'}${suffix}`;
    return this._hass?.states?.[id] ? id : null;
  }

  private _live() {
    const C = this._config, H = this._hass;
    const e = {
      supply: this._ent(C.supply_entity, 'outlet_temp'),
      ret: this._ent(C.return_entity, 'inlet_temp'),
      freq: this._ent(C.compressor_entity, 'comp_freq'),
      power: this._ent(C.power_entity, 'power'),
      tank: this._ent(C.tank_entity, 'tank_temp'),
      outdoor: this._ent(C.outdoor_entity, 'outdoor_temp'),
      tankSet: this._ent(undefined, 'param_tank_set'),
    };
    const v = (id: string | null) => (id ? this._v(H, id) : null);
    const supply = v(e.supply), ret = v(e.ret);
    const dtEnt = C.delta_t_entity ? this._v(H, C.delta_t_entity) : null;
    const dt = dtEnt ?? (supply !== null && ret !== null ? Math.round((supply - ret) * 10) / 10 : null);
    return {
      e, supply, ret, dt,
      freq: v(e.freq), power: v(e.power), tank: v(e.tank), outdoor: v(e.outdoor), tankSet: v(e.tankSet),
    };
  }

  getCardSize() { return this._config?.compact ? 4 : 7; }

  /* ── Tuya inquiry telemetry ─────────────── */

  private _telSignature(hass: Hass): string {
    const pfx = this._config?.telemetry_prefix || 'altal_t_';
    let sig = '';
    for (const id of Object.keys(hass.states)) {
      if (id.startsWith('sensor.' + pfx) || id.startsWith('binary_sensor.' + pfx))
        sig += id + '=' + hass.states[id].state + ';';
    }
    return sig;
  }

  private _collectTelemetry(hass: Hass) {
    const pfx = this._config.telemetry_prefix || 'altal_t_';
    const groups: Record<string, { label: string; value: string; hot?: boolean; bad?: boolean }[]> = {};
    for (const id of Object.keys(hass.states)) {
      let base: string | null = null;
      if (id.startsWith('sensor.' + pfx)) base = id.slice(('sensor.' + pfx).length);
      else if (id.startsWith('binary_sensor.' + pfx)) base = id.slice(('binary_sensor.' + pfx).length);
      if (!base) continue;
      const st = hass.states[id];
      const a = st.attributes || {};
      const codeMatch = base.match(/(?:^|_)(c0*\d{1,2})(?:_|$)/i);
      const inquiryCode = a.altal_inquire_id ?? a.inquire_id ?? codeMatch?.[1] ?? null;
      const settingCodeMatch = base.match(/(?:^|_)([cd]0*\d{1,2})(?:_|$)/i);
      const settingCode = a.altal_setting_id ?? settingCodeMatch?.[1] ?? null;
      const settingLabel = settingCode ? getTuyaSettingLabel(settingCode) : null;
      const group: string = a.altal_group || (settingLabel ? 'params' : null) ||
        (inquiryCode ? getTuyaInquiryGroup(inquiryCode) : null) || 'other';
      const label: string = a.altal_label || settingLabel ||
        (inquiryCode ? getTuyaInquiryLabel(inquiryCode) : null) || base.replace(/_/g, ' ');
      let value: string;
      const isBin = id.startsWith('binary_sensor.');
      const mappedSettingValue = settingCode ? formatTuyaSettingValue(settingCode, st.state) : null;
      if (a.altal_display != null) value = String(a.altal_display);
      else if (mappedSettingValue !== null) value = mappedSettingValue;
      else if (isBin) value = st.state === 'on' ? 'Да' : 'Нет';
      else if (st.state === 'unknown' || st.state === 'unavailable') continue;
      else value = st.state + (a.unit_of_measurement ? ' ' + a.unit_of_measurement : '');
      const bad = isBin ? st.state === 'on' && (a.device_class === 'problem' || a.device_class === 'cold') : false;
      (groups[group] = groups[group] || []).push({ label, value, bad });
    }
    return groups;
  }

  private _renderTelemetry(hass: Hass): string {
    if (this._config.show_telemetry === false) return '';
    if (!Object.keys(this._collectTelemetry(hass)).length) return '';
    return `
      <div class="telemetry">
        <button class="tel-toggle ${this._telOpen ? 'open' : ''}" id="tel_toggle">
          <span>Телеметрия теплового насоса</span><span class="arr">▾</span>
        </button>
        <div class="tel-body ${this._telOpen ? 'open' : ''}">${this._telOpen ? this._telBody(hass) : ''}</div>
      </div>`;
  }

  private _telBody(hass: Hass): string {
    const groups = this._collectTelemetry(hass);
    const groupNames: Record<string, string> = {
      heat: 'Отопление', dhw: 'Горячая вода', refr: 'Фреоновый контур',
      comp: 'Компрессор', elec: 'Электрика', service: 'Состояние', other: 'Прочее',
    };
    const order = ['service', 'heat', 'dhw', 'comp', 'refr', 'elec', 'other'];
    const params = groups['params'] || [];
    let body = '';
    for (const g of order) {
      const cells = groups[g];
      if (!cells || !cells.length) continue;
      body += `<div class="tel-group"><div class="tel-glbl">${groupNames[g] || g}</div><div class="tel-grid">` +
        cells.map(c => `<div class="tel-cell"><div class="tv ${c.bad ? 'bad' : ''}">${c.value}</div><div class="tl">${c.label}</div></div>`).join('') +
        `</div></div>`;
    }
    if (params.length) {
      body += `<button class="tel-params-link" id="tel_params">${this._paramsOpen ? '▲ Скрыть параметры' : '▼ Параметры настройки (' + params.length + ')'}</button>`;
      if (this._paramsOpen) {
        body += `<div class="tel-group"><div class="tel-grid">` +
          params.map(c => `<div class="tel-cell"><div class="tv">${c.value}</div><div class="tl">${c.label}</div></div>`).join('') +
          `</div></div>`;
      }
    }
    return body;
  }

  /* ── Helpers ───────────────────────────── */

  private _v(h: Hass, e: string): number | null {
    const s = h?.states?.[e];
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return null;
    const n = parseFloat(s.state);
    return isNaN(n) ? null : n;
  }

  private _trend(): 'up' | 'down' | 'flat' {
    if (this._history.length < 3) return 'flat';
    const r = this._history.slice(-5);
    const d = r[r.length - 1].t - r[0].t;
    return d > 0.3 ? 'up' : d < -0.3 ? 'down' : 'flat';
  }

  /**
   * ΔT Diagnostic logic:
   * ΔT = temperature difference between supply (подача) and return (обратка).
   * Optimal range: 4–7°C when actively heating.
   * 
   * States:
   * - Not heating → no diagnostic shown
   * - ΔT = 0 or unavailable → "waiting for data"
   * - Near setpoint (diff ≤ 0.7°C) → modulation mode, low ΔT is normal
   * - Far from setpoint + abnormal ΔT → transitional/defrost
   * - ΔT 4–7°C → optimal
   * - ΔT < 4°C → too low (high flow rate, many circuits, low compressor power)
   * - ΔT > 7°C → too high (restricted flow, dirty filter, air in system)
   */
  private _dtDiag(dt: number | null, cur: number | null, tgt: number | null, heating: boolean) {
    const empty = { icon: '', title: '', text: '', cls: 'hide' };
    if (!heating) return empty;
    if (dt === null || dt === 0) return { icon: '⏳', title: 'Ожидание данных ΔT', text: 'Данные ещё не получены', cls: 'neutral' };

    const diff = (tgt ?? 0) - (cur ?? 0);

    // Near setpoint → modulation, low ΔT expected
    if (diff <= 0.7 && diff >= -0.5) {
      return {
        icon: '🟢', title: 'Режим поддержания',
        text: `Температура близка к уставке. ΔT ${dt.toFixed(1)}°C — нормально при модуляции`,
        cls: 'good'
      };
    }

    // Far from setpoint + suspicious ΔT → transitional/defrost
    if (diff >= 1.5 && (dt < 2 || dt > 10)) {
      return {
        icon: '🧊', title: 'Переходный режим',
        text: `Нагрев: ${cur?.toFixed(1)} → ${tgt?.toFixed(1)}°C. ΔT=${dt.toFixed(1)}°C — ещё не стабилизировался`,
        cls: 'info'
      };
    }

    // Optimal ΔT
    if (dt >= 4 && dt <= 7) {
      return {
        icon: '✅', title: `ΔT в норме: ${dt.toFixed(1)}°C`,
        text: 'Оптимальная разница подача–обратка',
        cls: 'good'
      };
    }

    // ΔT too low
    if (dt < 4) {
      return {
        icon: '⚠️', title: `ΔT низкий: ${dt.toFixed(1)}°C`,
        text: 'Возможные причины: высокий расход, много контуров, низкая мощность компрессора',
        cls: 'warn'
      };
    }

    // ΔT too high (> 7)
    return {
      icon: '⚠️', title: `ΔT высокий: ${dt.toFixed(1)}°C`,
      text: 'Возможные причины: малый расход, засорён фильтр, воздух в системе, закрыты клапаны',
      cls: 'warn'
    };
  }

  /* ── Actions ───────────────────────────── */

  private _adjust(dir: number) {
    const step = this._config.step || 0.5;
    const cl = this._hass.states[this._config.climate_entity];
    const base = this._pendingTarget ?? parseFloat(cl?.attributes?.temperature);
    if (isNaN(base)) return;

    const next = Math.round((base + dir * step) * 10) / 10;
    const clamped = Math.max(cl?.attributes?.min_temp ?? 5, Math.min(cl?.attributes?.max_temp ?? 35, next));

    this._pendingTarget = clamped;

    // Instant UI update
    const el = this._root.querySelector('.sp-val');
    if (el) el.textContent = clamped.toFixed(1) + '°';
    this._render();

    // Debounced service call
    if (this._svcTimer) clearTimeout(this._svcTimer);
    this._svcTimer = setTimeout(() => {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.climate_entity, temperature: clamped,
      });
    }, 600);
  }

  private _preset(temp: number) {
    this._pendingTarget = temp;
    const el = this._root.querySelector('.sp-val');
    if (el) el.textContent = temp.toFixed(1) + '°';
    this._render();
    if (this._svcTimer) clearTimeout(this._svcTimer);
    this._svcTimer = setTimeout(() => {
      this._hass.callService('climate', 'set_temperature', {
        entity_id: this._config.climate_entity, temperature: temp,
      });
    }, 300);
  }

  private _mode(m: string) {
    const cl = this._hass.states[this._config.climate_entity];
    const supportedModes = cl?.attributes?.hvac_modes;
    if (Array.isArray(supportedModes) && supportedModes.length && !supportedModes.includes(m)) return;

    if (m.toLowerCase() === 'off') {
      if (cl?.state && cl.state.toLowerCase() !== 'off') this._lastActiveMode = cl.state;
    } else {
      this._lastActiveMode = m;
    }
    this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.climate_entity, hvac_mode: m,
    });
  }

  private _togglePower() {
    const cl = this._hass.states[this._config.climate_entity];
    if (!cl) return;
    const modes: string[] = Array.isArray(cl.attributes?.hvac_modes)
      ? cl.attributes.hvac_modes.filter((mode: unknown): mode is string => typeof mode === 'string')
      : ['heat', 'off'];

    if (cl.state.toLowerCase() === 'off') {
      const restoreMode = choosePowerOnMode(modes, this._lastActiveMode);
      if (restoreMode) this._mode(restoreMode);
      return;
    }

    const offMode = modes.find(mode => mode.toLowerCase() === 'off');
    if (offMode) this._mode(offMode);
  }

  /* ── Interactive Graphs ────────────────────── */

  private async _fetchGraph(entity_id: string, name: string) {
    if (this._activeGraphEntity === entity_id) {
      this._activeGraphEntity = null; // Toggle off
      this._render();
      return;
    }

    this._activeGraphEntity = entity_id;
    this._render(); // Render loading state

    const now = new Date();
    const past = new Date(now.getTime() - 24 * 60 * 60 * 1000); // last 24h
    const cache = this._cachedGraph[entity_id];

    // Cache for 5 minutes
    if (cache && now.getTime() - cache.time < 300000) {
      this._render();
      return;
    }

    try {
      const startStr = past.toISOString();
      const endStr = now.toISOString();
      // Use minimal_response to save bandwidth
      const res = await (this._hass as any).callApi(
        'GET',
        `history/period/${startStr}?filter_entity_id=${entity_id}&end_time=${endStr}&minimal_response`
      );

      if (res && res[0] && res[0].length > 0) {
        let min = Infinity;
        let max = -Infinity;
        const pts: { x: number; y: number }[] = [];

        const startTime = past.getTime();
        const timeSpan = now.getTime() - startTime;

        for (const s of res[0]) {
          const val = parseFloat(s.state);
          if (isNaN(val)) continue;
          if (val < min) min = val;
          if (val > max) max = val;

          const ts = new Date(s.last_changed).getTime();
          pts.push({ x: (ts - startTime) / timeSpan, y: val });
        }

        // Add current state at 100% X
        const curStr = this._hass.states[entity_id]?.state;
        if (curStr) {
          const val = parseFloat(curStr);
          if (!isNaN(val)) {
            pts.push({ x: 1, y: val });
            if (val < min) min = val;
            if (val > max) max = val;
          }
        }

        if (pts.length > 1) {
          // Add 10% padding to Y axis
          const spread = max - min;
          const yPad = spread === 0 ? 1 : spread * 0.1;
          const yMin = min - yPad;
          const yMax = max + yPad;
          const ySpan = yMax - yMin;

          // Generate SVG path
          const w = 300;
          const h = 60;
          let path = `M ${pts[0].x * w},${h - ((pts[0].y - yMin) / ySpan) * h}`;
          let fillPath = `${path}`;

          for (let i = 1; i < pts.length; i++) {
            const x = pts[i].x * w;
            const y = h - ((pts[i].y - yMin) / ySpan) * h;
            // Simple line for efficiency over 24h of data
            path += ` L ${x},${y}`;
          }

          fillPath = `${path} L ${w},${h} L 0,${h} Z`;

          const svg = `
            <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%; height:60px; margin-top:10px; overflow:visible;">
              <defs>
                <linearGradient id="gf_${entity_id}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--heat)" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="var(--heat)" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <path d="${fillPath}" fill="url(#gf_${entity_id})" />
              <path d="${path}" fill="none" stroke="var(--heat)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          `;

          this._cachedGraph[entity_id] = { time: now.getTime(), svg, min, max };
          if (this._activeGraphEntity === entity_id) this._render();
        } else {
          this._activeGraphEntity = null; // Not enough data
          this._render();
        }
      } else {
        this._activeGraphEntity = null; // No history recorded for this entity
        this._render();
      }
    } catch (e) {
      console.warn("Altal Card - History fetch failed", e);
      this._activeGraphEntity = null;
      this._render();
    }
  }

  /* ── Neumorphic SVG Icons (thin stroke style) ── */
  private _ico = {
    thermo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 10-5 0v11.26a4.5 4.5 0 105 0z"/><circle cx="11.5" cy="18" r="1.5" fill="currentColor" stroke="none"/><line x1="11.5" y1="14" x2="11.5" y2="18"/></svg>`,
    target: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`,
    delta: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 4l-8 16h16z"/></svg>`,
    flame: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-1.8 1.5-3.2 3-5 1.5 1.8 3 3.2 3 5 0 1.7-1.3 3-3 3z"/></svg>`,
    minus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
    plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>`,
    power: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v8"/><path d="M17.66 6.34a8 8 0 11-11.32 0"/></svg>`,
    heat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/></svg>`,
    cool: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M20 6L4 18M8 3l4 3 4-3M8 21l4-3 4 3M3 10l1-4 4 1M21 10l-1-4-4 1M3 14l1 4 4-1M21 14l-1 4-4-1"/></svg>`,
    water: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s7 7.2 7 12a7 7 0 1 1-14 0c0-4.8 7-12 7-12z"/><path d="M9 16a3 3 0 0 0 3 3"/></svg>`,
    auto: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"/></svg>`,
    off: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    up: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>`,
    down: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
    stable: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    rotor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7 2 0 2 3 0 5l-2.3 2.6M14 12c4 0 7 1 7 4 0 2-3 2-5 0l-2.6-2.3M12 14c0 4-1 7-4 7-2 0-2-3 0-5l2.3-2.6M10 12c-4 0-7-1-7-4 0-2 3-2 5 0l2.6 2.3"/></svg>`,
    bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>`,
    tank: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="4"/><path d="M6 13c2-1 4 1 6 0s4-1 6 0"/></svg>`,
    outdoor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M17 3v4"/></svg>`,
  };

  /* ══════════════════ CSS ══════════════════ */

  private _css(): string {
    const customText = this._config?.text_color || 'var(--aerogel-text, var(--primary-text-color, #3b3f5c))';
    const customHeat = this._config?.animation_color || 'var(--aerogel-warning, var(--state-climate-heat-color, var(--accent-color, var(--warning-color, #f07b3f))))';

    return `
      :host {
        --bg: var(--neumorphic-surface, var(--aerogel-base, var(--card-background-color, var(--ha-card-background, var(--primary-background-color, #e3e6ec)))));
        --txt: ${customText};
        --txt2: var(--aerogel-text-secondary, var(--secondary-text-color, color-mix(in srgb, var(--txt) 65%, var(--bg) 35%)));
        --accent: var(--aerogel-accent, var(--primary-color, #6CB4EE));

        --shadow-dark: color-mix(in srgb, var(--bg) 78%, var(--primary-text-color, #3b3f5c) 22%);
        --shadow-light: color-mix(in srgb, var(--bg) 86%, white 14%);
        --raised: var(--neumorphic-convex-shadow-md, var(--aerogel-convex-lg, 6px 6px 12px var(--shadow-dark), -6px -6px 12px var(--shadow-light)));
        --raised-s: var(--neumorphic-convex-shadow-sm, var(--aerogel-convex-sm, 3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)));
        --raised-xs: var(--neumorphic-convex-shadow-xs, 2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light));
        --inset: var(--neumorphic-concave-shadow-md, var(--aerogel-concave-lg, inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light)));
        --inset-s: var(--neumorphic-concave-shadow-sm, var(--aerogel-concave-sm, inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light)));
        --inset-xs: var(--neumorphic-concave-shadow-xs, inset 1px 1px 2px var(--shadow-dark), inset -1px -1px 2px var(--shadow-light));

        /* status colours are mixed toward the text colour so they stay readable on light and dark surfaces */
        --heat-raw: ${customHeat};
        --heat: color-mix(in srgb, var(--heat-raw) 72%, var(--txt));
        --cool: color-mix(in srgb, var(--state-climate-cool-color, var(--info-color, #3b82f6)) 75%, var(--txt));
        --water: color-mix(in srgb, var(--state-climate-dry-color, var(--info-color, #3b82f6)) 75%, var(--txt));
        --idle: var(--txt2);
        --good: color-mix(in srgb, var(--success-color, #05a677) 75%, var(--txt));
        --warn: color-mix(in srgb, var(--warning-color, #e5a100) 55%, var(--txt));
        --error: color-mix(in srgb, var(--error-color, #e53935) 75%, var(--txt));
        --info: var(--cool);

        display: block; width: 100%; box-sizing: border-box;
        position: relative; z-index: 0; isolation: isolate;
        font-family: var(--primary-font-family, var(--ha-font-family-body, var(--paper-font-body1_-_font-family, inherit)));
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      ha-card { background: none; box-shadow: none; border: 0; overflow: visible; }

      .card {
        background: var(--bg); color: var(--txt);
        border-radius: 18px; box-shadow: var(--raised);
        padding: 14px 16px 16px; container-type: inline-size; overflow: hidden;
      }

      /* ─── Header ─── */
      .top { display: flex; align-items: center; gap: 12px; }
      .pump-thumb {
        width: 48px; height: 48px; border-radius: 14px; flex: none; overflow: hidden;
        background: var(--bg); box-shadow: var(--raised-s);
        display: flex; align-items: center; justify-content: center; color: var(--txt2);
      }
      .pump-thumb img { width: 100%; height: 100%; object-fit: cover; }
      .pump-thumb svg { width: 28px; }
      .top-info { min-width: 0; flex: 1; }
      .name { font-size: 16px; font-weight: 700; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .status { font-size: 12.5px; color: var(--txt2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .top-right { display: flex; align-items: center; gap: 10px; flex: none; }
      .badge {
        display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 99px;
        font-size: 12.5px; font-weight: 650; box-shadow: var(--inset-xs); color: var(--txt2); white-space: nowrap;
        transition: color .4s;
      }
      .badge .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; transition: box-shadow .6s; }
      .badge.running { color: var(--heat); }
      .badge.running .dot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--heat) 18%, transparent); }
      .badge.waiting { color: var(--warn); }
      .badge.reached { color: var(--good); }
      .pwr {
        width: 40px; height: 40px; border-radius: 13px; border: none; cursor: pointer;
        background: var(--bg); box-shadow: var(--raised-s); color: var(--idle);
        display: flex; align-items: center; justify-content: center; transition: box-shadow .2s, color .3s;
      }
      .pwr:active { box-shadow: var(--inset-s); }
      .pwr.on { color: var(--heat); }
      .pwr svg { width: 20px; height: 20px; }

      /* ─── Dial ─── */
      .dial-area { display: flex; align-items: center; justify-content: center; gap: clamp(10px, 4cqw, 22px); margin: 16px 0 6px; }
      .side-btn {
        width: 46px; height: 46px; border-radius: 15px; border: none; flex: none; cursor: pointer;
        background: var(--bg); box-shadow: var(--raised-s); color: var(--txt);
        display: flex; align-items: center; justify-content: center;
        transition: box-shadow .15s, transform .15s; -webkit-tap-highlight-color: transparent;
      }
      .side-btn:active { box-shadow: var(--inset-s); transform: scale(.96); }
      .side-btn svg { width: 22px; }
      .dial { position: relative; width: clamp(170px, 54cqw, 220px); aspect-ratio: 1; flex: none; border-radius: 50%; background: var(--bg); box-shadow: var(--raised); }
      .dial svg.gauge { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .g-track { fill: none; stroke: color-mix(in srgb, var(--txt2) 16%, transparent); stroke-width: 2; stroke-linecap: round; }
      .g-val { fill: none; stroke: url(#gGrad); stroke-width: 2.5; stroke-linecap: round; transition: stroke-dashoffset 1.4s cubic-bezier(.22,.8,.3,1); }
      /* instrument scale: ticks light up to the current temperature, sweeping one after another */
      .tk { stroke: color-mix(in srgb, var(--txt2) 30%, transparent); stroke-width: 1; stroke-linecap: round; transition: stroke .5s ease, opacity .5s ease; }
      .tk.mj { stroke-width: 1.6; }
      .tk.on { stroke: var(--tc); }
      .g-mark { transition: transform 1.4s cubic-bezier(.22,.8,.3,1); }
      .g-mark line { stroke: var(--txt); stroke-width: 2.5; stroke-linecap: round; }
      /* compressor sweep: a short light trace runs along the scale while the compressor works;
         its pace follows the running frequency, and it fades in/out with spin-up and coast-down */
      .comet { fill: none; stroke-linecap: round; opacity: 0; }
      .comet.c1 { stroke: var(--heat-raw); stroke-width: 3; }
      .comet.c2 { stroke: color-mix(in srgb, var(--heat-raw) 55%, transparent); stroke-width: 2.5; }
      .comet.c3 { stroke: color-mix(in srgb, var(--heat-raw) 22%, transparent); stroke-width: 2.5; }
      .dial-in {
        position: absolute; inset: 17.5%; z-index: 1; border-radius: 50%; background: var(--bg); box-shadow: var(--inset);
        display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden;
      }
      .glow { position: absolute; inset: 0; border-radius: 50%; opacity: 0; pointer-events: none;
        background: radial-gradient(circle at 50% 62%, color-mix(in srgb, var(--heat-raw) 22%, transparent) 0%, transparent 70%);
        transition: opacity 1.6s ease; }
      .c-lbl, .sp-lbl, .m-lbl, .f-lbl, .tel-glbl {
        font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--txt2);
      }
      .c-lbl { position: relative; font-size: 11px; }
      .c-val { position: relative; font-size: clamp(30px, 10cqw, 40px); font-weight: 650; line-height: 1.05; margin-top: 2px; font-variant-numeric: tabular-nums; transition: color .6s; }
      .c-val sup { font-size: .45em; font-weight: 600; color: var(--txt2); }
      .card.running .c-val { color: var(--heat); }
      .c-trend { position: relative; display: flex; align-items: center; gap: 3px; margin-top: 3px; font-size: 12px; font-weight: 600; color: var(--txt2); }
      .c-trend svg { width: 13px; height: 13px; }
      .c-trend.up { color: var(--heat); } .c-trend.down { color: var(--info); } .c-trend.flat { color: var(--good); }
      .setpoint { text-align: center; margin-bottom: 12px; }
      .sp-val { font-size: 24px; font-weight: 700; line-height: 1.2; font-variant-numeric: tabular-nums; }
      .sp-hint { font-size: 12px; color: var(--txt2); margin-top: 1px; }

      /* ─── Water loop ─── */
      .flow { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; box-shadow: var(--inset-s); margin-bottom: 12px; }
      .f-end { text-align: center; min-width: 64px; }
      .f-val { font-size: 19px; font-weight: 700; line-height: 1.15; margin-top: 2px; font-variant-numeric: tabular-nums; }
      .f-val small { font-size: 12px; font-weight: 600; color: var(--txt2); }
      .f-end.sup .f-val { color: var(--heat); } .f-end.ret .f-val { color: var(--cool); }
      .f-mid { position: relative; height: 34px; }
      .f-mid svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
      .pipe-shell { fill: none; stroke: var(--bg); stroke-width: 9; stroke-linecap: round; filter: drop-shadow(1px 1px 1px var(--shadow-dark)) drop-shadow(-1px -1px 1px var(--shadow-light)); }
      .pipe-base { fill: none; stroke: url(#pGrad); stroke-width: 4; stroke-linecap: round; opacity: .55; transition: opacity 1.2s ease; }
      .card.running .pipe-base { opacity: .9; }
      /* moving sheen = water travelling from supply to return; only while the pump delivers heat */
      .pipe-sheen { fill: none; stroke: url(#pSheen); stroke-width: 4; stroke-linecap: round; opacity: 0; }
      .f-dt { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); padding: 2px 9px; border-radius: 99px;
        background: var(--bg); box-shadow: var(--raised-xs); font-size: 12.5px; font-weight: 700; white-space: nowrap; font-variant-numeric: tabular-nums; }
      .f-dt.ok { color: var(--good); } .f-dt.mid { color: var(--warn); } .f-dt.bad { color: var(--error); }

      /* ─── Metrics ─── */
      .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; }
      .metric { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: var(--bg); box-shadow: var(--raised-s); cursor: pointer; min-width: 0; transition: box-shadow .2s; }
      .metric:active { box-shadow: var(--inset-s); }
      .m-ico { width: 36px; height: 36px; border-radius: 11px; flex: none; box-shadow: var(--inset-xs); display: flex; align-items: center; justify-content: center; color: var(--txt2); transition: color .5s; }
      .m-ico svg { width: 20px; height: 20px; }
      .metric.hot .m-ico { color: var(--heat); }
      .m-txt { min-width: 0; flex: 1; }
      .m-val { font-size: 19px; font-weight: 700; line-height: 1.15; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
      .m-val small { font-size: 12px; font-weight: 600; color: var(--txt2); margin-left: 1px; }
      .m-lbl { margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .m-bar { height: 4px; border-radius: 4px; margin-top: 5px; box-shadow: var(--inset-xs); overflow: hidden; }
      .m-fill { height: 100%; border-radius: 4px; background: var(--water); transition: width 1.2s cubic-bezier(.22,.8,.3,1), background .5s; }
      .m-fill.hot { background: var(--heat); } .m-fill.ok { background: var(--good); } .m-fill.mid { background: var(--warn); } .m-fill.bad { background: var(--error); }

      /* ─── Diagnostics & graph ─── */
      .diag { border-radius: 14px; box-shadow: var(--inset-s); padding: 12px 14px; margin-bottom: 12px; font-size: 13px; line-height: 1.45; color: var(--txt2); }
      .diag.hide { display: none; }
      .diag-row { display: flex; gap: 12px; align-items: flex-start; }
      .d-i { font-size: 20px; line-height: 1; flex: none; }
      .d-t { font-size: 14px; font-weight: 650; color: var(--txt); margin-bottom: 2px; }
      .diag.good .d-t { color: var(--good); } .diag.warn .d-t { color: var(--warn); } .diag.info .d-t { color: var(--info); }
      .graph { border-top: 1px solid color-mix(in srgb, var(--txt2) 18%, transparent); padding-top: 8px; margin-top: 10px; }
      .graph-hdr { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; color: var(--txt2); }

      /* ─── Telemetry ─── */
      .telemetry { margin-bottom: 12px; }
      .tel-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; border: none; cursor: pointer;
        background: var(--bg); box-shadow: var(--raised-s); border-radius: 13px; padding: 10px 14px; font-family: inherit;
        font-size: 12px; font-weight: 650; letter-spacing: .5px; text-transform: uppercase; color: var(--txt2); }
      .tel-toggle:active { box-shadow: var(--inset-s); }
      .tel-toggle .arr { transition: transform .3s; }
      .tel-toggle.open .arr { transform: rotate(180deg); }
      .tel-body { display: none; margin-top: 10px; }
      .tel-body.open { display: block; animation: fadeDown .35s ease-out; }
      @keyframes fadeDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
      .tel-group { margin-bottom: 12px; } .tel-group:last-child { margin-bottom: 0; }
      .tel-glbl { margin: 0 4px 6px; }
      .tel-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: 8px; }
      .tel-cell { border-radius: 12px; box-shadow: var(--inset-s); padding: 8px 10px; min-width: 0; }
      .tel-cell .tv { font-size: 15px; font-weight: 700; line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-variant-numeric: tabular-nums; }
      .tel-cell .tv.hot { color: var(--heat); } .tel-cell .tv.bad { color: var(--error); }
      .tel-cell .tl { font-size: 12px; color: var(--txt2); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .tel-params-link { width: 100%; margin-top: 4px; background: none; border: none; color: var(--info); font-size: 12.5px; font-weight: 650; cursor: pointer; font-family: inherit; padding: 6px 0; }

      /* ─── Presets & modes ─── */
      .presets { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; }
      .chip { padding: 8px 16px; border-radius: 12px; border: none; cursor: pointer; font-family: inherit; font-size: 15px; font-weight: 600;
        background: var(--bg); box-shadow: var(--raised-s); color: var(--txt); transition: box-shadow .2s, color .3s; -webkit-tap-highlight-color: transparent; }
      .chip:active { box-shadow: var(--inset-s); }
      .chip.on { color: var(--heat); box-shadow: var(--inset-s); }
      .modes { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
      .mbtn { padding: 10px 12px; border-radius: 13px; border: none; cursor: pointer; font-family: inherit; font-size: 12.5px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .4px; background: var(--bg); box-shadow: var(--raised-s); color: var(--txt2);
        display: flex; align-items: center; justify-content: center; gap: 7px; transition: box-shadow .2s, color .3s; -webkit-tap-highlight-color: transparent; }
      .mbtn:active, .mbtn.on { box-shadow: var(--inset-s); }
      .mbtn.on.mode-heat, .mbtn.on.mode-heat-water { color: var(--heat); }
      .mbtn.on.mode-cool, .mbtn.on.mode-cool-water { color: var(--cool); }
      .mbtn.on.mode-water { color: var(--water); }
      .mbtn.on.mode-off { color: var(--txt); }
      .mbtn svg { width: 16px; height: 16px; }

      .err { padding: 32px; text-align: center; border-radius: 18px; background: var(--bg); box-shadow: var(--raised); }
      .err h3 { font-size: 17px; font-weight: 650; color: var(--error); margin-bottom: 6px; }
      .err p { font-size: 13px; color: var(--txt2); }

      @container (max-width: 340px) {
        .metrics { grid-template-columns: 1fr; }
        .f-end { min-width: 54px; }
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation: none !important; transition: none !important; }
      }
    `;
  }

  /* ══════════════════ RENDER ══════════════════ */

  /** Which metric tiles to show: live machine readings when the telemetry exists, else the classic four. */
  private _metricDefs(live: ReturnType<AltalHeatpumpCard['_live']>) {
    const C = this._config;
    const out: { k: string; ico: string; lbl: string; graph: string | null }[] = [];
    if (live.e.freq) out.push({ k: 'freq', ico: this._ico.rotor, lbl: 'Компрессор', graph: live.e.freq });
    if (live.e.power) out.push({ k: 'power', ico: this._ico.bolt, lbl: 'Мощность', graph: live.e.power });
    if (live.e.tank) out.push({ k: 'tank', ico: this._ico.tank, lbl: 'Бак ГВС', graph: live.e.tank });
    if (live.e.outdoor) out.push({ k: 'outdoor', ico: this._ico.outdoor, lbl: 'Улица', graph: live.e.outdoor });
    if (out.length >= 2) return out.slice(0, 4);
    return [
      { k: 'cur', ico: this._ico.thermo, lbl: 'Текущая', graph: C.current_temp_entity || null },
      { k: 'tgt', ico: this._ico.target, lbl: 'Уставка', graph: C.target_temp_entity || null },
      ...(C.delta_t_entity ? [{ k: 'dt', ico: this._ico.delta, lbl: 'ΔT', graph: C.delta_t_entity }] : []),
      { k: 'heat', ico: this._ico.flame, lbl: 'Нагрев', graph: C.heating_entity || null },
    ];
  }

  private _read() {
    const C = this._config, H = this._hass;
    const cl = H.states[C.climate_entity];
    const curT = this._v(H, C.current_temp_entity) ?? (cl.attributes.current_temperature !== undefined ? parseFloat(cl.attributes.current_temperature) : null);
    const tgtRaw = this._v(H, C.target_temp_entity) ?? parseFloat(cl.attributes.temperature);
    const tgtT = Number.isFinite(tgtRaw) ? tgtRaw : null;
    const live = this._live();
    const hvac = cl.state;
    const heatEnt = C.heating_entity && H.states[C.heating_entity] ? (H.states[C.heating_entity].state === 'on' ? 'on' : 'off') : null;
    const run: RunState = computeRunState({
      off: hvac.toLowerCase() === 'off', freq: live.freq, power: live.power, heatingEntity: heatEnt,
      hvacAction: cl.attributes.hvac_action ?? null, current: curT, target: tgtT,
    });
    const modes: string[] = Array.isArray(cl.attributes.hvac_modes)
      ? cl.attributes.hvac_modes.filter((mode: unknown): mode is string => typeof mode === 'string')
      : ['heat', 'off'];
    return { cl, curT, tgtT, live, hvac, run, modes };
  }

  private _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card" style="text-align:center;padding:40px;color:var(--txt2)">Загрузка…</div>`;
      this._structKey = '';
      return;
    }
    const C = this._config;
    const cl = this._hass.states[C.climate_entity];
    if (!cl) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p>${C.climate_entity}</p></div>`;
      this._structKey = '';
      return;
    }

    const r = this._read();
    const metrics = this._metricDefs(r.live);
    const hasFlow = r.live.supply !== null || r.live.ret !== null;
    const key = JSON.stringify([
      r.modes, metrics.map(m => m.k), hasFlow, this._telOpen, this._paramsOpen,
      this._activeGraphEntity, this._activeGraphEntity ? !!this._cachedGraph[this._activeGraphEntity] : false,
      C.show_controls, C.show_presets, C.show_diagnostics, C.show_image, C.image, C.show_telemetry,
      (C.quick_presets || []).join(','),
    ]);
    if (key !== this._structKey) {
      this._build(r, metrics, hasFlow);
      this._structKey = key;
      this._lastTelHtml = this._telOpen ? this._telBody(this._hass) : '';
    }
    this._update(r, metrics);
  }

  /** Builds the DOM skeleton. Runs only when the layout itself changes. */
  private _build(r: ReturnType<AltalHeatpumpCard['_read']>, metrics: ReturnType<AltalHeatpumpCard['_metricDefs']>, hasFlow: boolean) {
    const C = this._config;
    const showImg = C.show_image !== false;
    const presets = C.quick_presets || [19, 20, 22, 24];
    const mIco: Record<string, string> = {
      heat: this._ico.heat, hot: this._ico.heat, cool: this._ico.cool, cold: this._ico.cool,
      hotwater: this._ico.water, dhw: this._ico.water, hot_hotwater: this._ico.heat, cold_hotwater: this._ico.cool,
      auto: this._ico.auto, off: this._ico.off,
    };
    // 270° instrument scale. Thin value arc on r=88 (arc length 414.7 of 552.9), ticks just inside it.
    const ARC = 414.69, CIRC = 552.92, TICKS = 55;
    const ticks = Array.from({ length: TICKS }, (_, i) => {
      const f = i / (TICKS - 1), ang = (135 + 270 * f) * Math.PI / 180, major = i % 9 === 0;
      const r1 = major ? 72 : 75, r2 = 80;
      const p = (r: number) => `${(100 + r * Math.cos(ang)).toFixed(2)} ${(100 + r * Math.sin(ang)).toFixed(2)}`;
      const tc = `color-mix(in srgb, var(--heat) ${Math.round(f * 100)}%, var(--cool))`;
      return `<path class="tk${major ? ' mj' : ''}" d="M${p(r1)} L${p(r2)}" style="--tc:${tc};transition-delay:${(i * 12)}ms"/>`;
    }).join('');
    const comet = (cls: string, len: number) =>
      `<circle class="comet ${cls}" data-len="${len}" cx="100" cy="100" r="88" stroke-dasharray="${len} ${CIRC}" stroke-dashoffset="${len}" transform="rotate(135 100 100)"/>`;
    const dial = `
      <div class="dial" id="dial">
        <svg class="gauge" viewBox="0 0 200 200" aria-hidden="true">
          <defs><linearGradient id="gGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" style="stop-color:var(--cool)"/><stop offset="100%" style="stop-color:var(--heat)"/></linearGradient></defs>
          <g id="ticks">${ticks}</g>
          <circle class="g-track" cx="100" cy="100" r="88" stroke-dasharray="${ARC} ${CIRC}" transform="rotate(135 100 100)"/>
          <circle class="g-val" id="garc" cx="100" cy="100" r="88" stroke-dasharray="${ARC} ${CIRC}" stroke-dashoffset="${ARC}" transform="rotate(135 100 100)"/>
          ${comet('c3', 70)}${comet('c2', 30)}${comet('c1', 9)}
          <g class="g-mark" id="gmark" style="transform-origin:100px 100px"><line x1="182" y1="100" x2="194" y2="100"/></g>
        </svg>
        <div class="dial-in">
          <div class="glow" id="glow"></div>
          <span class="c-lbl">Сейчас</span>
          <span class="c-val" id="cval">—<sup>°</sup></span>
          <span class="c-trend" id="trend"></span>
        </div>
      </div>`;

    this._root.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="card" id="card">
          <div class="top">
            ${showImg ? `<div class="pump-thumb">${C.image ? `<img src="${C.image}" alt=""/>` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-4a2 2 0 012-2h12a2 2 0 012 2v4M4 14a2 2 0 002 2h12a2 2 0 002-2M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4M8 11v6M16 11v6"/></svg>`}</div>` : ''}
            <div class="top-info"><div class="name" id="name"></div><div class="status" id="status"></div></div>
            <div class="top-right">
              <div class="badge" id="badge"><span class="dot"></span><span id="btxt"></span></div>
              <button class="pwr" id="pwr" aria-label="Питание">${this._ico.power}</button>
            </div>
          </div>

          <div class="dial-area">
            ${C.show_controls !== false ? `<button class="side-btn" id="dn" aria-label="Уставка ниже">${this._ico.minus}</button>` : ''}
            ${dial}
            ${C.show_controls !== false ? `<button class="side-btn" id="up" aria-label="Уставка выше">${this._ico.plus}</button>` : ''}
          </div>
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val" id="spval">—</div>
            <div class="sp-hint" id="sphint"></div>
          </div>

          ${hasFlow ? `
          <div class="flow">
            <div class="f-end sup"><div class="f-lbl">Подача</div><div class="f-val"><span id="fsup">—</span><small>°</small></div></div>
            <div class="f-mid">
              <svg viewBox="0 0 200 34" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <linearGradient id="pGrad" gradientUnits="userSpaceOnUse" x1="6" y1="0" x2="194" y2="0">
                    <stop offset="0%" style="stop-color:var(--heat)"/><stop offset="100%" style="stop-color:var(--cool)"/></linearGradient>
                  <linearGradient id="pSheen" gradientUnits="userSpaceOnUse" spreadMethod="repeat" x1="0" y1="0" x2="64" y2="0">
                    <stop offset="0%" style="stop-color:#fff;stop-opacity:0"/><stop offset="45%" style="stop-color:#fff;stop-opacity:0"/>
                    <stop offset="62%" style="stop-color:#fff;stop-opacity:.75"/><stop offset="72%" style="stop-color:#fff;stop-opacity:0"/>
                    <stop offset="100%" style="stop-color:#fff;stop-opacity:0"/></linearGradient>
                </defs>
                <path class="pipe-shell" d="M6 17 H194"/>
                <path class="pipe-base" d="M6 17 H194"/>
                <path class="pipe-sheen" id="sheen" d="M6 17 H194"/>
              </svg>
              <div class="f-dt" id="fdt">ΔT —</div>
            </div>
            <div class="f-end ret"><div class="f-lbl">Обратка</div><div class="f-val"><span id="fret">—</span><small>°</small></div></div>
          </div>` : ''}

          <div class="metrics">
            ${metrics.map(m => `
              <div class="metric" data-k="${m.k}" ${m.graph ? `data-graph="${m.graph}"` : ''} aria-label="${m.lbl}">
                <div class="m-ico">${m.ico}</div>
                <div class="m-txt"><div class="m-val">—</div><div class="m-lbl">${m.lbl}</div>
                  ${m.k === 'tank' || m.k === 'dt' || m.k === 'power' || m.k === 'freq' ? `<div class="m-bar"><div class="m-fill" style="width:0%"></div></div>` : ''}</div>
              </div>`).join('')}
          </div>

          ${this._renderTelemetry(this._hass)}

          ${C.show_diagnostics !== false || this._activeGraphEntity ? `
          <div class="diag hide" id="diag">
            <div class="diag-row"><span class="d-i" id="dicon"></span>
              <div><div class="d-t" id="dtitle"></div><div id="dtext"></div></div></div>
            ${this._graphHtml()}
          </div>` : ''}

          ${C.show_presets !== false ? `
          <div class="presets">${presets.map(p => `<button class="chip" data-t="${p}">${p}°</button>`).join('')}</div>` : ''}

          <div class="modes">
            ${r.modes.map(m => `<button class="mbtn mode-${getModeClass(m)}" data-m="${m}" aria-label="${getModeLabel(m)}">${mIco[m.toLowerCase()] || ''} ${getModeLabel(m)}</button>`).join('')}
          </div>
        </div>
      </ha-card>`;

    this._comets = Array.from(this._root.querySelectorAll('.comet')) as SVGElement[];
    this._sheen = this._root.getElementById('sheen') as SVGElement | null;
    this._sheenGrad = this._root.getElementById('pSheen') as SVGElement | null;
    this._numTweens = new WeakMap();
    this._bindAll();
  }

  private _graphHtml(): string {
    if (!this._activeGraphEntity) return '';
    const g = this._cachedGraph[this._activeGraphEntity];
    if (!g) return '';
    return `<div class="graph"><div class="graph-hdr"><span>${g.min.toFixed(1)}</span><span>${g.max.toFixed(1)}</span></div>${g.svg}</div>`;
  }

  /** Patches values into the existing DOM. Runs on every state push; never replays entry animations. */
  private _update(r: ReturnType<AltalHeatpumpCard['_read']>, metrics: ReturnType<AltalHeatpumpCard['_metricDefs']>) {
    const C = this._config, $ = (id: string) => this._root.getElementById(id);
    const { cl, curT, tgtT, live, hvac, run } = r;
    const card = $('card');
    if (!card) return;
    card.className = `card ${run.kind}`;

    this._text($('name'), C.name || cl.attributes.friendly_name || 'Altal Heat Pump');
    this._text($('status'), `Тепловой насос · ${getModeLabel(hvac)}`);
    const badge = $('badge');
    if (badge) badge.className = `badge ${run.kind}`;
    this._text($('btxt'), run.label);
    $('pwr')?.classList.toggle('on', run.kind !== 'off');

    // dial
    const sMin = C.scale_min ?? 20, sMax = C.scale_max ?? 60, ARC = 414.69;
    const frac = scaleFraction(curT, sMin, sMax);
    this._num($('cval'), curT, 1, '<sup>°</sup>');
    $('garc')?.setAttribute('stroke-dashoffset', String(ARC * (1 - frac)));
    const tks = this._root.querySelectorAll('#ticks .tk');
    tks.forEach((tk, i) => tk.classList.toggle('on', curT !== null && i / (tks.length - 1) <= frac + 1e-6));
    const mark = $('gmark');
    if (mark) mark.style.transform = `rotate(${135 + 270 * scaleFraction(this._pendingTarget ?? tgtT, sMin, sMax)}deg)`;
    const tr = this._trend();
    const trend = $('trend');
    if (trend && trend.dataset.tr !== tr) {
      trend.dataset.tr = tr;
      trend.className = `c-trend ${tr}`;
      trend.innerHTML = `${tr === 'up' ? this._ico.up : tr === 'down' ? this._ico.down : this._ico.stable} ${tr === 'up' ? 'Растёт' : tr === 'down' ? 'Падает' : 'Стабильно'}`;
    }
    const glow = $('glow');
    if (glow) glow.style.opacity = run.running ? String(0.35 + 0.65 * Math.min(1, (live.power ?? 4) / 8)) : '0';

    const shownTgt = this._pendingTarget ?? tgtT;
    const sp = $('spval');
    if (sp && this._pendingTarget === null) sp.textContent = shownTgt !== null ? `${shownTgt.toFixed(1)}°` : '—';
    const gap = curT !== null && shownTgt !== null ? shownTgt - curT : null;
    this._text($('sphint'), run.kind === 'off' ? 'насос выключен' : gap === null ? '' :
      Math.abs(gap) < 0.5 ? 'вода на уставке' : gap > 0 ? `до уставки +${gap.toFixed(1)}°` : `выше уставки на ${(-gap).toFixed(1)}°`);

    // water loop
    this._num($('fsup'), live.supply, 1);
    this._num($('fret'), live.ret, 1);
    const fdt = $('fdt');
    if (fdt) {
      fdt.className = `f-dt ${run.running ? deltaClass(live.dt) : 'none'}`;
      fdt.textContent = live.dt !== null ? `ΔT ${live.dt.toFixed(1)}°` : 'ΔT —';
    }

    // metric tiles
    for (const m of metrics) {
      const el = this._root.querySelector(`.metric[data-k="${m.k}"]`) as HTMLElement | null;
      if (!el) continue;
      const val = el.querySelector('.m-val'), fill = el.querySelector('.m-fill') as HTMLElement | null;
      let hot = false;
      switch (m.k) {
        case 'freq': {
          this._num(val, live.freq, 0, '<small>Гц</small>');
          hot = run.running;
          if (fill) { fill.className = 'm-fill hot'; fill.style.width = `${scaleFraction(live.freq, 0, 90) * 100}%`; }
          break;
        }
        case 'power':
          this._num(val, live.power, 1, '<small>кВт</small>');
          hot = run.running;
          if (fill) { fill.className = 'm-fill hot'; fill.style.width = `${scaleFraction(live.power, 0, 12) * 100}%`; }
          break;
        case 'tank': {
          this._num(val, live.tank, 1, '<small>°C</small>');
          const reached = live.tank !== null && live.tankSet !== null && live.tank >= live.tankSet;
          if (fill) { fill.className = `m-fill ${reached ? 'ok' : ''}`; fill.style.width = `${scaleFraction(live.tank, 10, Math.max(40, (live.tankSet ?? 50) + 5)) * 100}%`; }
          break;
        }
        case 'outdoor': this._num(val, live.outdoor, 1, '<small>°C</small>'); break;
        case 'cur': this._num(val, curT, 1, '<small>°C</small>'); hot = run.running; break;
        case 'tgt': this._num(val, shownTgt, 1, '<small>°C</small>'); break;
        case 'dt':
          this._num(val, live.dt, 1, '<small>°C</small>');
          if (fill) { fill.className = `m-fill ${deltaClass(live.dt)}`; fill.style.width = `${scaleFraction(live.dt, 0, 12) * 100}%`; }
          break;
        case 'heat': this._text(val, run.running ? 'Вкл' : 'Нет'); hot = run.running; break;
      }
      el.classList.toggle('hot', hot);
    }

    // diagnostics (text only; the graph block is part of the structure)
    const diagEl = $('diag');
    if (diagEl) {
      let d = this._dtDiag(live.dt, curT, tgtT, run.running);
      if (this._activeGraphEntity) {
        const m = metrics.find(x => x.graph === this._activeGraphEntity);
        d = this._cachedGraph[this._activeGraphEntity]
          ? { icon: '📊', title: m ? m.lbl : 'График', text: 'Последние 24 часа · нажмите плитку ещё раз, чтобы скрыть', cls: 'neutral' }
          : { icon: '⌛', title: 'Загрузка', text: 'Получение истории…', cls: 'neutral' };
      }
      const hidden = !this._activeGraphEntity && (C.show_diagnostics === false || d.cls === 'hide');
      diagEl.className = `diag ${hidden ? 'hide' : d.cls}`;
      this._text($('dicon'), d.icon);
      this._text($('dtitle'), d.title);
      this._text($('dtext'), d.text);
    }

    // presets & modes
    this._root.querySelectorAll('.chip').forEach(el => {
      const t = parseFloat((el as HTMLElement).dataset.t || 'NaN');
      el.classList.toggle('on', shownTgt !== null && Math.abs(t - shownTgt) < 0.1);
    });
    this._root.querySelectorAll('.mbtn').forEach(el =>
      el.classList.toggle('on', ((el as HTMLElement).dataset.m || '').toLowerCase() === hvac.toLowerCase()));

    // telemetry: swap only the body contents, and only when they actually changed
    if (this._telOpen) {
      const body = this._root.querySelector('.tel-body');
      const html = this._telBody(this._hass);
      if (body && html !== this._lastTelHtml) {
        body.innerHTML = html;
        this._lastTelHtml = html;
        this._root.getElementById('tel_params')?.addEventListener('click', (e) => this._toggleParams(e));
      }
    }

    // animation targets
    this._anim.tgtSpd = this._reduceMotion ? 0 : rotorSpeed(run.running, live.freq);
    this._anim.tgtFlow = this._reduceMotion ? 0 : flowSpeed(run.running, live.power);
    this._kick();
  }

  /* ── In-place DOM helpers ───────────────── */

  private _text(el: Element | null, s: string) {
    if (el && el.textContent !== s) el.textContent = s;
  }

  /** Writes a number, easing from the previous value so changes read as motion, not a flash. */
  private _num(el: Element | null, value: number | null, decimals: number, suffix = '') {
    if (!el) return;
    if (value === null || !Number.isFinite(value)) {
      const s = `—${suffix}`;
      if (el.innerHTML !== s) el.innerHTML = s;
      this._numTweens.delete(el);
      return;
    }
    const prev = this._numTweens.get(el);
    const draw = (x: number) => { el.innerHTML = `${x.toFixed(decimals)}${suffix}`; };
    if (!prev || this._reduceMotion) {
      draw(value);
      this._numTweens.set(el, { from: value, to: value, raf: 0 });
      return;
    }
    if (prev.to === value) return;
    if (prev.raf) cancelAnimationFrame(prev.raf);
    const from = prev.raf ? prev.from : prev.to, start = performance.now(), dur = 700;
    const st = { from, to: value, raf: 0 };
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - p, 3);
      draw(from + (value - from) * e);
      st.from = from + (value - from) * e;
      st.raf = p < 1 ? requestAnimationFrame(step) : 0;
    };
    st.raf = requestAnimationFrame(step);
    this._numTweens.set(el, st);
  }

  /* ── Animation loop: compressor sweep and water flow ── */

  private _kick() {
    const a = this._anim;
    if (a.raf || !this.isConnected) return;
    if (!a.tgtSpd && !a.tgtFlow && a.spd < 0.5 && a.flowSpd < 0.5) { this._paintAnim(); return; }
    a.raf = requestAnimationFrame(this._tick);
  }

  private _tick = (t: number) => {
    const a = this._anim;
    const dt = a.last ? Math.min(0.1, (t - a.last) / 1000) : 0;
    a.last = t;
    // first-order lag ≈ 1.6 s: the compressor spins up and coasts down instead of snapping
    const k = 1 - Math.exp(-dt / 1.6);
    a.spd += (a.tgtSpd - a.spd) * k;
    a.flowSpd += (a.tgtFlow - a.flowSpd) * k;
    a.rot = (a.rot + a.spd * dt) % 360;
    // sweep position along the scale: one pass per few seconds, calm at low frequency, brisker near full load
    a.sweep = (a.sweep + (a.spd / 360) * (414.69 / 4) * dt) % (414.69 + 80);
    a.flow = (a.flow + a.flowSpd * dt) % 2000;
    this._paintAnim();
    if (!a.tgtSpd && !a.tgtFlow && a.spd < 0.5 && a.flowSpd < 0.5) {
      a.spd = 0; a.flowSpd = 0; a.raf = 0; a.last = 0;
      this._paintAnim();
      return;
    }
    a.raf = requestAnimationFrame(this._tick);
  };

  private _paintAnim() {
    const a = this._anim, ARC = 414.69;
    const head = a.sweep;
    const vis = Math.min(1, a.spd / 120);
    for (const c of this._comets) {
      const len = Number(c.getAttribute('data-len') || 0);
      c.setAttribute('stroke-dashoffset', (len - head).toFixed(1));
      c.style.opacity = String(vis * (head > ARC ? Math.max(0, 1 - (head - ARC) / 40) : 1));
    }
    if (this._sheenGrad) {
      const x = (a.flow % 64).toFixed(1);
      this._sheenGrad.setAttribute('x1', x);
      this._sheenGrad.setAttribute('x2', (Number(x) + 64).toFixed(1));
    }
    if (this._sheen) this._sheen.style.opacity = String(Math.min(1, a.flowSpd / 18));
  }

  /* ── Events ───────────────────────────── */

  private _toggleParams(e: Event) {
    e.preventDefault(); e.stopPropagation();
    this._paramsOpen = !this._paramsOpen;
    this._render();
  }

  private _bindAll() {
    const $ = (id: string) => this._root.getElementById(id);

    $('dn')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._adjust(-1); });
    $('up')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._adjust(1); });
    $('pwr')?.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._togglePower(); });

    $('tel_toggle')?.addEventListener('click', (e) => {
      e.preventDefault(); e.stopPropagation();
      this._telOpen = !this._telOpen;
      this._render();
    });
    $('tel_params')?.addEventListener('click', (e) => this._toggleParams(e));

    this._root.querySelectorAll('.metric[data-graph]').forEach(el =>
      el.addEventListener('click', () => {
        const id = (el as HTMLElement).dataset.graph;
        if (id) this._fetchGraph(id, (el as HTMLElement).getAttribute('aria-label') || '');
      }));

    this._root.querySelectorAll('.chip').forEach(el =>
      el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._preset(parseFloat((e.currentTarget as HTMLElement).dataset.t || '20')); })
    );
    this._root.querySelectorAll('.mbtn').forEach(el =>
      el.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this._mode((e.currentTarget as HTMLElement).dataset.m || 'off'); })
    );
  }
}

/* ═══════════════════ Register ═══════════════════ */

// PRO variant: subclass so both element names can coexist (registry forbids
// the same constructor under two names)
class AltalHeatpumpCardPro extends AltalHeatpumpCard {}

if (!customElements.get('altal-heatpump-card')) {
  customElements.define('altal-heatpump-card', AltalHeatpumpCard);
}
if (!customElements.get('altal-heatpump-card-pro')) {
  customElements.define('altal-heatpump-card-pro', AltalHeatpumpCardPro);
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'altal-heatpump-card',
  name: 'Altal Heater Card',
  description: 'Premium neumorphic card for Altal heat pump',
  preview: true,
  documentationURL: 'https://github.com/skeep83/altal_heater_card',
});
(window as any).customCards.push({
  type: 'altal-heatpump-card-pro',
  name: 'Altal Heater Card PRO',
  description: 'Theme-aware neumorphic card with Tuya EVI c01-c31 inquiry labels and native HVAC mode mapping',
  preview: true,
  documentationURL: 'https://github.com/skeep83/altal_heater_card_pro',
});

console.info(
  '%c ALTAL-HEATER-CARD PRO %c v4.5.0 ',
  'color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;',
  'color: #e6642f; background: #e3e6ec; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;'
);
