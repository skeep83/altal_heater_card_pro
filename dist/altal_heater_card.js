class I extends HTMLElement {
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
      this._root.getElementById(i)?.addEventListener("change", (r) => {
        const s = r.target.value;
        this._config = { ...this._config, [i]: s || void 0 }, this._dispatch();
      });
    }), this._root.getElementById("quick_presets")?.addEventListener("change", (i) => {
      const o = i.target.value.split(",").map((r) => parseFloat(r.trim())).filter((r) => !isNaN(r));
      this._config = { ...this._config, quick_presets: o.length ? o : void 0 }, this._dispatch();
    }), this._root.querySelectorAll(".toggle").forEach((i) => {
      i.addEventListener("click", () => {
        const o = i.dataset.field, r = this._config[o], s = r === !1 ? !0 : r === !0 || r === void 0 ? !1 : !r;
        this._config[o] = o === "compact" ? !this._config.compact : s, this._dispatch(), this._render();
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
customElements.get("altal-heatpump-card-editor") || customElements.define("altal-heatpump-card-editor", I);
const N = {
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
}, O = {
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
function q(a) {
  return N[a.toLowerCase()] ?? a;
}
function P(a) {
  return O[a.toLowerCase()] ?? "other";
}
function D(a, t) {
  const e = a.filter((o) => typeof o == "string" && o.toLowerCase() !== "off");
  if (!e.length) return null;
  if (t) {
    const o = e.find((r) => r.toLowerCase() === t.toLowerCase());
    if (o) return o;
  }
  const i = ["hot", "heat", "hot_hotwater", "hotwater", "dhw", "auto", "heat_cool", "cold", "cool", "cold_hotwater"];
  for (const o of i) {
    const r = e.find((s) => s.toLowerCase() === o);
    if (r) return r;
  }
  return e[0];
}
const R = {
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
}, V = {
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
function G(a) {
  const t = String(a).trim().match(/^c?0*(\d{1,2})$/i);
  if (!t) return null;
  const e = Number(t[1]);
  return !Number.isInteger(e) || e < 1 || e > 31 ? null : `c${String(e).padStart(2, "0")}`;
}
function U(a) {
  const t = G(a);
  return t ? R[t] ?? null : null;
}
function W(a) {
  const t = G(a);
  return t ? V[t] ?? null : null;
}
const K = "Допустимые режимы системы", Y = {
  0: "Охлаждение",
  1: "Охлаждение + отопление",
  2: "Отопление",
  3: "Охлаждение + отопление + ГВС",
  4: "Отопление",
  5: "Отопление + ГВС",
  6: "Охлаждение + ГВС"
};
function j(a) {
  const t = String(a).trim().toLowerCase();
  return t === "c41" || t === "d41" || t === "41";
}
function X(a) {
  return j(a) ? K : null;
}
function Q(a, t) {
  return j(a) ? Y[String(t).trim()] ?? null : null;
}
const J = 0.5;
function Z(a) {
  if (a.off) return { kind: "off", running: !1, demand: !1, label: "Выкл" };
  const t = a.current !== null && a.target !== null && a.current < a.target - J;
  let e;
  return a.heatingEntity !== null ? e = a.heatingEntity === "on" : a.freq !== null || a.power !== null ? e = (a.freq ?? 0) > 0 || (a.power ?? 0) > 0.05 : a.hvacAction ? e = a.hvacAction === "heating" || a.hvacAction === "cooling" : e = t, e ? { kind: "running", running: e, demand: t, label: "Работает" } : t ? { kind: "waiting", running: e, demand: t, label: "Ожидание" } : { kind: "reached", running: e, demand: t, label: "Уставка достигнута" };
}
function tt(a, t) {
  if (!a) return 0;
  const e = t !== null && t > 0 ? t : 30;
  return Math.max(40, Math.min(420, e * 6));
}
function et(a, t) {
  if (!a) return 0;
  const e = t !== null && t > 0 ? t : 3;
  return Math.max(14, Math.min(90, 12 + e * 7));
}
function A(a, t, e) {
  return a === null || !Number.isFinite(a) || e <= t ? 0 : Math.max(0, Math.min(1, (a - t) / (e - t)));
}
function F(a) {
  return a === null || !Number.isFinite(a) ? "none" : a >= 4 && a <= 7 ? "ok" : a < 3 || a > 9 ? "bad" : "mid";
}
class B extends HTMLElement {
  constructor() {
    super(), this._history = [], this._pendingTarget = null, this._svcTimer = null, this._cachedGraph = {}, this._activeGraphEntity = null, this._telOpen = !1, this._paramsOpen = !1, this._lastActiveMode = null, this._structKey = "", this._lastTelHtml = "", this._numTweens = /* @__PURE__ */ new WeakMap(), this._anim = { rot: 0, sweep: 0, flow: 0, spd: 0, flowSpd: 0, tgtSpd: 0, tgtFlow: 0, raf: 0, last: 0 }, this._comets = [], this._sheen = null, this._sheenGrad = null, this._reduceMotion = typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches, this._ico = {
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
      stable: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>',
      rotor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 4-7 2 0 2 3 0 5l-2.3 2.6M14 12c4 0 7 1 7 4 0 2-3 2-5 0l-2.6-2.3M12 14c0 4-1 7-4 7-2 0-2-3 0-5l2.3-2.6M10 12c-4 0-7-1-7-4 0-2 3-2 5 0l2.6 2.3"/></svg>',
      bolt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
      tank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="4"/><path d="M6 13c2-1 4 1 6 0s4-1 6 0"/></svg>',
      outdoor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M17 3v4"/></svg>'
    }, this._tick = (t) => {
      const e = this._anim, i = e.last ? Math.min(0.1, (t - e.last) / 1e3) : 0;
      e.last = t;
      const o = 1 - Math.exp(-i / 1.6);
      if (e.spd += (e.tgtSpd - e.spd) * o, e.flowSpd += (e.tgtFlow - e.flowSpd) * o, e.rot = (e.rot + e.spd * i) % 360, e.sweep = (e.sweep + e.spd / 360 * (414.69 / 4) * i) % (414.69 + 80), e.flow = (e.flow + e.flowSpd * i) % 2e3, this._paintAnim(), !e.tgtSpd && !e.tgtFlow && e.spd < 0.5 && e.flowSpd < 0.5) {
        e.spd = 0, e.flowSpd = 0, e.raf = 0, e.last = 0, this._paintAnim();
        return;
      }
      e.raf = requestAnimationFrame(this._tick);
    }, this._root = this.attachShadow({ mode: "open" });
  }
  connectedCallback() {
    (this._anim.tgtSpd || this._anim.tgtFlow) && this._kick();
  }
  disconnectedCallback() {
    this._anim.raf && cancelAnimationFrame(this._anim.raf), this._anim.raf = 0, this._anim.last = 0;
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
    }, this._structKey = "", this._hass && this._render();
  }
  set hass(t) {
    const e = this._hass;
    this._hass = t;
    const i = this._v(t, this._config.current_temp_entity);
    if (i !== null) {
      const r = Date.now();
      this._history.push({ t: i, ts: r }), this._history = this._history.filter((s) => s.ts > r - 30 * 6e4);
    }
    if (this._pendingTarget !== null) {
      const r = t.states[this._config.climate_entity]?.attributes?.temperature;
      r != null && Math.abs(parseFloat(r) - this._pendingTarget) < 0.01 && (this._pendingTarget = null);
    }
    (!e || e.states[this._config.climate_entity] !== t.states[this._config.climate_entity] || e.states[this._config.current_temp_entity] !== t.states[this._config.current_temp_entity] || e.states[this._config.target_temp_entity] !== t.states[this._config.target_temp_entity] || e.states[this._config.delta_t_entity] !== t.states[this._config.delta_t_entity] || e.states[this._config.heating_entity] !== t.states[this._config.heating_entity] || [
      this._config.supply_entity,
      this._config.return_entity,
      this._config.compressor_entity,
      this._config.power_entity,
      this._config.tank_entity,
      this._config.outdoor_entity
    ].some((r) => r && e.states[r] !== t.states[r]) || this._telSignature(e) !== this._telSignature(t)) && this._render();
  }
  /* ── Live entity resolution ────────────── */
  /** Configured entity, else sensor.<prefix><suffix> if Home Assistant has it. */
  _ent(t, e) {
    if (t) return t;
    const i = `sensor.${this._config.telemetry_prefix || "altal_t_"}${e}`;
    return this._hass?.states?.[i] ? i : null;
  }
  _live() {
    const t = this._config, e = this._hass, i = {
      supply: this._ent(t.supply_entity, "outlet_temp"),
      ret: this._ent(t.return_entity, "inlet_temp"),
      freq: this._ent(t.compressor_entity, "comp_freq"),
      power: this._ent(t.power_entity, "power"),
      tank: this._ent(t.tank_entity, "tank_temp"),
      outdoor: this._ent(t.outdoor_entity, "outdoor_temp"),
      tankSet: this._ent(void 0, "param_tank_set")
    }, o = (p) => p ? this._v(e, p) : null, r = o(i.supply), s = o(i.ret), n = (t.delta_t_entity ? this._v(e, t.delta_t_entity) : null) ?? (r !== null && s !== null ? Math.round((r - s) * 10) / 10 : null);
    return {
      e: i,
      supply: r,
      ret: s,
      dt: n,
      freq: o(i.freq),
      power: o(i.power),
      tank: o(i.tank),
      outdoor: o(i.outdoor),
      tankSet: o(i.tankSet)
    };
  }
  getCardSize() {
    return this._config?.compact ? 4 : 7;
  }
  /* ── Tuya inquiry telemetry ─────────────── */
  _telSignature(t) {
    const e = this._config?.telemetry_prefix || "altal_t_";
    let i = "";
    for (const o of Object.keys(t.states))
      (o.startsWith("sensor." + e) || o.startsWith("binary_sensor." + e)) && (i += o + "=" + t.states[o].state + ";");
    return i;
  }
  _collectTelemetry(t) {
    const e = this._config.telemetry_prefix || "altal_t_", i = {};
    for (const o of Object.keys(t.states)) {
      let r = null;
      if (o.startsWith("sensor." + e) ? r = o.slice(("sensor." + e).length) : o.startsWith("binary_sensor." + e) && (r = o.slice(("binary_sensor." + e).length)), !r) continue;
      const s = t.states[o], l = s.attributes || {}, n = r.match(/(?:^|_)(c0*\d{1,2})(?:_|$)/i), p = l.altal_inquire_id ?? l.inquire_id ?? n?.[1] ?? null, c = r.match(/(?:^|_)([cd]0*\d{1,2})(?:_|$)/i), u = l.altal_setting_id ?? c?.[1] ?? null, f = u ? X(u) : null, k = l.altal_group || (f ? "params" : null) || (p ? W(p) : null) || "other", d = l.altal_label || f || (p ? U(p) : null) || r.replace(/_/g, " ");
      let h;
      const m = o.startsWith("binary_sensor."), v = u ? Q(u, s.state) : null;
      if (l.altal_display != null) h = String(l.altal_display);
      else if (v !== null) h = v;
      else if (m) h = s.state === "on" ? "Да" : "Нет";
      else {
        if (s.state === "unknown" || s.state === "unavailable") continue;
        h = s.state + (l.unit_of_measurement ? " " + l.unit_of_measurement : "");
      }
      const M = m ? s.state === "on" && (l.device_class === "problem" || l.device_class === "cold") : !1;
      (i[k] = i[k] || []).push({ label: d, value: h, bad: M });
    }
    return i;
  }
  _renderTelemetry(t) {
    return this._config.show_telemetry === !1 || !Object.keys(this._collectTelemetry(t)).length ? "" : `
      <div class="telemetry">
        <button class="tel-toggle ${this._telOpen ? "open" : ""}" id="tel_toggle">
          <span>Телеметрия теплового насоса</span><span class="arr">▾</span>
        </button>
        <div class="tel-body ${this._telOpen ? "open" : ""}">${this._telOpen ? this._telBody(t) : ""}</div>
      </div>`;
  }
  _telBody(t) {
    const e = this._collectTelemetry(t), i = {
      heat: "Отопление",
      dhw: "Горячая вода",
      refr: "Фреоновый контур",
      comp: "Компрессор",
      elec: "Электрика",
      service: "Состояние",
      other: "Прочее"
    }, o = ["service", "heat", "dhw", "comp", "refr", "elec", "other"], r = e.params || [];
    let s = "";
    for (const l of o) {
      const n = e[l];
      !n || !n.length || (s += `<div class="tel-group"><div class="tel-glbl">${i[l] || l}</div><div class="tel-grid">` + n.map((p) => `<div class="tel-cell"><div class="tv ${p.bad ? "bad" : ""}">${p.value}</div><div class="tl">${p.label}</div></div>`).join("") + "</div></div>");
    }
    return r.length && (s += `<button class="tel-params-link" id="tel_params">${this._paramsOpen ? "▲ Скрыть параметры" : "▼ Параметры настройки (" + r.length + ")"}</button>`, this._paramsOpen && (s += '<div class="tel-group"><div class="tel-grid">' + r.map((l) => `<div class="tel-cell"><div class="tv">${l.value}</div><div class="tl">${l.label}</div></div>`).join("") + "</div></div>")), s;
  }
  /* ── Helpers ───────────────────────────── */
  _v(t, e) {
    const i = t?.states?.[e];
    if (!i || i.state === "unavailable" || i.state === "unknown") return null;
    const o = parseFloat(i.state);
    return isNaN(o) ? null : o;
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
  _dtDiag(t, e, i, o) {
    const r = { icon: "", title: "", text: "", cls: "hide" };
    if (!o) return r;
    if (t === null || t === 0) return { icon: "⏳", title: "Ожидание данных ΔT", text: "Данные ещё не получены", cls: "neutral" };
    const s = (i ?? 0) - (e ?? 0);
    return s <= 0.7 && s >= -0.5 ? {
      icon: "🟢",
      title: "Режим поддержания",
      text: `Температура близка к уставке. ΔT ${t.toFixed(1)}°C — нормально при модуляции`,
      cls: "good"
    } : s >= 1.5 && (t < 2 || t > 10) ? {
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
    const e = this._config.step || 0.5, i = this._hass.states[this._config.climate_entity], o = this._pendingTarget ?? parseFloat(i?.attributes?.temperature);
    if (isNaN(o)) return;
    const r = Math.round((o + t * e) * 10) / 10, s = Math.max(i?.attributes?.min_temp ?? 5, Math.min(i?.attributes?.max_temp ?? 35, r));
    this._pendingTarget = s;
    const l = this._root.querySelector(".sp-val");
    l && (l.textContent = s.toFixed(1) + "°"), this._render(), this._svcTimer && clearTimeout(this._svcTimer), this._svcTimer = setTimeout(() => {
      this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.climate_entity,
        temperature: s
      });
    }, 600);
  }
  _preset(t) {
    this._pendingTarget = t;
    const e = this._root.querySelector(".sp-val");
    e && (e.textContent = t.toFixed(1) + "°"), this._render(), this._svcTimer && clearTimeout(this._svcTimer), this._svcTimer = setTimeout(() => {
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
    const e = Array.isArray(t.attributes?.hvac_modes) ? t.attributes.hvac_modes.filter((o) => typeof o == "string") : ["heat", "off"];
    if (t.state.toLowerCase() === "off") {
      const o = D(e, this._lastActiveMode);
      o && this._mode(o);
      return;
    }
    const i = e.find((o) => o.toLowerCase() === "off");
    i && this._mode(i);
  }
  /* ── Interactive Graphs ────────────────────── */
  async _fetchGraph(t, e) {
    if (this._activeGraphEntity === t) {
      this._activeGraphEntity = null, this._render();
      return;
    }
    this._activeGraphEntity = t, this._render();
    const i = /* @__PURE__ */ new Date(), o = new Date(i.getTime() - 1440 * 60 * 1e3), r = this._cachedGraph[t];
    if (r && i.getTime() - r.time < 3e5) {
      this._render();
      return;
    }
    try {
      const s = o.toISOString(), l = i.toISOString(), n = await this._hass.callApi(
        "GET",
        `history/period/${s}?filter_entity_id=${t}&end_time=${l}&minimal_response`
      );
      if (n && n[0] && n[0].length > 0) {
        let p = 1 / 0, c = -1 / 0;
        const u = [], f = o.getTime(), k = i.getTime() - f;
        for (const h of n[0]) {
          const m = parseFloat(h.state);
          if (isNaN(m)) continue;
          m < p && (p = m), m > c && (c = m);
          const v = new Date(h.last_changed).getTime();
          u.push({ x: (v - f) / k, y: m });
        }
        const d = this._hass.states[t]?.state;
        if (d) {
          const h = parseFloat(d);
          isNaN(h) || (u.push({ x: 1, y: h }), h < p && (p = h), h > c && (c = h));
        }
        if (u.length > 1) {
          const h = c - p, m = h === 0 ? 1 : h * 0.1, v = p - m, $ = c + m - v, C = 300, b = 60;
          let _ = `M ${u[0].x * C},${b - (u[0].y - v) / $ * b}`, T = `${_}`;
          for (let E = 1; E < u.length; E++) {
            const z = u[E].x * C, g = b - (u[E].y - v) / $ * b;
            _ += ` L ${z},${g}`;
          }
          T = `${_} L ${C},${b} L 0,${b} Z`;
          const S = `
            <svg viewBox="0 0 ${C} ${b}" preserveAspectRatio="none" style="width:100%; height:60px; margin-top:10px; overflow:visible;">
              <defs>
                <linearGradient id="gf_${t}" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="var(--heat)" stop-opacity="0.3"/>
                  <stop offset="100%" stop-color="var(--heat)" stop-opacity="0.0"/>
                </linearGradient>
              </defs>
              <path d="${T}" fill="url(#gf_${t})" />
              <path d="${_}" fill="none" stroke="var(--heat)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          `;
          this._cachedGraph[t] = { time: i.getTime(), svg: S, min: p, max: c }, this._activeGraphEntity === t && this._render();
        } else
          this._activeGraphEntity = null, this._render();
      } else
        this._activeGraphEntity = null, this._render();
    } catch (s) {
      console.warn("Altal Card - History fetch failed", s), this._activeGraphEntity = null, this._render();
    }
  }
  /* ══════════════════ CSS ══════════════════ */
  _css() {
    const t = this._config?.text_color || "var(--aerogel-text, var(--primary-text-color, #3b3f5c))", e = this._config?.animation_color || "var(--aerogel-warning, var(--state-climate-heat-color, var(--accent-color, var(--warning-color, #f07b3f))))";
    return `
      :host {
        --bg: var(--neumorphic-surface, var(--aerogel-base, var(--card-background-color, var(--ha-card-background, var(--primary-background-color, #e3e6ec)))));
        --txt: ${t};
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
        --heat-raw: ${e};
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
  _metricDefs(t) {
    const e = this._config, i = [];
    return t.e.freq && i.push({ k: "freq", ico: this._ico.rotor, lbl: "Компрессор", graph: t.e.freq }), t.e.power && i.push({ k: "power", ico: this._ico.bolt, lbl: "Мощность", graph: t.e.power }), t.e.tank && i.push({ k: "tank", ico: this._ico.tank, lbl: "Бак ГВС", graph: t.e.tank }), t.e.outdoor && i.push({ k: "outdoor", ico: this._ico.outdoor, lbl: "Улица", graph: t.e.outdoor }), i.length >= 2 ? i.slice(0, 4) : [
      { k: "cur", ico: this._ico.thermo, lbl: "Текущая", graph: e.current_temp_entity || null },
      { k: "tgt", ico: this._ico.target, lbl: "Уставка", graph: e.target_temp_entity || null },
      ...e.delta_t_entity ? [{ k: "dt", ico: this._ico.delta, lbl: "ΔT", graph: e.delta_t_entity }] : [],
      { k: "heat", ico: this._ico.flame, lbl: "Нагрев", graph: e.heating_entity || null }
    ];
  }
  _read() {
    const t = this._config, e = this._hass, i = e.states[t.climate_entity], o = this._v(e, t.current_temp_entity) ?? (i.attributes.current_temperature !== void 0 ? parseFloat(i.attributes.current_temperature) : null), r = this._v(e, t.target_temp_entity) ?? parseFloat(i.attributes.temperature), s = Number.isFinite(r) ? r : null, l = this._live(), n = i.state, p = t.heating_entity && e.states[t.heating_entity] ? e.states[t.heating_entity].state === "on" ? "on" : "off" : null, c = Z({
      off: n.toLowerCase() === "off",
      freq: l.freq,
      power: l.power,
      heatingEntity: p,
      hvacAction: i.attributes.hvac_action ?? null,
      current: o,
      target: s
    }), u = Array.isArray(i.attributes.hvac_modes) ? i.attributes.hvac_modes.filter((f) => typeof f == "string") : ["heat", "off"];
    return { cl: i, curT: o, tgtT: s, live: l, hvac: n, run: c, modes: u };
  }
  _render() {
    if (!this._config || !this._hass) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="card" style="text-align:center;padding:40px;color:var(--txt2)">Загрузка…</div>`, this._structKey = "";
      return;
    }
    const t = this._config;
    if (!this._hass.states[t.climate_entity]) {
      this._root.innerHTML = `<style>${this._css()}</style><div class="err"><h3>Entity не найден</h3><p>${t.climate_entity}</p></div>`, this._structKey = "";
      return;
    }
    const i = this._read(), o = this._metricDefs(i.live), r = i.live.supply !== null || i.live.ret !== null, s = JSON.stringify([
      i.modes,
      o.map((l) => l.k),
      r,
      this._telOpen,
      this._paramsOpen,
      this._activeGraphEntity,
      this._activeGraphEntity ? !!this._cachedGraph[this._activeGraphEntity] : !1,
      t.show_controls,
      t.show_presets,
      t.show_diagnostics,
      t.show_image,
      t.image,
      t.show_telemetry,
      (t.quick_presets || []).join(",")
    ]);
    s !== this._structKey && (this._build(i, o, r), this._structKey = s, this._lastTelHtml = this._telOpen ? this._telBody(this._hass) : ""), this._update(i, o);
  }
  /** Builds the DOM skeleton. Runs only when the layout itself changes. */
  _build(t, e, i) {
    const o = this._config, r = o.show_image !== !1, s = o.quick_presets || [19, 20, 22, 24], l = {
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
    }, n = 414.69, p = 552.92, c = 55, u = Array.from({ length: c }, (d, h) => {
      const m = h / (c - 1), v = (135 + 270 * m) * Math.PI / 180, M = h % 9 === 0, $ = M ? 72 : 75, C = 80, b = (T) => `${(100 + T * Math.cos(v)).toFixed(2)} ${(100 + T * Math.sin(v)).toFixed(2)}`, _ = `color-mix(in srgb, var(--heat) ${Math.round(m * 100)}%, var(--cool))`;
      return `<path class="tk${M ? " mj" : ""}" d="M${b($)} L${b(C)}" style="--tc:${_};transition-delay:${h * 12}ms"/>`;
    }).join(""), f = (d, h) => `<circle class="comet ${d}" data-len="${h}" cx="100" cy="100" r="88" stroke-dasharray="${h} ${p}" stroke-dashoffset="${h}" transform="rotate(135 100 100)"/>`, k = `
      <div class="dial" id="dial">
        <svg class="gauge" viewBox="0 0 200 200" aria-hidden="true">
          <defs><linearGradient id="gGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" style="stop-color:var(--cool)"/><stop offset="100%" style="stop-color:var(--heat)"/></linearGradient></defs>
          <g id="ticks">${u}</g>
          <circle class="g-track" cx="100" cy="100" r="88" stroke-dasharray="${n} ${p}" transform="rotate(135 100 100)"/>
          <circle class="g-val" id="garc" cx="100" cy="100" r="88" stroke-dasharray="${n} ${p}" stroke-dashoffset="${n}" transform="rotate(135 100 100)"/>
          ${f("c3", 70)}${f("c2", 30)}${f("c1", 9)}
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
            ${r ? `<div class="pump-thumb">${o.image ? `<img src="${o.image}" alt=""/>` : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14v-4a2 2 0 012-2h12a2 2 0 012 2v4M4 14a2 2 0 002 2h12a2 2 0 002-2M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4M8 11v6M16 11v6"/></svg>'}</div>` : ""}
            <div class="top-info"><div class="name" id="name"></div><div class="status" id="status"></div></div>
            <div class="top-right">
              <div class="badge" id="badge"><span class="dot"></span><span id="btxt"></span></div>
              <button class="pwr" id="pwr" aria-label="Питание">${this._ico.power}</button>
            </div>
          </div>

          <div class="dial-area">
            ${o.show_controls !== !1 ? `<button class="side-btn" id="dn" aria-label="Уставка ниже">${this._ico.minus}</button>` : ""}
            ${k}
            ${o.show_controls !== !1 ? `<button class="side-btn" id="up" aria-label="Уставка выше">${this._ico.plus}</button>` : ""}
          </div>
          <div class="setpoint">
            <div class="sp-lbl">Уставка</div>
            <div class="sp-val" id="spval">—</div>
            <div class="sp-hint" id="sphint"></div>
          </div>

          ${i ? `
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
          </div>` : ""}

          <div class="metrics">
            ${e.map((d) => `
              <div class="metric" data-k="${d.k}" ${d.graph ? `data-graph="${d.graph}"` : ""} aria-label="${d.lbl}">
                <div class="m-ico">${d.ico}</div>
                <div class="m-txt"><div class="m-val">—</div><div class="m-lbl">${d.lbl}</div>
                  ${d.k === "tank" || d.k === "dt" || d.k === "power" || d.k === "freq" ? '<div class="m-bar"><div class="m-fill" style="width:0%"></div></div>' : ""}</div>
              </div>`).join("")}
          </div>

          ${this._renderTelemetry(this._hass)}

          ${o.show_diagnostics !== !1 || this._activeGraphEntity ? `
          <div class="diag hide" id="diag">
            <div class="diag-row"><span class="d-i" id="dicon"></span>
              <div><div class="d-t" id="dtitle"></div><div id="dtext"></div></div></div>
            ${this._graphHtml()}
          </div>` : ""}

          ${o.show_presets !== !1 ? `
          <div class="presets">${s.map((d) => `<button class="chip" data-t="${d}">${d}°</button>`).join("")}</div>` : ""}

          <div class="modes">
            ${t.modes.map((d) => `<button class="mbtn mode-${P(d)}" data-m="${d}" aria-label="${q(d)}">${l[d.toLowerCase()] || ""} ${q(d)}</button>`).join("")}
          </div>
        </div>
      </ha-card>`, this._comets = Array.from(this._root.querySelectorAll(".comet")), this._sheen = this._root.getElementById("sheen"), this._sheenGrad = this._root.getElementById("pSheen"), this._numTweens = /* @__PURE__ */ new WeakMap(), this._bindAll();
  }
  _graphHtml() {
    if (!this._activeGraphEntity) return "";
    const t = this._cachedGraph[this._activeGraphEntity];
    return t ? `<div class="graph"><div class="graph-hdr"><span>${t.min.toFixed(1)}</span><span>${t.max.toFixed(1)}</span></div>${t.svg}</div>` : "";
  }
  /** Patches values into the existing DOM. Runs on every state push; never replays entry animations. */
  _update(t, e) {
    const i = this._config, o = (g) => this._root.getElementById(g), { cl: r, curT: s, tgtT: l, live: n, hvac: p, run: c } = t, u = o("card");
    if (!u) return;
    u.className = `card ${c.kind}`, this._text(o("name"), i.name || r.attributes.friendly_name || "Altal Heat Pump"), this._text(o("status"), `Тепловой насос · ${q(p)}`);
    const f = o("badge");
    f && (f.className = `badge ${c.kind}`), this._text(o("btxt"), c.label), o("pwr")?.classList.toggle("on", c.kind !== "off");
    const k = i.scale_min ?? 20, d = i.scale_max ?? 60, h = 414.69, m = A(s, k, d);
    this._num(o("cval"), s, 1, "<sup>°</sup>"), o("garc")?.setAttribute("stroke-dashoffset", String(h * (1 - m)));
    const v = this._root.querySelectorAll("#ticks .tk");
    v.forEach((g, x) => g.classList.toggle("on", s !== null && x / (v.length - 1) <= m + 1e-6));
    const M = o("gmark");
    M && (M.style.transform = `rotate(${135 + 270 * A(this._pendingTarget ?? l, k, d)}deg)`);
    const $ = this._trend(), C = o("trend");
    C && C.dataset.tr !== $ && (C.dataset.tr = $, C.className = `c-trend ${$}`, C.innerHTML = `${$ === "up" ? this._ico.up : $ === "down" ? this._ico.down : this._ico.stable} ${$ === "up" ? "Растёт" : $ === "down" ? "Падает" : "Стабильно"}`);
    const b = o("glow");
    b && (b.style.opacity = c.running ? String(0.35 + 0.65 * Math.min(1, (n.power ?? 4) / 8)) : "0");
    const _ = this._pendingTarget ?? l, T = o("spval");
    T && this._pendingTarget === null && (T.textContent = _ !== null ? `${_.toFixed(1)}°` : "—");
    const S = s !== null && _ !== null ? _ - s : null;
    this._text(o("sphint"), c.kind === "off" ? "насос выключен" : S === null ? "" : Math.abs(S) < 0.5 ? "вода на уставке" : S > 0 ? `до уставки +${S.toFixed(1)}°` : `выше уставки на ${(-S).toFixed(1)}°`), this._num(o("fsup"), n.supply, 1), this._num(o("fret"), n.ret, 1);
    const E = o("fdt");
    E && (E.className = `f-dt ${c.running ? F(n.dt) : "none"}`, E.textContent = n.dt !== null ? `ΔT ${n.dt.toFixed(1)}°` : "ΔT —");
    for (const g of e) {
      const x = this._root.querySelector(`.metric[data-k="${g.k}"]`);
      if (!x) continue;
      const y = x.querySelector(".m-val"), w = x.querySelector(".m-fill");
      let L = !1;
      switch (g.k) {
        case "freq": {
          this._num(y, n.freq, 0, "<small>Гц</small>"), L = c.running, w && (w.className = "m-fill hot", w.style.width = `${A(n.freq, 0, 90) * 100}%`);
          break;
        }
        case "power":
          this._num(y, n.power, 1, "<small>кВт</small>"), L = c.running, w && (w.className = "m-fill hot", w.style.width = `${A(n.power, 0, 12) * 100}%`);
          break;
        case "tank": {
          this._num(y, n.tank, 1, "<small>°C</small>");
          const H = n.tank !== null && n.tankSet !== null && n.tank >= n.tankSet;
          w && (w.className = `m-fill ${H ? "ok" : ""}`, w.style.width = `${A(n.tank, 10, Math.max(40, (n.tankSet ?? 50) + 5)) * 100}%`);
          break;
        }
        case "outdoor":
          this._num(y, n.outdoor, 1, "<small>°C</small>");
          break;
        case "cur":
          this._num(y, s, 1, "<small>°C</small>"), L = c.running;
          break;
        case "tgt":
          this._num(y, _, 1, "<small>°C</small>");
          break;
        case "dt":
          this._num(y, n.dt, 1, "<small>°C</small>"), w && (w.className = `m-fill ${F(n.dt)}`, w.style.width = `${A(n.dt, 0, 12) * 100}%`);
          break;
        case "heat":
          this._text(y, c.running ? "Вкл" : "Нет"), L = c.running;
          break;
      }
      x.classList.toggle("hot", L);
    }
    const z = o("diag");
    if (z) {
      let g = this._dtDiag(n.dt, s, l, c.running);
      if (this._activeGraphEntity) {
        const y = e.find((w) => w.graph === this._activeGraphEntity);
        g = this._cachedGraph[this._activeGraphEntity] ? { icon: "📊", title: y ? y.lbl : "График", text: "Последние 24 часа · нажмите плитку ещё раз, чтобы скрыть", cls: "neutral" } : { icon: "⌛", title: "Загрузка", text: "Получение истории…", cls: "neutral" };
      }
      const x = !this._activeGraphEntity && (i.show_diagnostics === !1 || g.cls === "hide");
      z.className = `diag ${x ? "hide" : g.cls}`, this._text(o("dicon"), g.icon), this._text(o("dtitle"), g.title), this._text(o("dtext"), g.text);
    }
    if (this._root.querySelectorAll(".chip").forEach((g) => {
      const x = parseFloat(g.dataset.t || "NaN");
      g.classList.toggle("on", _ !== null && Math.abs(x - _) < 0.1);
    }), this._root.querySelectorAll(".mbtn").forEach((g) => g.classList.toggle("on", (g.dataset.m || "").toLowerCase() === p.toLowerCase())), this._telOpen) {
      const g = this._root.querySelector(".tel-body"), x = this._telBody(this._hass);
      g && x !== this._lastTelHtml && (g.innerHTML = x, this._lastTelHtml = x, this._root.getElementById("tel_params")?.addEventListener("click", (y) => this._toggleParams(y)));
    }
    this._anim.tgtSpd = this._reduceMotion ? 0 : tt(c.running, n.freq), this._anim.tgtFlow = this._reduceMotion ? 0 : et(c.running, n.power), this._kick();
  }
  /* ── In-place DOM helpers ───────────────── */
  _text(t, e) {
    t && t.textContent !== e && (t.textContent = e);
  }
  /** Writes a number, easing from the previous value so changes read as motion, not a flash. */
  _num(t, e, i, o = "") {
    if (!t) return;
    if (e === null || !Number.isFinite(e)) {
      const f = `—${o}`;
      t.innerHTML !== f && (t.innerHTML = f), this._numTweens.delete(t);
      return;
    }
    const r = this._numTweens.get(t), s = (f) => {
      t.innerHTML = `${f.toFixed(i)}${o}`;
    };
    if (!r || this._reduceMotion) {
      s(e), this._numTweens.set(t, { from: e, to: e, raf: 0 });
      return;
    }
    if (r.to === e) return;
    r.raf && cancelAnimationFrame(r.raf);
    const l = r.raf ? r.from : r.to, n = performance.now(), p = 700, c = { from: l, to: e, raf: 0 }, u = (f) => {
      const k = Math.min(1, (f - n) / p), d = 1 - Math.pow(1 - k, 3);
      s(l + (e - l) * d), c.from = l + (e - l) * d, c.raf = k < 1 ? requestAnimationFrame(u) : 0;
    };
    c.raf = requestAnimationFrame(u), this._numTweens.set(t, c);
  }
  /* ── Animation loop: compressor sweep and water flow ── */
  _kick() {
    const t = this._anim;
    if (!(t.raf || !this.isConnected)) {
      if (!t.tgtSpd && !t.tgtFlow && t.spd < 0.5 && t.flowSpd < 0.5) {
        this._paintAnim();
        return;
      }
      t.raf = requestAnimationFrame(this._tick);
    }
  }
  _paintAnim() {
    const t = this._anim, e = 414.69, i = t.sweep, o = Math.min(1, t.spd / 120);
    for (const r of this._comets) {
      const s = Number(r.getAttribute("data-len") || 0);
      r.setAttribute("stroke-dashoffset", (s - i).toFixed(1)), r.style.opacity = String(o * (i > e ? Math.max(0, 1 - (i - e) / 40) : 1));
    }
    if (this._sheenGrad) {
      const r = (t.flow % 64).toFixed(1);
      this._sheenGrad.setAttribute("x1", r), this._sheenGrad.setAttribute("x2", (Number(r) + 64).toFixed(1));
    }
    this._sheen && (this._sheen.style.opacity = String(Math.min(1, t.flowSpd / 18)));
  }
  /* ── Events ───────────────────────────── */
  _toggleParams(t) {
    t.preventDefault(), t.stopPropagation(), this._paramsOpen = !this._paramsOpen, this._render();
  }
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
    }), t("tel_params")?.addEventListener("click", (e) => this._toggleParams(e)), this._root.querySelectorAll(".metric[data-graph]").forEach((e) => e.addEventListener("click", () => {
      const i = e.dataset.graph;
      i && this._fetchGraph(i, e.getAttribute("aria-label") || "");
    })), this._root.querySelectorAll(".chip").forEach(
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
class it extends B {
}
customElements.get("altal-heatpump-card") || customElements.define("altal-heatpump-card", B);
customElements.get("altal-heatpump-card-pro") || customElements.define("altal-heatpump-card-pro", it);
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
  "%c ALTAL-HEATER-CARD PRO %c v4.5.0 ",
  "color: white; background: #e6642f; font-weight: bold; border-radius: 4px 0 0 4px; padding: 2px 8px;",
  "color: #e6642f; background: #e3e6ec; font-weight: bold; border-radius: 0 4px 4px 0; padding: 2px 8px;"
);
