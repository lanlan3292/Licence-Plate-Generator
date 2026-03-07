/**
 * assets/plate/cn/nev.js
 * China mainland New Energy Vehicle plate (新能源绿牌)
 *
 * Standard small-vehicle NEV size: 480 × 140 logical px
 *
 * Appearance (GB 11...):
 *   - Gradient background: white at top → light green (#90ee90 area) at bottom
 *   - Black text and borders
 *   - Left white band: province char (black) + "新能源" sub-label (black)
 *   - Main area: city-letter + 5 chars, separated by centre dot
 *
 * Format:  省份·字母+5位  e.g.  浙A·D12345
 */
PlateRegistry.register({
  id:      "cn",
  type:    "nev",
  flag:    "🇨🇳",
  name:    "China NEV 🇨🇳",
  width:   440,
  height:  140,
  format:  "浙A·D12345",
  example: "浙A·D12345",

  render(ctx, cfg, text, W, H) {
    const bw = 4;

    // ── GRADIENT BACKGROUND: white top → light green bottom ─────────────────
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,   "#ffffff");
    grad.addColorStop(1,   "#88dd88");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── OUTER BORDER ────────────────────────────────────────────────────────
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

    // ── INNER BLACK BORDER ───────────────────────────────────────────────────
    const inset = 10;
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

    // ── TOP "中国" label ──────────────────────────────────────────────────────
    ctx.fillStyle = "#000000";
    ctx.font = "bold 11px 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("中国", W / 2, 10);

    // ── LEFT BAND (white, with province char and 新能源 label) ───────────────
    const bandW = 66;
    const bandX = inset + 2;
    const bandY = inset + 2;
    const bandH = H - inset * 2 - 4;

    // White band background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bandX, bandY, bandW, bandH);

    // Thin separator line between band and main area
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bandX + bandW, bandY);
    ctx.lineTo(bandX + bandW, bandY + bandH);
    ctx.stroke();

    // Province character
    const province = text.charAt(0) || "浙";
    ctx.fillStyle = "#000000";
    ctx.font = "bold 44px 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(province, bandX + bandW / 2, H * 0.50);

    // "新能源" sub-label
    ctx.font = "bold 10px 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
    ctx.fillText("新能源", bandX + bandW / 2, H - inset - 9);

    // ── MAIN TEXT ────────────────────────────────────────────────────────────
    // Strip province char; handle optional centre dot  浙A·D12345 → A·D12345
    const rest     = text.length > 1 ? text.slice(1) : "A·D12345";
    // Display with dot separator if not already present
    const mainText = rest;

    const textStartX = bandX + bandW + 10;
    const availW     = W - textStartX - inset - bw - 6;
    const textCX     = textStartX + availW / 2;
    const textY      = H * 0.52;

    ctx.fillStyle = "#000000";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const font = "'FE-Schrift','Noto Sans SC','Microsoft YaHei','SimHei',Arial,sans-serif";
    let fontSize = 56;
    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.letterSpacing = "2px";
    while (ctx.measureText(mainText).width > availW - 8 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px ${font}`;
    }
    ctx.fillText(mainText, textCX, textY);
  },
});