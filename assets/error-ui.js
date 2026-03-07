/**
 * assets/error-ui.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Renders a styled error card into a container element.
 * Used by both index.html (boot failures) and plate.html (render failures).
 *
 * API:
 *   ErrorUI.show(container, message, detail?)
 *     container  — HTMLElement to render into (replaces content)
 *     message    — short human-readable headline string
 *     detail     — optional technical detail string (stack trace, HTTP status…)
 *                  shown inside a collapsible "详细错误 / Details" block
 *
 *   ErrorUI.showInLoading(message, detail?)
 *     Helper: replaces the #loading overlay content with the error card
 *     (used during app boot before the main UI is visible)
 */

const ErrorUI = (() => {

  // ── Styles injected once ────────────────────────────────────────────────────
  function _injectStyles() {
    if (document.getElementById("error-ui-style")) return;
    const s = document.createElement("style");
    s.id = "error-ui-style";
    s.textContent = `
      .eu-error-card {
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: #1a0d0d;
        border: 1px solid #5c2020;
        border-radius: 12px;
        padding: 24px 28px;
        max-width: 520px;
        width: 100%;
        font-family: 'Noto Sans', 'Noto Sans SC', system-ui, sans-serif;
        box-sizing: border-box;
      }
      .eu-error-icon {
        font-size: 28px;
        line-height: 1;
      }
      .eu-error-headline {
        font-size: 15px;
        font-weight: 600;
        color: #f28b82;
        line-height: 1.5;
        word-break: break-word;
      }
      .eu-error-actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .eu-error-reload {
        padding: 8px 18px;
        background: #3a1010;
        border: 1px solid #5c2020;
        border-radius: 7px;
        color: #f28b82;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: .5px;
        text-transform: uppercase;
        cursor: pointer;
        font-family: inherit;
        transition: background .15s, border-color .15s;
      }
      .eu-error-reload:hover {
        background: #4a1818;
        border-color: #f28b82;
      }

      /* Collapsible details */
      .eu-error-details {
        border-top: 1px solid #3a1a1a;
        padding-top: 12px;
      }
      .eu-error-toggle {
        display: flex;
        align-items: center;
        gap: 7px;
        background: none;
        border: none;
        color: #9a5a5a;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        padding: 0;
        user-select: none;
        transition: color .15s;
      }
      .eu-error-toggle:hover { color: #f28b82; }
      .eu-error-toggle .eu-toggle-chevron {
        font-size: 9px;
        display: inline-block;
        transition: transform .25s ease;
      }
      .eu-error-toggle.open .eu-toggle-chevron {
        transform: rotate(180deg);
      }

      /* Animated collapsible container */
      .eu-error-body-wrap {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows .28s ease;
        margin-top: 0;
        overflow: hidden;
      }
      .eu-error-body-wrap.open {
        grid-template-rows: 1fr;
        margin-top: 10px;
      }
      .eu-error-body-inner {
        min-height: 0;
        overflow: hidden;
      }
      .eu-error-body {
        background: #110808;
        border: 1px solid #3a1a1a;
        border-radius: 6px;
        padding: 12px 14px;
        overflow-x: auto;
      }
      .eu-error-body pre {
        font-family: 'IBM Plex Mono', 'Consolas', monospace;
        font-size: 11px;
        color: #c97070;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-all;
        margin: 0;
      }
    `;
    document.head.appendChild(s);
  }

  // ── Build error card DOM ────────────────────────────────────────────────────
  function _buildCard(message, detail) {
    _injectStyles();

    const card = document.createElement("div");
    card.className = "eu-error-card";

    // Icon + headline
    const icon = document.createElement("div");
    icon.className = "eu-error-icon";
    icon.textContent = "⚠️";
    card.appendChild(icon);

    const headline = document.createElement("div");
    headline.className = "eu-error-headline";
    headline.textContent = message;
    card.appendChild(headline);

    // Reload button
    const actions = document.createElement("div");
    actions.className = "eu-error-actions";
    const reload = document.createElement("button");
    reload.className = "eu-error-reload";
    reload.textContent = "↺ Reload / 重新加载";
    reload.onclick = () => location.reload();
    actions.appendChild(reload);
    card.appendChild(actions);

    // Collapsible details
    if (detail) {
      const detailsWrap = document.createElement("div");
      detailsWrap.className = "eu-error-details";

      const toggle = document.createElement("button");
      toggle.className = "eu-error-toggle";
      toggle.innerHTML = `<span class="eu-toggle-chevron">▼</span><span>详细错误 / Details</span>`;

      // Animated wrapper: grid-template-rows 0fr → 1fr
      const bodyWrap = document.createElement("div");
      bodyWrap.className = "eu-error-body-wrap";

      const bodyInner = document.createElement("div");
      bodyInner.className = "eu-error-body-inner";

      const body = document.createElement("div");
      body.className = "eu-error-body";
      const pre = document.createElement("pre");
      pre.textContent = detail;
      body.appendChild(pre);
      bodyInner.appendChild(body);
      bodyWrap.appendChild(bodyInner);

      toggle.addEventListener("click", () => {
        const open = bodyWrap.classList.toggle("open");
        toggle.classList.toggle("open", open);
      });

      detailsWrap.appendChild(toggle);
      detailsWrap.appendChild(bodyWrap);
      card.appendChild(detailsWrap);
    }

    return card;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Show error card inside `container`.
   * Clears container content first.
   */
  function show(container, message, detail) {
    if (!container) return;
    container.innerHTML = "";

    // Wrap in a centering div when used full-screen
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:flex;align-items:center;justify-content:center;padding:32px;min-height:100%;";
    wrap.appendChild(_buildCard(message, detail));
    container.appendChild(wrap);
  }

  /**
   * Replace the #loading overlay with the error card.
   * Safe to call even before the rest of the UI has rendered.
   */
  function showInLoading(message, detail) {
    const ov = document.getElementById("loading");
    if (!ov) {
      // Fallback: append to body
      const fb = document.createElement("div");
      fb.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#0d0d0f;z-index:9999;padding:24px;";
      fb.appendChild(_buildCard(message, detail));
      document.body.appendChild(fb);
      return;
    }

    // Replace spinner content with error card
    ov.innerHTML = "";
    ov.style.cssText = "position:fixed;inset:0;background:#0d0d0f;display:flex;align-items:center;justify-content:center;z-index:9999;padding:24px;";
    ov.appendChild(_buildCard(message, detail));
    // Don't hide it — keep visible so user sees the error
  }

  return { show, showInLoading };
})();