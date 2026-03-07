/**
 * assets/renderer.js
 * Core canvas plate renderer. No UI logic, no i18n, no registry.
 *
 * Exports (on window):
 *   PlateRenderer.draw(canvas, cfg, text, scale)
 *   PlateRenderer.drawStar(ctx, cx, cy, r, points)
 */

const PlateRenderer = (() => {

  function drawStar(ctx, cx, cy, r, points) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const radius = i % 2 === 0 ? r : r * 0.45;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render a license plate onto a canvas element.
   *
   * @param {HTMLCanvasElement} canvas  - target canvas
   * @param {object}            cfg     - plate config (from registry)
   * @param {string}            text    - plate text (caller should uppercase)
   * @param {number}            [scale] - pixel scale factor (default 2 for retina)
   */
  function draw(canvas, cfg, text, scale) {
    const SCALE = (scale != null && scale > 0) ? scale : 2;
    const W = cfg.width;
    const H = cfg.height;

    canvas.width  = Math.round(W * SCALE);
    canvas.height = Math.round(H * SCALE);

    const ctx = canvas.getContext("2d");
    ctx.scale(SCALE, SCALE);

    // Delegate to fully custom renderer if provided
    if (typeof cfg.render === "function") {
      cfg.render(ctx, cfg, text, W, H, { drawStar });
      return;
    }

    // ── BACKGROUND ───────────────────────────────────────────────────────────
    ctx.fillStyle = cfg.background || "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // ── OUTER BORDER ─────────────────────────────────────────────────────────
    const bw = cfg.borderWidth || 0;
    if (cfg.border && bw > 0) {
      ctx.strokeStyle = cfg.border;
      ctx.lineWidth = bw;
      ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);
    }

    const stripW = 52;
    let offL = 0, offR = 0;

    // ── EU STRIP (left) ───────────────────────────────────────────────────────
    if (cfg.euroStrip) {
      const s = cfg.euroStrip;
      ctx.fillStyle = s.color;
      ctx.fillRect(bw, bw, stripW, H - bw * 2);

      if (s.stars) {
        const scx = bw + stripW / 2;
        const scy = H * 0.42;
        ctx.fillStyle = "#ffcc00";
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          drawStar(ctx, scx + Math.cos(a) * 11, scy + Math.sin(a) * 11, 3.5, 5);
        }
      }

      ctx.fillStyle = s.codeColor;
      ctx.font = `bold ${s.code.length > 1 ? 11 : 13}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText(s.code, bw + stripW / 2, H - bw - 4);
      offL = stripW + bw;
    }

    // ── COUNTRY BADGE (left, e.g. GB) ─────────────────────────────────────────
    if (cfg.countryBadge) {
      const cb = cfg.countryBadge;
      const badgeW = 56;
      ctx.fillStyle = cb.bg;
      ctx.fillRect(bw, bw, badgeW, H - bw * 2);
      ctx.fillStyle = cb.color;
      ctx.font = `bold 16px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cb.text, bw + badgeW / 2, H / 2);
      offL = Math.max(offL, badgeW + bw);
    }

    // ── RIGHT STICKER ─────────────────────────────────────────────────────────
    const stickerW = 36;
    if (cfg.sticker) {
      const st = cfg.sticker;
      ctx.fillStyle = st.bg;
      ctx.fillRect(W - bw - stickerW, bw, stickerW, H - bw * 2);
      ctx.fillStyle = st.color;
      ctx.font = `bold 13px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(st.text, W - bw - stickerW / 2, H / 2);
      offR = stickerW;
    }

    // ── MAIN PLATE TEXT ───────────────────────────────────────────────────────
    const availW = W - offL - offR - bw * 2 - 8;
    const tcx    = offL + availW / 2 + 4;

    ctx.fillStyle = cfg.textColor || "#000000";
    ctx.letterSpacing = (cfg.letterSpacing || 0) + "px";

    let fontSize = cfg.fontSize || 60;
    ctx.font = `bold ${fontSize}px ${cfg.font || "Arial"}`;
    while (ctx.measureText(text).width > availW - 10 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px ${cfg.font || "Arial"}`;
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, tcx, H * (cfg.textY || 0.52));
  }

  return { draw, drawStar };
})();
