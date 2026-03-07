PlateRegistry.register({
  id:           "uk",
  type:         "standard",
  flag:         "🇬🇧",
  name:         "United Kingdom 🇬🇧",
  width:        520,
  height:       110,
  background:   "#ffcc00",
  border:       "#000000",
  borderWidth:  2,
  textColor:    "#000000",
  font:         "'Arial Narrow', Arial, sans-serif",
  fontSize:     62,
  letterSpacing: 4,
  textY:        0.52,
  euroStrip:    null,
  countryBadge: null,
  sticker:      null,
  format:       "AB12 CDE",
  example:      "AB12 CDE",

  render(ctx, cfg, text, W, H) {
    const bw = cfg.borderWidth;

    // Yellow background (UK rear plate)
    ctx.fillStyle = cfg.background;
    ctx.fillRect(0, 0, W, H);

    // Outer border
    ctx.strokeStyle = cfg.border;
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

    // GB flag strip on left
    const stripW = 52;
    // Blue base
    ctx.fillStyle = "#012169";
    ctx.fillRect(bw, bw, stripW, H - bw * 2);
    // White diagonals (St Andrew)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(bw, bw); ctx.lineTo(bw + stripW, H - bw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bw + stripW, bw); ctx.lineTo(bw, H - bw); ctx.stroke();
    // Red diagonals (St Patrick)
    ctx.strokeStyle = "#C8102E";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(bw, bw); ctx.lineTo(bw + stripW, H - bw); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bw + stripW, bw); ctx.lineTo(bw, H - bw); ctx.stroke();
    // White cross
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(bw + stripW / 2 - 5, bw, 10, H - bw * 2);
    ctx.fillRect(bw, H / 2 - 5, stripW, 10);
    // Red cross
    ctx.fillStyle = "#C8102E";
    ctx.fillRect(bw + stripW / 2 - 3, bw, 6, H - bw * 2);
    ctx.fillRect(bw, H / 2 - 3, stripW, 6);
    // "GB" text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("GB", bw + stripW / 2, H - bw - 3);

    // Main text
    const offL = stripW + bw;
    const availW = W - offL - bw * 2 - 8;
    const tcx    = offL + availW / 2 + 4;
    let fontSize = cfg.fontSize;
    ctx.fillStyle = cfg.textColor;
    ctx.font = `bold ${fontSize}px ${cfg.font}`;
    ctx.letterSpacing = (cfg.letterSpacing || 0) + "px";
    while (ctx.measureText(text).width > availW - 10 && fontSize > 20) {
      fontSize -= 2;
      ctx.font = `bold ${fontSize}px ${cfg.font}`;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, tcx, H * cfg.textY);
  },
});
