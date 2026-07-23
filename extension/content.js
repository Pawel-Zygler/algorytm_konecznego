// Koneczny Civilization Analyzer - Content Script

(function() {
  if (document.getElementById('koneczny-extension-root')) return;

  const root = document.createElement('div');
  root.id = 'koneczny-extension-root';
  root.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:-apple-system,BlinkMacSystemFont,"Inter","Segoe UI",sans-serif;';
  document.body.appendChild(root);

  const shadow = root.attachShadow({ mode: 'open' });

  // Import Google Font via link inside shadow (won't work in shadow, so we use system fonts)
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    :host {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-sizing: border-box;
    }

    *, *::before, *::after { box-sizing: inherit; }

    /* ── Floating Button ── */
    .fab {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #18181b;
      color: #fff;
      border: 2px solid #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0,0,0,0.25), 0 1px 3px rgba(0,0,0,0.15);
      transition: transform .2s ease, box-shadow .2s ease;
      overflow: hidden;
      padding: 0;
    }
    .fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.15);
    }
    .fab img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      display: block;
    }

    /* ── Panel ── */
    .panel {
      position: fixed;
      bottom: 88px;
      right: 24px;
      width: 600px;
      max-height: 82vh;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 16px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform-origin: bottom right;
      transform: scale(0.94) translateY(12px);
      opacity: 0;
      pointer-events: none;
      transition: transform .25s cubic-bezier(.16,1,.3,1), opacity .25s ease;
    }
    .panel.open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* ── Header ── */
    .header {
      padding: 14px 18px;
      border-bottom: 1px solid #f4f4f5;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fafafa;
      border-radius: 16px 16px 0 0;
    }
    .header-left { display:flex;align-items:center;gap:10px; }
    .logo-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }
    .logo-badge img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .header-title {
      font-size: 14px;
      font-weight: 700;
      color: #18181b;
      letter-spacing: -0.01em;
    }
    .header-subtitle {
      font-size: 11px;
      color: #71717a;
      margin-top: 1px;
    }
    .close-btn {
      width: 28px; height: 28px;
      border-radius: 6px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #71717a;
      display: flex;align-items:center;justify-content:center;
      transition: background .15s, color .15s;
    }
    .close-btn:hover { background:#f4f4f5; color:#18181b; }
    .close-btn svg { width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2.5;stroke-linecap:round; }

    /* ── Scrollable Content ── */
    .content {
      padding: 16px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scroll-behavior: smooth;
    }
    .content::-webkit-scrollbar { width: 4px; }
    .content::-webkit-scrollbar-track { background: transparent; }
    .content::-webkit-scrollbar-thumb { background: #e4e4e7; border-radius: 2px; }

    .fab.spinning img {
      animation: fab-rotate 2s linear infinite;
    }
    @keyframes fab-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ── Loading Tank Arena ── */
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 10px 0;
      gap: 14px;
    }
    .tank-arena {
      position: relative;
      width: 100%;
      height: 220px;
      margin: 10px 0;
      display: flex;
      align-items: center;
      justify-content: flex-start;
      overflow: hidden;
      border-radius: 12px;
      background: radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.05) 0%, rgba(24, 24, 27, 0.06) 100%);
      border: 1px dashed rgba(0, 0, 0, 0.12);
    }
    .koneczny-tank {
      position: absolute;
      left: 20px;
      top: 75px;
      width: 80px;
      height: 70px;
      z-index: 5;
      animation: tank-drive 1.2s ease-in-out infinite alternate;
    }
    @keyframes tank-drive {
      0% { transform: translateY(0px); }
      100% { transform: translateY(5px); }
    }
    .tank-body {
      position: absolute;
      bottom: 6px;
      left: 0;
      width: 65px;
      height: 26px;
      background: #18181b;
      border: 2px solid #10b981;
      border-radius: 6px 12px 6px 6px;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
    }
    .tank-treads {
      position: absolute;
      bottom: 0;
      left: -2px;
      width: 69px;
      height: 12px;
      background: #27272a;
      border: 2px solid #52525b;
      border-radius: 6px;
    }
    .tank-hatch {
      position: absolute;
      top: 10px;
      left: 14px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: 2px solid #10b981;
      overflow: hidden;
      background: #18181b;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    }
    .tank-hatch img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tank-barrel {
      position: absolute;
      top: 24px;
      right: -16px;
      width: 24px;
      height: 5px;
      background: #10b981;
      border-radius: 2px;
      box-shadow: 0 0 8px rgba(16, 185, 129, 0.8);
      transform-origin: left center;
      transition: transform 0.2s ease;
    }
    .cannon-shell {
      position: absolute;
      width: 14px;
      height: 4px;
      background: #ef4444;
      border-radius: 2px;
      box-shadow: 0 0 10px #ef4444;
      z-index: 4;
      transition: left 0.35s linear, top 0.35s linear, opacity 0.35s ease;
    }
    .badge-negative {
      position: absolute;
      padding: 4px 8px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #dc2626;
      font-size: 10px;
      font-weight: 700;
      font-family: monospace;
      border-radius: 6px;
      white-space: nowrap;
      transition: all 0.3s ease;
      z-index: 4;
    }
    .badge-positive {
      position: absolute;
      padding: 4px 8px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #059669;
      font-size: 10px;
      font-weight: 700;
      font-family: monospace;
      border-radius: 6px;
      white-space: nowrap;
      transition: left 1.8s cubic-bezier(0.4, 0, 0.2, 1), top 1.8s cubic-bezier(0.4, 0, 0.2, 1), transform 1.8s ease, opacity 1.8s ease;
      z-index: 4;
    }
    .laser-beam {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, #ef4444, #f87171);
      box-shadow: 0 0 8px #ef4444;
      transform-origin: 0 50%;
      pointer-events: none;
      z-index: 3;
      animation: laser-flash 0.3s linear forwards;
    }
    @keyframes laser-flash {
      0% { opacity: 1; }
      100% { opacity: 0; }
    }
    .loader-label { font-size:13px; color:#71717a; font-weight:500; text-align:center; }

    /* ── Score Hero ── */
    .score-hero {
      background: #18181b;
      border-radius: 12px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .score-info {}
    .score-label { font-size: 11px; font-weight:600; color:#a1a1aa; letter-spacing:.06em; text-transform:uppercase; margin-bottom:4px; }
    .score-value { font-size: 42px; font-weight:800; color:#fff; letter-spacing:-0.03em; line-height:1; }
    .score-desc { font-size:12px; color:#71717a; margin-top:6px; }
    .score-ring-wrap { position:relative; width:72px;height:72px;flex-shrink:0; }
    .score-ring-wrap svg { width:72px;height:72px;transform:rotate(-90deg); }
    .ring-bg { fill:none; stroke:#3f3f46; stroke-width:5; }
    .ring-fill { fill:none; stroke-width:5; stroke-linecap:round; transition:stroke-dashoffset .8s cubic-bezier(.16,1,.3,1); }
    .ring-pct { position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#fff; }

    /* ── Tabs Navigation ── */
    .tab-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 14px;
      background: #f4f4f5;
      padding: 6px 8px;
      border-radius: 10px;
      overflow-x: auto;
      align-items: center;
      min-height: 48px;
    }
    .tab-bar::-webkit-scrollbar {
      height: 4px;
    }
    .tab-bar::-webkit-scrollbar-track {
      background: transparent;
    }
    .tab-bar::-webkit-scrollbar-thumb {
      background: #d4d4d8;
      border-radius: 4px;
    }
    .tab-btn {
      flex: 0 0 auto;
      padding: 8px 14px;
      white-space: nowrap;
      font-size: 11.5px;
      font-weight: 600;
      color: #71717a;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all .2s ease;
      text-align: center;
      min-height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .tab-btn.active {
      background: #fff;
      color: #18181b;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* ── Hero Card (Dark background matching screenshot) ── */
    .dark-hero-card {
      background: #18181b;
      color: #fff;
      border-radius: 16px;
      padding: 20px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      margin-bottom: 16px;
    }
    .dark-hero-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #a1a1aa;
      margin-bottom: 4px;
    }
    .dark-hero-val {
      font-size: 42px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: -0.03em;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .dark-hero-status {
      font-size: 12.5px;
      color: #a1a1aa;
      font-weight: 500;
    }

    /* Ring inside Dark Hero */
    .dark-ring-wrap {
      position: relative;
      width: 68px;
      height: 68px;
      flex-shrink: 0;
    }
    .dark-ring-wrap svg {
      width: 68px;
      height: 68px;
      transform: rotate(-90deg);
    }
    .dark-ring-bg {
      fill: none;
      stroke: #27272a;
      stroke-width: 6;
    }
    .dark-ring-fill {
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s ease;
    }
    .dark-ring-pct {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      font-weight: 800;
      color: #ffffff;
    }

    /* ── Section Title ── */
    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: .07em;
      margin-bottom: 10px;
    }

    /* ── Accordion Answer Card ── */
    .answer-card {
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      background: #fff;
      overflow: hidden;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .answer-card + .answer-card { margin-top: 10px; }
    .answer-card.expanded {
      border-color: #a1a1aa;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .answer-head {
      display: flex;
      flex-direction: column;
      padding: 12px 14px 10px;
      background: #fafafa;
      cursor: pointer;
      user-select: none;
      gap: 8px;
      transition: background .2s ease;
    }
    .answer-head:hover { background: #f4f4f5; }
    .answer-head-top { display:flex;align-items:center;gap:10px;flex:1;min-width:0; }
    .answer-pct {
      flex-shrink: 0;
      font-size: 12px;
      font-weight: 700;
      min-width: 38px;
      text-align: right;
    }
    .chevron-icon {
      width: 16px;
      height: 16px;
      stroke: #71717a;
      fill: none;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      transition: transform .25s ease;
      flex-shrink: 0;
    }
    .answer-card.expanded .chevron-icon {
      transform: rotate(180deg);
    }
    .progress-track {
      width: 100%;
      height: 6px;
      background: #e4e4e7;
      border-radius: 4px;
      overflow: hidden;
      margin: 0;
    }
    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width .6s cubic-bezier(.16,1,.3,1);
    }
    .answer-name {
      font-size: 12.5px;
      font-weight: 600;
      color: #18181b;
    }
    .answer-question {
      font-size: 10.5px;
      color: #71717a;
      margin-top: 2px;
      font-style: italic;
      line-height: 1.3;
    }

    /* Accordion Body */
    .answer-body {
      display: none;
      padding: 14px;
      border-top: 1px solid #f4f4f5;
      background: #fff;
    }
    .answer-card.expanded .answer-body {
      display: block;
    }
    .explanation-text {
      font-size: 12.5px;
      color: #3f3f46;
      line-height: 1.55;
      margin: 0 0 12px 0;
    }
    .news-title {
      font-size: 10.5px;
      font-weight: 600;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: .07em;
      margin-bottom: 6px;
    }
    .news-list { display:flex;flex-direction:column;gap:5px; }
    .news-item-link { text-decoration: none; display: block; }
    .news-item-link:hover .news-item { background: #e4e4e7; }
    .news-item {
      font-size: 11.5px;
      color: #3f3f46;
      line-height: 1.5;
      padding: 7px 10px;
      background: #f4f4f5;
      border-radius: 6px;
      border-left: 3px solid #a1a1aa;
      word-break: break-word;
      transition: background 0.15s ease;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
    }
    .external-link-icon {
      width: 13px; height: 13px;
      stroke: #a1a1aa; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round;
      flex-shrink: 0; margin-top: 2px;
    }

    /* ── Error ── */
    .error-box {
      padding: 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      font-size: 13px;
      color: #b91c1c;
      line-height: 1.5;
    }
    .error-box strong { display:block;margin-bottom:4px; }
    .error-hint { font-size:11.5px;color:#dc2626;opacity:.8;margin-top:6px; }
  `;

  const konecznyImg = chrome.runtime.getURL('koneczny.jpg');

  const container = document.createElement('div');
  container.innerHTML = `
    <style>${css}</style>

    <button class="fab" id="koneczny-trigger" title="Analizuj cywilizacyjnie">
      <img src="${konecznyImg}" alt="Feliks Koneczny">
    </button>

    <div class="panel" id="koneczny-panel">
      <div class="header">
        <div class="header-left">
          <div class="logo-badge">
            <img src="${konecznyImg}" alt="Feliks Koneczny">
          </div>
          <div>
            <div class="header-title">Analiza Konecznego</div>
            <div class="header-subtitle">Metoda Historiozoficzna</div>
          </div>
        </div>
        <button class="close-btn" id="koneczny-close">
          <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="content" id="koneczny-content"></div>
    </div>
  `;

  shadow.appendChild(container);

  const trigger = shadow.getElementById('koneczny-trigger');
  const panel   = shadow.getElementById('koneczny-panel');
  const closeBtn = shadow.getElementById('koneczny-close');
  const content  = shadow.getElementById('koneczny-content');

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));
  trigger.addEventListener('click', () => {
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
    } else {
      panel.classList.add('open');
      runAnalysis();
    }
  });

    function initKonecznyTankDom(arena, konecznyImgSrc) {
      const negativeWords = ["GROMADNOŚĆ", "MECHANIZM", "STATOLATRIA", "APRIORYZM", "CEZAROPAPIZM", "KOLEKTYWIZM", "TURAŃSZCZYZNA", "BIZANTYNIZM", "FISKALIZM", "MAKIAWELIZM"];
      const positiveWords = ["PERSONALIZM", "DUALIZM PRAWNY", "ETYKA", "WOLNOŚĆ", "APOSTERIORYZM", "AUTONOMIA RODZINY", "PRAWDA OBIEKTYWNA", "HISTORYZM"];

      const svg = arena.querySelector('.tank-laser-svg');

      function spawnNegative() {
        if (!document.body.contains(arena)) return;
        const word = negativeWords[Math.floor(Math.random() * negativeWords.length)];

        const leftPx = 200 + Math.random() * 140;
        const topPx = 20 + Math.random() * 150;

        const badge = document.createElement('div');
        badge.className = 'badge-negative';
        badge.textContent = '💥 ' + word;
        badge.style.left = leftPx + 'px';
        badge.style.top = topPx + 'px';
        arena.appendChild(badge);

        setTimeout(() => {
          if (!document.body.contains(badge)) return;

          const tank = arena.querySelector('.koneczny-tank');
          const barrel = arena.querySelector('.tank-barrel');

          const tankX = 95;
          const tankY = tank ? tank.offsetTop + 26 : 100;
          const targetX = leftPx + 35;
          const targetY = topPx + 10;

          const dx = targetX - tankX;
          const dy = targetY - tankY;
          const angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

          if (barrel) barrel.style.transform = `rotate(${angleDeg}deg)`;

          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', tankX);
          line.setAttribute('y1', tankY);
          line.setAttribute('x2', targetX);
          line.setAttribute('y2', targetY);
          line.setAttribute('stroke', '#ef4444');
          line.setAttribute('stroke-width', '3');
          line.setAttribute('stroke-linecap', 'round');
          line.setAttribute('style', 'filter: drop-shadow(0 0 6px #ef4444); opacity: 1; transition: opacity 0.2s ease;');
          if (svg) svg.appendChild(line);

          setTimeout(() => {
            if (line) line.style.opacity = '0';
            setTimeout(() => { if (line) line.remove(); }, 200);

            badge.style.transform = 'scale(1.4)';
            badge.style.opacity = '0';
            setTimeout(() => {
              if (document.body.contains(badge)) badge.remove();
              if (document.body.contains(arena)) spawnNegative();
            }, 200);
          }, 150);
        }, 400 + Math.random() * 500);
      }

      function spawnPositive() {
        if (!document.body.contains(arena)) return;
        const word = positiveWords[Math.floor(Math.random() * positiveWords.length)];

        const startX = 240 + Math.random() * 100;
        const startY = 10 + Math.random() * 40;

        const badge = document.createElement('div');
        badge.className = 'badge-positive';
        badge.textContent = '⚡ ' + word;
        badge.style.left = startX + 'px';
        badge.style.top = startY + 'px';
        arena.appendChild(badge);

        setTimeout(() => {
          if (!document.body.contains(badge)) return;
          badge.style.left = '45px';
          badge.style.top = '90px';
          badge.style.transform = 'scale(0.2)';
          badge.style.opacity = '0';

          setTimeout(() => {
            if (document.body.contains(badge)) badge.remove();
            if (document.body.contains(arena)) spawnPositive();
          }, 1600);
        }, 100);
      }

      for (let i = 0; i < 3; i++) setTimeout(spawnNegative, i * 350);
      for (let i = 0; i < 2; i++) setTimeout(spawnPositive, i * 650);
    }

  // ── Analysis ──────────────────────────────────────────
  async function runAnalysis(targetIndexStr = null) {
    if (trigger) trigger.classList.add('spinning');

    content.innerHTML = `
      <div class="loader">
        <div class="tank-arena" id="tank-arena">
          <svg class="tank-laser-svg" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:4;"></svg>
          <div class="koneczny-tank">
            <div class="tank-body">
              <div class="tank-barrel"></div>
            </div>
            <div class="tank-treads"></div>
            <div class="tank-hatch">
              <img src="${konecznyImg}" alt="Feliks Koneczny">
            </div>
          </div>
        </div>
        <div class="loader-label" id="loader-label-text">Profesor analizuje tekst…</div>
      </div>
    `;

    const arena = content.querySelector('#tank-arena');
    if (arena) {
      initKonecznyTankDom(arena, konecznyImg);
    }

    const statements = [
      "Szereguję dwoistości...",
      "Przypisuję sakralność...",
      "Rozpoznaję wpływy turańskie...",
      "Mierzę wskaźnik gromadności...",
      "Szukam trójpodziału władzy...",
      "Tropię cywilizację bizantyńską...",
      "Odkrywam prawo aposterioryczne...",
      "De-maskuję statolatrię...",
      "Sprawdzam stosunek do pracy...",
      "Diagnozuję historyzm...",
      "Badam niezależność Kościoła...",
      "Analizuję quincunx dóbr...",
      "Mierzę aprioryzm ustrojowy...",
      "Liczę odsetek etyki w prawie...",
      "Tropię rządy inżynierskie...",
      "Ocenię wyemancypowanie rodziny...",
      "Sprawdzam poczucie odpowiedzialności osobistej...",
      "Analizuję stosunek do czasu i pędu historycznego...",
      "Rozliczam wskaźniki cywilizacji łacińskiej...",
      "Szukam reliktów cywilizacji arabskiej w tekście...",
      "Oceniam czy prawo stoi ponad władcą...",
      "Przyglądam się autonomii zrzeszeń...",
      "Weryfikuję zjawisko biurokratyzacji...",
      "Mierzę siłę etyki w życiu publicznym...",
      "Sprawdzam spójność pięciu kategorii bytu...",
      "Oceniam dążenie do prawdy obiektywnej...",
      "Weryfikuję tolerancję dla praw lokalnych...",
      "Odmierzam dawkę mechanicyzmu...",
      "Ważę słuszność ponad legalizmem...",
      "Ewaluuję stopień militaryzacji społeczeństwa...",
      "Sprawdzam, czy państwo jest celem samym w sobie...",
      "Analizuję prymat społeczeństwa nad państwem...",
      "Tropię ewolucję prawa z doświadczeń...",
      "Szukam narzucania zmyślonych praw apriorycznych...",
      "Oceniam podejście do dziedziczenia własności...",
      "Tropię makiawelizm w decyzjach urzędniczych...",
      "Weryfikuję niezależność sądownictwa od biurokracji...",
      "Badam poziom suwerenności rodziny w wychowaniu...",
      "Kwalifikuję zjawisko turańskiego obozownictwa...",
      "Mierzę skażenie prawa monizmem państwowym...",
      "Sprawdzam wolność stanowienia prawa prywatnego...",
      "Analizuję podział na sacrum i profanum w prawie...",
      "Szukam śladów kazuistyki żydowskiej...",
      "Kwalifikuję stan acywilizacyjnego kołobłędu...",
      "Ocenię proporcję bezinteresowności do utylitaryzmu...",
      "Sprawdzam suwerenność autokrytyki sumienia...",
      "Badam stopień uświęcenia pracy fizycznej i umysłowej...",
      "Liczę wskaźniki emancypacji synów spod władzy rodu...",
      "Tropię fiskalizm nieuzasadniony potrzebami społecznymi...",
      "Ocenię surowość kar za naruszenie wolności osoby...",
      "Weryfikuję ciągłość er historycznych i tradycji...",
      "Sprawdzam, czy prawo traktowane jest jako odkrywane czy wymyślane...",
      "Tropię zanik odpowiedzialności indywidualnej na rzecz kasty...",
      "Mierzę spójność siedmiu generaliów etyki...",
      "Skanuję tekst pod kątem cezaropapizmu...",
      "Ocenię stopień ujednostajnienia mas pod przymusem...",
      "Odkrywam relikty prawniczości szariatu...",
      "Mierzę poczucie godności osobistej w tekście...",
      "Weryfikuję poszanowanie dla umów prywatnych...",
      "Tropię aprioryzm socjalistyczny i planistyczny...",
      "Analizuję rolę zwyczaju w stanowieniu prawa...",
      "Kwalifikuję obecność monizmu publicznego...",
      "Prześwietlam przyczyny paraliżu kultury czynu...",
      "Sprawdzam równość władcy i obywatela wobec etyki...",
      "Rozpoznaję wpływy cywilizacji bramińskiej...",
      "Weryfikuję stopień komercjalizacji etyki i sądów...",
      "Mierzę kapitalizację czasu w dorobku pokoleń...",
      "Tropię aprioryczne inżynierie ustrojowe...",
      "Ocenię nienaruszalność prawa własności prywatnej..."
    ];

    const questions = [
      "Czy założenie kanału na YouTube narusza supremację ducha?",
      "Ciekawe czy algorytmy TikToka to czysty aprioryzm?",
      "Czy sztuczna inteligencja to nowy monizm prawny?",
      "Czy na Twitterze da się zmierzyć chyżość historyczną?",
      "Co bym wrzucił na Instagrama z wykładów w Wilnie?",
      "Czy praca zdalna wzmacnia personalizm?",
      "Czy subskrypcja Netflixa to przejaw cywilizacji turańskiej?",
      "Czy kolonizacja Marsa będzie łacińska czy bizantyńska?",
      "Czy systemy blockchain wspierają pluralizm źródeł prawa?",
      "Czy smartwatche niszczą autonomię czasu?",
      "Czy kryptowaluty wyemancypują nas od mechanizmu państwa?",
      "Czy e-sport kształtuje poczucie odpowiedzialności gromadnej?",
      "Czy social media to nowy wymiar statolatrii?",
      "Czy modele językowe mają szansę pojąć quincunx?",
      "Czy w Metaverse da się zastosować prawo aposterioryczne?",
      "Czy kultura cancel-culture to objaw cywilizacji bramińskiej?",
      "Czy programowanie obiektowe wywodzi się z cywilizacji łacińskiej?",
      "Czy Big Data zwiastuje powrót mechanicyzmu społecznego?",
      "Czy w cyberprzestrzeni zachowamy poczucie obowiązku?",
      "Ciekawe czy algorytmy rekomendacji są w pełni aprioryczne?",
      "Czy Feliks Koneczny założyłby Patronite na rzecz badań cywilizacji?",
      "Czy smart city to ostateczny tryumf inżynierii społecznej?",
      "Czy asystenci głosowi niszczą naszą kulturę czynu?",
      "Czy praca dla korporacji to powrót cywilizacji chińskiej?",
      "Czy open-source to współczesny pluralizm prawny?",
      "Ciekawe czy mikropłatności to forma sakralnej ekonomii?",
      "Czy AI agent zastąpi poczucie odpowiedzialności osobistej?",
      "Czy Cloud Computing to powrót do ustroju obozowego?",
      "Czy pojęcie 'User Experience' szanuje personalizm?",
      "Czy zalew powiadomień niszczy naszą autokrytykę sumienia?",
      "Czy praca w Agile wywodzi się z łacińskiego aposterioryzmu?",
      "Czy inteligentne kontenery na śmieci to statolatria?",
      "Czy w grach RPG panuje prymat etyki nad prawem?",
      "Czy Algorytm Konecznego otrzyma odznaczenie cywilizacyjne?",
      "Czy w VR da się wybudować autonomię rodziny?",
      "Czy moderacja Reddita to forma gromadności żydowskiej?",
      "Czy hackathony to uświęcenie pracy wolnej?",
      "Czy tokeny NFT wspierają trwałość prawa własności?",
      "Czy czat GPT jest odporny na acywilizacyjny kołobłęd?",
      "Czy powiadomienia push wymuszają na nas wegetację?",
      "Czy elektryczne hulajnogi to objaw bezdusznego mechanicyzmu?",
      "Czy autouzupełnianie tekstu odbiera nam kontrolę nad słowem?",
      "Czy decentralizacja DAO to czysta cywilizacja łacińska?",
      "Czy płatności zbliżeniowe przyspieszają emancypację rodziny?",
      "Czy cyfrowe nomadztwo to powrót do turańskiego koczownictwa?",
      "Czy kody QR w restauracjach niszczą tradycję uświęcenia pracy?",
      "Czy inteligentne umowy (smart contracts) eliminują sędziowską słuszność?",
      "Czy domotyka (smart home) chroni autonomię prywatnego ogniska?",
      "Czy media strumieniowe zniosły pojęcie ery historycznej?"
    ];

    function shuffle(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    }

    shuffle(statements);
    shuffle(questions);

    let statIdx = 0;
    let questIdx = 0;
    let sequenceCounter = 0;
    let sequenceTarget = Math.floor(Math.random() * 2) + 2; // 2 or 3
    
    if(window.konecznyLoadingInterval) clearInterval(window.konecznyLoadingInterval);
    
    window.konecznyLoadingInterval = setInterval(() => {
      const label = content.querySelector('#loader-label-text');
      if(label) {
        let text = "";
        if (sequenceCounter < sequenceTarget) {
          text = statements[statIdx % statements.length];
          statIdx++;
          sequenceCounter++;
        } else {
          text = questions[questIdx % questions.length];
          questIdx++;
          sequenceCounter = 0;
          sequenceTarget = Math.floor(Math.random() * 2) + 2;
        }
        label.textContent = text;
      }
    }, 3000);

    try {
      const config = await getStorageData();
      let backendUrl = config.backendUrl || 'http://localhost:8005';
      if (backendUrl.includes(':8000')) {
        backendUrl = backendUrl.replace(':8000', ':8005');
        chrome.storage.local.set({ backendUrl });
      }
      const apiKey = config.apiKey || '';

      const pageData = extractCleanText();
      let reqBody;

      if (pageData && pageData.pdf_url) {
        reqBody = { pdf_url: pageData.pdf_url };
        if (targetIndexStr) reqBody.target_indices = [targetIndexStr];
      } else {
        if (!pageData || pageData.length < 50) {
          throw new Error('Niewystarczająca ilość tekstu na stronie.');
        }
        reqBody = { text: pageData.substring(0, 8000) };
        if (targetIndexStr) reqBody.target_indices = [targetIndexStr];
      }

      const response = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Gemini-API-Key': apiKey },
        body: JSON.stringify(reqBody)
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Błąd serwera: ${response.status}`);
      }

      clearInterval(window.konecznyLoadingInterval);
      const newData = await response.json();
      window.konecznyResults.sacrality_score = newData.sacrality_score || window.konecznyResults.sacrality_score;
      window.konecznyResults.spirit_supremacy_score = newData.spirit_supremacy_score || window.konecznyResults.spirit_supremacy_score;
      window.konecznyResults.legal_dualism_score = newData.legal_dualism_score || window.konecznyResults.legal_dualism_score;
      window.konecznyResults.law_source_pluralism_score = newData.law_source_pluralism_score || window.konecznyResults.law_source_pluralism_score;
      window.konecznyResults.aposteriori_apriori_score = newData.aposteriori_apriori_score || window.konecznyResults.aposteriori_apriori_score;
      window.konecznyResults.organism_mechanism_score = newData.organism_mechanism_score || window.konecznyResults.organism_mechanism_score;
      window.konecznyResults.personalism_score = newData.personalism_score || window.konecznyResults.personalism_score;
      window.konecznyResults.family_law_autonomy_score = newData.family_law_autonomy_score || window.konecznyResults.family_law_autonomy_score;
      window.konecznyResults.raw_ratings = { ...window.konecznyResults.raw_ratings, ...(newData.raw_ratings || {}) };
      renderResults();

    } catch (err) {
      if (trigger) trigger.classList.remove('spinning');
      clearInterval(window.konecznyLoadingInterval);

      const errText = err.message || '';
      const isQuotaError = errText.includes('429') || errText.includes('Quota') || errText.includes('RESOURCE_EXHAUSTED') || errText.includes('limit');

      content.innerHTML = `
        <div style="padding: 16px; background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 10px; margin: 15px; text-align: left; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);">
          <div style="font-weight: 700; color: #f87171; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            ⚠️ ${isQuotaError ? 'Przekroczono limit API Gemini (Quota 429)' : 'Błąd analizy danych'}
          </div>
          <div style="font-size: 13px; color: #fee2e2; line-height: 1.5; margin-bottom: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-word; max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 8px 10px; border-radius: 6px;">
            ${errText}
          </div>
          <div style="font-size: 12px; color: #fca5a5; border-top: 1px dashed rgba(239,68,68,0.3); padding-top: 10px; line-height: 1.4;">
            💡 <strong>Powód braku danych:</strong> ${isQuotaError ? 'Klucz Gemini API osiągnął darmowy limit zapytań (RPM/RPD). Poczekaj około 30–60 sekund na odnowienie puli i spróbuj ponownie.' : 'Sprawdź połączenie z backendem (port 8005) oraz poprawność klucza Gemini API.'}
          </div>
          <button id="retry-analysis-btn" style="margin-top: 14px; width: 100%; padding: 10px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
            🔄 Spróbuj ponownie
          </button>
        </div>
      `;

      const retryBtn = content.querySelector('#retry-analysis-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          content.innerHTML = '<div style="padding:20px; text-align:center; color:#a1a1aa;">Ponowne uruchamianie analizy...</div>';
          runAnalysis(targetIndexStr);
        });
      }
    }
  }


  // Global state
  window.konecznyResults = window.konecznyResults || { raw_ratings: {} };
  // ── Render ─────────────────────────────────────────────
  function renderResults() {
    if (trigger) trigger.classList.remove('spinning');
    const data = window.konecznyResults;

    // Remember active tab
    let activeTabId = 'tab-church'; // default to church for dev
    const existingActive = content.querySelector('.tab-btn.active');
    if (existingActive) {
      activeTabId = existingActive.id;
    }


    const sacralityScore = Math.round((data.sacrality_score || 0) * 100);
    const spiritScore    = Math.round((data.spirit_supremacy_score || 0) * 100);


    const legalDualismScore = Math.round((data.legal_dualism_score || 0) * 100);
    const legalDualismScores = data.raw_ratings?.legal_dualism_scores || {};

    const pluralismScore = Math.round((data.law_source_pluralism_score || 0) * 100);
    const pluralismScores = data.raw_ratings?.law_source_pluralism_scores || {};

    const aposterioriScore = Math.round((data.aposteriori_apriori_score || 0) * 100);
    const aposterioriScores = data.raw_ratings?.aposteriori_apriori_scores || {};

    const organismScore = Math.round((data.organism_mechanism_score || 0) * 100);
    const personalismScore = Math.round((data.personalism_score || 0) * 100);
    const familyScore = Math.round((data.family_law_autonomy_score || 0) * 100);
    const churchScore = Math.round((data.church_independence_score || 0) * 100);
    const propertyScore = Math.round((data.property_rights_stability_score || 0) * 100);
    const propertyScores = data.raw_ratings?.property_rights_stability_scores || {};
    const inheritanceScores = data.raw_ratings?.inheritance_continuity_scores || {};
    const organismScores = data.raw_ratings?.organism_mechanism_scores || {};
    const personalismScores = data.raw_ratings?.personalism_scores || {};
    const familyScores = data.raw_ratings?.family_law_autonomy_scores || {};
    const churchScores = data.raw_ratings?.church_independence_scores || {};
    const moralityScores = data.raw_ratings?.morality_supremacy_scores || {};
    const publicMoralityScores = data.raw_ratings?.public_morality_totality_scores || {};
    const adminRespScores = data.raw_ratings?.administrative_responsibility_scores || {};

    let calcAdminRespScore = data.administrative_responsibility_score || 0;
    if (calcAdminRespScore === 0 && Object.keys(adminRespScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(adminRespScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcAdminRespScore = validSum / validCount;
      }
    }
    const adminRespScore = Math.round(calcAdminRespScore * 100);

    let calcPublicMoralityScore = data.public_morality_totality_score || 0;
    if (calcPublicMoralityScore === 0 && Object.keys(publicMoralityScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(publicMoralityScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcPublicMoralityScore = validSum / validCount;
      }
    }
    const publicMoralityScore = Math.round(calcPublicMoralityScore * 100);

    let calcMoralityScore = data.morality_supremacy_score || 0;
    if (calcMoralityScore === 0 && Object.keys(moralityScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(moralityScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcMoralityScore = validSum / validCount;
      }
    }
    const moralityScore = Math.round(calcMoralityScore * 100);

    let calcInheritanceScore = data.inheritance_continuity_score || 0;
    if (calcInheritanceScore === 0 && Object.keys(inheritanceScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(inheritanceScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcInheritanceScore = validSum / validCount;
      }
    }
    const inheritanceScore = Math.round(calcInheritanceScore * 100);





    const sacralityScores = data.raw_ratings?.sacrality_scores || {};
    const spiritScores    = data.raw_ratings?.spirit_supremacy_scores || {};

    const SACRALITY_META = {
      RELIGIOUS_LAW_SUPREMACY:      { name: 'Supremacja Prawa Religijnego',     question: 'Czy prawo religijne dominuje nad świeckim?' },
      THEOCRATIC_AUTHORITY:         { name: 'Autorytet Teokratyczny',            question: 'Czy władza polityczna pochodzi z autorytetu religijnego?' },
      FAMILY_RELIGIOUS_CONTROL:     { name: 'Kontrola Religijna Rodziny',        question: 'Czy małżeństwo, rozwód i dziedziczenie są regulowane przez religię?' },
      RELIGIOUS_EDUCATION:          { name: 'Religia w Edukacji',                question: 'Czy edukacja jest wyłącznie lub dominująco religijna?' },
      PROPERTY_RELIGIOUS_CONTROL:   { name: 'Kontrola Religijna Własności',    question: 'Czy własność prywatna podlega normom religijnym?' },
      SACRAL_CRIMINAL_LAW:          { name: 'Sakralne Prawo Karne',              question: 'Czy prawo karne opiera się na nakazach religijnych (np. hudud)?' },
      RELIGIOUS_TIME_CALENDAR:      { name: 'Religijny Kalendarz i Czas',        question: 'Czy organizacja czasu i świąt jest wyznaczana przez religię?' },
      SCIENCE_RELIGION_FUSION:      { name: 'Fuzja Nauki i Religii',             question: 'Czy nauka jest podporządkowana dogmatom religijnym?' },
      ETHICS_RELIGION_IDENTITY:     { name: 'Tożsamość Etyki i Religii',       question: 'Czy etyka jest tożsama z nakazami religijnymi, nie ma etyki poza religią?' },
      SACRAL_ECONOMICS:             { name: 'Sakralna Ekonomia',                 question: 'Czy działalność gospodarcza jest regulowana normami religijnymi (np. zakaz lichwy)?' },
      SOCIAL_HIERARCHY_RELIGIOUS:   { name: 'Religijna Hierarchia Społeczna',  question: 'Czy hierarchia społeczna (kasty, stany) jest religijnie określona?' },
      STATE_CHURCH_UNITY:           { name: 'Jedność Państwa i Kościoła',      question: 'Czy państwo i instytucja religijna stanowią jedność (teokracja)?' },
      APOSTASY_PUNISHMENT:          { name: 'Karanie Apostazji',                 question: 'Czy odejście od wiary jest czynem karalnym cywilnie lub karnie?' }
    };

    const GENERALIA_META = {
      duty_source_personalistic: { name: '1. Źródło Obowiązku', question: 'Mierzy, czy obowiązek wypływa z autonomicznego nakazu etycznego wyprzedzającego prawo (szereg personalistyczny), czy z zewnętrznego przymusu państwowego lub okólnika (gromadnościowy).' },
      motivation_altruism: { name: '2. Motywacja (Bezinteresowność)', question: 'Mierzy, czy motywacją działania jest bezinteresowna dążność do Dobra i Prawdy jako celów samych w sobie, czy kontraktowy utylitaryzm "coś za coś".' },
      responsibility_personal: { name: '3. Rodzaj Odpowiedzialności', question: 'Mierzy, czy człowiek odpowiada osobiście i indywidualnie za własne czyny i mowę (personalizm), czy ponosi odpowiedzialność zbiorową rodu, kasty lub gromady.' },
      justice_equity: { name: '4. Natura Sprawiedliwości', question: 'Mierzy, czy sprawiedliwość opiera się na etycznym poczuciu słuszności stojącym ponad przepisem, czy na bezdusznym legalizmie i ślepym posłuszeństwie literze prawa.' },
      conscience_autonomous: { name: '5. Status Sumienia', question: 'Mierzy, czy najwyższą instancją jest autonomia sumienia i autokrytyka moralna, czy heteronomia zastępująca sumienie okólnikiem władzy.' },
      time_mastery_historicism: { name: '6. Opanowanie Czasu', question: 'Mierzy, czy społeczeństwo wykazuje historyzm, erę i międzypokoleniową kapitalizację czasu, czy wegetuje ahistorycznie w bezwymiarowej teraźniejszości.' },
      work_ethos_sanctification: { name: '7. Ethos Pracy', question: 'Mierzy, czy praca uznawana jest za uświęcenie i godność człowieka wolnego, czy traktowana jako przymus, jarzmo niewolnicze lub przedmiot pogardy.' }
    };

    const DUTY_SOURCE_META = {
      ethics_over_law: { name: 'Poczucie Obowiązku vs Prawo', question: 'Czy poczucie obowiązku etycznego wyprzedza prawo stanowione?', isDev: true },
      voluntary_action: { name: 'Dobrowolność Czynu', question: 'Czy jednostka spełnia obowiązki z własnej woli (zamiast lęku przed przymusem)?', isDev: true },
      direct_god_relation: { name: 'Bezpośredniość Relacji z Bogiem', question: 'Czy relacja z Siłą Wyższą i sumieniem jest bezpośrednia i osobista?', isDev: true },
      autonomous_conscience: { name: 'Autonomia Sumienia', question: 'Czy najwyższą instancją jest osobiste sumienie (autokrytyka moralna)?', isDev: true },
      unwavering_commitment: { name: 'Niezmienność Obowiązku', question: 'Czy obowiązek etyczny trwa niezależnie od sakralnego zrzucenia zobowiązania?', isDev: true },
      universal_ethics: { name: 'Uniwersalizm Obowiązku', question: 'Czy obowiązek odnosi się uniwersalnie do każdego człowieka (bliźniego)?', isDev: true },
      personal_creativity: { name: 'Twórczość i Inicjatywa', question: 'Czy poczucie obowiązku pobudza do twórczości i osobistej inicjatywy?', isDev: true },
      ethics_primacy: { name: 'Prymat Etyki nad Prawem', question: 'Czy uznaje się bezwzględny prymat etyki nad stanowionym prawem?', isDev: true },
      personal_confession: { name: 'Spowiedź Indywidualna', question: 'Czy istnieje spowiedź i osobista samoocena myśli, mowy i uczynków?', isDev: true },
      no_statolatry: { name: 'Brak Statolatrii', question: 'Czy odrzuca się statolatrię i nieomylność państwa?', isDev: true },
      no_camp_system: { name: 'Brak Ustroju Obozowego', question: 'Czy odrzuca się turański ustrój obozowy i rozkaz wodza jako obowiązek?', isDev: true },
      no_sacral_casuistry: { name: 'Brak Sakralnej Kazuistyki', question: 'Czy odrzuca się drobiazgową kazuistykę przepisów zastępującą sumienie?', isDev: true },
      no_collectivism: { name: 'Brak Kolektywizmu', question: 'Czy odrzuca się kolektywizm i uszczęśliwianie ludzi pod przymusem?', isDev: true }
    };

    const SPIRIT_META = {
      LEGAL_DUALISM_INDEX:           { name: 'Indeks Dualizmu Prawnego',        question: 'Czy państwo uznaje niezależną sferę praw prywatnych jednostki?' },
      LAW_SOURCE_PLURALISM_INDEX:    { name: 'Pluralizm Źródeł Prawa',           question: 'Czy istnieje wolność stanowienia prawa zwyczajowego i lokalnego?' },
      APOSTERIORI_APRIORI_INDEX:      { name: 'Prawo Aposterioryczne vs Apriori', question: 'Czy prawo wyrasta z doświadczenia społeczeństwa (aposteriori)?' },
      ORGANISM_MECHANISM_INDEX:      { name: 'Organizm vs Mechanizm',          question: 'Czy społeczeństwo traktowane jest jako organizm czy mechanizm?' },
      PERSONALISM_INDEX:             { name: 'Indeks Personalizmu',             question: 'Czy człowiek jest traktowany podmiotowo i unikalnie?' },
      FAMILY_LAW_AUTONOMY_INDEX:     { name: 'Autonomia Prawa Rodzinnego',      question: 'Czy rodzina ma autonomiczną sferę niezależną od państwa?' },
      CHURCH_INDEPENDENCE_INDEX:     { name: 'Niezależność Kościoła',           question: 'Czy instytucje duchowe są wolne od kontroli państwa?' },
      PROPERTY_RIGHTS_STABILITY_INDEX: { name: 'Trwałość Prawa Własności',      question: 'Czy własność prywatna jest bezwzględnie chroniona?' },
      INHERITANCE_CONTINUITY_INDEX:  { name: 'Ciągłość Dziedziczenia',          question: 'Czy dziedziczenie odbywa się swobodnie w rodzinie?' },
      MORALITY_SUPREMACY_INDEX:      { name: 'Nadrzędność Moralności',          question: 'Czy polityka i prawo podlegają uniwersalnej etyce?' },
      PUBLIC_MORALITY_TOTALITY_INDEX: { name: 'Totalność Moralności Publicznej', question: 'Czy państwo wymusza jedną etykę czy szanuje sumienie?' },
      ADMINISTRATIVE_RESPONSIBILITY_INDEX: { name: 'Odpowiedzialność Urzędnicza', question: 'Czy urzędnik odpowiada osobiscie przed obywatelem za szkody?' }
    };

    const LEGAL_DUALISM_META = {
      PRIVATE_RIGHTS_SPHERE: { name: 'Sfera Praw Prywatnych', question: 'Czy państwo uznaje niezależną od siebie sferę praw prywatnych jednostki?' },
      FAMILY_AUTONOMY: { name: 'Pełna Autonomia Rodziny', question: 'Czy rodzina posiada pełną autonomię niezależną od państwa?' },
      PROPERTY_PROTECTION: { name: 'Ochrona Własności', question: 'Czy własność prywatna jest bezwzględnie chroniona i wolna od konfiskat?' },
      NATURAL_INHERITANCE: { name: 'Dziedziczenie Naturalne', question: 'Czy dziedziczenie podlega prawu naturalnemu i zależy wyłącznie od woli rodziny?' },
      POWER_LIMITS: { name: 'Granice Władzy', question: 'Czy istnieją obiektywne i realne granice władzy państwowej?' },
      OPPOSITION_RIGHT: { name: 'Prawo Sprzeciwu', question: 'Czy istnieje nieskrępowane prawo sprzeciwu (opozycji) wobec władzy?' },
      STATE_MORALITY_SUBORDINATION: { name: 'Podporządkowanie Państwa Moralności', question: 'Czy państwo jest w pełni podporządkowane uniwersalnej moralności?' },
      DIVINE_VS_CAESAR: { name: 'Boskie i Cesarskie', question: 'Czy zachowany jest podział na to co boskie (duchowe) i cesarskie (świeckie)?' },
      RULER_ETHICS_EQUALITY: { name: 'Zrównanie Etyczne Władcy', question: 'Czy król/państwo podlegają dokładnie tym samym normom etycznym co obywatele?' },
      INDEPENDENT_JUDICIARY: { name: 'Niezależność Sędziów', question: 'Czy sędziowie są odrębnym organem czy funkcjonariuszem administracji?' },
      OFFICIAL_RESPONSIBILITY: { name: 'Odpowiedzialność Urzędnika', question: 'Czy istnieje odpowiedzialność urzędnika przed obywatelem za wyrządzone szkody?' },
      APOSTERIORI_LAW: { name: 'Prawo Aposterioryczne', question: 'Czy prawo wywodzi się z aposteriorycznego doświadczenia etycznego czy z biurokracji?' },
      ASSOCIATION_AUTONOMY: { name: 'Autonomia Zrzeszeń', question: 'Czy istnieje autonomia organizacji zrzeszenia?' },
      LAND_OWNERSHIP_FULL: { name: 'Pełna Własność Ziemska', question: 'Czy własność ziemska jest pełna czy zależna od łaski władcy?' },
      LOCAL_LAW_TOLERANCE: { name: 'Tolerancja Praw Lokalnych', question: 'Czy istnieją prawa lokalne czy państwo usiłuje narzucić jednostajne prawo?' },
      LAW_CONSCIENCE_EQUALITY: { name: 'Zgodność Prawa z Sumieniem', question: 'Czy prawo musi się oglądać na sumienie i słuszność?' },
      FAMILY_EMANCIPATION: { name: 'Emancypacja Rodziny', question: 'Czy rodzina jest wyemancypowana?' },
      SOCIETY_PRIMACY: { name: 'Prymat Społeczeństwa', question: 'Czy istnieje prymat społeczeństwa nad państwem?' },
      SOCIETY_AS_GOAL: { name: 'Społeczeństwo Jako Cel', question: 'Czy państwo jest środkiem a społeczeństwo celem?' },
      CHURCH_INDEPENDENCE: { name: 'Niezależność Kościoła', question: 'Czy Kościół jest niezależny od państwa?' },
      NO_STATOLATRY_PUBLIC_MONISM: { name: 'Odrzucenie Statolatrii', question: 'Czy odrzuca się zjawisko statolatrii i monizmu prawa publicznego?' },
      NO_PRIVATE_LAW_MONISM: { name: 'Brak Monizmu Prywatnego', question: 'Czy unika się monizmu prawa prywatnego (np. na wzór turański)?' },
      CITIZENS_ARE_FREE: { name: 'Wolność Obywateli', question: 'Czy mieszkańcy są wolni (a nie niewolnikami lub zakładnikami władcy)?' },
      NO_SACRAL_LAW_MONOPOLY: { name: 'Brak Monopolu Sakralnego', question: 'Czy istnieje autonomiczne prawo świeckie (brak wyłączności prawa rytualnego)?' },
      NO_EXCESS_REGULATION: { name: 'Brak Nadmiaru Przepisów', question: 'Czy unika się nadmiaru przepisów pochłaniających prawo prywatne?' }
    };

    const PLURALISM_META = {
      MULTIPLE_LAW_SOURCES: { name: 'Wielosc Zrodel Prawa', question: 'Czy prawo ma wiele współistniejących źródeł (prawo naturalne, etyka, zwyczaj)?' },
      SINGLE_LAW_SOURCE: { name: 'Odrzucenie Monopolu Źródeł', question: 'Czy odrzuca się monopol jednego wyłącznego źródła prawa (np. państwa lub dyktatora)?' },
      LAW_DISCOVERY_VS_CREATION: { name: 'Odkrywanie Prawa', question: 'Czy prawo traktuje się jako odkrywane z życia i zwyczaju (a nie odgórnie narzucane)?' },
      UNJUST_LAW_CHALLENGE: { name: 'Prawo do Podwazenia', question: 'Czy istnieje coś co może zakwestionować obowiązujące prawo jako niesprawiedliwe?' },
      LAW_JUDGEABILITY: { name: 'Ocenialnosc Prawa', question: 'Czy prawo może być osądzane czy tylko wykonywane?' },
      CAN_LAW_BE_BAD: { name: 'Zle Prawo', question: 'Czy prawo może być złe?' },
      LAW_SUBJECT_TO_REASON: { name: 'Prawo Podlegle Rozumowi', question: 'Czy prawo podlega rozumowi?' },
      CUSTOMARY_LAW_RECOGNITION: { name: 'Prawo Zwyczajowe', question: 'Czy państwo uznaje prawo zwyczajowe za równorzędne z pisanym?' },
      SOCIAL_GROUPS_STATUTES: { name: 'Statuty Grup Spolecznych', question: 'Czy grupy społeczne (stany, zawody) mają prawo do tworzenia własnych statutów?' },
      RULER_SUBJECT_TO_LAW: { name: 'Podleglosc Wladcy Prawu', question: 'Czy władca jest podległy prawu?' },
      LAW_FROM_ETHICS_OR_DOGMA: { name: 'Zrodlo Prawa (Etyka czy Dogmat)', question: 'Czy prawo wywodzi się z etyki, czy z dogmatu?' },
      IUS_GENTIUM_PRESENCE: { name: 'Prawo Narodow', question: 'Czy istnieje Prawo Narodów obok prawa rodzimego?' },
      MEDITATION_VS_EXPERIENCE: { name: 'Medytacja czy Doswiadczenie', question: 'Czy prawo powstaje przez medytację czy przez doświadczenie (aposterioryzm)?' },
      INDEPENDENT_CORPORATIONS: { name: 'Niezalezne Korporacje', question: 'Czy istnieją niezależne korporacje i samorządy?' },
      PRIVATE_PUBLIC_LAW_SPLIT: { name: 'Podzial Prawa', question: 'Czy istnieje ścisły podział na sferę prywatną i publiczną?' },
      SOCIETY_PRIMACY_OVER_STATE: { name: 'Prymat Spoleczenstwa', question: 'Czy istnieje prymat społeczeństwa nad państwem?' },
      SINGLE_IMMUTABLE_SOURCE: { name: 'Brak Sztywnego Źródła', question: 'Czy odrzuca się istnienie jednego, sztywnego i niezmiennego źródła prawa?' },
      WODZ_WILL_VS_MULTIPLE: { name: 'Odrzucenie Woli Wodza', question: 'Czy odrzuca się samowolę i wyłączność woli wodza jako jedynego źródła prawa?' },
      STATE_ONLY_LAW_SOURCE: { name: 'Brak Monopolu Państwa', question: 'Czy odrzuca się monopol państwa w stanowieniu prawa (uznając prawo zwyczajowe/społeczne)?' },
      SOCIALIST_DOCTRINE_COERCION: { name: 'Brak Doktrynerstwa', question: 'Czy prawodawstwo jest wolne od apriorycznej doktryny socjalistycznej niszczącej tradycję?' }
    };

    const APOSTERIORI_META = {
      LAW_SANCTIONING_FACTS_VS_IDEAS: { name: 'Sankcjonowanie Faktów', question: 'Czy prawo sankcjonuje realne fakty wynikające ze społecznego doświadczenia (aposteriori)?' },
      STATE_AS_EDUCATOR: { name: 'Brak Państwa-Wychowawcy', question: 'Czy unika się traktowania państwa jako apriorycznego wychowawcy społeczeństwa?' },
      INDUCTION_VS_DEDUCTION: { name: 'Indukcja z Doświadczenia', question: 'Czy system prawny opiera się na indukcji z doświadczenia i faktów?' },
      UNITY_BY_DIVERSITY_VS_UNIFORMITY: { name: 'Jedność przez Rozmaitość', question: 'Czy jedność budowana jest organicznie przez różnorodność, a nie narzuconą jednostajność?' },
      SOCIAL_ENGINEERING_CULT: { name: 'Brak Inżynierii Społecznej', question: 'Czy odrzuca się inżynierię społeczną i odgórny kult biur planowania?' },
      ETHICS_PRECEDES_LAW: { name: 'Etyka Wyprzedza Prawo', question: 'Czy etyka wyprzedza prawo, czy prawo wyprzedza etykę?' },
      HISTORICISM_AS_BASE: { name: 'Historyzm jako Podstawa', question: 'Czy istnieje historyzm jako podstawa aposteriorycznego prawodawstwa?' },
      HISTORICISM_FOUNDATION: { name: 'Fundament Historyzmu', question: 'Czy istnieje historyzm jako fundament aposterioryzmu?' },
      HUMAN_PERSONALISM_PRESENCE: { name: 'Obecnosc Personalizmu', question: 'Czy istnieje personalizm osoby ludzkiej z wolną wolą utrudniającą ujęcie w sztywne ramy aprioryzmu?' },
      LEGAL_DUALISM_PRESENCE: { name: 'Obecnosc Dualizmu', question: 'Czy istnieje dualizm prawny (brak narzucanej woli obozowej)?' },
      FAMILY_EMANCIPATION_FOR_EXPERIENCE: { name: 'Emancypacja Rodziny dla Doswiadczenia', question: 'Czy rodzina jest wyemancypowana by prawo mogło oprzeć się na doświadczeniu?' },
      NORMS_IMMUTABLE_VS_EVOLVING: { name: 'Ewolucja Norm z Doświadczenia', question: 'Czy normy życiowe ewoluują z doświadczenia (a nie są podane odgórnie raz na zawsze)?' },
      MECHANICAL_SOCIETY_METHOD: { name: 'Brak Metody Mechanicznej', question: 'Czy unika się mechanicznych i sztucznych metod regulowania społeczeństwa?' },
      ENDLESS_UTOPIAN_PLANNING: { name: 'Brak Planowania Utopii', question: 'Czy prawodawstwo jest wolne od utopijnego planowania urojonych praw apriorycznych?' },
      EXCESSIVE_LEGISLATION_APRIORI: { name: 'Brak Nadmiaru Ustaw', question: 'Czy unika się nadmiaru ustaw próbujących odgórnie uregulować każdy krok obywatela?' }
    };

    const ORGANISM_META = {
      SELF_HEALING_CAPACITY: { name: 'Zdolność Samoleczenia', question: 'Czy zrzeszenie posiada wewnętrzną zdolność do samoleczenia i organicznego rozwoju?' },
      UNITY_IN_DIVERSITY: { name: 'Jedność w Różnorodności', question: 'Czy jedność budowana jest poprzez rozwój różnorodności stanowej i lokalnej?' },
      ENGINEERING_GOVERNMENT: { name: 'Brak Rządów Inżynierskich', question: 'Czy odrzuca się traktowanie społeczeństwa jak bezdusznej maszyny/mechanizmu?' },
      ACTION_CULTURE_VS_PASSIVITY: { name: 'Kultura Czynu', question: 'Czy motorem działania jest kultura czynu (organizm), czy bierność i ślepe posłuszeństwo (mechanizm)?' },
      BUREAUCRACY_ELEPHANTIASIS: { name: 'Brak Przerostu Biurokracji', question: 'Czy zrzeszenie jest wolne od patologicznego przerostu biurokracji (elephantiasis)?' },
      ABSTRACTS_RECOGNITION: { name: 'Rola Abstraktow', question: 'Czy zrzeszenie uznaje rolę abstraktów (idei) wykraczających poza walkę o byt?' },
      STATE_AS_TOOL_VS_GOAL: { name: 'Państwo jako Środek', question: 'Czy państwo jest narzędziem (środkiem) służącym społeczeństwu, a nie celem samym w sobie?' },
      PERSONALISM_FREE_WILL: { name: 'Personalizm i Wolna Wola', question: 'Czy panuje personalizm i szacunek dla wolnej woli człowieka?' },
      LEGAL_DUALISM_NECESSITY: { name: 'Koniecznosc Dualizmu', question: 'Czy jest dualizm prawny jako oparcie dla społeczeństwa?' },
      HISTORICISM_TRADITION: { name: 'Historyzm i Tradycja', question: 'Czy organizm wyrasta z doświadczeń pokoleń (historyzm i aposterioryzm)?' },
      APRIORISM_PLANNING: { name: 'Brak Aprioryzmu', question: 'Czy odrzuca się aprioryzm i odgórne planowanie sztucznych relacji społecznych?' },
      COERCION_AS_MAIN_BOND: { name: 'Więzi Dobrowolne', question: 'Czy zrzeszenie opiera się na dobrowolnych więziach społecznych zamiast na przymusie państwowym?' }
    };

  
  const FAMILY_META = {
    adult_son_independence: { name: 'Niezależność Dorosłego Syna', question: 'Czy dorosły syn osiąga niezależność, czy pozostaje pod władzą rodu?', positive: 'Syn usamodzielniony (1.0)', negative: 'Syn zależny (0.0)' },
    family_emancipation_from_clan: { name: 'Emancypacja z Rodu', question: 'Czy rodzina może w pełni wyemancypować się ze struktur rodowych?', positive: 'Rodzina wyemancypowana (1.0)', negative: 'Wchłonięta przez ród (0.0)' },
    son_adulthood_during_fathers_life: { name: 'Pełnoletność Syna', question: 'Czy syn może osiągnąć dojrzałość prawną jeszcze za życia ojca?', positive: 'Pełnoletność za życia ojca (1.0)', negative: 'Zależność do śmierci ojca (0.0)' },
    wife_treated_as_free_person: { name: 'Prawa Żony', question: 'Czy żona traktowana jest jako wolna osoba i partner, czy jako własność?', positive: 'Żona osobą wolną (1.0)', negative: 'Żona traktowana jak przedmiot (0.0)' },
    marriage_by_mutual_consent: { name: 'Małżeństwo z Wyboru', question: 'Czy małżeństwo zawiera się na podstawie wolnej decyzji obu stron?', positive: 'Małżeństwo z ugody stron (1.0)', negative: 'Małżeństwo aranżowane/przymusowe (0.0)' },
    lifelong_monogamy: { name: 'Dożywotnia Monogamia', question: 'Czy obowiązuje zasada dożywotniej monogamii (jednożeństwo bez łatwych rozwodów)?', positive: 'Monogamia dożywotnia (1.0)', negative: 'Poligamia / rozwody (0.0)' },
    state_religion_interferes_home_life: { name: 'Brak Ingerencji w Dom', question: 'Czy państwo lub autorytet religijny może swobodnie ingerować w życie domowe?', positive: 'Brak ingerencji w dom (1.0)', negative: 'Państwo/religia decyduje (0.0)' },
    exclusive_parental_care_rights: { name: 'Wyłączne Prawa Rodzicielskie', question: 'Czy prawa rodzicielskie do wychowania dzieci są wyłączne i chronione przed państwem?', positive: 'Wyłączne prawa rodzicielskie (1.0)', negative: 'Państwo/religia ingeruje (0.0)' },
    property_independent_of_clan_state: { name: 'Własność Prywatna', question: 'Czy istnieje niezależna własność prywatna rodziny, wolna od zwierzchnictwa klanu?', positive: 'Własność prywatna (1.0)', negative: 'Brak własności / państwowa (0.0)' },
    family_law_inaccessible_to_state: { name: 'Ochrona Prawa Rodzinnego', question: 'Czy obszar prawa rodzinnego jest chroniony i niedostępny dla wszechwładzy państwa?', positive: 'Prawo rodzinne chronione (1.0)', negative: 'Prawo regulowane przez państwo (0.0)' },
    polygamy_exists: { name: 'Brak Poligamii', question: 'Czy istnieje zjawisko poligamii degradujące status kobiety?', positive: 'Brak poligamii (1.0)', negative: 'Istnieje poligamia (0.0)' },
    state_regulates_private_life: { name: 'Ochrona Życia Prywatnego', question: 'Czy państwo uzurpuje sobie prawo do mikrozarządzania i regulacji życia prywatnego?', positive: 'Życie prywatne chronione (1.0)', negative: 'Państwo reguluje życie prywatne (0.0)' },
    family_autonomy_disappears_to_state: { name: 'Autonomia Wobec Państwa', question: 'Czy pierwotna autonomia rodziny znika całkowicie na rzecz struktur państwowych?', positive: 'Autonomia zachowana (1.0)', negative: 'Autonomia wchłonięta przez państwo (0.0)' },
    sacralization_of_life: { name: 'Desakralizacja Życia', question: 'Czy życie rodzinne opiera się na umowie i prawie, czy ulega całkowitej sakralizacji rytualnej?', positive: 'Brak totalnej sakralizacji życia (1.0)', negative: 'Sakralizacja życia (0.0)' }
  };

  const PERSONALISM_META = {
      GOD_RELATION_PERSONAL_VS_COLLECTIVE: { name: 'Osobista Relacja z Bogiem', question: 'Czy relacja z Bogiem/etyką ma charakter indywidualny i osobisty?' },
      RESPONSIBILITY_PERSONAL_VS_COLLECTIVE: { name: 'Odpowiedzialność Osobista', question: 'Czy odpowiedzialność prawna i moralna jest wyłącznie osobista (a nie zbiorowa)?' },
      CONFESSION_PERSONAL_VS_COLLECTIVE: { name: 'Osobiste Wyznanie', question: 'Czy spowiedź/wyznanie jest osobiste, a nie narzucone gromadnie?' },
      FAMILY_EMANCIPATION_FROM_CLAN: { name: 'Emancypacja z Rodu', question: 'Czy syn zostaje usamodzielniony (emancypacja rodziny) czy należy do seniora rodu?' },
      WOMAN_PERSONAL_FREEDOM: { name: 'Wolność Osobista Kobiety', question: 'Czy kobieta posiada pełną wolność osobistą (nie będąc własnością rodu ani klanu)?' },
      PRIVATE_PROPERTY_INDEPENDENCE: { name: 'Niezaleznosc przez Wlasnosc', question: 'Czy istnieje własność prywatna dająca niezależność od władzy?' },
      NEIGHBOR_DUTY_UNIVERSAL_VS_TRIBAL: { name: 'Uniwersalny Obowiązek Bliźniego', question: 'Czy obowiązek moralny wobec bliźniego ma charakter uniwersalny (dotyczy każdego człowieka)?' },
      WORK_AS_SANCTIFICATION_VS_COERCION: { name: 'Praca jako Uświęcenie', question: 'Czy pracę traktuje się jako uświęcenie i wolny wybór (a nie przymusowy ciężar)?' },
      PERSONAL_RESPONSIBILITY_PRESENCE: { name: 'Obecnosc Odpowiedzialnosci', question: 'Czy istnieje wykształcona odpowiedzialność osobista?' },
      FAMILY_EMANCIPATION_GENERAL: { name: 'Emancypacja Rodziny', question: 'Czy jest emancypacja rodziny z systemu rodowego?' },
      STATUS_BY_BIRTH_PRIVILEGE: { name: 'Brak Przywileju Urodzenia', question: 'Czy odrzuca się sztywny status społeczny wynikający wyłącznie z przywileju urodzenia?' },
      STATUS_BY_CASTE_MEMBERSHIP: { name: 'Brak Ustoju Kastowego', question: 'Czy odrzuca się ustrój kastowy uniemożliwiający osobisty rozwój jednostki?' },
      LEGAL_MONISM_PRESENCE: { name: 'Brak Monizmu (Ochrona Osoby)', question: 'Czy unika się monizmu prawnego sprowadzającego wolną osobę do roli trybiku?' },
      UNIFORMITY_MECHANICISM_PRESENCE: { name: 'Brak Mechanicyzmu Masa', question: 'Czy odrzuca się mechanicyzm traktujący personalizm i wolność jako anarchię?' },
      HISTORICISM_PRESENCE: { name: 'Historyzm', question: 'Czy jest historyzm (widzenie przodków, a nie tylko bezosobowej masy)?' },
      HEREDITARY_SURNAMES_PRESENCE: { name: 'Nazwiska Dziedziczne', question: 'Czy funkcjonują nazwiska dziedziczne?' }
    };

    const CHURCH_META = {
      hierarch_appointment: { name: 'Mianowanie Hierarchów', question: 'Czy Kościół ma wyłączne prawo mianowania biskupów?', positive: 'Niezależne mianowanie (1.0)', negative: 'Władza świecka mianuje (0.0)' },
      dogmatic_disputes: { name: 'Spory Dogmatyczne', question: 'Czy państwo nie wtrąca się w spory dogmatyczne?', positive: 'Brak ingerencji (1.0)', negative: 'Państwo rozstrzyga spory (0.0)' },
      economic_independence: { name: 'Niezawisłość Ekonomiczna', question: 'Czy Kościół ma niezawisłość ekonomiczną?', positive: 'Własne dobra (1.0)', negative: 'Państwowe pensje (0.0)' },
      moral_sanctions_on_rulers: { name: 'Sankcje Moralne', question: 'Czy Kościół może nakładać sankcje moralne na władców?', positive: 'Władca podlega moralności (1.0)', negative: 'Władca bezkarny (0.0)' },
      canon_law_separation: { name: 'Odrębność Prawa Kanonicznego', question: 'Czy prawo kanoniczne jest odrębne od świeckiego?', positive: 'Odrębne prawo (1.0)', negative: 'Zależność od biurokracji (0.0)' },
      brachium_saeculare: { name: 'Brachium Saeculare', question: 'Czy państwo jest narzędziem celów moralnych, a nie celem samym w sobie?', positive: 'Państwo jest środkiem (1.0)', negative: 'Państwo jest celem (0.0)' },
      total_ethics: { name: 'Etyka Totalna', question: 'Czy obowiązuje etyka totalna (w życiu prywatnym i publicznym)?', positive: 'Etyka totalna (1.0)', negative: 'Brak etyki w polityce (0.0)' },
      divine_vs_caesar: { name: 'Boskie i Cesarskie', question: 'Czy występuje podział na to co boskie i cesarskie?', positive: 'Istnieje podział (1.0)', negative: 'Brak podziału (0.0)' },
      personalism_presence: { name: 'Personalizm', question: 'Czy szanuje się wolność i godność osoby?', positive: 'Obecny personalizm (1.0)', negative: 'Brak personalizmu (0.0)' },
      freedom_of_conversion: { name: 'Wolność Nawracania', question: 'Czy panuje swoboda wyznania i nawracania?', positive: 'Wolność nawracania (1.0)', negative: 'Brak wolności (0.0)' },
      caesaropapism_absence: { name: 'Brak Cezaropapizmu', question: 'Czy brakuje władcy-głowy kościoła?', positive: 'Brak cezaropapizmu (1.0)', negative: 'Cezaropapizm obecny (0.0)' },
      cuius_regio_absence: { name: 'Brak Cuius Regio', question: 'Czy odrzucono zasadę cuius regio eius religio?', positive: 'Brak cuius regio (1.0)', negative: 'Cuius regio obecne (0.0)' },
      statolatry_absence: { name: 'Brak Statolatrii', question: 'Czy brak bałwochwalczego stosunku do państwa?', positive: 'Brak statolatrii (1.0)', negative: 'Statolatria obecna (0.0)' },
      sacralism_absence: { name: 'Brak Sakralizmu', question: 'Czy religia nie jest tożsama z prawem i państwowością?', positive: 'Brak sakralizmu (1.0)', negative: 'Sakralizm obecny (0.0)' },
      confessional_bureaucracy_absence: { name: 'Brak Biurokracji Wyznaniowej', question: 'Czy brakuje biurokracji nadzorującej wiarę?', positive: 'Brak nadzoru państwa (1.0)', negative: 'Biurokracja wyznaniowa (0.0)' }
    };

    const PROPERTY_META = {
      absolute_property_vs_usufruct: { name: 'Własność Bezwzględna', question: 'Czy obywatel posiada grunt na własność bezwzględną, czy jest jedynie jego użytkownikiem?', positive: 'Własność (1.0)', negative: 'Używalność (0.0)' },
      real_estate_as_ideal: { name: 'Nieruchomości jako Ideał', question: 'Czy ideałem jest mienie nieruchome dające niezawisłość duchową?', positive: 'Nieruchome (1.0)', negative: 'Ruchome / Spekulacja (0.0)' },
      neminem_captivabimus: { name: 'Neminem Captivabimus', question: 'Czy majątek jest chroniony przed arbitralną konfiskatą państwa?', positive: 'Ochrona prawna (1.0)', negative: 'Konfiskaty (0.0)' },
      family_continuity_of_property: { name: 'Ciągłość Rodzinna', question: 'Czy prawo i obyczaj sprzyjają utrzymaniu majątku w rodzinie przez pokolenia?', positive: 'Ciągłość (1.0)', negative: 'Rozdrobnienie (0.0)' },
      inheritance_as_personality_extension: { name: 'Prawo Spadkowe', question: 'Czy dziedziczenie to przedłużenie osobowości (bez wysokich podatków)?', positive: 'Brak podatków (1.0)', negative: 'Fiskalizm (0.0)' },
      official_liability: { name: 'Odpowiedzialność Urzędnicza', question: 'Czy urzędnik odpowiada za błędy własnym majątkiem?', positive: 'Odpowiedzialność (1.0)', negative: 'Ochrona państwa (0.0)' },
      ius_primi_occupantis: { name: 'Tytuł z Pracy', question: 'Czy tytuł własności wywodzi się z pracy a nie z nadania władcy?', positive: 'Praca (1.0)', negative: 'Nadanie władzy (0.0)' },
      lifelong_monogamy: { name: 'Monogamia a Własność', question: 'Czy monogamia wspiera stabilność własności prywatnej?', positive: 'Monogamia (1.0)', negative: 'Brak (0.0)' },
      son_emancipation: { name: 'Emancypacja Syna', question: 'Czy syn ma prawo do posiadania własnego majątku za życia ojca?', positive: 'Tak (1.0)', negative: 'Własność rodowa (0.0)' },
      property_in_private_law: { name: 'Własność w Prawie Prywatnym', question: 'Czy własność należy do sfery prawa prywatnego, niedostępnej dla państwa?', positive: 'Prawo prywatne (1.0)', negative: 'Ingerencja państwa (0.0)' },
      sacralization_of_property_absence: { name: 'Brak Sakralizacji Majątku', question: 'Czy unika się sakralizacji ziemi (np. przymusowych zwrotów jubileuszowych)?', positive: 'Brak sakralizacji (1.0)', negative: 'Sakralizacja (0.0)' },
      fiscalism_bureaucracy_absence: { name: 'Brak Fiskalizmu', question: 'Czy państwo unika nadmiernego fiskalizmu niszczącego rentowność?', positive: 'Brak fiskalizmu (1.0)', negative: 'Bizantynizm / fiskalizm (0.0)' },
      socialism_collectivism_absence: { name: 'Brak Kolektywizmu', question: 'Czy społeczeństwo odrzuca socjalizm i dążenie do sproletaryzowania?', positive: 'Brak socjalizmu (1.0)', negative: 'Kolektywizm (0.0)' }
    };

    const INHERITANCE_META = {
      inheritance_as_personality_extension: { name: 'Przedłużenie Osobowości', question: 'Czy dziedziczenie to naturalna kontynuacja życia rodziny?', positive: 'Przedłużenie (1.0)', negative: 'Techniczny transfer (0.0)' },
      inheritance_tax_absence: { name: 'Brak Podatków Spadkowych', question: 'Czy państwo dąży do znoszenia ciężarów podatkowych od spadków?', positive: 'Brak podatków (1.0)', negative: 'Wywłaszczanie fiskalne (0.0)' },
      majorat_or_indivisibility: { name: 'Majoraty / Niepodzielność', question: 'Czy istnieją instytucje zapobiegające rozdrobnieniu np. majoraty?', positive: 'Ochrona przed rozdrobnieniem (1.0)', negative: 'Rozdrabnianie majątku (0.0)' },
      real_estate_retention_encouraged: { name: 'Zapobieganie Rozdrobnieniu', question: 'Czy prawo zapobiega rozdrobnieniu nieruchomości?', positive: 'Utrzymanie w całości (1.0)', negative: 'Rozdrobnienie (0.0)' },
      real_estate_primary_inheritance: { name: 'Nieruchomości jako Baza', question: 'Czy dziedziczenie dotyczy przede wszystkim własności nieruchomej?', positive: 'Nieruchomości (1.0)', negative: 'Brak nieruchomości (0.0)' },
      family_estate_ideal: { name: 'Ideał Ojcowiźny', question: 'Czy ideałem jest trwanie rodziny na „ojcowiźnie”?', positive: 'Ojcobizna (1.0)', negative: 'Spekulacja (0.0)' },
      son_emancipation_before_death: { name: 'Emancypacja Syna', question: 'Czy syn posiada pełnię praw majątkowych za życia ojca?', positive: 'Tak (1.0)', negative: 'Własność rodowa (0.0)' },
      primogeniture_privilege: { name: 'Primogenitura', question: 'Czy najstarszy syn jest uprzywilejowany w spadku?', positive: 'Tak (1.0)', negative: 'Równy podział (0.0)' },
      family_emancipation_from_clan: { name: 'Wyodrębnienie z Klanu', question: 'Czy rodzina wyodrębniła się z ustroju rodowego?', positive: 'Emancypacja (1.0)', negative: 'Ustrój rodowy (0.0)' },
      lifelong_monogamy: { name: 'Dożywotnia Monogamia', question: 'Czy występuje monogamia dożywotnia wspierająca trwałość mienia?', positive: 'Monogamia (1.0)', negative: 'Poligamia / rozwody (0.0)' },
      historism_and_hereditary_surnames: { name: 'Nazwiska Dziedziczne', question: 'Czy nazwiska dziedziczne symbolizują ciągłość dziedzictwa?', positive: 'Historyzm (1.0)', negative: 'Brak nazwisk (0.0)' },
      usufruct_system_absence: { name: 'Brak Systemu Używalności', question: 'Czy brak roku jubileuszowego i czasowej używalności?', positive: 'Własność stała (1.0)', negative: 'Używalność u bóstwa (0.0)' },
      speculative_capital_absence: { name: 'Brak Dominacji Spekulacji', question: 'Czy brakuje dominacji kapitału ruchomego i spekulacyjnego?', positive: 'Brak spekulacji (1.0)', negative: 'Kapitał spekulacyjny (0.0)' },
      statolatry_absence: { name: 'Brak Statolatrii', question: 'Czy własność nie zależy od łaski najwyższego właściciela (państwa)?', positive: 'Prawo prywatne (1.0)', negative: 'Państwo właścicielem (0.0)' },
      collectivism_socialism_absence: { name: 'Brak Kolektywizmu', question: 'Czy brakuje socjalizmu dążącego do zniesienia dziedziczenia?', positive: 'Brak kolektywizmu (1.0)', negative: 'Socjalizm (0.0)' }
    };

    const MORALITY_META = {
      ethics_over_law_primacy: { name: 'Prymat etyki nad prawem', question: 'Czy prawo jest jedynie sankcją dla postulatów etycznych?' },
      total_ethics: { name: 'Etyka Totalna', question: 'Czy etyka obowiązuje w równym stopniu w życiu prywatnym i publicznym?' },
      politics_bound_by_ethics: { name: 'Polityka podlegająca moralności', question: 'Czy polityka i działania państwa muszą przestrzegać dekalogu?' },
      ethics_over_wealth_primacy: { name: 'Prymat etyki nad dobrobytem', question: 'Czy etyka ma pierwszeństwo przed interesem materialnym i gospodarką?' },
      moral_utilitarianism: { name: 'Utylitaryzm zdominowany przez moralność', question: 'Czy utylitaryzm musi być moralny, a nie moralność utylitarna?' },
      ethics_over_science_primacy: { name: 'Prymat etyki nad nauką', question: 'Czy etyka stoi ponad poszukiwaniem Prawdy (nauki) w przypadku kolizji?' },
      immoral_science_rejection: { name: 'Odrzucenie amoralnej nauki', question: 'Czy zakazuje się eksperymentów naruszających godność, jak eugenika?' },
      ethics_over_art_primacy: { name: 'Prymat etyki nad sztuką', question: 'Czy etyka stoi ponad sztuką i artyzmem?' },
      immoral_art_rejection: { name: 'Odrzucenie amoralnej sztuki', question: 'Czy nie dopuszcza się usprawiedliwiania moralnej szpetoty artyzmem?' },
      voluntarism_over_coercion: { name: 'Dobrowolność vs Przymus', question: 'Czy rozwój opiera się na dobrowolności zamiast przymusu państwowego?' },
      duty_over_obedience: { name: 'Poczucie wewnętrznego obowiązku', question: 'Czy rozwój moralny wynika z wewnętrznego obowiązku, a nie wymuszonego posłuszeństwa?' },
      conscience_as_highest_instance: { name: 'Sumienie jako najwyższa instancja', question: 'Czy najwyższą instancją dla jednostki jest jej sumienie?' },
      personal_responsibility: { name: 'Osobista odpowiedzialność', question: 'Czy dominuje odpowiedzialność osobista, a nie gromadna/zbiorowa?' },
      legalism_absence: { name: 'Brak legalizmu', question: 'Czy odrzuca się zasadę co nie jest zakazane paragrafem, jest moralnie obojętne?' },
      state_amoralism_absence: { name: 'Brak amoralizmu państwowego', question: 'Czy odrzuca się dobro państwa jako usprawiedliwienie dla łamania etyki?' }
    };

    const PUBLIC_MORALITY_META = {
      two_consciences_rejection: { name: 'Odrzucenie „dwóch sumień”', question: 'Czy uznaje się, że urzędnik, żołnierz czy poseł nie może mieć odrębnego sumienia dla spraw publicznych?' },
      state_bound_by_decalogue: { name: 'Państwo podlega dekalogowi', question: 'Czy przyrodzone prawo moralne obowiązuje państwo w tej samej mierze co jednostkę?' },
      politics_as_ethical_domain: { name: 'Polityka dziedziną etyczną', question: 'Czy panuje przekonanie, że polityka winna być oparta na etyce?' },
      unethical_law_is_lawless: { name: 'Prawo nieetyczne to bezprawie', question: 'Czy prawo sprzeczne z etyką jest uznawane za bezprawie?' },
      evil_in_name_of_state_remains_evil: { name: 'Zło państwowe to zło', question: 'Czy zło popełnione „w imieniu państwa” pozostaje złem?' },
      stricter_ethics_for_public_figures: { name: 'Surowsza etyka osób publicznych', question: 'Czy od osób publicznych wymaga się surowszej etyki niż w prywatnych sprawach?' },
      duty_to_fight_public_evil: { name: 'Obowiązek walki ze złem', question: 'Czy etyka nakłada na obywatela obowiązek czynnego przeciwstawiania się niemoralności w życiu publicznym?' },
      ethics_over_law_primacy_public: { name: 'Prymat etyki nad prawem', question: 'Czy w sprawach publicznych etyka ma wyższość nad prawem stanowionym?' },
      personal_responsibility_in_public: { name: 'Odpowiedzialność osobista', question: 'Czy w działaniach publicznych obowiązuje pełna odpowiedzialność osobista?' },
      legal_dualism_presence: { name: 'Dualizm prawny', question: 'Czy występuje dualizm prawny (prawo prywatne wyznacza granice państwowemu)?' },
      good_as_dominant_category: { name: 'Dobro jako kategoria panująca', question: 'Czy Dobro jest uznane za kategorię panującą w życiu publicznym?' },
      dual_ethics_absence: { name: 'Brak dwoistości etyki', question: 'Czy odrzuca się bizantyjską dwoistość etyki (prywatna vs państwowa)?' },
      physical_force_supremacy_absence: { name: 'Brak supremacji siły', question: 'Czy odrzuca się supremację siły fizycznej i wolę wodza jako jedyne źródło prawa?' },
      statolatry_absence: { name: 'Brak statolatrii', question: 'Czy odrzuca się deifikację państwa i statolatrię?' },
      legalism_replacing_conscience_absence: { name: 'Brak legalizmu zamiast sumienia', question: 'Czy odrzuca się sytuację, gdzie legalizm zastepuje sumienie?' },
      caesaropapism_absence: { name: 'Brak cezaropapizmu', question: 'Czy odrzuca się cezaropapizm (władza świecka nie rządzi sumieniami)?' }
    };

    const ADMIN_RESP_META = {
      personal_liability_for_damages: { name: 'Odpowiedzialność osobista', question: 'Czy urzędnik odpowiada osobiście za szkody wyrządzone obywatelowi?' },
      material_guarantee_for_reliability: { name: 'Gwarancje materialne', question: 'Czy rzetelność urzędnika jest zabezpieczona materialnie (kaucje)?' },
      single_conscience_in_public: { name: 'Jedno sumienie', question: 'Czy urzędnik podlega dekalogowi w służbie tak samo jak w życiu prywatnym?' },
      obedience_to_ethics_over_orders: { name: 'Prymat etyki nad rozkazem', question: 'Czy najwyższą instancją jest słuszność etyczna, a nie rozkaz przełożonego?' },
      official_as_legal_entity: { name: 'Urzędnik jako podmiot', question: 'Czy urzędnik posiada autonomię decyzji i ryzyko, zamiast bycia trybikiem?' },
      independent_administrative_judiciary: { name: 'Niezawisłe sądownictwo', question: 'Czy spory z urzędem rozstrzyga niezależny od administracji sąd?' },
      office_as_civic_service: { name: 'Urząd jako służba obywatelska', question: 'Czy urząd jest służbą niezależnych obywateli, a nie płatnym zawodem aparatczyków?' },
      legal_dualism_presence_admin: { name: 'Dualizm prawny', question: 'Czy prawo prywatne jest oddzielone od publicznego?' },
      personalism_in_administration: { name: 'Personalizm urzędniczy', question: 'Czy odpowiedzialność spoczywa na osobie, a nie na bezosobowym urzędzie?' },
      ethics_over_law_primacy_admin: { name: 'Prymat etyki nad prawem', question: 'Czy urzędnik nie może zasłaniać się niemoralnym przepisem?' },
      decentralization_and_self_gov: { name: 'Decentralizacja i samorząd', question: 'Czy istnieje szeroki samorząd pod bezpośrednią kontrolą społeczną?' },
      totalitarian_state_absence: { name: 'Brak państwa totalnego', question: 'Czy państwo nie jest omnipotentne (nie pożera społeczeństwa)?' },
      monism_of_public_law_absence: { name: 'Brak monizmu prawa publicznego', question: 'Czy unika się sytuacji, gdzie prawo prywatne zanika?' },
      dual_ethics_absence_admin: { name: 'Brak dwoistości etyki', question: 'Czy odrzuca się makiawelizm i wyjęcie polityki spod etyki?' },
      camp_system_absence: { name: 'Brak ustroju obozowego', question: 'Czy odrzuca się turański ustrój obozowy (wola wodza jedynym prawem)?' },
      kormlenie_system_absence: { name: 'Brak systemu kormilenia', question: 'Czy odrzuca się bizantyński system traktowania urzędu jako prywatnego łupu?' }
    };

    function buildCardsGroup(scoresObj, metaDict) {
      let html = '';
      for (const [key, val] of Object.entries(scoresObj)) {
        if (!val || typeof val !== 'object') continue;
        const score = val.score ?? 0;
        const explanation = val.explanation || '';
        const news = Array.isArray(val.news_examples) ? val.news_examples : [];
        const meta = metaDict[key] || { name: key.replace(/_/g, ' '), question: '' };
        const label = meta.name;
        const question = meta.question;
        const pct = score < 0 ? 'Brak danych' : Math.round(score * 100) + '%';
        let polarityMarker = '';
        if (score >= 0) {
            if (score > 0.5) polarityMarker = '<span style="color: #10b981; font-weight: bold; font-size: 0.65em; margin-left: 6px; vertical-align: middle;">[+ Podwyższa]</span>';
            else if (score < 0.5) polarityMarker = '<span style="color: #ef4444; font-weight: bold; font-size: 0.65em; margin-left: 6px; vertical-align: middle;">[- Obniża]</span>';
            else polarityMarker = '<span style="color: #9ca3af; font-size: 0.65em; margin-left: 6px; vertical-align: middle;">[Neutralne]</span>';
        }
        const barColor = score < 0 ? '#52525b' : `hsl(${Math.round(score * 120)}, 78%, 46%)`;
        const barWidth = score < 0 ? 0 : Math.round(score * 100);

        const newsItems = news.map(n => {
          const url = `https://www.google.com/search?q=${encodeURIComponent(n)}`;
          return `
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="news-item-link">
              <div class="news-item">
                <span>${n}</span>
                <svg class="external-link-icon" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
              </div>
            </a>
          `;
        }).join('');

        html += `
          <div class="answer-card">
            <div class="answer-head">
              <div class="answer-head-top">
                <div style="flex:1;min-width:0">
                  <div class="answer-name">${label}</div>
                  ${question ? `<div class="answer-question">${question}</div>` : ''}
                </div>
                <div style="display: flex; align-items: center; justify-content: flex-end;">
                  <span class="answer-pct" style="color:${barColor}">${pct}</span>
                  ${polarityMarker}
                </div>
                <svg class="chevron-icon" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
              <div class="progress-track">
                <div class="progress-fill" style="width:${barWidth}%;background:${barColor}"></div>
              </div>
            </div>
            <div class="answer-body">
              <p class="explanation-text">${explanation}</p>
              ${news.length > 0 ? `
                <div class="news-title">📰 Kontekst ze świata</div>
                <div class="news-list">${newsItems}</div>
              ` : ''}
            </div>
          </div>
        `;
      }
      return html;
    }

    function buildDarkHero(title, pct, statusText, customValDisplay = null) {
      const isMissing = pct < 0;
      const displayVal = isMissing ? 'N/A' : (customValDisplay !== null ? customValDisplay : `${pct}%`);
      const ringPctDisplay = isMissing ? 'N/A' : `${pct}%`;
      const displayStatus = isMissing ? 'Brak danych w tekście' : statusText;
      const C = 2 * Math.PI * 28;
      const dashOffset = isMissing ? C : C - (pct / 100) * C;
      const ringColor = isMissing ? '#52525b' : (pct >= 65 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#ef4444');

      return `
        <div class="dark-hero-card">
          <div>
            <div class="dark-hero-label">${title}</div>
            <div class="dark-hero-val" style="color: ${isMissing ? '#a1a1aa' : '#fff'}; ${customValDisplay ? 'font-size: 26px;' : ''}">${displayVal}</div>
            <div class="dark-hero-status" style="color: ${isMissing ? '#71717a' : '#a1a1aa'}">${isMissing ? '✕' : '✓'} ${displayStatus}</div>
          </div>
          <div class="dark-ring-wrap">
            <svg viewBox="0 0 68 68">
              <circle class="dark-ring-bg" cx="34" cy="34" r="28"/>
              <circle class="dark-ring-fill" cx="34" cy="34" r="28"
                stroke="${ringColor}"
                stroke-dasharray="${C}"
                stroke-dashoffset="${dashOffset}"/>
            </svg>
            <div class="dark-ring-pct" style="color: ${isMissing ? '#71717a' : '#fff'}">${ringPctDisplay}</div>
          </div>
        </div>
      `;
    }


    

    

    

    

    
    const familyHero = buildDarkHero(
      'EMANCYPACJA RODZINY',
      familyScore,
      familyScore >= 70 ? 'Wyemancypowana / Łacińska' : familyScore >= 40 ? 'Częściowo zależna' : 'Wchłonięta (ród/państwo/sakralizm)'
    );
    const personalismHero = buildDarkHero(
      'INDEKS PERSONALIZMU',
      personalismScore,
      personalismScore >= 65 ? 'Dominacja personalizmu (cyw. łacińska)' : personalismScore >= 35 ? 'Mieszanka' : 'Dominacja gromadnościowa'
    );

    const organismHero = buildDarkHero(
      'ORGANIZM VS MECHANIZM',
      organismScore,
      organismScore >= 65 ? 'Organizm (żywy i samoistny)' : organismScore >= 35 ? 'Mieszanka' : 'Mechanizm (martwy i sterowany)'
    );

    const aposterioriHero = buildDarkHero(
      'APOSTERIORI VS APRIORI',
      aposterioriScore,
      aposterioriScore >= 65 ? 'Organizm (doświadczenie z faktów)' : aposterioriScore >= 35 ? 'Mieszanka' : 'Aprioryzm (zmyślanie i inżynieria)'
    );

    const pluralismHero = buildDarkHero(
      'PLURALIZM ŹRÓDEŁ PRAWA',
      pluralismScore,
      pluralismScore >= 65 ? 'Silny pluralizm' : pluralismScore >= 35 ? 'Umiarkowany pluralizm' : 'Monizm źródeł (narzucane z góry)'
    );

    const dualismHero = buildDarkHero(
      'DUALIZM PRAWNY',
      legalDualismScore,
      legalDualismScore >= 65 ? 'Silny dualizm (państwo ograniczone)' : legalDualismScore >= 35 ? 'Umiarkowany dualizm' : 'Monizm prawny (absolutyzm państwa)'
    );

    const generaliaScores = data.raw_ratings?.generalia_scores || {};

    let ethicalCoherenceScore = data.ethical_coherence_score !== undefined ? data.ethical_coherence_score : -1;
    if (ethicalCoherenceScore < 0 && Object.keys(generaliaScores).length > 0) {
      let sum = 0;
      let count = 0;
      for (const val of Object.values(generaliaScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          sum += s;
          count++;
        }
      }
      if (count > 0) {
        ethicalCoherenceScore = sum;
      }
    }

    const generaliaDiagnosis = data.generalia_diagnosis || (ethicalCoherenceScore >= 6.0 ? 'Dominacja Szeregu Personalistycznego (Cywilizacja Łacińska)' : (ethicalCoherenceScore >= 0 && ethicalCoherenceScore <= 2.0) ? 'Dominacja Szeregu Gromadnościowego' : (ethicalCoherenceScore > 2.0) ? '⚠️ MIESZANKA TRUJĄCA (Stan acywilizacyjny / Kołobłęd etyczny)' : 'Brak danych');
    const mixtureAlert = data.mixture_alert !== undefined ? data.mixture_alert : (ethicalCoherenceScore >= 2.5 && ethicalCoherenceScore <= 5.5);

    const generaliaHero = buildDarkHero(
      'SPÓJNOŚĆ GENERALIÓW ETYKI',
      ethicalCoherenceScore >= 0 ? Math.round((ethicalCoherenceScore / 7) * 100) : -1,
      generaliaDiagnosis,
      ethicalCoherenceScore >= 0 ? `${ethicalCoherenceScore.toFixed(1)} / 7.0` : null
    );

    const dutySourceScores = data.raw_ratings?.duty_source_scores || {};
    let calcDutySourceScore = data.duty_source_personalistic_score || 0;
    if (calcDutySourceScore === 0 && Object.keys(dutySourceScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(dutySourceScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcDutySourceScore = validSum / validCount;
      }
    }
    const dutySourceScore = Math.round(calcDutySourceScore * 100);

    const dutySourceHero = buildDarkHero(
      'ŹRÓDŁO OBOWIĄZKU',
      dutySourceScore,
      dutySourceScore >= 65 ? 'Autonomiczne etyczne' : dutySourceScore >= 35 ? 'Mieszanka' : 'Zewnętrzne (przymus państwowy)'
    );

    const INDEX_DEV_FLAGS = {
      sacrality: false,
      spirit: false,
      generalia: false,
      duty_source: true,
      motivation: false,
      responsibility_type: false,
      justice_nature: false,
      conscience_status: false,
      time_mastery: false,
      work_ethos: false,
      dualism: false,
      pluralism: false,
      aposteriori: false,
      organism: false,
      personalism: false,
      family: false,
      church: false,
      property: false,
      inheritance: false,
      morality: false,
      public_morality: false,
      administrative_responsibility: false
    };

    const dutySourceCards = Object.keys(dutySourceScores).length > 0 ? buildCardsGroup(dutySourceScores, DUTY_SOURCE_META) : `
      <div id="loader-duty-source" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.duty_source ? `<button class="tab-btn active zapytaj-btn" data-target="duty_source" data-loader="loader-duty-source" data-name="Personalistyczne Źródło Obowiązku" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony</div>`}
      </div>`;

    const generaliaCards = Object.keys(generaliaScores).length > 0 ? buildCardsGroup(generaliaScores, GENERALIA_META) : `
      <div id="loader-generalia" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.generalia ? `<button class="tab-btn active zapytaj-btn" data-target="generalia" data-loader="loader-generalia" data-name="7 Generaliów Etyki" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Wyliczanie ogólne wyłączone. Testujesz poszczególne indeksy generaliów poniżej.</div>`}
      </div>
      <div class="sub-indices" style="margin-top: 30px;">
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${dutySourceHero}
          <div style="font-size: 13px; color: #9ca3af; padding: 10px 20px; margin-bottom: 5px; line-height: 1.5; text-align: center;">
             Mierzy, czy poczucie obowiązku etycznego wyprzedza prawo (szereg personalistyczny), czy wynika z przymusu zewnętrznego i okólnika (gromadnościowy).
          </div>
          <div class="section-title" style="margin-top:10px">13 Wskaźników Personalistycznego Źródła Obowiązku</div> ${dutySourceCards}
        </div>
      </div>`;


    const sacralityCards = Object.keys(sacralityScores).length > 0 ? buildCardsGroup(sacralityScores, SACRALITY_META) : `
      <div id="loader-sacrality" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.sacrality ? `<button class="tab-btn active zapytaj-btn" data-target="sacrality" data-loader="loader-sacrality" data-name="Indeks Sakralności i Duch" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

      
    const dualismCards = Object.keys(legalDualismScores).length > 0 ? buildCardsGroup(legalDualismScores, LEGAL_DUALISM_META) : `
      <div id="loader-dualism" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.dualism ? `<button class="tab-btn active zapytaj-btn" data-target="dualism" data-loader="loader-dualism" data-name="Dualizm Prawny" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;
      
    const pluralismCards = Object.keys(pluralismScores).length > 0 ? buildCardsGroup(pluralismScores, PLURALISM_META) : `
      <div id="loader-pluralism" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.pluralism ? `<button class="tab-btn active zapytaj-btn" data-target="pluralism" data-loader="loader-pluralism" data-name="Pluralizm Zródeł Prawa" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;
      
    const aposterioriCards = Object.keys(aposterioriScores).length > 0 ? buildCardsGroup(aposterioriScores, APOSTERIORI_META) : `
      <div id="loader-aposteriori" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.aposteriori ? `<button class="tab-btn active zapytaj-btn" data-target="aposteriori" data-loader="loader-aposteriori" data-name="Aposteriori vs Apriori" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;
      
    const organismCards = Object.keys(organismScores).length > 0 ? buildCardsGroup(organismScores, ORGANISM_META) : `
      <div id="loader-organism" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.organism ? `<button class="tab-btn active zapytaj-btn" data-target="organism" data-loader="loader-organism" data-name="Organizm i Personalizm" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;
      
    const personalismCards = Object.keys(personalismScores).length > 0 ? buildCardsGroup(personalismScores, PERSONALISM_META) : `
      <div id="loader-personalism" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.personalism ? `<button class="tab-btn active zapytaj-btn" data-target="personalism" data-loader="loader-personalism" data-name="Personalizm" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const familyCards = Object.keys(familyScores).length > 0 ? buildCardsGroup(familyScores, FAMILY_META) : `
      <div id="loader-family" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.family ? `<button class="tab-btn active zapytaj-btn" data-target="family" data-loader="loader-family" data-name="Autonomia Rodziny" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    // Make runPartialAnalysis accessible
    

    const sacralityHero = buildDarkHero(
      'INDEKS SAKRALNOŚCI',
      sacralityScore,
      sacralityScore >= 65 ? 'Wysoki poziom sakralizacji' : sacralityScore >= 35 ? 'Umiarkowany poziom sakralizacji' : 'Niski poziom sakralizacji'
    );

    const spiritHero = buildDarkHero(
      'SUPREMACJA DUCHA',
      spiritScore,
      spiritScore >= 65 ? 'Wysoka supremacja ducha' : spiritScore >= 35 ? 'Umiarkowany poziom supremacji' : 'Niski poziom supremacji'
    );

    const churchHero = buildDarkHero(
      'NIEZAWISŁOŚĆ KOŚCIOŁA',
      churchScore,
      churchScore >= 65 ? 'Pełna supremacja ducha' : churchScore >= 35 ? 'Częściowa niezawisłość' : 'Cezaropapizm / Statolatria'
    );

    const churchCards = Object.keys(churchScores).length > 0 ? buildCardsGroup(churchScores, CHURCH_META) : `
      <div id="loader-church" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.church ? `<button class="tab-btn active zapytaj-btn" data-target="church" data-loader="loader-church" data-name="Niezawisłość Kościoła" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const propertyHero = buildDarkHero(
      'STABILNOŚĆ WŁASNOŚCI',
      propertyScore,
      propertyScore >= 65 ? 'Stabilna własność prywatna' : propertyScore >= 35 ? 'Mieszanka / Ograniczenia' : 'Brak własności / Kolektywizm'
    );

    const propertyCards = Object.keys(propertyScores).length > 0 ? buildCardsGroup(propertyScores, PROPERTY_META) : `
      <div id="loader-property" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.property ? `<button class="tab-btn active zapytaj-btn" data-target="property" data-loader="loader-property" data-name="Stabilność Własności" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const inheritanceHero = buildDarkHero(
      'CIĄGŁOŚĆ DZIEDZICZENIA',
      inheritanceScore,
      inheritanceScore >= 65 ? 'Silna ciągłość' : inheritanceScore >= 35 ? 'Mieszanka' : 'Brak ciągłości'
    );

    const inheritanceCards = Object.keys(inheritanceScores).length > 0 ? buildCardsGroup(inheritanceScores, INHERITANCE_META) : `
      <div id="loader-inheritance" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.inheritance ? `<button class="tab-btn active zapytaj-btn" data-target="inheritance" data-loader="loader-inheritance" data-name="Ciągłość Dziedziczenia" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const moralityHero = buildDarkHero(
      'SUPREMACJA MORALNOŚCI',
      moralityScore,
      moralityScore >= 65 ? 'Etyka totalna (Cyw. Łacińska)' : moralityScore >= 35 ? 'Mieszanka' : 'Amoralizm / Legalizm'
    );

    const moralityCards = Object.keys(moralityScores).length > 0 ? buildCardsGroup(moralityScores, MORALITY_META) : `
      <div id="loader-morality" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.morality ? `<button class="tab-btn active zapytaj-btn" data-target="morality" data-loader="loader-morality" data-name="Supremacja Moralności" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const publicMoralityHero = buildDarkHero(
      'TOTALNOŚĆ MORALNOŚCI PUBLICZNEJ',
      publicMoralityScore,
      publicMoralityScore >= 65 ? 'Państwo narzędziem etyki' : publicMoralityScore >= 35 ? 'Mieszanka' : 'Państwo zwolnione z etyki / Dwa sumienia'
    );

    const publicMoralityCards = Object.keys(publicMoralityScores).length > 0 ? buildCardsGroup(publicMoralityScores, PUBLIC_MORALITY_META) : `
      <div id="loader-public_morality" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.public_morality ? `<button class="tab-btn active zapytaj-btn" data-target="public_morality" data-loader="loader-public_morality" data-name="Totalność Moralności Publicznej" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const adminRespHero = buildDarkHero(
      'ODPOWIEDZIALNOŚĆ URZĘDNICZA',
      adminRespScore,
      adminRespScore >= 65 ? 'Urzędnik jako sługa prawa' : adminRespScore >= 35 ? 'Mieszanka' : 'Biurokrata / Narzędzie gwałtu'
    );

    const adminRespCards = Object.keys(adminRespScores).length > 0 ? buildCardsGroup(adminRespScores, ADMIN_RESP_META) : `
      <div id="loader-administrative_responsibility" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.administrative_responsibility ? `<button class="tab-btn active zapytaj-btn" data-target="administrative_responsibility" data-loader="loader-administrative_responsibility" data-name="Odpowiedzialność Urzędnicza" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const spiritCards = `
      <div id="loader-spirit" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.spirit ? `<button class="tab-btn active zapytaj-btn" data-target="spirit" data-loader="loader-spirit" data-name="Supremacja Ducha (12 indeksów)" style="margin:0 auto; padding:10px 20px;">
          Wylicz Supremację Ducha (~60-90s)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>
      <div class="sub-indices" style="margin-top: 30px;">
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${dualismHero} 
          <div style="font-size: 13px; color: #9ca3af; padding: 10px 20px; margin-bottom: 5px; line-height: 1.5; text-align: center;">
             Mierzy, czy istnieje niezależne prawo prywatne obok publicznego, podlegające ocenie moralnej, a nie monizm ustalany arbitralnie przez jedną władzę.
          </div>
          <div class="section-title" style="margin-top:10px">Wskaźniki Dualizmu Prawnego</div> ${dualismCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${pluralismHero} <div class="section-title" style="margin-top:10px">Wskaźniki Pluralizmu Źródeł Prawa</div> ${pluralismCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${aposterioriHero} <div class="section-title" style="margin-top:10px">Wskaźniki Aposterioryzmu</div> ${aposterioriCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${organismHero} <div class="section-title" style="margin-top:10px">Wskaźniki Organizmu</div> ${organismCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${personalismHero} <div class="section-title" style="margin-top:10px">Wskaźniki Personalizmu</div> ${personalismCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${familyHero} <div class="section-title" style="margin-top:10px">Wskaźniki Autonomii Rodziny</div> ${familyCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${churchHero} <div class="section-title" style="margin-top:10px">Wskaźniki Niezależności Kościoła</div> ${churchCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${propertyHero} <div class="section-title" style="margin-top:10px">Wskaźniki Stabilności Własności</div> ${propertyCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${inheritanceHero} <div class="section-title" style="margin-top:10px">Wskaźniki Ciągłości Dziedziczenia</div> ${inheritanceCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${moralityHero} <div class="section-title" style="margin-top:10px">Wskaźniki Supremacji Moralności</div> ${moralityCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${publicMoralityHero} <div class="section-title" style="margin-top:10px">Wskaźniki Moralności Publicznej</div> ${publicMoralityCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${adminRespHero} <div class="section-title" style="margin-top:10px">Wskaźniki Odpowiedzialności Urzędniczej</div> ${adminRespCards}
        </div>
      </div>`;

    content.innerHTML = `
      <div class="tab-bar">
        <button class="tab-btn" id="tab-sacrality">Indeks Sakralności</button>
        <button class="tab-btn" id="tab-spirit">Supremacja Ducha</button>
        <button class="tab-btn active" id="tab-generalia">Szereg Personalistyczny</button>
      </div>

      <div id="view-sacrality" style="display:none">
        ${sacralityHero}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Mierzy, czy porządek życia zbiorowego (prawo, państwo, instytucje) posiada charakter sakralny, tzn. czy jest uznawany za święty, nietykalny i wyjęty spod krytyki moralnej i rozumowej.
        </div>
        <div class="section-title">13 Wskaźników Sakralności</div>
        ${sacralityCards}
      </div>
      <div id="view-spirit" style="display:none">
        ${spiritHero}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Supremacja Ducha to agregacja 12 podstawowych indeksów: od dualizmu prawnego po odpowiedzialność urzędniczą.
           Określa dominację sił duchowych w kształtowaniu życia zbiorowego.
        </div>
        ${spiritCards}
      </div>
      <div id="view-generalia">
        ${generaliaHero}
        ${mixtureAlert ? `
        <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: 10px; padding: 14px; margin: 15px 20px; text-align: center;">
          <div style="color: #ef4444; font-weight: 800; font-size: 15px; margin-bottom: 6px;">⚠️ ALERT MIESZANKI TRUJĄCEJ (ACYWILIZACYJNY KOŁOBŁĘD)</div>
          <div style="color: #f87171; font-size: 12px; line-height: 1.5;">
            Według metody Konecznego zrzeszenie połączyło sprzeczne generalia etyczne (${ethicalCoherenceScore} / 7.0). 
            Synkretyzm etyczny paraliżuje kulturę czynu – norma prawna pozostaje w sprzeczności z normą moralną.
          </div>
        </div>` : ''}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Siedem Niewiadomych Etyki: Obowiązek, Bezinteresowność, Odpowiedzialność, Sprawiedliwość, Sumienie, Czas i Praca.
           Ocena spójności etycznej określa czy społeczeństwo opiera się na wolności osoby (Łacińska) czy przymusie gromadnościowym.
        </div>
        <div class="section-title">7 Generaliów Etycznych (Siedem Niewiadomych)</div>
        ${generaliaCards}
      </div>
    `;

    const tabSacrality = content.querySelector('#tab-sacrality');
    const tabSpirit    = content.querySelector('#tab-spirit');
    const tabGeneralia = content.querySelector('#tab-generalia');
    const viewSacrality = content.querySelector('#view-sacrality');
    const viewSpirit    = content.querySelector('#view-spirit');
    const viewGeneralia = content.querySelector('#view-generalia');

    function switchTab(tabBtn, viewDiv) {
      [tabSacrality, tabSpirit, tabGeneralia].forEach(t => t.classList.remove('active'));
      [viewSacrality, viewSpirit, viewGeneralia].forEach(v => v.style.display = 'none');
      tabBtn.classList.add('active');
      viewDiv.style.display = 'block';
    }

    tabSacrality.addEventListener('click', () => switchTab(tabSacrality, viewSacrality));
    tabSpirit.addEventListener('click', () => switchTab(tabSpirit, viewSpirit));
    tabGeneralia.addEventListener('click', () => switchTab(tabGeneralia, viewGeneralia));

    // Bind Zapytaj buttons
    content.querySelectorAll('.zapytaj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        runAnalysis(btn.getAttribute('data-target'));
      });
    });


    const activeTabBtn = content.querySelector(`#${activeTabId}`);
    if (activeTabBtn) {
      activeTabBtn.click();
    }


    // Add Accordion expand/collapse click listeners to all answer cards
    content.querySelectorAll('.answer-card').forEach(card => {
      const head = card.querySelector('.answer-head');
      if (head) {
        head.addEventListener('click', () => {
          card.classList.toggle('expanded');
        });
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────
  function extractCleanText() {
    if (document.contentType === 'application/pdf' || window.location.pathname.toLowerCase().endsWith('.pdf')) {
      return { pdf_url: window.location.href };
    }

    const selectors = ['article','main','[role="main"]','#content','.content','.post-content','.entry-content','.article-content'];
    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText.trim().length > 400) return clean(el.innerText);
    }
    return clean(document.body.innerText);
  }

  function clean(str) {
    return str.replace(/\s+/g,' ').replace(/[\t\r\n]/g,' ').trim();
  }

  function getStorageData() {
    return new Promise(resolve => {
      chrome.storage.local.get(['backendUrl','apiKey'], data => {
        let backendUrl = data ? data.backendUrl || 'http://localhost:8005' : 'http://localhost:8005';
        if (backendUrl.includes(':8000')) {
          backendUrl = backendUrl.replace(':8000', ':8005');
          chrome.storage.local.set({ backendUrl });
        }
        resolve({ ...data, backendUrl });
      });
    });
  }

})();
