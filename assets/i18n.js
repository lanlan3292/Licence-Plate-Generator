/**
 * assets/i18n.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lightweight i18n engine.
 *
 * Language discovery:
 *   Reads  assets/lang/manifest.json  → array of locale codes ["en_us","zh_cn",…]
 *   Meta (flag, label, sub) lives inside each JSON under "_meta"
 *
 * Fallback chain per key:  current lang → en_us → raw key string
 *
 * Debug / raw-key mode:
 *   Add  ?debug_lang=1  to the page URL to display raw translation key names
 *   instead of translated strings everywhere.
 *
 * API:
 *   await I18n.init()            — detect lang, fetch manifest + required files
 *   await I18n.setLang("zh_cn") — switch language (lazy-loads if needed)
 *   I18n.t("key")               — translate
 *   I18n.t("key", {w,h})        — with {placeholder} interpolation
 *   I18n.lang                   — current locale code string
 *   I18n.keysMode               — true when debug_lang=1 is in URL
 *   I18n.available              — array of locale codes from manifest
 *   I18n.meta(code)             — { flag, label, sub, locale }
 *
 * To add a new language:
 *   1. Create  assets/lang/xx_yy.json  with a "_meta" block + translation keys
 *   2. Add "xx_yy" to  assets/lang/manifest.json
 *   — The UI picks it up automatically on next load.
 */

const I18n = (() => {
  const MANIFEST_URL  = "assets/lang/manifest.json";
  const FALLBACK_CODE = "en_us";
  const LS_KEY        = "eu-plates-lang";

  // Read once at module parse time so it's available synchronously
  const _keysMode = new URLSearchParams(location.search).get("debug_lang") === "1";

  let _available = [];
  let _lang      = FALLBACK_CODE;
  let _strings   = {};   // { "en_us": { key: val, … }, … }
  let _meta      = {};   // { "en_us": { flag, label, sub, locale }, … }
  const _warnings = [];  // non-fatal issues collected during init

  // ── helpers ────────────────────────────────────────────────────────────────

  function _mapBrowserLang(raw) {
    if (!raw) return FALLBACK_CODE;
    const l = raw.toLowerCase();
    if (l.startsWith("zh")) return "zh_cn";
    // extend here as more locales are added, e.g.: if (l.startsWith("fr")) return "fr_fr";
    return FALLBACK_CODE;
  }

  function _detectLang() {
    const stored = localStorage.getItem(LS_KEY);
    if (stored && _available.includes(stored)) return stored;
    const nav    = navigator.language || navigator.userLanguage || "";
    const mapped = _mapBrowserLang(nav);
    return _available.includes(mapped) ? mapped : (_available[0] || FALLBACK_CODE);
  }

  // ── loaders ────────────────────────────────────────────────────────────────

  async function _fetchManifest() {
    const res = await fetch(MANIFEST_URL);
    if (!res.ok) throw new Error(`[I18n] manifest fetch failed HTTP ${res.status}`);
    _available = await res.json();
  }

  async function _loadLang(code) {
    if (_strings[code]) return;
    try {
      const res = await fetch(`assets/lang/${code}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const m    = data["_meta"] || {};
      _meta[code] = {
        flag:   m.flag   || "🌐",
        label:  m.label  || code,
        sub:    m.sub    || "",
        locale: m.locale || code,
      };
      const strings = {};
      for (const [k, v] of Object.entries(data)) {
        if (k !== "_meta") strings[k] = v;
      }
      _strings[code] = strings;
    } catch (e) {
      const msg = `Failed to load language file "${code}": ${e.message}`;
      console.warn(`[I18n] ${msg}`);
      _warnings.push(msg);
      _strings[code] = {};
      // Pretty-format the code as a fallback label (e.g. "en_gb" → "EN GB")
      _meta[code] = {
        flag:   "🌐",
        label:  code.toUpperCase().replace("_", " "),
        sub:    "",
        locale: code.replace("_", "-"),
      };
    }
  }

  // ── public API ─────────────────────────────────────────────────────────────

  /**
   * Translate a key.
   * @param {string}  key
   * @param {object}  [vars]  — interpolation map, e.g. { w: 1040, h: 220 }
   */
  function t(key, vars) {
    if (_keysMode) return key;

    const cur      = _strings[_lang]         || {};
    const fallback = _strings[FALLBACK_CODE] || {};

    let raw = Object.prototype.hasOwnProperty.call(cur, key)
      ? cur[key]
      : Object.prototype.hasOwnProperty.call(fallback, key)
        ? fallback[key]
        : key;

    if (vars && typeof raw === "string") {
      raw = raw.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
    }
    return raw;
  }

  async function setLang(code) {
    if (!_available.includes(code)) {
      console.warn(`[I18n] unknown lang "${code}", falling back to ${FALLBACK_CODE}`);
      code = FALLBACK_CODE;
    }
    await _loadLang(code);
    _lang = code;
    localStorage.setItem(LS_KEY, code);
    document.documentElement.lang = _meta[code]?.locale || "en";
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: code } }));
  }

  async function init() {
    await _fetchManifest();
    // Pre-load ALL language files so _meta is populated for every dropdown entry.
    // Lang files are small JSON — loading them all upfront is negligible.
    await Promise.all(_available.map(code => _loadLang(code)));
    const detected = _detectLang();
    _lang = detected;
    document.documentElement.lang = _meta[detected]?.locale || "en";
    document.dispatchEvent(new CustomEvent("langchange", { detail: { lang: _lang } }));
  }

  function meta(code) {
    return _meta[code] || { flag: "🌐", label: code, sub: "", locale: code };
  }

  return {
    init,
    setLang,
    t,
    meta,
    get lang()      { return _lang; },
    get keysMode()  { return _keysMode; },
    get available() { return _available.slice(); },
    get warnings()  { return _warnings.slice(); },
  };
})();