"use strict";

// ── Shorthand ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const t = (key, vars) => I18n.t(key, vars);

// ── DOM refs ──────────────────────────────────────────────────────────────────
const plateText = $("plate-text");
const canvas    = $("plate-canvas");

// Current selection state
let _selectedCountry = null;   // config object
let currentCfg       = null;
let currentText      = "";

// ── URL state ─────────────────────────────────────────────────────────────────
// Persist UI state into ?country=&type=&text=&w=&unit= so that the page URL
// can be shared or bookmarked and the same state is restored on reload.
// This mirrors the way plate.html uses URL params for its image output.

function _pushState() {
  if (!_selectedCountry) return;
  const p = new URLSearchParams();
  p.set("country", _selectedCountry.id);
  if (_selectedCountry.type && _selectedCountry.type !== "standard") {
    p.set("type", _selectedCountry.type);
  }
  const text = plateText.value.trim().toUpperCase();
  if (text) p.set("text", text);
  const unit = $("res-unit").value;
  if (unit === "px") {
    const w = parseInt($("res-w").value);
    if (w) p.set("w", w);
  } else {
    p.set("unit", unit);
  }
  const newUrl = location.pathname + "?" + p.toString();
  history.replaceState(null, "", newUrl);
}

// ── applyLang ─────────────────────────────────────────────────────────────────
function applyLang() {
  document.title = t("page_title");

  const nodes = {
    "hdr-sub":         "header_sub",
    "lbl-country":     "lbl_country",
    "lbl-text":        "lbl_text",
    "btn-generate":    "btn_generate",
    "btn-random":      "btn_random",
    "lbl-res":         "lbl_res",
    "res-hint":        "res_hint",
    "lbl-link":        "lbl_link",
    "link-hint":       "link_hint",
    "btn-open-link":   "btn_open",
    "hist-title":      "hist_title",
    "preview-label":   "preview_label",
    "btn-download":    "btn_download",
    "btn-add-history": "btn_save",
    "copy-toast":      "copied",
    "empty-title":     "empty_title",
    "empty-msg":       "empty_msg",
    "lbl-type":        "lbl_type",
  };
  for (const [id, key] of Object.entries(nodes)) {
    const el = $(id); if (el) el.textContent = t(key);
  }

  $("btn-copy").title = t("copy_title");
  // placeholder is set by updateFmtHint() based on cfg.format

  const m = I18n.meta(I18n.lang);
  $("lang-flag").textContent  = m.flag;
  $("lang-label").textContent = m.label;

  document.querySelectorAll("#lang-dd-opts .dd-opt").forEach(el => {
    el.classList.toggle("active", el.dataset.lang === I18n.lang);
  });

  const banner = $("keys-banner");
  if (I18n.keysMode) {
    banner.style.display = "block";
    banner.textContent   = t("lang_keys_mode");
    $("lang-sw").classList.add("keys-mode");
  }

  rebuildCountryDropdown();
  // Refresh the country button label in the current language
  if (_selectedCountry) {
    $("country-btn-name").textContent = countryDisplayName(_selectedCountry);
    buildTypePills(_selectedCountry);
  }
  buildEmptySteps();
  updateFmtHint();
  updateResBadge();
  renderHistory();
}

// ── Language dropdown ─────────────────────────────────────────────────────────
function buildLangDropdown() {
  const opts = $("lang-dd-opts"); opts.innerHTML = "";
  I18n.available.forEach(code => {
    const m   = I18n.meta(code);
    const div = document.createElement("div");
    div.className = "dd-opt" + (code === I18n.lang ? " active" : "");
    div.dataset.lang = code;
    div.innerHTML = `<span class="opt-flag">${m.flag}</span><div><div class="opt-main">${m.label}</div><div class="opt-sub">${m.sub}</div></div>`;
    div.addEventListener("click", async () => {
      closeDd("lang-btn", "lang-dd");
      await I18n.setLang(code);
    });
    opts.appendChild(div);
  });
}

// ── Country dropdown ──────────────────────────────────────────────────────────
function countryDisplayName(cfg) {
  const key        = `country_${cfg.id}`;
  const translated = t(key);
  return (translated === key) ? cfg.name.replace(/\p{Emoji_Presentation}/gu, "").trim() : translated;
}

function rebuildCountryDropdown() {
  const opts = $("country-dd-opts"); opts.innerHTML = "";
  const all  = PlateRegistry.getAll();

  const sorted = all.slice().sort((a, b) =>
    countryDisplayName(a).localeCompare(countryDisplayName(b), I18n.meta(I18n.lang).locale)
  );

  sorted.forEach(cfg => {
    const div = document.createElement("div");
    div.className = "dd-opt";
    div.dataset.country = cfg.id;
    if (_selectedCountry && _selectedCountry.id === cfg.id) div.classList.add("active");
    div.innerHTML = `<span class="opt-flag">${cfg.flag || "🏁"}</span><div class="opt-main">${countryDisplayName(cfg)}</div>`;
    div.addEventListener("click", () => {
      selectCountry(PlateRegistry.get(cfg.id));
      closeDd("country-btn", "country-dd");
    });
    opts.appendChild(div);
  });
}

// ── Type pills ────────────────────────────────────────────────────────────────
const TYPE_LABELS = { standard: "Standard", nev: "NEV 新能源" };
function typeLabel(type) { return t("type_" + type) || TYPE_LABELS[type] || type; }

function buildTypePills(cfg) {
  const field = $("type-field");
  const pills = $("type-pills");
  pills.innerHTML = "";

  const types = PlateRegistry.manifest()[cfg.id] || ["standard"];
  if (types.length <= 1) { field.style.display = "none"; return; }

  field.style.display = "";
  const activeType = _selectedCountry?.type || "standard";

  types.forEach(type => {
    const typed = PlateRegistry.get(`${cfg.id}:${type}`); if (!typed) return;
    const pill  = document.createElement("span");
    pill.className = "type-pill" + (activeType === type ? " active" : "");
    pill.textContent = typeLabel(type);
    pill.title = typed.format || "";
    pill.addEventListener("click", () => {
      selectCountry(typed);
      if (currentCfg) generate();
    });
    pills.appendChild(pill);
  });
}

function selectCountry(cfg) {
  _selectedCountry = cfg;
  $("country-btn-flag").textContent = cfg.flag || "🏁";
  $("country-btn-name").textContent = countryDisplayName(cfg);
  document.querySelectorAll("#country-dd-opts .dd-opt").forEach(el => {
    el.classList.toggle("active", el.dataset.country === cfg.id);
  });
  buildTypePills(cfg);
  updateFmtHint();
  syncResForCountry();
  updateResBadge();
  _pushState();
}

// ── Generic dropdown open/close ───────────────────────────────────────────────
function toggleDd(btnId, panelId) {
  const btn    = $(btnId);
  const panel  = $(panelId);
  const isOpen = panel.classList.contains("open");
  document.querySelectorAll(".custom-dd-panel.open").forEach(p => {
    p.classList.remove("open");
    p.previousElementSibling?.classList.remove("open");
  });
  if (!isOpen) { btn.classList.add("open"); panel.classList.add("open"); }
}
function closeDd(btnId, panelId) {
  $(btnId)?.classList.remove("open");
  $(panelId)?.classList.remove("open");
}

$("lang-btn").addEventListener("click", e => { e.stopPropagation(); toggleDd("lang-btn", "lang-dd"); });
$("country-btn").addEventListener("click", e => { e.stopPropagation(); toggleDd("country-btn", "country-dd"); });
document.addEventListener("click", () => {
  document.querySelectorAll(".custom-dd-panel.open").forEach(p => {
    p.classList.remove("open");
    p.previousElementSibling?.classList.remove("open");
  });
});
["lang-dd", "country-dd"].forEach(id => {
  $(id)?.addEventListener("click", e => e.stopPropagation());
});

// ── Empty state steps ─────────────────────────────────────────────────────────
const EMPTY_STEP_KEYS = [
  { n: 1, icon: "🗺",  key: "lbl_country"  },
  { n: 2, icon: "✏️", key: "lbl_text"     },
  { n: 3, icon: "⚡", key: "btn_generate" },
];
function buildEmptySteps() {
  const el = $("empty-steps"); if (!el) return;
  el.innerHTML = "";
  EMPTY_STEP_KEYS.forEach(step => {
    const div = document.createElement("div");
    div.className = "empty-step";
    div.innerHTML = `<span class="sn">${step.n}</span><span>${step.icon} ${t(step.key)}</span>`;
    el.appendChild(div);
  });
}

// ── Resolution ────────────────────────────────────────────────────────────────
const RES_PRESETS = [
  { label: "1×",  w: 520,  h: 110 },
  { label: "2×",  w: 1040, h: 220 },
  { label: "4×",  w: 2080, h: 440 },
  { label: "HD",  w: 1280, h: 270 },
  { label: "FHD", w: 1920, h: 405 },
  { label: "4K",  w: 3840, h: 810 },
];
function buildResPresets() {
  const el = $("res-presets"); el.innerHTML = "";
  RES_PRESETS.forEach(p => {
    const tag = document.createElement("span");
    tag.className = "res-preset"; tag.textContent = p.label; tag.title = `${p.w} × ${p.h} px`;
    tag.onclick = () => {
      $("res-w").value = p.w; $("res-h").value = p.h; $("res-unit").value = "px";
      updateResBadge(); _pushState(); if (currentCfg) generate();
    };
    el.appendChild(tag);
  });
}
function getOutputSize(cfg) {
  cfg = cfg || _selectedCountry;
  if (!cfg) return { w: 0, h: 0, scale: 2 };
  const unit = $("res-unit").value;
  if (unit === "px") {
    const w = parseInt($("res-w").value) || cfg.width * 2;
    const s = w / cfg.width;
    return { w: Math.round(cfg.width * s), h: Math.round(cfg.height * s), scale: s };
  }
  const s = parseFloat(unit);
  return { w: Math.round(cfg.width * s), h: Math.round(cfg.height * s), scale: s };
}
function updateResBadge() {
  const b = $("res-badge"); if (!b || b.style.display === "none") return;
  const { w, h } = getOutputSize(); if (w && h) b.textContent = t("res_badge", { w, h });
}
function syncResForCountry() {
  const cfg = _selectedCountry; if (!cfg) return;
  const unit = $("res-unit").value, rw = $("res-w"), rh = $("res-h");
  if (unit === "px") { rh.value = Math.round(parseInt(rw.value) * cfg.height / cfg.width); }
  else { const s = parseFloat(unit); rw.value = Math.round(cfg.width * s); rh.value = Math.round(cfg.height * s); }
}
["res-w", "res-h"].forEach(id => {
  $(id).addEventListener("change", () => {
    const cfg = _selectedCountry; if (!cfg) return;
    const rw = $("res-w"), rh = $("res-h");
    if ($("res-unit").value === "px") {
      if (id === "res-w") rh.value = Math.round(parseInt(rw.value) * cfg.height / cfg.width);
      else                rw.value = Math.round(parseInt(rh.value) * cfg.width  / cfg.height);
    }
    updateResBadge(); _pushState(); if (currentCfg) generate();
  });
});
$("res-unit").addEventListener("change", () => {
  syncResForCountry(); updateResBadge(); _pushState(); if (currentCfg) generate();
});

// ── Format hint ───────────────────────────────────────────────────────────────
function updateFmtHint() {
  const cfg = _selectedCountry;
  // Show format example directly in the input placeholder
  plateText.placeholder = cfg ? cfg.format : t("placeholder");
}

// ── Generate ──────────────────────────────────────────────────────────────────
function generate() {
  const cfg  = _selectedCountry;
  const text = plateText.value.trim().toUpperCase();
  if (!cfg || !text) {
    plateText.classList.add("invalid");
    setTimeout(() => plateText.classList.remove("invalid"), 800);
    return;
  }
  currentCfg = cfg; currentText = text;

  const { scale } = getOutputSize(cfg);
  PlateRenderer.draw(canvas, cfg, text, scale);

  canvas.style.display = "block";
  $("empty-state").style.display = "none";
  $("action-row").style.display  = "flex";
  $("plate-canvas-wrap").classList.add("has-plate");

  const badge = $("res-badge");
  badge.style.display = "block";
  updateResBadge();

  // Build plate.html direct link
  const base = location.href.replace(/[?#].*/, "").replace("index.html", "").replace(/\/$/, "");
  const { w } = getOutputSize(cfg);
  const typeParam = cfg.type && cfg.type !== "standard" ? `&type=${cfg.type}` : "";
  const link = `${base}/plate.html?country=${cfg.id}${typeParam}&text=${encodeURIComponent(text)}&w=${w}`;
  const ld = $("link-display");
  ld.textContent = link; ld.title = link;
  $("btn-open-link").onclick = () => window.open(link, "_blank");

  // Persist UI state into the current page URL
  _pushState();
}

$("btn-generate").onclick = generate;
plateText.addEventListener("keydown", e => { if (e.key === "Enter") generate(); });

$("btn-random").onclick = () => {
  const manifest = PlateRegistry.manifest();
  const entries  = [];
  for (const [id, types] of Object.entries(manifest)) {
    types.forEach(type => {
      const cfg = PlateRegistry.get(`${id}:${type}`);
      if (cfg) entries.push(cfg);
    });
  }
  const cfg = entries[Math.floor(Math.random() * entries.length)];
  selectCountry(cfg);
  plateText.value = cfg.example;
  generate();
};

$("btn-copy").onclick = () => {
  const link = $("link-display").textContent; if (link === "–") return;
  navigator.clipboard.writeText(link).then(() => {
    const ct = $("copy-toast"); ct.classList.remove("hidden");
    setTimeout(() => ct.classList.add("hidden"), 2000);
  });
};

$("btn-download").onclick = () => {
  if (!currentCfg) return;
  canvas.toBlob(blob => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const { w, h } = getOutputSize(currentCfg);
    a.download = `plate-${currentCfg.id}-${currentCfg.type || "std"}-${currentText.replace(/\s/g, "_")}-${w}x${h}.png`;
    a.click();
  }, "image/png");
};

// ── History ───────────────────────────────────────────────────────────────────
let _plateHistory = JSON.parse(localStorage.getItem("eu-plates-history") || "[]");
const histEl = $("history-list");
function saveHistory() { localStorage.setItem("eu-plates-history", JSON.stringify(_plateHistory)); }

function renderHistory() {
  if (_plateHistory.length === 0) {
    histEl.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:4px 0">${t("hist_empty")}</div>`;
    return;
  }
  histEl.innerHTML = "";
  _plateHistory.slice().reverse().forEach((item, ri) => {
    const idx  = _plateHistory.length - 1 - ri;
    const type = item.type || "standard";
    const cfg  = PlateRegistry.get(`${item.country}:${type}`) || PlateRegistry.get(item.country);
    if (!cfg) return;
    const div  = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `
      <span class="hi-flag">${cfg.flag || "🏁"}</span>
      <span class="hi-text">${item.text}</span>
      <span class="hi-country">${item.country.toUpperCase()}${type !== "standard" ? " · " + type : ""}</span>
      <button class="hi-del" title="${t("remove")}">✕</button>`;
    div.addEventListener("click", e => {
      if (e.target.classList.contains("hi-del")) return;
      selectCountry(cfg); plateText.value = item.text;
      updateFmtHint(); syncResForCountry(); generate();
    });
    div.querySelector(".hi-del").addEventListener("click", e => {
      _plateHistory.splice(idx, 1); saveHistory(); renderHistory(); e.stopPropagation();
    });
    histEl.appendChild(div);
  });
}

$("btn-add-history").onclick = () => {
  if (!currentCfg || !currentText) return;
  const type = currentCfg.type || "standard";
  if (!_plateHistory.some(h => h.country === currentCfg.id && h.type === type && h.text === currentText)) {
    _plateHistory.push({ country: currentCfg.id, type, text: currentText });
    if (_plateHistory.length > 20) _plateHistory.shift();
    saveHistory();
  }
  renderHistory();
};

// ── Soft-warning toast ────────────────────────────────────────────────────────
function showWarningToast(warnings) {
  if (!warnings || warnings.length === 0) return;

  const toast = document.createElement("div");
  toast.style.cssText = [
    "position:fixed", "bottom:20px", "right:20px", "z-index:8000",
    "background:#1e1a0a", "border:1px solid #7a5a10", "border-radius:10px",
    "padding:12px 16px", "max-width:340px", "font-size:12px",
    "color:#c8a040", "font-family:inherit", "box-shadow:0 4px 20px rgba(0,0,0,.5)",
    "display:flex", "flex-direction:column", "gap:8px",
  ].join(";");

  const top = document.createElement("div");
  top.style.cssText = "display:flex;align-items:center;gap:8px;font-weight:600;padding-right:20px;";
  top.innerHTML = `<span>⚠️</span><span>${warnings.length} resource(s) failed to load</span>`;

  const toggle = document.createElement("button");
  toggle.style.cssText = [
    "background:none", "border:none", "color:#9a7a30", "font-size:11px",
    "cursor:pointer", "font-family:inherit", "padding:0", "text-align:left",
    "display:flex", "align-items:center", "gap:6px", "user-select:none",
  ].join(";");
  const chevron = document.createElement("span");
  chevron.textContent = "▼";
  chevron.style.cssText = "font-size:9px;display:inline-block;transition:transform .25s ease;";
  const toggleLabel = document.createElement("span");
  toggleLabel.textContent = "详细错误 / Details";
  toggle.appendChild(chevron);
  toggle.appendChild(toggleLabel);

  const bodyWrap = document.createElement("div");
  bodyWrap.style.cssText = "display:grid;grid-template-rows:0fr;transition:grid-template-rows .28s ease;overflow:hidden;";
  const bodyInner = document.createElement("div");
  bodyInner.style.cssText = "min-height:0;overflow:hidden;";
  const body = document.createElement("div");
  body.style.cssText = "background:#110e04;border:1px solid #3a2a08;border-radius:5px;padding:8px 10px;margin-top:6px;";
  const pre = document.createElement("pre");
  pre.style.cssText = "font-family:'IBM Plex Mono',monospace;font-size:10px;color:#9a7a30;white-space:pre-wrap;word-break:break-all;margin:0;line-height:1.5;";
  pre.textContent = warnings.join("\n");
  body.appendChild(pre);
  bodyInner.appendChild(body);
  bodyWrap.appendChild(bodyInner);

  let open = false;
  toggle.addEventListener("click", () => {
    open = !open;
    bodyWrap.style.gridTemplateRows = open ? "1fr" : "0fr";
    chevron.style.transform = open ? "rotate(180deg)" : "";
    clearTimeout(autoDismiss);
  });

  const close = document.createElement("button");
  close.style.cssText = "position:absolute;top:8px;right:10px;background:none;border:none;color:#9a7a30;font-size:16px;cursor:pointer;line-height:1;";
  close.textContent = "×";
  close.onclick = () => toast.remove();
  toast.style.position = "fixed";

  toast.appendChild(top);
  toast.appendChild(toggle);
  toast.appendChild(bodyWrap);
  toast.appendChild(close);
  document.body.appendChild(toast);

  const autoDismiss = setTimeout(() => { if (!open) toast.remove(); }, 12000);
}

// ── Theme ─────────────────────────────────────────────────────────────────────
(function initTheme() {
  const saved = localStorage.getItem("eu-plates-theme");
  if (saved === "light") document.documentElement.classList.add("light");
  _updateThemeBtn();
})();

function _updateThemeBtn() {
  const btn = $("theme-toggle");
  if (!btn) return;
  const isLight = document.documentElement.classList.contains("light");
  btn.textContent = isLight ? "🌙" : "☀";
  btn.title = isLight ? "Switch to dark theme" : "Switch to light theme";
}

$("theme-toggle").addEventListener("click", () => {
  const isLight = document.documentElement.classList.toggle("light");
  localStorage.setItem("eu-plates-theme", isLight ? "light" : "dark");
  _updateThemeBtn();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    await Promise.all([ I18n.init(), PlateRegistry.loadAll() ]);
  } catch (err) {
    const detail = [
      err.message || String(err),
      "",
      "— Technical info —",
      `URL: ${location.href}`,
      `Time: ${new Date().toISOString()}`,
      ...(err.stack ? ["", err.stack] : []),
    ].join("\n");
    ErrorUI.showInLoading("Failed to load required resources.", detail);
    return;
  }

  const allWarnings = [ ...I18n.warnings, ...PlateRegistry.warnings ];

  try {
    buildLangDropdown();
    buildResPresets();
    applyLang();

    const allCfgs = PlateRegistry.getAll();
    if (allCfgs.length === 0) {
      throw new Error("No plate configurations loaded. All plate files may have failed to load.");
    }

    document.addEventListener("langchange", applyLang);

    // ── Restore state from URL ─────────────────────────────────────────────
    const p       = new URLSearchParams(location.search);
    const pCountry = p.get("country");
    const pType    = p.get("type") || "standard";
    const pText    = p.get("text");
    const pW       = p.get("w");
    const pUnit    = p.get("unit");

    let restoredFromURL = false;

    if (pCountry) {
      const cfgFromURL = PlateRegistry.get(`${pCountry}:${pType}`) || PlateRegistry.get(pCountry);
      if (cfgFromURL) {
        // Restore resolution unit / width before selectCountry so syncRes works correctly
        if (pUnit && pUnit !== "px") {
          $("res-unit").value = pUnit;
        } else if (pW) {
          $("res-unit").value = "px";
          $("res-w").value    = pW;
        }
        selectCountry(cfgFromURL);
        if (pText) {
          plateText.value = decodeURIComponent(pText);
          syncResForCountry();
          generate();
          restoredFromURL = true;
        }
      } else {
        allWarnings.push(`URL param ?country=${pCountry}&type=${pType} did not match any loaded plate config.`);
      }
    }

    if (!restoredFromURL) {
      selectCountry(allCfgs[0]);
    }

    // Dismiss loading overlay
    const ov = $("loading");
    ov.classList.add("done");
    setTimeout(() => ov.remove(), 400);

    if (allWarnings.length > 0) {
      setTimeout(() => showWarningToast(allWarnings), 600);
    }

  } catch (err) {
    const detail = [
      err.message || String(err),
      "",
      "— Loaded plates —",
      PlateRegistry.getAll().map(c => `  ${c.id} (${c.type || "standard"})`).join("\n") || "  (none)",
      "",
      "— Non-fatal warnings —",
      allWarnings.length ? allWarnings.join("\n") : "  (none)",
      "",
      `URL: ${location.href}`,
      `Time: ${new Date().toISOString()}`,
      ...(err.stack ? ["", err.stack] : []),
    ].join("\n");
    ErrorUI.showInLoading("An error occurred while initialising the application.", detail);
  }
})();