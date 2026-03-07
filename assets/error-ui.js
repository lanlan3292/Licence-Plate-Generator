/**
 * assets/error-ui.js
 * Renders a styled, scrollable error card.
 * Used by index.html (boot failures via showInLoading).
 * plate.html uses its own plain-text error rendering.
 *
 * API:
 *   ErrorUI.showInLoading(message, detail?)
 *     Replaces the #loading overlay with a full-screen error card.
 */

const ErrorUI = (() => {

  function _injectStyles() {
    if (document.getElementById("error-ui-style")) return;
    const s = document.createElement("style");
    s.id = "error-ui-style";
    s.textContent = `
      /* Full-screen overlay */
      .eu-overlay {
        position: fixed; inset: 0;
        background: #0d0d0f;
        display: flex; align-items: flex-start; justify-content: center;
        overflow-y: auto;
        z-index: 9999;
        padding: 32px 16px;
      }

      .eu-error-card {
        display: flex;
        flex-direction: column;
        gap: 14px;
        background: #1a0d0d;
        border: 1px solid #5c2020;
        border-radius: 12px;
        padding: 24px 28px;
        width: min(600px, 100%);
        font-family: 'Noto Sans', 'Noto Sans SC', system-ui, sans-serif;
        box-sizing: border-box;
        margin: auto 0;         /* vertical centering when card is short */
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
      .eu-error-reload:hover { background: #4a1818; border-color: #f28b82; }

      /* Collapsible details */
      .eu-error-details { border-top: 1px solid #3a1a1a; padding-top: 12px; }

      .eu-error-toggle {
        display: flex; align-items: center; gap: 7px;
        background: none; border: none; color: #9a5a5a;
        font-size: 12px; font-family: inherit;
        cursor: pointer; padding: 0; user-select: none;
        transition: color .15s;
      }
      .eu-error-toggle:hover { color: #f28b82; }
      .eu-error-toggle .eu-chevron {
        font-size: 9px; display: inline-block;
        transition: transform .25s ease;
      }
      .eu-error-toggle.open .eu-chevron { transform: rotate(180deg); }

      /* grid-template-rows animation */
      .eu-body-wrap {
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows .28s ease;
        overflow: hidden;
        margin-top: 0;
        transition: grid-template-rows .28s ease, margin-top .28s ease;
      }
      .eu-body-wrap.open { grid-template-rows: 1fr; margin-top: 10px; }
      .eu-body-inner { min-height: 0; }

      .eu-body-pre-wrap {
        background: #110808;
        border: 1px solid #3a1a1a;
        border-radius: 6px;
        padding: 12px 14px;
        overflow-x: auto;
      }
      .eu-body-pre-wrap pre {
        font-family: 'IBM Plex Mono', 'Consolas', monospace;
        font-size: 11px;
        color: #c97070;
        line-height: 1.6;
        white-space: pre;       /* no wrap — scroll horizontally */
        margin: 0;
      }
    `;
    document.head.appendChild(s);
  }

  function _buildCard(message, detail) {
    _injectStyles();

    const card = document.createElement("div");
    card.className = "eu-error-card";

    const icon = document.createElement("div");
    icon.className = "eu-error-icon";
    icon.textContent = "⚠️";
    card.appendChild(icon);

    const headline = document.createElement("div");
    headline.className = "eu-error-headline";
    headline.textContent = message;
    card.appendChild(headline);

    const actions = document.createElement("div");
    actions.className = "eu-error-actions";
    const reload = document.createElement("button");
    reload.className = "eu-error-reload";
    reload.textContent = "↺ Reload / 重新加载";
    reload.onclick = () => location.reload();
    actions.appendChild(reload);
    card.appendChild(actions);

    if (detail) {
      const detailsWrap = document.createElement("div");
      detailsWrap.className = "eu-error-details";

      const toggle = document.createElement("button");
      toggle.className = "eu-error-toggle";
      toggle.innerHTML = `<span class="eu-chevron">▼</span><span>详细错误 / Details</span>`;

      const bodyWrap  = document.createElement("div");
      bodyWrap.className = "eu-body-wrap";
      const bodyInner = document.createElement("div");
      bodyInner.className = "eu-body-inner";
      const preWrap   = document.createElement("div");
      preWrap.className = "eu-body-pre-wrap";
      const pre       = document.createElement("pre");
      pre.textContent = detail;
      preWrap.appendChild(pre);
      bodyInner.appendChild(preWrap);
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

  /**
   * Replace the #loading overlay with a scrollable full-screen error card.
   */
  function showInLoading(message, detail) {
    let target = document.getElementById("loading");

    if (!target) {
      target = document.createElement("div");
      document.body.appendChild(target);
    }

    target.innerHTML = "";
    target.className = "eu-overlay";
    // Remove any inline styles that may have been set by the spinner
    target.removeAttribute("style");

    target.appendChild(_buildCard(message, detail));
  }

  return { showInLoading };
})();