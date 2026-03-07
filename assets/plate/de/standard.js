/**
 * assets/plate/de/standard.js
 * Germany standard plate (Zulassungskennzeichen)
 *
 * Uses FE-Schrift (Fälschungserschwerende Schrift), the mandatory typeface for
 * German license plates since 2000. Loaded from a public CDN as a web font.
 *
 * Format:  {district}·{letters} {digits}
 * Example: B·AB 1234
 */

// Inject FE-Schrift web font once
(function injectFESchrift() {
  if (document.getElementById("fe-schrift-style")) return;
  const style = document.createElement("style");
  style.id = "fe-schrift-style";
  // FE-Schrift is available on Google Fonts under the name "FE Schrift"
  // Fallback chain: FE Schrift → DIN 1451 → Arial Narrow → Arial
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@700&display=swap');
    @font-face {
      font-family: 'FE-Schrift';
      font-style:  normal;
      font-weight: 700;
      /* Public mirror of the FE-Schrift TTF */
      src: url('https://cdn.jsdelivr.net/gh/nicowillis/fe-font@master/FE-Font.ttf') format('truetype');
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
})();

PlateRegistry.register({
  id:           "de",
  type:         "standard",
  flag:         "🇩🇪",
  name:         "Germany 🇩🇪",
  width:        520,
  height:       110,
  background:   "#ffffff",
  border:       "#000000",
  borderWidth:  3,
  textColor:    "#000000",
  font:         "'FE-Schrift', 'FE-Font', 'DIN 1451', 'Arial Narrow', Arial, sans-serif",
  fontSize:     62,
  letterSpacing: 3,
  textY:        0.54,
  euroStrip:    { color: "#003399", stars: true, code: "D", codeColor: "#ffffff" },
  countryBadge: null,
  sticker:      { bg: "#e8e8e8", color: "#333", text: "●" },
  format:       "AB·CD 1234",
  example:      "B·AB 1234",
});