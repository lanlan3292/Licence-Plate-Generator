/**
 * assets/plate/cn/nev.js
 * China mainland New Energy Vehicle plate (新能源绿牌)
 *
 * Small NEV vehicle:  480mm × 140mm  →  480×140 logical px
 * The plate uses a gradient from green (#00a550) to teal (#007a5e),
 * with a white left band showing the province abbreviation.
 *
 * Format: Province + letter + 5 chars (all uppercase), last char must be
 *   alphanumeric.  e.g.  粤AD12345  /  京B00001
 */
PlateRegistry.register({
  id:      "cn",
  type:    "nev",
  flag:    "🇨🇳",
  name:    "China NEV 🇨🇳",
  width:   480,
  height:  140,
  format:  "粤AD12345",
  example: "粤AD12345",

  render(ctx, cfg, text, W, H) {
    const bw = 4;

    // ── GRADIENT BACKGROUND ─────────────────────────────────────────────────
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0,   "#007a3d");
    grad.addColorStop(0.5, "#00a84f");
    grad.addColorStop(1,   "#007a3d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // ── OUTER BORDER ────────────────────────────────────────────────────────
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

    // ── INNER WHITE BORDER ───────────────────────────────────────────────────
    const inset = 10;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

    // ── TOP "中国" label ──────────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("中国", W / 2, 10);

    // ── WHITE LEFT BAND (province char + small new-energy mark) ──────────────
    const bandW = 68;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(inset + 2, inset + 2, bandW, H - inset * 2 - 4);

    // Province abbreviation in the white band
    const province = text.charAt(0) || "粤";
    ctx.fillStyle = "#007a3d";
    ctx.font = "bold 46px 'Noto Sans SC', 'Microsoft YaHei', 'SimHei', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(province, inset + 2 + bandW / 2, H * 0.55);

    // Small "新能源" label inside the band
    ctx.font = "bold 10px 'Noto Sans SC', 'Microsoft YaHei', sans-serif";
    ctx.fillStyle = "#007a3d";
    ctx.fillText("新能源", inset + 2 + bandW / 2, H - inset - 10);

    // ── MAIN TEXT (rest of plate after province char) ─────────────────────────
    const mainText = text.length > 1 ? text.slice(1) : "D12345";
    const textStartX = inset + bandW + 14;
    const availW     = W - textStartX - inset - bw - 8;
    const textCX     = textStartX + availW / 2;
    const textY      = H * 0.55;

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const font = "'Noto Sans SC', 'Microsoft YaHei', 'SimHei', Arial, sans-serif";
    let fontSize = 58;
    ctx.font = `bold ${fontSize}px ${font}`;
    ctx.letterSpacing = "3px";
    while (ctx.measureText(mainText).width > availW - 8 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px ${font}`;
    }
    ctx.fillText(mainText, textCX, textY);
  },
});
