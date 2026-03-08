/**
 * assets/plate/de/standard.js
 * Germany standard EU license plate (Euro-Kennzeichen)
 *
 * Dimensions based on German standard plate (PKW):
 *   520mm × 110mm  →  scaled to 520×110 logical px
 *
 * Format: City code + 1–2 letters + 1–4 numbers
 *   e.g.  B AB 1234  /  M A 999
 *
 * Uses custom render because of EU blue band with circle of stars
 * and country code “D” on the left.
 */
PlateRegistry.register({
  id:      "de",
  type:    "standard",
  flag:    "🇩🇪",
  name:    "Germany 🇩🇪",
  width:   520,
  height:  110,
  format:  "B AB 1234",
  example: "B AB 1234",

  render(ctx, cfg, text, W, H, helpers) {
    const bw = 3;

    // ── BACKGROUND ──────────────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    // ── OUTER BORDER ────────────────────────────────────────────────────────
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

    // ── EU BLUE BAND (left side) ────────────────────────────────────────────
    const bandW = 80;
    ctx.fillStyle = "#003399";
    ctx.fillRect(bw, bw, bandW, H - bw * 2);

    // ── EU STARS (circle approximation) ─────────────────────────────────────
    const cx = bandW / 2 + bw;
    const cy = H * 0.38;
    const r  = 18;

    ctx.fillStyle = "#ffcc00";
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── COUNTRY CODE “D” ────────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px 'FE-Font', 'DIN 1451', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("D", cx, H * 0.78);

    // ── MAIN PLATE TEXT ──────────────────────────────────────────────────────
    const textXStart = bandW + 20;
    const textY = H * 0.60;
    const availW = W - textXStart - 20;

    ctx.fillStyle = "#000000";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    let fontSize = 52;
    const font = "'FE-Font', 'DIN 1451 Mittelschrift', Arial, sans-serif";
    ctx.font = `bold ${fontSize}px ${font}`;

    while (ctx.measureText(text).width > availW && fontSize > 24) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px ${font}`;
    }

    ctx.fillText(text, textXStart, textY);

    // ── OPTIONAL SPACING GUIDELINE (visual separator) ───────────────────────
    // German plates visually separate city code and serial with space
    // (Handled by provided text formatting)
  },
});