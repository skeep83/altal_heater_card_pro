class j extends HTMLElement {
  constructor() {
    super(), this._root = this.attachShadow({ mode: "open" });
  }
  set hass(t) {
    this._hass = t;
  }
  setConfig(t) {
    this._config = { ...t }, this._render();
  }
  _render() {
    const t = this._config;
    this._root.innerHTML = `
      <style>
        :host { display: block; }
        .editor {
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family, 'Roboto', sans-serif);
        }
        .row { margin-bottom: 14px; }
        label {
          display: block; font-size: 11px; font-weight: 600;
          color: var(--primary-text-color, #44476a);
          margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;
        }
        input, select {
          width: 100%; padding: 10px 14px;
          border: 1px solid var(--divider-color, #d1d9e6);
          border-radius: 10px;
          background: var(--card-background-color, #e6e7ee);
          color: var(--primary-text-color, #44476a);
          font-size: 14px; box-sizing: border-box; outline: none;
          box-shadow: inset 1px 1px 3px rgba(163,177,198,0.4), inset -1px -1px 3px rgba(255,255,255,0.3);
          transition: all 0.2s;
        }
        input:focus, select:focus {
          border-color: var(--primary-color, #e6642f);
          box-shadow: 0 0 0 2px rgba(230,100,47,0.15);
        }
        .hint { font-size: 11px; color: var(--secondary-text-color, #7b7e8a); margin-top: 3px; }
        h3 { margin: 0 0 18px; font-size: 18px; font-weight: 700; }
        .section {
          margin-top: 18px; padding-top: 14px;
          border-top: 1px solid var(--divider-color, #d1d9e6);
        }
        .section-title {
          font-size: 13px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1px; color: var(--secondary-text-color, #7b7e8a);
          margin-bottom: 12px;
        }
        .toggle-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .toggle-row:last-child { border-bottom: none; }
        .toggle-label {
          font-size: 14px; color: var(--primary-text-color, #44476a);
        }
        .toggle {
          position: relative; width: 44px; height: 24px;
          background: var(--card-background-color, #e6e7ee);
          border-radius: 24px; cursor: pointer;
          box-shadow: inset 1px 1px 3px rgba(163,177,198,0.5), inset -1px -1px 3px rgba(255,255,255,0.4);
          transition: all 0.3s;
        }
        .toggle.on {
          background: #e6642f;
          box-shadow: 0 2px 8px rgba(230,100,47,0.3);
        }
        .toggle .knob {
          position: absolute; top: 2px; left: 2px;
          width: 20px; height: 20px; border-radius: 50%;
          background: white;
          box-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .toggle.on .knob { left: 22px; }
      </style>
      <div class="editor">
        <h3>⚙️ Altal Heater Card</h3>

        <div class="row">
          <label>Название</label>
          <input type="text" id="name" value="${t.name || ""}" placeholder="Altal Heat Pump">
        </div>

        <div class="section">
          <div class="section-title">Entities</div>
          <div class="row">
            <label>Climate entity</label>
            <input type="text" id="climate_entity" value="${t.climate_entity || ""}" placeholder="climate.altal_home_heater">
          </div>
          <div class="row">
            <label>Текущая температура</label>
            <input type="text" id="current_temp_entity" value="${t.current_temp_entity || ""}" placeholder="sensor.altal_current_temp">
          </div>
          <div class="row">
            <label>Целевая температура</label>
            <input type="text" id="target_temp_entity" value="${t.target_temp_entity || ""}" placeholder="sensor.altal_target_temp">
          </div>
          <div class="row">
            <label>ΔT (дельта)</label>
            <input type="text" id="delta_t_entity" value="${t.delta_t_entity || ""}" placeholder="sensor.altal_delta_t">
          </div>
          <div class="row">
            <label>Статус нагрева</label>
            <input type="text" id="heating_entity" value="${t.heating_entity || ""}" placeholder="binary_sensor.altal_heating">
          </div>
        </div>

        <div class="section">
          <div class="section-title">Внешний вид</div>
          <div class="row">
            <label>Изображение (URL)</label>
            <input type="text" id="image" value="${t.image || ""}" placeholder="/local/altal-pump.png">
            <div class="hint">Путь к изображению теплового насоса</div>
          </div>
          <div class="row">
            <label>Пресеты (через запятую)</label>
            <input type="text" id="quick_presets" value="${(t.quick_presets || [19, 20, 22, 24]).join(", ")}" placeholder="19, 20, 22, 24">
          </div>
          <div class="row">
            <label>Цвет текста (HEX/CSS)</label>
            <input type="text" id="text_color" value="${t.text_color || ""}" placeholder="var(--aerogel-text) или #ffffff">
            <div class="hint">Оставьте пустым для цвета темы Aerogel</div>
          </div>
          <div class="row">
            <label>Цвет акцента/нагрева (HEX)</label>
            <input type="text" id="animation_color" value="${t.animation_color || ""}" placeholder="var(--aerogel-warning) или #ffaa00">
            <div class="hint">Цвет свечения и иконки нагрева</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Настройки отображения</div>
          <div class="toggle-row">
            <span class="toggle-label">Показать изображение</span>
            <div class="toggle ${t.show_image !== !1 ? "on" : ""}" data-field="show_image"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Показать управление</span>
            <div class="toggle ${t.show_controls !== !1 ? "on" : ""}" data-field="show_controls"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Показать пресеты</span>
            <div class="toggle ${t.show_presets !== !1 ? "on" : ""}" data-field="show_presets"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Диагностика ΔT</span>
            <div class="toggle ${t.show_diagnostics !== !1 ? "on" : ""}" data-field="show_diagnostics"><div class="knob"></div></div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Компактный режим</span>
            <div class="toggle ${t.compact ? "on" : ""}" data-field="compact"><div class="knob"></div></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Телеметрия Tuya (c01–c31)</div>
          <div class="row">
            <label>Префикс сущностей</label>
            <input type="text" id="telemetry_prefix" value="${t.telemetry_prefix || "altal_t_"}" placeholder="altal_t_">
            <div class="hint">Демон публикует sensor.&lt;префикс&gt;*. Для автоподписей передавайте altal_inquire_id или включайте cXX в ID. Значения остаются сырыми: масштаб/единицы задаёт интеграция; c04 пока не подтверждён.</div>
          </div>
          <div class="toggle-row">
            <span class="toggle-label">Показывать телеметрию</span>
            <div class="toggle ${t.show_telemetry !== !1 ? "on" : ""}" data-field="show_telemetry"><div class="knob"></div></div>
          </div>
        </div>
      </div>
    `, [
      "name",
      "climate_entity",
      "current_temp_entity",
      "target_temp_entity",
      "delta_t_entity",
      "heating_entity",
      "image",
      "text_color",
      "animation_color",
      "telemetry_prefix"
    ].forEach((i) => {
      this._root.getElementById(i)?.addEventListener("change", (o) => {
        const r = o.target.value;
        this._config = { ...this._config, [i]: r || void 0 }, this._dispatch();
      });
    }), this._root.getElementById("quick_presets")?.addEventListener("change", (i) => {
      const a = i.target.value.split(",").map((o) => parseFloat(o.trim())).filter((o) => !isNaN(o));
      this._config = { ...this._config, quick_presets: a.length ? a : void 0 }, this._dispatch();
    }), this._root.querySelectorAll(".toggle").forEach((i) => {
      i.addEventListener("click", () => {
        const a = i.dataset.field, o = this._config[a], r = o === !1 ? !0 : o === !0 || o === void 0 ? !1 : !o;
        this._config[a] = a === "compact" ? !this._config.compact : r, this._dispatch(), this._render();
      });
    });
  }
  _dispatch() {
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: !0,
      composed: !0
    }));
  }
}
customElements.get("altal-heatpump-card-editor") || customElements.define("altal-heatpump-card-editor", j);
const G = {
  heat: "Отопление",
  hot: "Отопление",
  cool: "Охлаждение",
  cold: "Охлаждение",
  hotwater: "ГВС",
  dhw: "ГВС",
  hot_hotwater: "Отопление + ГВС",
  cold_hotwater: "Охлаждение + ГВС",
  auto: "Авто",
  off: "Выкл"
}, P = {
  heat: "heat",
  hot: "heat",
  cool: "cool",
  cold: "cool",
  hotwater: "water",
  dhw: "water",
  hot_hotwater: "heat-water",
  cold_hotwater: "cool-water",
  auto: "auto",
  off: "off"
};
function A(c) {
  return G[c.toLowerCase()] ?? c;
}
function S(c) {
  return P[c.toLowerCase()] ?? "other";
}
function F(c, t) {
  const e = c.filter((a) => typeof a == "string" && a.toLowerCase() !== "off");
  if (!e.length) return null;
  if (t) {
    const a = e.find((o) => o.toLowerCase() === t.toLowerCase());
    if (a) return a;
  }
  const i = ["hot", "heat", "hot_hotwater", "hotwater", "dhw", "auto", "heat_cool", "cold", "cool", "cold_hotwater"];
  for (const a of i) {
    const o = e.find((r) => r.toLowerCase() === a);
    if (o) return o;
  }
  return e[0];
}
const O = {
  c01: "Version No.",
  c02: "Ambient Temp.",
  c03: "Water Tank Temp.",
  c05: "Inlet Water Temp.",
  c06: "Evaporator Coil Temp.",
  c07: "Exhaust Temp.",
  c08: "Condenser Coil Temp.",
  c09: "Suction Temp.",
  c10: "IPM Module Temp.",
  c11: "Main EEV Steps",
  c12: "Auxiliary EEV Steps",
  c13: "Exhaust Valve Steps",
  c14: "Target Frequency",
  c15: "Running Frequency",
  c16: "AC Voltage",
  c17: "DC Voltage",
  c18: "Input Current",
  c19: "Compressor Current",
  c20: "Output Power",
  c21: "Temp. before Auxiliary EEV",
  c22: "Temp. after Auxiliary EEV",
  c23: "Low Pressure",
  c24: "High Pressure",
  c25: "Error Code",
  c26: "Limited Frequency Code",
  c27: "Wire Controller Version",
  c28: "MCU1 Version",
  c29: "MCU2 Version",
  c30: "MCU3 Version",
  c31: "Error History"
}, B = {
  c01: "service",
  c02: "other",
  c03: "dhw",
  c05: "heat",
  c06: "refr",
  c07: "refr",
  c08: "refr",
  c09: "refr",
  c10: "comp",
  c11: "comp",
  c12: "comp",
  c13: "comp",
  c14: "comp",
  c15: "comp",
  c16: "elec",
  c17: "elec",
  c18: "elec",
  c19: "elec",
  c20: "elec",
  c21: "refr",
  c22: "refr",
  c23: "refr",
  c24: "refr",
  c25: "service",
  c26: "service",
  c27: "service",
  c28: "service",
  c29: "service",
  c30: "service",
  c31: "service"
};
function q(c) {
  const t = String(c).trim().match(/^c?0*(\d{1,2})$/i);
  if (!t) return null;
  const e = Number(t[1]);
  return !Number.isInteger(e) || e < 1 || e > 31 ? null : `c${String(e).padStart(2, "0")}`;
}
function D(c) {
  const t = q(c);
  return t ? O[t] ?? null : null;
}
function H(c) {
  const t = q(c);
  return t ? B[t] ?? null : null;
}
const N = "Допустимые режимы системы", V = {
  0: "Охлаждение",
  1: "Охлаждение + отопление",
  2: "Отопление",
  3: "Охлаждение + отопление + ГВС",
  4: "Отопление",
  5: "Отопление + ГВС",
  6: "Охлаждение + ГВС"
};
function z(c) {
  const t = String(c).trim().toLowerCase();
  return t === "c41" || t === "d41" || t === "41";
}
function R(c) {
  return z(c) ? N : null;
}
function U(c, t) {
  return z(c) ? V[String(t).trim()] ?? null : null;
}
class I extends HTMLElement {
  constructor() {
    super(), this._history = [], this._pendingTarget = null, this._svcTimer = null, this._cachedGraph = {}, this._activeGraphEntity = null, this._telOpen = !1, this._paramsOpen = !1, this._lastActiveMode = null, this._ico = {
      thermo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 10-5 0v11.26a4.5 4.5 0 105 0z"/><circle cx="11.5" cy="18" r="1.5" fill="currentColor" stroke="none"/><line x1="11.5" y1="14" x2="11.5" y2="18"/></svg>',
      target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>',
      delta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 4l-8 16h16z"/></svg>',
      flame: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/><path d="M12 22c-1.7 0-3-1.3-3-3 0-1.8 1.5-3.2 3-5 1.5 1.8 3 3.2 3 5 0 1.7-1.3 3-3 3z"/></svg>',
      minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="7" y1="12" x2="17" y2="12"/></svg>',
      plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="7" x2="12" y2="17"/><line x1="7" y1="12" x2="17" y2="12"/></svg>',
      power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 3v8"/><path d="M17.66 6.34a8 8 0 11-11.32 0"/></svg>',
      heat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c-4 0-7-2.5-7-7 0-3.5 2.5-6 4.5-8.2C10.5 5.7 12 4 12 4s1.5 1.7 2.5 2.8C16.5 9 19 11.5 19 15c0 4.5-3 7-7 7z"/></svg>',
      cool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 2v20M4 6l16 12M20 6L4 18M8 3l4 3 4-3M8 21l4-3 4 3M3 10l1-4 4 1M21 10l-1-4-4 1M3 14l1 4 4-1M21 14l-1 4-4-1"/></svg>',
      water: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3s7 7.2 7 12a7 7 0 1 1-14 0c0-4.8 7-12 7-12z"/><path d="M9 16a3 3 0 0 0 3 3"/></svg>',
      auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"/></svg>',
      off: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="8"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
      up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>',
      down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
      stable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>'
    }, this._root = this.attachShadow({ mode: "open" });
  }
  static getConfigElement() {
    return document.createElement("altal-heatpump-card-editor");
  }
  static getStubConfig() {
    return {
      climate_entity: "climate.altal_home_heater",
      current_temp_entity: "sensor.altal_current_temp",
      target_temp_entity: "sensor.altal_target_temp",
      delta_t_entity: "sensor.altal_delta_t",
      heating_entity: "binary_sensor.altal_heating",
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: !0,
      show_presets: !0,
      show_controls: !0,
      show_image: !0,
      compact: !1,
      text_color: "",
      animation_color: ""
    };
  }
  setConfig(t) {
    if (!t.climate_entity) throw new Error("Укажите climate_entity");
    this._config = {
      step: 0.5,
      quick_presets: [19, 20, 22, 24],
      show_diagnostics: !0,
      show_presets: !0,
      show_controls: !0,
      show_image: !0,
      compact: !1,
      ...t
    }, this._hass && this._render();
  }
  set hass(t) {
    const e = this._hass;
    this._hass = t;
    const i = this._v(t, this._config.current_temp_entity);
    if (i !== null) {
      const o = Date.now();
      this._history.push({ t: i, ts: o }), this._history = this._history.filter((r) => r.ts > o - 30 * 6e4);
    }
    if (this._pendingTarget !== null) {
      const o = t.states[this._config.climate_entity]?.attributes?.temperature;
      o != null && Math.abs(parseFloat(o) - this._pendingTarget) < 0.01 && (this._pendingTarget = null);
    }
    (!e || e.states[this._config.climate_entity] !== t.states[this._config.climate_entity] || e.states[this._config.current_temp_entity] !== t.states[this._config.current_temp_entity] || e.states[this._config.target_temp_entity] !== t.states[this._config.target_temp_entity] || e.states[this._config.delta_t_entity] !== t.states[this._config.delta_t_entity] || e.states[this._config.heating_entity] !== t.states[this._config.heating_entity] || this._telSignature(e) !== this._telSignature(t)) && this._render();
  }
  getCardSize() {
    return this._config?.compact ? 4 : 7;
  }
  /* ── Tuya inquiry telemetry ─────────────── */
  _telSignature(t) {
    const e = this._config?.telemetry_prefix || "altal_t_";
    let i = "";
    for (const a of Object.keys(t.states))
      (a.startsWith("sensor." + e) || a.startsWith("binary_sensor." + e)) && (i += a + "=" + t.states[a].state + ";");
    return i;
  }
  _collectTelemetry(t) {
    const e = this._config.telemetry_prefix || "altal_t_", i = {};
    for (const a of Object.keys(t.states)) {
      let o = null;
      if (a.startsWith("sensor." + e) ? o = a.slice(("sensor." + e).length) : a.startsWith("binary_sensor." + e) && (o = a.slice(("binary_sensor." + e).length)), !o) continue;
      const r = t.states[a], s = r.attributes || {}, g = o.match(/(?:^|_)(c0*\d{1,2})(?:_|$)/i), d = s.altal_inquire_id ?? s.inquire_id ?? g?.[1] ?? null, n = o.match(/(?:^|_)([cd]0*\d{1,2})(?:_|$)/i), p = s.altal_setting_id ?? n?.[1] ?? null, _ = p ? R(p) : null, y = s.altal_group || (_ ? "params" : null) || (d ? H(d) : null) || "other", k = s.altal_label || _ || (d ? D(d) : null) || o.replace(/_/g, " ");
      let l;
      const v = a.startsWith("binary_sensor."), m = p ? U(p, r.state) : null;
      if (s.altal_display != null) l = String(s.altal_display);
      else if (m !== null) l = m;
      else if (v) l = r.state === "on" ? "Да" : "Нет";
      else {
        if (r.state === "unknown" || r.state === "unavailable") continue;
        l = r.state + (s.unit_of_measurement ? " " + s.unit_of_measurement : "");
      }
      const u = v ? r.state === "on" && (s.device_class === "problem" || s.device_class === "cold") : !1;
      (i[y] = i[y] || []).push({ label: k, value: l, bad: u });
    }
    return i;
  }
  _renderTelemetry(t) {
    if (this._config.show_telemetry === !1) return "";
    const e = this._collectTelemetry(t), i = {
      heat: "Отопление",
      dhw: "Горячая вода",
      refr: "Фреоновый контур",
      comp: "Компрессор",
      elec: "Электрика",
      service: "Состояние",
      other: "Прочее"
    }, a = ["service", "heat", "dhw", "comp", "refr", "elec", "other"], o = e.params || [];
    let r = "";
    for (const s of a) {
      const g = e[s];
      !g || !g.length || (r += `<div class="tel-group"><div class="tel-glbl">${i[s] || s}</div><div class="tel-grid">` + g.map((d) => `<div class="tel-cell"><div class="tv ${d.bad ? "bad" : ""}">${d.value}</div><div class="tl">${d.label}</div></div>`).join("") + "</div></div>");
    }
    return o.length && (r += `<button class="tel-params-link" id="tel_params">${this._paramsOpen ? "▲ Скрыть параметры" : "▼ Параметры настройки (" + o.length + ")"}</button>`, this._paramsOpen && (r += '<div class="tel-group"><div class="tel-grid">' + o.map((s) => `<div class="tel-cell"><div class="tv">${s.value}</div><div class="tl">${s.label}</div></div>`).join("") + "</div></div>")), r ? `
      <div class="telemetry">
        <button class="tel-toggle ${this._telOpen ? "open" : ""}" id="tel_toggle">
          <span>Телеметрия теплового насоса</span><span class="arr">▾</span>
        </button>
        <div class="tel-body ${this._telOpen ? "open" : ""}">${r}</div>
      </div>` : "";
  }
  /* ── Helpers ───────────────────────────── */
  _v(t, e) {
    const i = t?.states?.[e];
    if (!i || i.state === "unavailable" || i.state === "unknown") return null;
    const a = parseFloat(i.state);
    return isNaN(a) ? null : a;
  }
  _trend() {
    if (this._history.length < 3) return "flat";
    const t = this._history.slice(-5), e = t[t.length - 1].t - t[0].t;
    return e > 0.3 ? "up" : e < -0.3 ? "down" : "flat";
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
  _dtDiag(t, e, i, a) {
    const o = { icon: "", title: "", text: "", cls: "hide" };
    if (!a) return o;
    if (t === null || t === 0) return { icon: "⏳", title: "Ожидание данных ΔT", text: "Данные ещё не получены", cls: "neutral" };
    const r = (i ?? 0) - (e ?? 0);
    return r <= 0.7 && r >= -0.5 ? {
      icon: "🟢",
      title: "Режим поддержания",
      text: `Температура близка к уставке. ΔT ${t.toFixed(1)}°C — нормально при модуляции`,
      cls: "good"
    } : r >= 1.5 && (t < 2 || t > 10) ? {
      icon: "🧊",
      title: "Переходный режим",
      text: `Нагрев: ${e?.toFixed(1)} → ${i?.toFixed(1)}°C. ΔT=${t.toFixed(1)}°C — ещё не стабилизировался`,
      cls: "info"
    } : t >= 4 && t <= 7 ? {
      icon: "✅",
      title: `ΔT в норме: ${t.toFixed(1)}°C`,
      text: "Оптимальная разница подача–обратка",
      cls: "good"
    } : t < 4 ? {
      icon: "⚠️",
      title: `ΔT низкий: ${t.toFixed(1)}°C`,
      text: "Возможные причины: высокий расход, много контуров, низкая мощность компрессора",
      cls: "warn"
    } : {
      icon: "⚠️",
      title: `ΔT высокий: ${t.toFixed(1)}°C`,
      text: "Возможные причины: малый расход, засорён фильтр, воздух в системе, закрыты клапаны",
      cls: "warn"
    };
  }
  /* ── Actions ───────────────────────────── */
  _adjust(t) {
    const e = this._config.step || 0.5, i = this._hass.states[this._config.climate_entity], a = this._pendingTarget ?? parseFloat(i?.attributes?.temperature);
    if (isNaN(a)) return;
    const o = Math.round((a + t * e) * 10) / 10, r = Math.max(i?.attributes?.min_temp ?? 5, Math.min(i?.attributes?.max_temp ?? 35, o));
    this._pendingTarget = r;
    const s = this._root.querySelector(".sp-val");
    s && (s.textContent = r.toFixed(1) + "°"), this._svcTimer && clearTimeout(this._svcTimer), this._svcTimer = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: r
      });
    }, 600);
  }
  _preset(t) {
    this._pendingTarget = t;
    const e = this._root.querySelector(".sp-val");
    e && (e.textContent = t.toFixed(1) + "°"), this._svcTimer && clearTimeout(this._svcTimer), this._svcTimer = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: t
      });
    }, 300);
  }
  _mode(t) {
    const e = this._hass.states[this._config.climate_entity], i = e?.attributes?.hvac_modes;
    Array.isArray(i) && i.length && !i.includes(t) || (t.toLowerCase() === "off" ? e?.state && e.state.toLowerCase() !== "off" && (this._lastActiveMode = e.state) : this._lastActiveMode = t, this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.climate_entity,
      hvac_mode: t
    }));
  }
  _togglePower() {
    const t = this._hass.states[this._config.climate_entity];
    if (!t) return;
    const e = Array.isArray(t.attributes?.hvac_modes) ? t.attributes.hvac_modes.filter((a) => typeof a == "string") : ["heat", "off"];
    if (t.state.toLowerCase() === "off") {
      const a = F(e, this._lastActiveMode);
      a && this._mode(a);
      return;
    }
    const i = e.find((a) => a.toLowerCase() === "off");
    i && this._mode(i);
  }
  /* ── Interactive Graphs ────────────────────── */
  async _fetchGraph(t, e) {
    if (this._activeGraphEntity === t) {
      this._activeGraphEntity = null, this._render();
      return;
    }
    this._activeGraphEntity = t, this._render();
    const i = /* @__PURE__ */ new Date(), a = new Date(i.getTime() - 1440 * 60 * 1e3), o = this._cachedGraph[t];
    if (o && i.getTime() - o.time < 3e5) {
      this._render();
      return;
    }
    try {
      const r = a.toISOString(), s = i.toISOString(), g = await this._hass.callApi(
        "GET",
        `history/period/${r}?filter_entity_id=${t}&end_time=${s}&minimal_response`
      );
      if (g && g[0] && g[0].length > 0) {
        let d = 1 / 0, n = -1 / 0;
        const p = [], _ = a.getTime(), y = i.getTime() - _;
        for (const l of g[0]) {
          const v = parseFloat(l.state);
          if (isNaN(v)) continue;
          v < d && (d = v), v > n && (n = v);
          const m = new Date(l.last_changed).getTime();
          p.push({ x: (m - _) / y, y: v });
        }
        const k = this._hass.states[t]?.state;
        if (k) {
          const l = parseFloat(k);
          isNaN(l) || (p.push({ x: 1, y: l }), l < d && (d = l), l > n && (n = l));
        }
        if (p.length > 1) {
          const l = n - d, v = l === 0 ? 1 : l * 0.1, m = d - v, C = n + v - m, x = 300, f = 60;
          let $ = `M ${p[0].x * x},${f - (p[0].y - m) / C * f}`, T = `${$}`;
          for (let b = 1; b < p.length; b++) {
            const E = p[b].x * x, h = f - (p[b].y - m) / C * f;
            $ += ` L ${E},${h}`;
          }
          T = `${$} L ${x},${f} L 0,${f} Z`;
          const M = `
            <svg viewBox="0 0 ${x} ${f}" preserveAspectRatio="none" style="width:100%; height:60px; margin-top:10px; overflow:visible;">
              <defs>
                <linearGradient id="gf_${t}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--heat)" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="var(--heat)" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <path d="${T}" fill="url(#gf_${t})" />
              <path d="${$}" fill="none" stroke="var(--heat)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          `;
          this._cachedGraph[t] = { time: i.getTime(), svg: M, min: d, max: n }, this._activeGraphEntity === t && this._render();
        } else
          this._activeGraphEntity = null, this._render();
      }
    } catch (r) {
      console.warn("Altal Card - History fetch failed", r), this._activeGraphEntity = null, this._render();
    }
  }
  /* ══════════════════ CSS ══════════════════ */
  _css() {
    const t = this._config?.text_color || "var(--aerogel-text, var(--primary-text-color, #3b3f5c))", e = this._config?.animation_color || "var(--aerogel-warning, var(--state-climate-heat-color, var(--warning-color, #f07b3f)))";
    return `
      :host {
        --bg: var(--aerogel-base, var(--card-background-color, var(--ha-card-background, var(--primary-background-color, #e3e6ec))));
        --bg2: var(--aerogel-base-alt, color-mix(in srgb, var(--bg) 90%, var(--primary-text-color, #3b3f5c) 10%));
        --txt: ${t};
        --txt2: var(--aerogel-text-secondary, var(--secondary-text-color, color-mix(in srgb, var(--txt) 65%, var(--bg) 35%)));
        --accent: var(--aerogel-accent, var(--primary-color, #6CB4EE));

        --shadow-dark: color-mix(in srgb, var(--bg) 78%, var(--primary-text-color, #3b3f5c) 22%);
        --shadow-light: color-mix(in srgb, var(--bg) 86%, white 14%);
        --sh-d: var(--shadow-dark);
        --sh-l: var(--shadow-light);
        --raised: var(--aerogel-convex-lg, 6px 6px 14px var(--shadow-dark), -6px -6px 14px var(--shadow-light));
        --raised-s: var(--aerogel-convex-sm, 3px 3px 8px var(--shadow-dark), -3px -3px 8px var(--shadow-light));
        --inset: var(--aerogel-concave-lg, inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light));
        --inset-s: var(--aerogel-concave-sm, inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light));
        --btn: var(--aerogel-flat, 4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light));
        --btn-p: var(--aerogel-active, inset 3px 3px 7px var(--shadow-dark), inset -3px -3px 7px var(--shadow-light));

        --heat: ${e};
        --heat-g: color-mix(in srgb, var(--heat) 16%, transparent);
        --cool: var(--state-climate-cool-color, var(--info-color, #3b82f6));
        --water: var(--state-climate-dry-color, var(--info-color, var(--primary-color, #3b82f6)));
        --idle: var(--aerogel-text-secondary, var(--secondary-text-color, #93a5be));
        --good: var(--success-color, #05a677);
        --warn: var(--aerogel-warning, var(--warning-color, #e5a100));
        --error: var(--error-color, #e53935);
        --info: var(--aerogel-accent, #3b82f6);

        display: block; width: 100%; box-sizing: border-box;
        position: relative; z-index: 0; isolation: isolate;
        font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, var(--aerogel-font, 'Nunito', sans-serif)));
      }

      * { margin: 0; padding: 0; box-sizing: border-box; }

      /* ─── Card ─── */
      .card {
        background: var(--bg);
        border-radius: 24px;
        box-shadow: var(--raised);
        overflow: hidden;
        font-family: inherit;
        color: var(--txt);
        padding: clamp(16px, 5cqw, 24px);
        container-type: inline-size;
      }

      /* ─── Top ─── */
      .top {
        display: flex; align-items: center; justify-content: space-between;
        margin-bottom: clamp(16px, 5cqw, 24px);
      }
      .top-left { display: flex; align-items: center; gap: clamp(12px, 3cqw, 16px); }

      .pump-thumb {
        width: clamp(60px, 15cqw, 80px); aspect-ratio: 1;
        border-radius: 20px;
        background: var(--bg);
        box-shadow: var(--raised-s);
        overflow: hidden; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.3s;
      }
      .pump-thumb:hover { transform: scale(1.04); }
      .pump-thumb img {
        width: 100%; height: 100%;
        object-fit: cover;
      }
      .pump-thumb.empty {
        font-size: clamp(10px, 2.5cqw, 12px); font-weight: 700;
        color: var(--txt2); letter-spacing: 2px;
      }

      .top-info {}
      .top-info .name {
        font-size: clamp(16px, 4cqw, 20px); font-weight: 600;
        color: var(--txt); line-height: 1.3;
      }
      .top-info .status {
        font-size: clamp(11px, 2.8cqw, 13px); font-weight: 400;
        color: var(--txt2); margin-top: 4px;
      }

      .top-right {
        display: flex; flex-direction: column;
        align-items: flex-end; gap: clamp(6px, 2cqw, 10px);
      }

      /* Badge */
      .badge {
        display: inline-flex; align-items: center; gap: 6px;
        padding: 5px 14px; border-radius: 20px;
        font-size: clamp(9px, 2cqw, 11px); font-weight: 600;
        letter-spacing: 0.5px;
      }
      .badge .dot { width: 7px; height: 7px; border-radius: 50%; }
      .badge.heating { background: color-mix(in srgb, var(--heat) 12%, transparent); color: var(--heat); }
      .badge.heating .dot { background: var(--heat); box-shadow: 0 0 6px var(--heat); animation: blink 1.4s ease-in-out infinite; }
      .badge.idle { background: color-mix(in srgb, var(--idle) 12%, transparent); color: var(--idle); }
      .badge.idle .dot { background: var(--idle); }
      .badge.off { background: color-mix(in srgb, var(--idle) 8%, transparent); color: var(--idle); }
      .badge.off .dot { background: var(--idle); }
      @keyframes blink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.3;transform:scale(1.5)} }

      /* Power */
      .pwr {
        width: clamp(36px, 9cqw, 44px); aspect-ratio: 1; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--idle); transition: all 0.25s;
      }
      .pwr:hover { box-shadow: 5px 5px 12px var(--sh-d), -5px -5px 12px var(--sh-l); }
      .pwr:active { box-shadow: var(--btn-p); }
      .pwr.on { color: var(--heat); }
      .pwr svg { width: clamp(18px, 4.5cqw, 22px); height: clamp(18px, 4.5cqw, 22px); }

      /* ─── Main dial area ─── */
      .dial-area {
        display: flex; align-items: center; justify-content: center;
        gap: clamp(12px, 4cqw, 20px); margin-bottom: 12px;
      }

      /* Side +/- */
      .side-btn {
        width: clamp(40px, 10cqw, 56px); aspect-ratio: 1; border-radius: 16px; border: none;
        background: var(--bg); box-shadow: var(--btn);
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        color: var(--txt); flex-shrink: 0;
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .side-btn:hover { transform: scale(1.06); box-shadow: var(--raised); }
      .side-btn:active { box-shadow: var(--btn-p); transform: scale(0.94); }
      .side-btn svg { width: clamp(20px, 5cqw, 24px); }

      /* Circle */
      .circle {
        width: clamp(140px, 40cqw, 260px); aspect-ratio: 1;
        border-radius: 50%; flex-shrink: 0;
        background: var(--bg); box-shadow: var(--raised);
        display: flex; align-items: center; justify-content: center;
        position: relative;
      }
      .circle-in {
        width: 85%; aspect-ratio: 1;
        border-radius: 50%;
        background: var(--bg); box-shadow: var(--inset);
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        position: relative; z-index: 2; overflow: hidden;
      }

      /* Glow + spin + ripple */
      .glow {
        position: absolute; inset: 0; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.5s;
      }
      .glow.on { background: radial-gradient(circle, var(--heat-g) 0%, transparent 60%); opacity: 1; animation: gp 2.5s ease-in-out infinite; }
      @keyframes gp { 0%,100%{opacity:.4;transform:scale(.97)} 50%{opacity:1;transform:scale(1.03)} }

      .spin-ring {
        position: absolute; inset: -3px; border-radius: 50%;
        pointer-events: none; opacity: 0; transition: opacity 0.4s;
      }
      .spin-ring.on {
        opacity: 1;
        border: 2.5px solid transparent;
        border-top-color: var(--heat);
        border-right-color: color-mix(in srgb, var(--heat) 30%, transparent);
        animation: sp 3s linear infinite;
        filter: drop-shadow(0 0 3px var(--heat-g));
      }
      @keyframes sp { to { transform:rotate(360deg); } }

      /* Temp display */
      .c-lbl {
        font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
        position: relative; z-index: 3;
      }
      .c-val {
        font-size: clamp(32px, 10cqw, 56px); font-weight: 300; line-height: 1;
        color: var(--txt); margin-top: 2px;
        position: relative; z-index: 3; transition: color 0.3s;
      }
      .c-val sup { font-size: clamp(16px, 4cqw, 24px); font-weight: 400; }
      .c-val.hot { color: var(--heat); }

      .c-trend {
        display: flex; align-items: center; gap: 4px;
        margin-top: 6px; font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500;
        color: var(--txt2); position: relative; z-index: 3;
      }
      .c-trend svg { width: clamp(12px, 3.5cqw, 14px); aspect-ratio: 1; }
      .c-trend.up { color: var(--heat); }
      .c-trend.down { color: var(--info); }
      .c-trend.flat { color: var(--good); }

      /* ─── Setpoint below dial ─── */
      .setpoint {
        text-align: center; margin-bottom: clamp(16px, 5cqw, 22px);
      }
      .sp-lbl {
        font-size: clamp(9px, 2.5cqw, 11px); font-weight: 500; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2);
      }
      .sp-val {
        font-size: clamp(24px, 7cqw, 36px); font-weight: 600; color: var(--txt);
        line-height: 1.3; transition: color 0.3s;
      }
      .sp-val.hot { color: var(--heat); }

      /* ─── Sensor metrics ─── */
      .metrics {
        display: grid; grid-template-columns: 1fr 1fr;
        gap: clamp(10px, 3cqw, 14px); margin-bottom: 18px;
        width: 100%;
      }
      .metric {
        background: var(--bg);
        box-shadow: var(--raised-s);
        border-radius: 18px; padding: clamp(12px, 3cqw, 16px);
        display: flex; align-items: center; gap: clamp(8px, 2.5cqw, 12px);
        transition: all 0.25s;
        animation: pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
      }
      .metric:nth-child(1){animation-delay:.1s}
      .metric:nth-child(2){animation-delay:.15s}
      .metric:nth-child(3){animation-delay:.2s}
      .metric:nth-child(4){animation-delay:.25s}
      @keyframes pop { 0%{opacity:0;transform:scale(.85)} 100%{opacity:1;transform:none} }
      .metric:hover { transform: translateY(-2px); box-shadow: var(--raised); }
      .metric:active { box-shadow: var(--inset-s); transform: none; }

      .m-ico {
        width: 44px; height: 44px; border-radius: 14px;
        background: var(--bg); box-shadow: var(--inset-s);
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0; color: var(--txt2); transition: color 0.3s;
      }
      .m-ico svg { width: 22px; height: 22px; }
      .m-ico.hot { color: var(--heat); }
      .m-ico.ok { color: var(--good); }

      .m-txt { min-width: 0; }
      .m-val { font-size: clamp(15px, 4.5cqw, 20px); font-weight: 600; color: var(--txt); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .m-val.hot { color: var(--heat); }
      .m-lbl { font-size: 12px; font-weight: 500; color: var(--txt2); margin-top: 2px; }

      /* ΔT bar */
      .dt-bar { 
        height: 4px; border-radius: 4px; margin-top: 6px;
        background: var(--bg); box-shadow: var(--inset-s);
        overflow: hidden; 
      }
      .dt-fill {
        height: 100%; border-radius: 4px;
        transition: width 0.8s ease;
      }
      .dt-fill.ok { background: var(--good); }
      .dt-fill.mid { background: var(--warn); }
      .dt-fill.bad { background: var(--error); }

      /* ─── Diagnostics & Graphs ─── */
      .diag {
        background: var(--bg); box-shadow: var(--inset);
        border-radius: 18px; padding: 16px 20px;
        margin-bottom: 18px; display: flex;
        flex-direction: column;
        align-items: flex-start; gap: 14px;
        font-size: 13px; font-weight: 400; line-height: 1.6;
        color: var(--txt2);
        animation: pop 0.4s 0.3s both;
        overflow: hidden;
      }
      .diag.hide { display: none; }
      
      .diag-row {
        display: flex; width: 100%;
        align-items: flex-start; gap: 14px;
      }
      .diag .d-i { font-size: 24px; flex-shrink: 0; line-height: 1; }
      .diag .d-b { flex: 1; }
      .diag .d-t { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 3px; }
      .diag.good .d-t { color: var(--good); }
      .diag.warn .d-t { color: var(--warn); }
      .diag.info .d-t { color: var(--info); }
      
      .graph {
        width: 100%;
        border-top: 1px solid rgba(139, 143, 163, 0.15);
        padding-top: 10px;
        margin-top: 2px;
        animation: fadeDown 0.4s ease-out;
      }
      .graph-hdr {
        display: flex; justify-content: space-between;
        font-size: 10px; text-transform: uppercase;
        letter-spacing: 1px; color: var(--txt2); font-weight: 600;
      }
      @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:none} }

      /* ─── Tuya inquiry telemetry — theme-aware neumorphic language ─── */
      .telemetry {
        width: 100%; margin-bottom: 18px;
        animation: pop 0.4s 0.35s both;
      }
      .tel-toggle {
        width: 100%; display: flex; align-items: center; justify-content: space-between;
        background: var(--bg); box-shadow: var(--raised-s); border: none;
        border-radius: 16px; padding: 12px 18px; cursor: pointer;
        font-size: 12px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2); font-family: inherit;
        transition: all 0.25s;
      }
      .tel-toggle:hover { transform: translateY(-2px); box-shadow: var(--raised); }
      .tel-toggle:active { box-shadow: var(--inset-s); transform: none; }
      .tel-toggle .arr { transition: transform 0.3s; }
      .tel-toggle.open .arr { transform: rotate(180deg); }
      .tel-body { display: none; margin-top: 12px; }
      .tel-body.open { display: block; animation: fadeDown 0.4s ease-out; }
      .tel-group { margin-bottom: 14px; }
      .tel-group:last-child { margin-bottom: 0; }
      .tel-glbl {
        font-size: 10px; font-weight: 600; text-transform: uppercase;
        letter-spacing: 1.5px; color: var(--txt2); margin: 0 4px 8px;
      }
      .tel-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
        gap: 10px;
      }
      .tel-cell {
        background: var(--bg); box-shadow: var(--inset-s);
        border-radius: 14px; padding: 10px 12px; min-width: 0;
      }
      .tel-cell .tv {
        font-size: clamp(14px, 4cqw, 17px); font-weight: 600; color: var(--txt);
        line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .tel-cell .tv.hot { color: var(--heat); }
      .tel-cell .tv.bad { color: var(--error); }
      .tel-cell .tl {
        font-size: 10px; font-weight: 500; color: var(--txt2); margin-top: 3px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .tel-params-link {
        width: 100%; margin-top: 4px; background: none; border: none;
        color: var(--info); font-size: 11px; font-weight: 600; cursor: pointer;
        font-family: inherit; padding: 6px 0; letter-spacing: 0.5px;
      }

      /* ─── Presets ─── */
      .presets {
        display: flex; gap: 10px; justify-content: center;
        flex-wrap: wrap; margin-bottom: 18px;
        animation: pop 0.4s 0.35s both;
      }
      .chip {
        padding: 10px 20px; border-radius: 14px; border: none;
        background: var(--bg); box-shadow: var(--raised-s);
        cursor: pointer; font-family: inherit;
        font-size: 15px; font-weight: 500; color: var(--txt);
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .chip:hover { transform: translateY(-2px); }
      .chip:active { box-shadow: var(--btn-p); transform: scale(0.95); }
      .chip.on { color: var(--heat); box-shadow: var(--btn-p); font-weight: 600; }

      /* ─── Mode row ─── */
      .modes {
        display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
        animation: pop 0.4s 0.4s both;
      }
      .mbtn {
        padding: 12px 16px; border-radius: 16px; border: none;
        background: var(--bg); box-shadow: var(--raised-s);
        cursor: pointer; font-family: inherit;
        font-size: 13px; font-weight: 600;
        text-transform: uppercase; letter-spacing: 0.5px;
        color: var(--txt2); display: flex; align-items: center; justify-content: center; gap: 8px;
        transition: all 0.2s; -webkit-tap-highlight-color: transparent;
      }
      .mbtn:hover { transform: translateY(-2px); }
      .mbtn:active { box-shadow: var(--btn-p); transform: scale(0.95); }
      .mbtn.on { box-shadow: var(--btn-p); }
      .mbtn.on.mode-heat, .mbtn.on.mode-heat-water { color: var(--heat); }
      .mbtn.on.mode-cool, .mbtn.on.mode-cool-water { color: var(--cool); }
      .mbtn.on.mode-water { color: var(--water); }
      .mbtn.on.mode-off { color: var(--idle); }
      .mbtn svg { width: 16px; height: 16px; }

      /* ─── Error ─── */
      .err {
        padding: 40px; text-align: center; border-radius: 24px;
        background: var(--bg); box-shadow: var(--raised);
      }
      .err h3 { font-size: 18px; font-weight: 600; color: var(--error); margin-bottom: 8px; }
      .err p { font-size: 14px; color: var(--txt2); }
    `;
  }
  /* ══════════════════ RENDER ══════════════════ */
  _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card" style="text-align:center;padding:40px;color:var(--txt2);font-family:'Rubik',sans-serif">Загрузка…</div>`;
      return;
    }
    const t = this._config, e = this._hass, i = e.states[t.climate_entity];
    if (!i) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p>${t.climate_entity}</p></div>`;
      return;
    }
    const a = this._v(e, t.current_temp_entity) ?? (i.attributes.current_temperature !== void 0 ? parseFloat(i.attributes.current_temperature) : null), o = this._v(e, t.target_temp_entity) ?? parseFloat(i.attributes.temperature), r = t.delta_t_entity ? this._v(e, t.delta_t_entity) : null, s = i.state, g = s.toLowerCase() === "off", d = S(s);
    let n = !1;
    t.heating_entity && e.states[t.heating_entity] ? n = e.states[t.heating_entity].state === "on" : n = i.attributes.hvac_action === "heating" || (d === "heat" || d === "heat-water") && a !== null && a < o;
    const p = this._pendingTarget ?? i.attributes.temperature, _ = Array.isArray(i.attributes.hvac_modes) ? i.attributes.hvac_modes.filter((h) => typeof h == "string") : ["heat", "off"], y = t.name || i.attributes.friendly_name || "Altal Heat Pump", k = t.quick_presets || [19, 20, 22, 24], l = this._trend(), v = l === "up" ? this._ico.up : l === "down" ? this._ico.down : this._ico.stable, m = l === "up" ? "Растёт" : l === "down" ? "Падает" : "Стабильно";
    let u = this._dtDiag(r, a, o, n), C = "";
    if (this._activeGraphEntity) {
      const h = this._cachedGraph[this._activeGraphEntity];
      if (h) {
        let w = "График";
        this._activeGraphEntity === t.current_temp_entity && (w = "Текущая температура"), this._activeGraphEntity === t.target_temp_entity && (w = "Уставка нагрева"), this._activeGraphEntity === t.delta_t_entity && (w = "Дельта T (ΔT)"), u = { icon: "📊", title: w, text: "Данные за последние 24 часа", cls: "neutral" }, C = `
          <div class="graph">
            <div class="graph-hdr"><span>${h.min.toFixed(1)}</span><span>${h.max.toFixed(1)}</span></div>
            ${h.svg}
          </div>
        `;
      } else
        u = { icon: "⌛", title: "Загрузка", text: "Получение графиков из истории...", cls: "neutral" };
    }
    let x = "off", f = "Выкл";
    n ? (x = "heating", f = "Нагрев") : g || (x = "idle", f = "Ожидание");
    const $ = {
      heat: this._ico.heat,
      hot: this._ico.heat,
      cool: this._ico.cool,
      cold: this._ico.cool,
      hotwater: this._ico.water,
      dhw: this._ico.water,
      hot_hotwater: this._ico.heat,
      cold_hotwater: this._ico.cool,
      auto: this._ico.auto,
      off: this._ico.off
    }, T = r != null ? Math.min(100, r / 12 * 100) : 0, M = r != null ? r >= 4 && r <= 7 ? "ok" : r < 3 || r > 9 ? "bad" : "mid" : "ok", b = t.show_image !== !1, E = p != null ? parseFloat(p).toFixed(1) : "—";
    this._root.innerHTML = `
      <style>${this._css()}</style>
      <ha-card>
        <div class="card">

          <!-- TOP -->
          <div class="top">
            <div class="top-left">
              ${b && t.image ? `<div class="pump-thumb"><img src="${t.image}" alt="Heat Pump"/></div>` : b ? '<div class="pump-thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" style="width: 40px; color: var(--txt2);"><path d="M4 14v-4a2 2 0 012-2h12a2 2 0 012 2v4M4 14a2 2 0 002 2h12a2 2 0 002-2M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4M8 11v6M16 11v6"/></svg></div>' : ""}
              <div class="top-info">
                <div class="name">${y}</div>
                <div class="status">Тепловой насос · ${A(s)}</div>
              </div>
            </div>
            <div class="top-right">
              <div class="badge ${x}"><span class="dot"></span>${f}</div>
              <button class="pwr ${g ? "" : "on"}" id="pwr">${this._ico.power}</button>
            </div>
          </div>

          <!-- DIAL AREA: [-] [circle] [+] -->
          ${t.show_controls !== !1 ? `
          <div class="dial-area">
            <button class="side-btn" id="dn">${this._ico.minus}</button>
            <div class="circle">
              <div class="spin-ring ${n ? "on" : ""}"></div>
              <div class="circle-in">
                <div class="glow ${n ? "on" : ""}"></div>
                <span class="c-lbl">Сейчас</span>
                <span class="c-val ${n ? "hot" : ""}">${a !== null ? a.toFixed(1) : "—"}<sup>°</sup></span>
                <span class="c-trend ${l}">${v} ${m}</span>
              </div>
            </div>
            <button class="side-btn" id="up">${this._ico.plus}</button>
          </div>

          <!-- SETPOINT -->
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val ${n ? "hot" : ""}">${E}°</div>
          </div>
          ` : `
          <div class="dial-area">
            <div class="circle">
              <div class="spin-ring ${n ? "on" : ""}"></div>
              <div class="circle-in">
                <div class="glow ${n ? "on" : ""}"></div>
                <span class="c-lbl">Сейчас</span>
                <span class="c-val ${n ? "hot" : ""}">${a !== null ? a.toFixed(1) : "—"}<sup>°</sup></span>
                <span class="c-trend ${l}">${v} ${m}</span>
              </div>
            </div>
          </div>
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val ${n ? "hot" : ""}">${E}°</div>
          </div>
          `}

          <!-- METRICS -->
          <div class="metrics">
            <div class="metric" id="m_cur" style="cursor: pointer" aria-label="График текущей температуры">
              <div class="m-ico ${n ? "hot" : ""}">${this._ico.thermo}</div>
              <div class="m-txt">
                <div class="m-val">${a !== null ? a.toFixed(1) : "—"}°C</div>
                <div class="m-lbl">Текущая</div>
              </div>
            </div>
            <div class="metric" id="m_tgt" style="cursor: pointer" aria-label="График уставки">
              <div class="m-ico">${this._ico.target}</div>
              <div class="m-txt">
                <div class="m-val">${o !== null ? o.toFixed(1) : "—"}°C</div>
                <div class="m-lbl">Уставка</div>
              </div>
            </div>
            ${t.delta_t_entity ? `
            <div class="metric" id="m_dt" style="cursor: pointer" aria-label="График дельта T">
              <div class="m-ico">${this._ico.delta}</div>
              <div class="m-txt">
                <div class="m-val">${r !== null ? r.toFixed(1) : "—"}°C</div>
                <div class="m-lbl">ΔT</div>
                <div class="dt-bar"><div class="dt-fill ${M}" style="width:${T}%"></div></div>
              </div>
            </div>
            ` : ""}
            <div class="metric" id="m_heat" style="cursor: pointer" aria-label="График статуса нагрева">
              <div class="m-ico ${n ? "hot" : ""}">${this._ico.flame}</div>
              <div class="m-txt">
                <div class="m-val ${n ? "hot" : ""}">${n ? "Вкл" : "Нет"}</div>
                <div class="m-lbl">Нагрев</div>
              </div>
            </div>
          </div>

          <!-- DIAGNOSTICS & GRAPHS -->
          ${this._renderTelemetry(this._hass)}
          ${t.show_diagnostics !== !1 || this._activeGraphEntity ? `
            <div class="diag ${!t.show_diagnostics && !this._activeGraphEntity || !this._activeGraphEntity && u.cls === "hide" ? "hide" : u.cls}">
              <div class="diag-row">
                <span class="d-i">${u.icon}</span>
                <div class="d-b">
                  <div class="d-t">${u.title}</div>
                  ${u.text ? `<div>${u.text}</div>` : ""}
                </div>
              </div>
              ${C}
            </div>
          ` : ""}

          <!-- PRESETS -->
          ${t.show_presets !== !1 ? `
            <div class="presets">
              ${k.map((h) => `<button class="chip ${p != null && Math.abs(h - parseFloat(p)) < 0.1 ? "on" : ""}" data-t="${h}">${h}°</button>`).join("")}
            </div>
          ` : ""}

          <!-- MODES -->
          <div class="modes">
            ${_.map((h) => {
      const w = h.toLowerCase(), L = A(h);
      return `<button class="mbtn mode-${S(h)} ${w === s.toLowerCase() ? "on" : ""}" data-m="${h}" aria-label="${L}">${$[w] || ""} ${L}</button>`;
    }).join("")}
          </div>

        </div>
      </ha-card>
    `, this._bindAll();
  }
  /* ── Events ───────────────────────────── */
  _bindAll() {
    const t = (e) => this._root.getElementById(e);
    t("dn")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._adjust(-1);
    }), t("up")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._adjust(1);
    }), t("pwr")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._togglePower();
    }), t("tel_toggle")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._telOpen = !this._telOpen, this._render();
    }), t("tel_params")?.addEventListener("click", (e) => {
      e.preventDefault(), e.stopPropagation(), this._paramsOpen = !this._paramsOpen, this._render();
    }), t("m_cur")?.addEventListener("click", () => {
      const e = this._config;
      e.current_temp_entity && this._fetchGraph(e.current_temp_entity, "Текущая");
    }), t("m_tgt")?.addEventListener("click", () => {
      const e = this._config;
      e.target_temp_entity && this._fetchGraph(e.target_temp_entity, "Уставка");
    }), t("m_dt")?.addEventListener("click", () => {
      const e = this._config;
      e.delta_t_entity && this._fetchGraph(e.delta_t_entity, "ΔT");
    }), t("m_heat")?.addEventListener("click", () => {
      const e = this._config;
      e.heating_entity && this._fetchGraph(e.heating_entity, "Нагрев");
    }), this._root.querySelectorAll(".chip").forEach(
      (e) => e.addEventListener("click", (i) => {
        i.preventDefault(), i.stopPropagation(), this._preset(parseFloat(i.currentTarget.dataset.t || "20"));
      })
    ), this._root.querySelectorAll(".mbtn").forEach(
      (e) => e.addEventListener("click", (i) => {
        i.preventDefault(), i.stopPropagation(), this._mode(i.currentTarget.dataset.m || "off");
      })
    );
  }
}
class Y extends I {
}
customElements.get("altal-heatpump-card") || customElements.define("altal-heatpump-card", I);
customElements.get("altal-heatpump-card-pro") || customElements.define("altal-heatpump-card-pro", Y);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "altal-heatpump-card",
  name: "Altal Heater Card",
  description: "Premium neumorphic card for Altal heat pump",
  preview: !0,
  documentationURL: "https://github.com/skeep83/altal_heater_card"
});
window.customCards.push({
  type: "altal-heatpump-card-pro",
  name: "Altal Heater Card PRO",
  description: "Theme-aware neumorphic card with Tuya EVI c01-c31 inquiry labels and native HVAC mode mapping",
  preview: !0,
  documentationURL: "https://github.com/skeep83/altal_heater_card_pro"
});
console.info(
  "%c ALTAL-HEATER-CARD %c v4.4.0 ",
  "color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;",
  "color: #e6642f; background: #e3e6ec; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;"
);
