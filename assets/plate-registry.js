/**
 * assets/plate-registry.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Dynamic plate configuration registry.
 *
 * File layout:
 *   assets/plate/manifest.json          ← source of truth: { "de": ["standard"], ... }
 *   assets/plate/{country}/{type}.js    ← calls PlateRegistry.register(cfg)
 *
 * To add a new country:
 *   1. Create   assets/plate/{cc}/{type}.js   with your config object
 *   2. Add an entry to  assets/plate/manifest.json
 *   Done — both index.html and plate.html pick it up automatically.
 *
 * API:
 *   await PlateRegistry.loadAll()             — load every entry from manifest
 *   await PlateRegistry.load("de","standard") — load one specific file
 *   PlateRegistry.register(cfg)               — called by each plate JS file
 *   PlateRegistry.get("de")                   → primary config or undefined
 *   PlateRegistry.get("de:standard")          → typed config or undefined
 *   PlateRegistry.getAll()                    → array of primary configs (sorted)
 *   PlateRegistry.has("de")                   → boolean
 *   PlateRegistry.manifest()                  → raw manifest object
 */

const PlateRegistry = (() => {
  const MANIFEST_URL = "assets/plate/manifest.json";

  let _manifest = null;                   // { de: ["standard"], fr: ["standard"], ... }
  const _configs = {};                    // "de" → cfg, "de:standard" → cfg

  // ── Manifest ───────────────────────────────────────────────────────────────

  async function _ensureManifest() {
    if (_manifest) return;
    try {
      const res = await fetch(MANIFEST_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      _manifest = await res.json();
    } catch (e) {
      console.error("[PlateRegistry] Failed to load manifest:", e);
      _manifest = {};
    }
  }

  // ── Register (called from each plate JS file) ──────────────────────────────

  function register(cfg) {
    if (!cfg || !cfg.id) {
      console.warn("[PlateRegistry] register() called with config missing `id`", cfg);
      return;
    }
    const type = cfg.type || "standard";
    const key  = `${cfg.id}:${type}`;
    _configs[key] = cfg;

    // Register as primary (bare country id) if first type or type === "standard"
    if (!_configs[cfg.id] || type === "standard") {
      _configs[cfg.id] = cfg;
    }
  }

  // ── Dynamic script loader ──────────────────────────────────────────────────

  function _loadScript(src) {
    return new Promise((resolve) => {
      const s   = document.createElement("script");
      s.src     = src;
      s.onload  = () => resolve(true);
      s.onerror = () => {
        console.warn(`[PlateRegistry] Failed to load: ${src}`);
        resolve(false);
      };
      document.head.appendChild(s);
    });
  }

  /** Load a specific plate file (no-op if already loaded) */
  async function load(country, type = "standard") {
    const key = `${country}:${type}`;
    if (_configs[key]) return _configs[key];
    await _loadScript(`assets/plate/${country}/${type}.js`);
    return _configs[key] || null;
  }

  /** Load everything listed in the manifest */
  async function loadAll() {
    await _ensureManifest();
    const tasks = [];
    for (const [country, types] of Object.entries(_manifest)) {
      for (const type of types) {
        const key = `${country}:${type}`;
        if (!_configs[key]) {
          tasks.push(_loadScript(`assets/plate/${country}/${type}.js`));
        }
      }
    }
    await Promise.all(tasks);
  }

  // ── Query helpers ──────────────────────────────────────────────────────────

  function get(countryOrKey) {
    return _configs[countryOrKey];
  }

  /** All primary configs, sorted by cfg.name (English) */
  function getAll() {
    if (!_manifest) return [];
    return Object.keys(_manifest)
      .map(id => _configs[id])
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function has(countryOrKey) {
    return !!_configs[countryOrKey];
  }

  function manifest() {
    return _manifest || {};
  }

  return { register, load, loadAll, get, getAll, has, manifest };
})();
