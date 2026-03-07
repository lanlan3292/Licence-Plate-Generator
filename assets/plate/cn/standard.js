/**
 * assets/plate/cn/standard.js
 * China mainland standard blue plate (蓝牌)
 *
 * Dimensions based on GB 15741-2009 standard:
 *   Small vehicle: 440mm × 140mm  →  scaled to 440×140 logical px
 *
 * Format: Province abbreviation + letter + 5 alphanumeric chars
 *   e.g.  粤A·12345  /  京B·ABC12
 *
 * Uses a custom render function because the left province zone has a different
 * background and border style from the main text area.
 */
PlateRegistry.register({
  id:      "cn",
  type:    "standard",
  flag:    "🇨🇳",
  name:    "China 🇨🇳",
  width:   440,
  height:  140,
  format:  "粤A·12345",
  example: "粤A·12345",

  render(ctx, cfg, text, W, H, helpers) {
    const bw = 4;  // border width

    // ── BACKGROUND ──────────────────────────────────────────────────────────
    ctx.fillStyle = "#1155aa";   // Chinese blue
    ctx.fillRect(0, 0, W, H);

    // ── OUTER BORDER ────────────────────────────────────────────────────────
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

    // ── INNER BORDER (inset 8px from outer) ─────────────────────────────────
    const inset = 10;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

    // ── EMBLEM AREA — small red star + "中国" text, top-center ───────────────
    // Chinese plates have a small emblem centered between top border and text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("中国", W / 2, 10);

    // ── MAIN PLATE TEXT ──────────────────────────────────────────────────────
    // Split on center dot if present (e.g. "粤A·12345")
    const parts = text.split(/[·•\.]/).map(s => s.trim());
    const leftPart  = parts[0] || "";
    const rightPart = parts.slice(1).join(" ") || "";
    const fullText  = rightPart ? `${leftPart} ${rightPart}` : leftPart;

    const textY   = H * 0.62;
    const availW  = W - inset * 2 - bw * 2 - 20;
    const availCX = W / 2;

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let fontSize = 62;
    const font = "'Noto Sans SC', 'Microsoft YaHei', 'SimHei', Arial, sans-serif";
    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.letterSpacing = "4px";
    while (ctx.measureText(fullText).width > availW - 10 && fontSize > 24) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px ${font}`;
    }
    ctx.fillText(fullText, availCX, textY);

    // ── CENTER DIVIDER DOT ───────────────────────────────────────────────────
    if (rightPart) {
      // Find where the province char ends and draw separator line
      ctx.font = `bold ${fontSize}px ${font}`;
      const leftW = ctx.measureText(leftPart + " ").width;
      const dotX  = availCX - availW / 2 + leftW + 4;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(dotX - 4, textY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  },
});
