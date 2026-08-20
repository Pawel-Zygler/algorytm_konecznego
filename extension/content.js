// Koneczny Civilization Analyzer - Content Script

(function () {
  if (document.getElementById('koneczny-extension-root')) return;

  const root = document.createElement('div');
  root.id = 'koneczny-extension-root';
  root.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:999999;font-family:system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;';
  document.body.appendChild(root);

  const shadow = root.attachShadow({ mode: 'open' });

  const css = `
    :host {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
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
      width: 780px;
      max-height: 94vh;
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
      font-family: system-ui, sans-serif;
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
      font-family: system-ui, sans-serif;
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
      width: 100%;
      gap: 6px;
      margin: 16px 0;
      background: #f1f5f9;
      padding: 6px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);
      overflow: hidden;
      align-items: center;
      min-height: 50px;
    }
    .tab-btn {
      flex: 1 1 0px;
      min-width: 0;
      height: 38px;
      padding: 0 6px;
      white-space: nowrap;
      font-size: 12px;
      font-weight: 700;
      color: #64748b;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      text-overflow: ellipsis;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      user-select: none;
    }
    .tab-btn:hover {
      color: #1e293b;
      background: rgba(255, 255, 255, 0.5);
    }
    .tab-btn.active {
      background: #ffffff;
      color: #0f172a;
      font-weight: 800;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
      border: 1px solid rgba(0,0,0,0.04);
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
    .download-btn {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.35);
      padding: 5px 11px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
      font-family: inherit;
    }
    .download-btn:hover {
      background: rgba(16, 185, 129, 0.28);
      border-color: #10b981;
      color: #34d399;
    }
  `;

  let lastAnalysisResultData = null;
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
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <div class="header-title">Analiza Algorytmem Konecznego</div>
              <span style="font-size: 11px; background: #e2e8f0; color: #475569; padding: 2px 8px; border-radius: 4px; font-weight: 600;">v1.4.6</span>
              <button class="save-results-btn" id="koneczny-download-header" title="Zapisz pełny raport z wynikami analizy w formacie JSON" style="display: inline-flex; align-items: center; gap: 5px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; border: none; padding: 4px 11px; border-radius: 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; box-shadow: 0 2px 6px rgba(16,185,129,0.35); transition: all 0.2s ease;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Zapisz wyniki
              </button>
            </div>
            <div class="header-subtitle" title="Dzieła i teoria Konecznego zamienione w cyfrowe narzędzie">Metoda Historiozoficzna</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <button class="close-btn" id="koneczny-close" title="Zamknij panel">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="content" id="koneczny-content"></div>
    </div>
  `;

  shadow.appendChild(container);

  const trigger = shadow.getElementById('koneczny-trigger');
  const panel = shadow.getElementById('koneczny-panel');
  const closeBtn = shadow.getElementById('koneczny-close');
  const downloadBtn = shadow.getElementById('koneczny-download-header');
  const content = shadow.getElementById('koneczny-content');

  closeBtn.addEventListener('click', () => panel.classList.remove('open'));
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => downloadResultsJson(lastAnalysisResultData));
  }
  trigger.addEventListener('click', () => {
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
    } else {
      panel.classList.add('open');
      runAnalysis();
    }
  });

  function downloadResultsJson(data) {
    if (!data) data = window.konecznyResults || lastAnalysisResultData;
    if (!data) return;

    const rawTitle = document.title || 'analiza';
    const cleanTitle = rawTitle
      .toLowerCase()
      .replace(/[^a-z0-9a-ząćęłńóśźż]+/gi, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 40) || 'analiza_cywilizacyjna';

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `koneczny_${cleanTitle}_${dateStr}.json`;

    const exportPayload = {
      meta: {
        aplikacja: "Algorytm Konecznego - Analiza Cywilizacyjna",
        metoda: "Historiozoficzna metoda Feliksa Konecznego",
        wersja: "1.4.6",
        data_analizy: new Date().toISOString(),
        url: window.location.href,
        tytuł_strony: document.title
      },
      klasyfikacja_dashboard: {
        cywilizacja_główna: data.primary_civilization || "Łacińska",
        diagnoza_cywilizacyjna: data.civilization_diagnosis || "",
        sakralność: data.sacrality_score !== undefined ? data.sacrality_score : null,
        supremacja_ducha: data.spirit_supremacy_score !== undefined ? data.spirit_supremacy_score : null,
        etyka_7_generaliów: data.ethical_coherence_score !== undefined ? data.ethical_coherence_score : null,
        diagnoza_generaliów: data.generalia_diagnosis || "",
        chyżość_historyczna_oponowanie_czasu: data.time_mastery_efficiency_score !== undefined ? data.time_mastery_efficiency_score : (data.time_mastery_history_score !== undefined ? data.time_mastery_history_score : null),
        quincunx_pięciomian_bytu: data.quincunx_coherence_score !== undefined ? data.quincunx_coherence_score : null,
        diagnoza_quincunxa: data.quincunx_diagnosis || "",
        kłamstwo_cywilizacyjne_procent: data.civilizational_lie_percentage !== undefined ? data.civilizational_lie_percentage : null,
        diagnoza_kłamstwa: data.civilizational_lie_diagnosis || "",
        wektory_kłamstwa: data.civilizational_lie_vectors || {}
      },
      kategorie_pięciomianu_quincunx: data.quincunx_categories || {},
      surowe_oceny_indeksów: data.raw_ratings || {},
      pełne_dane_wynikowe: data
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }

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
      badge.textContent = word;
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
    window.lastAnalysisTargetIndex = targetIndexStr;
    if (trigger) trigger.classList.add('spinning');

    content.innerHTML = `
      <div class="loader" style="padding: 40px 15px; text-align: center;">
        <style>
          @keyframes spinGlowRing { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulsePortrait { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.04); } }
        </style>
        <div style="display: flex; align-items: center; justify-content: center; gap: 14px; max-width: 780px; margin: 0 auto;">
          <!-- Bubble Left: Historiosophical statements (Po lewej: te co teraz) -->
          <div style="flex: 1; min-width: 190px; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 14px; padding: 12px 14px; text-align: right; box-shadow: 0 4px 16px rgba(0,0,0,0.3); backdrop-filter: blur(6px);">
            <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #a78bfa; margin-bottom: 4px;">📜 PROFESOR BADA TEKST</div>
            <div id="loader-label-text" style="font-size: 12.5px; font-weight: 600; color: #f1f5f9; line-height: 1.4;">Profesor analizuje strukturę cywilizacyjną...</div>
          </div>

          <!-- Avatar Center (Głowa Konecznego) -->
          <div style="position: relative; width: 100px; height: 100px; flex-shrink: 0;">
            <div style="position: absolute; inset: -7px; border-radius: 50%; background: conic-gradient(from 0deg, #3b82f6, #8b5cf6, #ec4899, #3b82f6); animation: spinGlowRing 2.5s linear infinite; filter: blur(3px);"></div>
            <div style="position: absolute; inset: 0; border-radius: 50%; background: #0f172a; padding: 4px; display: flex; align-items: center; justify-content: center; z-index: 2; animation: pulsePortrait 3s ease-in-out infinite;">
              <img src="${konecznyImg}" alt="Profesor Feliks Koneczny" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.2);">
            </div>
          </div>

          <!-- Bubble Right: Gadget slogans (Kubek / Koszulka / Breloczek) -->
          <div style="flex: 1; min-width: 190px; background: rgba(30, 41, 59, 0.85); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 14px; padding: 12px 14px; text-align: left; box-shadow: 0 4px 16px rgba(0,0,0,0.3); backdrop-filter: blur(6px);">
            <div id="loader-gadget-header" style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #34d399; margin-bottom: 4px;">☕ HASŁO NA KUBEK</div>
            <div id="loader-gadget-text" style="font-size: 12.5px; font-weight: 600; color: #f1f5f9; line-height: 1.4; font-style: italic;">"Etyka przed ustawą — kawę piję z prawa prywatnego."</div>
          </div>
        </div>
      </div>
    `;

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

    const mugSlogans = [
      "\"Etyka przed ustawą — kawę piję z prawa prywatnego.\"",
      "\"Nie budź mnie bez dualizmu prawnego.\"",
      "\"Mój kubek, moja autonomia rodziny.\"",
      "\"Stres to objaw cywilizacji turańskiej.\"",
      "\"Prawda obiektywna i czarna kawa bez cukru.\"",
      "\"Statolatrii mówimy stanowcze NIE.\"",
      "\"Kawa z rana, quincunx poukładany.\"",
      "\"W tym domu obowiązuje cywilizacja łacińska.\"",
      "\"Precz z monizmem państwowym i zimną kawą!\"",
      "\"Sumienie autonomiczne, espresso bezkompromisowe.\"",
      "\"Moja chyżość historyczna: 100% po pierwszej kawie.\"",
      "\"Salus animarum suprema lex.\"",
      "\"Prawo aposterioryczne — sprawdzam temperaturę łyka.\"",
      "\"Etyka nie zna dwóch sumień, ani dwóch rodzajów kawy.\"",
      "\"Wypity łyk to kapitalizacja dorobku pokoleń.\"",
      "\"Nie dla acywilizacyjnego kołobłędu przed 9:00!\"",
      "\"Prymat etyki nad poniedziałkowym biurem.\"",
      "\"Personalizm w każdej kropli.\"",
      "\"Ten kubek chroni autonomia prawa własności.\"",
      "\"Turańskie obozownictwo zwalczam ciepłą melisą.\"",
      "\"Wolność osoby zaczyna się od porannej kawy.\"",
      "\"Zanim wydasz okólnik, daj mi wypić espresso.\"",
      "\"Słuszność etyczna ponad sztywną literą przepisu.\"",
      "\"Zero gromadności w moim biurze!\"",
      "\"Herbata czy kawa? Aposterioryczny wybór tradycji.\"",
      "\"Moja rodzina jest wyemancypowana od biurokracji.\"",
      "\"Nawet po trzeciej kawie odrzucam aprioryzm ustrojowy.\"",
      "\"Kawa bez cukru jak ustrój bez przymusu.\"",
      "\"Pora na łyk wolności i personalizmu.\"",
      "\"Łacińska kultura czynu wymaga kofeiny.\"",
      "\"Nie mieszam cywilizacji, nie mieszam kawy.\"",
      "\"Własność prywatna kubka jest nienaruszalna.\"",
      "\"Praca wolna i nieprzymuszona — z kubkiem w ręku.\"",
      "\"Nie bierz mojego kubka — to monizm prywatny!\"",
      "\"Etyczny monoteizm i świeżo mielona kawa.\"",
      "\"Zgoda na nadgodziny? Tylko przy prymacie etyki.\"",
      "\"Statolatria kończy się tam, gdzie zaczyna się czarna kawa.\"",
      "\"Mój budzik szanuje chyżość historyczną.\"",
      "\"Bezinteresowność dobra i kubek na biurku.\"",
      "\"Odrzucam kazuistykę prawniczą, wybieram espresso.\"",
      "\"Nawet w poniedziałek zachowuję autokrytykę sumienia.\"",
      "\"Uświęcenie pracy umysłowej wymaga kofeiny.\"",
      "\"Nie ma zbawienia zbiorowego, jest tylko mój kubek.\"",
      "\"Prawo odkrywane w doświadczeniu, kawa parzona z pasją.\"",
      "\"Autonomia prywatnego ogniska domowego.\"",
      "\"Żadnych apriorycznych inżynierii społecznych przed kawą!\"",
      "\"Zasada aequitas miarkuje rygor poranka.\"",
      "\"Prymat słuszności nad legalizmem.\"",
      "\"Koneczny pisał w Wilnie, ja piję w biurze.\"",
      "\"Personalizm to nie egoizm — podziel się kawą!\""
    ];

    const tshirtSlogans = [
      "\"Wytwór cywilizacji łacińskiej\"",
      "\"Prawo nie stwarza etyki. Etyka stwarza prawo.\"",
      "\"Dualizm Prawny — Ochrona Przed Państwem\"",
      "\"Zero Statolatrii. Zero Przymusu.\"",
      "\"Jestem Osobą, Nie Elementem Masy\"",
      "\"Personalizm > Zbawienie Zbiorowe\"",
      "\"Cywilizacja Łacińska: Wolność & Odpowiedzialność\"",
      "\"Nie Daj Się Wciągnąć w Acywilizacyjny Kołobłęd\"",
      "\"Moje Sumienie Jest Autonomiczne\"",
      "\"Salus Animarum Suprema Lex\"",
      "\"Aposterioryzm — Uczmy Się z Historii\"",
      "\"Sprawdzam Quincunx Bytu\"",
      "\"Stoik Łaciński w Świecie Biurokracji\"",
      "\"Stop Inżynierii Społecznej i Aprioryzmowi\"",
      "\"Etyka Prywatna = Etyka Publiczna\"",
      "\"Wolność Osoby, Autonomia Rodziny, Trwałość Własności\"",
      "\"Ustrój Obozowy? Nie ze Mną!\"",
      "\"Prawo Służy Człowiekowi, Nie Państwo Prawu\"",
      "\"Duch Ponad Materią\"",
      "\"Zwyczaj i Doświadczenie Przed Dekretem\"",
      "\"Prymat Słuszności (Aequitas) Nad Legalizmem\"",
      "\"Zrozumieć Konecznego = Zrozumieć Świat\"",
      "\"Monogamia & Własność Prywatna\"",
      "\"Nie Jestem Własnością Państwa Ani Władcy\"",
      "\"Chyżość Historyczna — Czas To Dorobek Pokoleń\"",
      "\"Bezinteresowna Kultura Czynu\"",
      "\"Etyka Nie Zna Dwóch Sumień\"",
      "\"Obrona Autonomii Ogniska Domowego\"",
      "\"Sędzia Słuszny, Nie Biurokrata\"",
      "\"Uświęcenie Pracy Wolnej\"",
      "\"Stop Kazuistyce i Manipulacji\"",
      "\"Rozpoznaję Wpływy Bizantyńskie na Odległość\"",
      "\"Nie Tylko Walka o Byt — Liczą Się Cele Wyższe\"",
      "\"Trójpodział Władzy w Sercu Łacińskim\"",
      "\"Architekt Etycznego Ładu\"",
      "\"Praca, Prawda, Piękno, Etyka, Zdrowie\"",
      "\"Precz z Państwowym Monizmem\"",
      "\"Moje Prawo Własności Jest Nienaruszalne\"",
      "\"Sprawdzam Odsetek Etyki w Twojej Ustawie\"",
      "\"Koneczny Miał Rację.\"",
      "\"Osoba Ludzka Jest Celem, Nie Środkiem\"",
      "\"Suwerenność Sumienia Przed Władzą\"",
      "\"Brak Zgody na Cezaropapizm\"",
      "\"Odpowiedzialność Osobista za Słowa i Czyny\"",
      "\"Nie Jestem Cyfrą w Statystyce Państwowej\"",
      "\"Łacińska Dwoistość Prawa\"",
      "\"Tradycja Trwania i Rozwoju\"",
      "\"Wolny Człowiek Wolnej Cywilizacji\"",
      "\"Quincunx w Rozkwicie\"",
      "\"Odpór Turańszczyźnie!\""
    ];

    const keychainSlogans = [
      "Dualizm Prawny",
      "Supremacja Ducha",
      "Quincunx Bytu",
      "Personalizm",
      "Salus Animarum",
      "Civitas Dei",
      "Chyżość Historyczna",
      "Stoik Łaciński",
      "Bez Statolatrii",
      "Prawo Prywatne",
      "Autonomia Sumienia",
      "Zero Poligamii",
      "Łaciński Ład",
      "Etyka i Prawda",
      "Nie Dla Turańszczyzny",
      "Własność Prywatna",
      "Emancypacja Rodziny",
      "Kultura Czynu",
      "Prawo Aposterioryczne",
      "Trójprawo",
      "Prymat Etyki",
      "Autonomia Rodziny",
      "Wolność Osoby",
      "Aequitas",
      "Słuszność Prawa",
      "Feliks Koneczny",
      "Metoda Indukcyjna",
      "Prawda Obiektywna",
      "Bez Aprioryzmu",
      "Łacińska Szkoła",
      "Wolność Człowieka",
      "Nienaruszalność",
      "Pięciomian Bytu",
      "Suwerenność Osoby",
      "Stop Biurokracji",
      "Słuszność Etyki",
      "Etyczny Ład",
      "Czyste Sumienie",
      "Tradycja Łacińska",
      "Civitas Romana"
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
    shuffle(mugSlogans);
    shuffle(tshirtSlogans);
    shuffle(keychainSlogans);

    let statIdx = 0;
    let questIdx = 0;
    let gadgetCycle = 0; // 0: Mug, 1: Tshirt, 2: Keychain
    let mIdx = 0, tIdx = 0, kIdx = 0;
    let sequenceCounter = 0;
    let sequenceTarget = Math.floor(Math.random() * 2) + 2; // 2 or 3

    if (window.konecznyLoadingInterval) clearInterval(window.konecznyLoadingInterval);

    window.konecznyLoadingInterval = setInterval(() => {
      const label = content.querySelector('#loader-label-text');
      const gadgetHeader = content.querySelector('#loader-gadget-header');
      const gadgetText = content.querySelector('#loader-gadget-text');

      if (label) {
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

      if (gadgetHeader && gadgetText) {
        if (gadgetCycle === 0) {
          gadgetHeader.textContent = "☕ HASŁO NA KUBEK";
          gadgetHeader.style.color = "#34d399";
          gadgetText.textContent = mugSlogans[mIdx % mugSlogans.length];
          mIdx++;
        } else if (gadgetCycle === 1) {
          gadgetHeader.textContent = "👕 HASŁO NA KOSZULKĘ";
          gadgetHeader.style.color = "#60a5fa";
          gadgetText.textContent = tshirtSlogans[tIdx % tshirtSlogans.length];
          tIdx++;
        } else {
          gadgetHeader.textContent = "🔑 BRELOCZEK (1-2 SŁOWA)";
          gadgetHeader.style.color = "#f59e0b";
          gadgetText.textContent = keychainSlogans[kIdx % keychainSlogans.length];
          kIdx++;
        }
        gadgetCycle = (gadgetCycle + 1) % 3;
      }
    }, 2800);

    try {
      const config = await getStorageData();
      window.konecznyConfig = config;
      let backendUrl = config.backendUrl || 'http://localhost:8005';
      if (backendUrl.includes(':8000')) {
        backendUrl = backendUrl.replace(':8000', ':8005');
        chrome.storage.local.set({ backendUrl });
      }
      const apiKey = config.apiKey || '';

      const pageData = extractCleanText();
      let reqBody;

      const selectedIndices = targetIndexStr ? [targetIndexStr] : (config.selectedIndices && config.selectedIndices.length > 0 ? config.selectedIndices : null);
      const mode = config.analysisMode || 'lite';

      if (pageData && pageData.pdf_url) {
        reqBody = { pdf_url: pageData.pdf_url, url: window.location.href, title: document.title, mode: mode };
        if (selectedIndices && mode === 'full') reqBody.target_indices = selectedIndices;
      } else {
        if (!pageData || pageData.length < 50) {
          throw new Error('Niewystarczająca ilość tekstu na stronie.');
        }
        reqBody = { text: pageData.substring(0, 8000), url: window.location.href, title: document.title, mode: mode };
        if (selectedIndices && mode === 'full') reqBody.target_indices = selectedIndices;
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
      window.konecznyResults = {
        ...window.konecznyResults,
        ...newData,
        raw_ratings: {
          ...(window.konecznyResults.raw_ratings || {}),
          ...(newData.raw_ratings || {})
        }
      };
      renderResults();

    } catch (err) {
      if (trigger) trigger.classList.remove('spinning');
      clearInterval(window.konecznyLoadingInterval);

      const errText = err.message || '';
      const isQuotaError = errText.includes('429') || errText.includes('Quota') || errText.includes('RESOURCE_EXHAUSTED') || errText.includes('limit');

      content.innerHTML = `
        <div style="padding: 16px; background: rgba(239, 68, 68, 0.12); border: 1px solid #ef4444; border-radius: 10px; margin: 15px; text-align: left; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);">
          <div style="font-weight: 700; color: #f87171; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            ${isQuotaError ? 'Przekroczono limit API Gemini (Quota 429)' : 'Błąd analizy danych'}
          </div>
          <div style="font-size: 13px; color: #fee2e2; line-height: 1.5; margin-bottom: 12px; font-family: monospace; white-space: pre-wrap; word-break: break-word; max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.2); padding: 8px 10px; border-radius: 6px;">
            ${errText}
          </div>
          <div style="font-size: 12px; color: #fca5a5; border-top: 1px dashed rgba(239,68,68,0.3); padding-top: 10px; line-height: 1.4;">
            <strong>Powód braku danych:</strong> ${isQuotaError ? 'Klucz Gemini API osiągnął darmowy limit zapytań (RPM/RPD). Poczekaj około 30–60 sekund na odnowienie puli i spróbuj ponownie.' : 'Sprawdź połączenie z backendem (port 8005) oraz poprawność klucza Gemini API.'}
          </div>
          <button id="retry-analysis-btn" style="margin-top: 14px; width: 100%; padding: 10px; background: #ef4444; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; transition: background 0.2s;" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
            Spróbuj ponownie
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


  function getTabForIndexKey(key) {
    if (!key) return null;
    const k = key.toLowerCase().trim();
    if (k === 'sacrality') return 'tab-sacrality';
    if (k === 'quincunx') return 'tab-quincunx';
    if (k === 'time_mastery' || k === 'chyznosc') return 'tab-chyznosc';
    if (k === 'lie' || k === 'lie_index' || k === 'civilizational_lie') return 'tab-lie';
    if (['generalia', 'duty_source', 'motivation', 'justice_nature', 'conscience_status', 'work_ethos'].includes(k)) {
      return 'tab-generalia';
    }
    if (['spirit', 'dualism', 'pluralism', 'aposteriori', 'organism', 'personalism', 'family', 'church', 'property', 'inheritance', 'morality', 'public_morality', 'administrative_responsibility'].includes(k)) {
      return 'tab-spirit';
    }
    return null;
  }

  // Global state
  window.konecznyResults = window.konecznyResults || { raw_ratings: {} };
  // ── Render ─────────────────────────────────────────────
  function renderResults() {
    if (trigger) trigger.classList.remove('spinning');
    const data = window.konecznyResults;

    // Determine active tab dynamically based on requested index or calculated/selected indices
    let activeTabId = null;

    if (window.lastAnalysisTargetIndex) {
      activeTabId = getTabForIndexKey(window.lastAnalysisTargetIndex);
    }

    if (!activeTabId && window.konecznyConfig && Array.isArray(window.konecznyConfig.selectedIndices) && window.konecznyConfig.selectedIndices.length > 0) {
      const sorted = [...window.konecznyConfig.selectedIndices].sort();
      for (const idxKey of sorted) {
        const tab = getTabForIndexKey(idxKey);
        if (tab) {
          activeTabId = tab;
          break;
        }
      }
    }

    if (!activeTabId && data.raw_ratings) {
      const rawKeys = Object.keys(data.raw_ratings).sort();
      for (const rKey of rawKeys) {
        if (Object.keys(data.raw_ratings[rKey] || {}).length > 0) {
          const cleanKey = rKey.replace('_scores', '');
          const tab = getTabForIndexKey(cleanKey);
          if (tab) {
            activeTabId = tab;
            break;
          }
        }
      }
    }

    if (!activeTabId) {
      activeTabId = 'tab-generalia';
    }


    const sacralityScore = Math.round((data.sacrality_score || 0) * 100);
    const spiritScore = Math.round((data.spirit_supremacy_score || 0) * 100);


    const legalDualismScore = Math.round((data.legal_dualism_score || 0) * 100);
    const dualismScores = data.raw_ratings?.legal_dualism_scores || {};
    const legalDualismScores = dualismScores;

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

    let calcAdminRespScore = data.administrative_responsibility_score !== undefined ? data.administrative_responsibility_score : -1;
    if ((calcAdminRespScore === 0 || calcAdminRespScore === -1) && Object.keys(adminRespScores).length > 0) {
      let validCount = 0, validSum = 0;
      for (const val of Object.values(adminRespScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) { validSum += s; validCount++; }
      }
      calcAdminRespScore = validCount > 0 ? validSum / validCount : -1;
    } else if (Object.keys(adminRespScores).length === 0) {
      calcAdminRespScore = -1;
    }
    const adminRespScore = calcAdminRespScore >= 0 ? Math.round(calcAdminRespScore * 100) : -1;

    let calcPublicMoralityScore = data.public_morality_totality_score !== undefined ? data.public_morality_totality_score : -1;
    if ((calcPublicMoralityScore === 0 || calcPublicMoralityScore === -1) && Object.keys(publicMoralityScores).length > 0) {
      let validCount = 0, validSum = 0;
      for (const val of Object.values(publicMoralityScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) { validSum += s; validCount++; }
      }
      calcPublicMoralityScore = validCount > 0 ? validSum / validCount : -1;
    } else if (Object.keys(publicMoralityScores).length === 0) {
      calcPublicMoralityScore = -1;
    }
    const publicMoralityScore = calcPublicMoralityScore >= 0 ? Math.round(calcPublicMoralityScore * 100) : -1;

    let calcMoralityScore = data.morality_supremacy_score !== undefined ? data.morality_supremacy_score : -1;
    if ((calcMoralityScore === 0 || calcMoralityScore === -1) && Object.keys(moralityScores).length > 0) {
      let validCount = 0, validSum = 0;
      for (const val of Object.values(moralityScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) { validSum += s; validCount++; }
      }
      calcMoralityScore = validCount > 0 ? validSum / validCount : -1;
    } else if (Object.keys(moralityScores).length === 0) {
      calcMoralityScore = -1;
    }
    const moralityScore = calcMoralityScore >= 0 ? Math.round(calcMoralityScore * 100) : -1;

    let calcInheritanceScore = data.inheritance_continuity_score !== undefined ? data.inheritance_continuity_score : -1;
    if ((calcInheritanceScore === 0 || calcInheritanceScore === -1) && Object.keys(inheritanceScores).length > 0) {
      let validCount = 0, validSum = 0;
      for (const val of Object.values(inheritanceScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) { validSum += s; validCount++; }
      }
      calcInheritanceScore = validCount > 0 ? validSum / validCount : -1;
    } else if (Object.keys(inheritanceScores).length === 0) {
      calcInheritanceScore = -1;
    }
    const inheritanceScore = calcInheritanceScore >= 0 ? Math.round(calcInheritanceScore * 100) : -1;





    const sacralityScores = data.raw_ratings?.sacrality_scores || {};
    const spiritScores = data.raw_ratings?.spirit_supremacy_scores || {};

    const SACRALITY_META = {
      RELIGIOUS_LAW_SUPREMACY: { name: 'Supremacja Prawa Religijnego', question: 'Czy prawo religijne dominuje nad świeckim?' },
      THEOCRATIC_AUTHORITY: { name: 'Autorytet Teokratyczny', question: 'Czy władza polityczna pochodzi z autorytetu religijnego?' },
      FAMILY_RELIGIOUS_CONTROL: { name: 'Kontrola Religijna Rodziny', question: 'Czy małżeństwo, rozwód i dziedziczenie są regulowane przez religię?' },
      RELIGIOUS_EDUCATION: { name: 'Religia w Edukacji', question: 'Czy edukacja jest wyłącznie lub dominująco religijna?' },
      PROPERTY_RELIGIOUS_CONTROL: { name: 'Kontrola Religijna Własności', question: 'Czy własność prywatna podlega normom religijnym?' },
      SACRAL_CRIMINAL_LAW: { name: 'Sakralne Prawo Karne', question: 'Czy prawo karne opiera się na nakazach religijnych (np. hudud)?' },
      RELIGIOUS_TIME_CALENDAR: { name: 'Religijny Kalendarz i Czas', question: 'Czy organizacja czasu i świąt jest wyznaczana przez religię?' },
      SCIENCE_RELIGION_FUSION: { name: 'Fuzja Nauki i Religii', question: 'Czy nauka jest podporządkowana dogmatom religijnym?' },
      ETHICS_RELIGION_IDENTITY: { name: 'Tożsamość Etyki i Religii', question: 'Czy etyka jest tożsama z nakazami religijnymi, nie ma etyki poza religią?' },
      SACRAL_ECONOMICS: { name: 'Sakralna Ekonomia', question: 'Czy działalność gospodarcza jest regulowana normami religijnymi (np. zakaz lichwy)?' },
      SOCIAL_HIERARCHY_RELIGIOUS: { name: 'Religijna Hierarchia Społeczna', question: 'Czy hierarchia społeczna (kasty, stany) jest religijnie określona?' },
      STATE_CHURCH_UNITY: { name: 'Jedność Państwa i Kościoła', question: 'Czy państwo i instytucja religijna stanowią jedność (teokracja)?' },
      APOSTASY_PUNISHMENT: { name: 'Karanie Apostazji', question: 'Czy odejście od wiary jest czynem karalnym cywilnie lub karnie?' }
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

    const MOTIVATION_META = {
      truth_for_truth_sake: { name: 'Prawda dla Prawdy', question: 'Czy Prawda i nauka są szukane bezinteresownie (dla nich samych)?', isDev: true },
      altruistic_faith: { name: 'Wiara Bezinteresowna', question: 'Czy wiara opiera się na bezinteresownej miłości (zamiast paktu "coś za coś")?', isDev: true },
      res_sacra_miser: { name: 'Zasada Res Sacra Miser', question: 'Czy uznaje się zasadę bezinteresownego wsparcia dla cierpiących?', isDev: true },
      ethical_utilitarianism: { name: 'Utylitaryzm Etyczny', question: 'Czy dążenie do zysku jest podporządkowane normie moralnej?', isDev: true },
      idealistic_public_service: { name: 'Służba dla Ideału', question: 'Czy służba publiczna pełniona jest dla Dobra wspólnego (nie dla łupu)?', isDev: true },
      art_for_beauty: { name: 'Sztuka dla Piękna', question: 'Czy twórczość artystyczna wynika z bezinteresownego pędu ku Pięknu?', isDev: true },
      voluntary_sacrifice: { name: 'Dobrowolne Poświęcenie', question: 'Czy w systemie etycznym kładzie się nacisk na wartość poświęcenia?', isDev: true },
      morality_leadership: { name: 'Etyka jako Przodowniczka', question: 'Czy etyka stoi wyżej w hierarchii niż polityka i prawo?', isDev: true },
      person_as_end: { name: 'Człowiek jako Cel', question: 'Czy człowiek traktowany jest jako podmiot i cel sam w sobie?', isDev: true },
      sanctification_of_intent: { name: 'Uświęcenie Intencji', question: 'Czy o wartości czynu decyduje wewnętrzna intencja?', isDev: true },
      no_transactional_utilitarianism: { name: 'Brak Utylitaryzmu Transakcyjnego', question: 'Czy odrzuca się kupczenie etyką dla zysku?', isDev: true },
      no_contractual_religion: { name: 'Brak Religii Kontraktowej', question: 'Czy odrzuca się traktowanie relacji z bóstwem jako prawniczego paktu?', isDev: true },
      no_totalitarian_utilitarianism: { name: 'Brak Utylitaryzmu Totalnego', question: 'Czy odrzuca się utylitaryzm zabijający wolną naukę?', isDev: true },
      no_biologism_force: { name: 'Brak Biologizmu i Etyki Siły', question: 'Czy odrzuca się elimnowanie słabych i etykę siły?', isDev: true }
    };

    const JUSTICE_NATURE_META = {
      equity_over_letter: { name: 'Słuszność Etyczna vs Litera', question: 'Czy etyczne poczucie słuszności stoi ponad martwą literą prawa?', isDev: true },
      judge_conscience_role: { name: 'Rola Sędziego i Sumienia', question: 'Czy sędzia orzeka według sumienia i poczucia słuszności?', isDev: true },
      law_from_ethics: { name: 'Wyznaczenie Prawa z Etyki', question: 'Czy prawo wywodzi się z etyki jako jej pieczęć?', isDev: true },
      no_shylock_formalism: { name: 'Brak Formalizmu Shylocka', question: 'Czy odrzuca się formalizm prawny używany do krzywdzenia?', isDev: true },
      state_under_decalogue: { name: 'Podległość Państwa Etyce', question: 'Czy ustawy państwa podlegają bezwzględnie Dekalogowi i normom moralnym?', isDev: true },
      justice_needs_mercy: { name: 'Miłosierdzie jako Korekta', question: 'Czy miłosierdzie uznaje się za niezbędną korektę sprawiedliwości?', isDev: true },
      no_legislative_elephantiasis: { name: 'Brak Elephantiasis Ustawodawczej', question: 'Czy odrzuca się skodyfikowanie wszystkiego pożerające sumienie?', isDev: true },
      good_hegemony_over_law: { name: 'Hegemonia Dobra nad Prawem', question: 'Czy uznaje się, że bezprawiem jest wszystko, co razi etykę?', isDev: true },
      aposteriori_law: { name: 'Prawo Aposterioryczne', question: 'Czy prawo wyrasta z doświadczenia historycznego społeczeństwa?', isDev: true },
      legal_dualism: { name: 'Ścisły Dualizm Prawny', question: 'Czy istnieje ścisły rozdział prawa prywatnego od publicznego?', isDev: true },
      judicial_independence: { name: 'Niezawisłość Sędziowska', question: 'Czy sądy mają prawo oceny zgodności ustawy ze słusznością?', isDev: true },
      ethics_above_law: { name: 'Prymat Etyki nad Litera Prawa', question: 'Czy odrzuca się sytuację pożerania sumienia przez przepis?', isDev: true },
      no_jewish_casuistry: { name: 'Brak Kazuistyki Żydowskiej', question: 'Czy odrzuca się sakralną kazuistykę zamiast sprawiedliwej myśli?', isDev: true },
      no_byzantine_statolatry: { name: 'Brak Bizantynizmu i Statolatrii', question: 'Czy odrzuca się przedkładanie "dobra państwa" nad etykę?', isDev: true },
      no_camp_turanian_law: { name: 'Brak Prawa Obozowego', question: 'Czy odrzuca się turański kaprys i siłę fizyczną jako prawo?', isDev: true },
      no_socialist_collectivism: { name: 'Brak Socjalistycznego Kolektywizmu', question: 'Czy odrzuca się zastępowanie sumienia wolą gromady?', isDev: true }
    };

    const CONSCIENCE_STATUS_META = {
      no_statutory_morality_only: { name: 'Odrzucenie Moralności Przepisu', question: 'Czy potępia się uznawanie się za moralnego tylko z powodu braku kolizji z przepisem?', isDev: true },
      conscience_as_supreme_judge: { name: 'Sumienie Suwerennym Sędzią', question: 'Czy sumienie uznawane jest za sędziego nad prawem stanowionym?', isDev: true },
      no_legislative_elephantiasis: { name: 'Brak Elephantiasis Ustawodawczej', question: 'Czy odrzuca się skodyfikowanie wszystkiego krępujące sumienie?', isDev: true },
      refusal_of_immoral_orders: { name: 'Odmowa Zbrodniczego Rozkazu', question: 'Czy istnieje obowiązek odmowy wykonania rozkazu sprzecznego z sumieniem?', isDev: true },
      personal_accountability_god: { name: 'Osobisty Rachunek Sumienia', question: 'Czy istnieje instytucja osobistej odpowiedzialności przed Bogiem i sumieniem?', isDev: true },
      no_shylock_formalism: { name: 'Odrzucenie Metody Shylocka', question: 'Czy odrzuca się naciąganie litery kodeksu wbrew słuszności?', isDev: true },
      ethics_above_law: { name: 'Etyka Przodowniczką Prawa', question: 'Czy prawo wywodzi się z etyki (zamiast etyki jako działu administracji)?', isDev: true },
      personalism_sovereignty: { name: 'Suwerenność Personalistyczna', question: 'Czy jednostka uznawana jest za suwerenny podmiot z wolną wolą?', isDev: true },
      good_hegemony_over_law: { name: 'Prymat Dobra nad Prawem', question: 'Czy państwo i prawo podlegają tej samej etyce co życie prywatne?', isDev: true },
      legal_dualism_privacy: { name: 'Ścisły Dualizm Prawny', question: 'Czy rozdział sfer gwarantuje obszar wolności sumienia?', isDev: true },
      aposteriori_experience: { name: 'Prawo Aposterioryczne', question: 'Czy prawo wyrasta z doświadczenia i etyki społecznej?', isDev: true },
      no_casuistry_expropriation: { name: 'Brak Wywłaszczenia Kazuistyką', question: 'Czy odrzuca się zastępowanie osobistego sumienia kazuistyką?', isDev: true },
      no_byzantine_statolatry: { name: 'Brak Bizantynizmu i Statolatrii', question: 'Czy odrzuca się mrok prawny biurokracji zwalniający z myślenia?', isDev: true },
      no_socialist_gregarious_fear: { name: 'Brak Lęku Przed Gromadą', question: 'Czy odrzuca się zastępowanie sumienia bojaźnią przed gromadą?', isDev: true },
      no_camp_turanian_coercion: { name: 'Brak Turańskiego Przymusu', question: 'Czy odrzuca się wolę wodza i przymus znoszący odpowiedzialność?', isDev: true }
    };

    const TIME_MASTERY_META = {
      scientific_chronology: { name: 'Naukowa Chronologia i Era', question: 'Czy liczenie lat jest precyzyjne, naukowe i powszechne?', isDev: true },
      active_critical_tradition: { name: 'Tradycja Czynna i Krytyczna', question: 'Czy społeczeństwo potrafi przesiewać spuściznę przodków dla postępu?', isDev: true },
      hereditary_surnames: { name: 'Nazwiska Dziedziczne', question: 'Czy jednostka uznaje się za ogniwo w paśmie pokoleń (historyzm prywatny)?', isDev: true },
      term_discipline: { name: 'Pojęcie Terminu i Punktualności', question: 'Czy wyznaczanie i dotrzymywanie terminów służy opanowywaniu losu?', isDev: true },
      capitalization_of_time: { name: 'Kapitalizowanie Czasu', question: 'Czy przekazuje się dorobek pokoleń zamiast zaczynania od zera (ab ovo)?', isDev: true },
      sub_specie_aeternitatis: { name: 'Działanie Sub Specie Aeternitatis', question: 'Czy podejmuje się wysiłki wykraczające poza własny zgon?', isDev: true },
      time_rich_language: { name: 'Bogactwo Pojęć Czasowych', question: 'Czy język pozwala na precyzyjne planowanie i wyznaczanie relacji czasowych?', isDev: true },
      historicism_national_consciousness: { name: 'Poczucie Narodowe na Historyzmie', question: 'Czy jedność zrzeszenia wynika ze świadomości historycznej?', isDev: true },
      dated_documentation: { name: 'Datowana Dokumentacja', question: 'Czy dokumenty są systematycznie datowane z wrażliwością na chronologię?', isDev: true },
      latin_historicism_unique: { name: 'Historyzm Cywilizacji Łacińskiej', question: 'Czy obecna jest unikalna dla Łaciny kultura czynu i oszczędność czasu?', isDev: true },
      generational_voluntary_synthesis: { name: 'Dobrowolna Synteza Pokoleń', question: 'Czy pokolenia łączą się dobrowolnie wokół wspólnego celu duchowego?', isDev: true },
      family_emancipation_workshop: { name: 'Rodzina Warsztatem Historyzmu', question: 'Czy wyodrębniona rodzina stanowi warsztat trwałego historyzmu prywatnego?', isDev: true },
      truth_and_goodness_cult: { name: 'Kult Prawdy i Dobra', question: 'Czy przeszłość bada się krytycznie nie bojąc się wytykać błędów przodków?', isDev: true },
      no_sacral_passive_stagnation: { name: 'Brak Sakralnego Zastoju', question: 'Czy odrzuca się bierną tradycję sakralną w której nic się nie zmienia?', isDev: true },
      no_turanian_camp_presentism: { name: 'Brak Uwięzienia w Teraźniejszości', question: 'Czy odrzuca się obozową teraźniejszość i niszczenie ciągłości moralnej?', isDev: true }
    };

    const WORK_ETHOS_META = {
      manual_work_dignity: { name: 'Godność Pracy Fizycznej', question: 'Czy praca fizyczna jest uznawana za godną człowieka wolnego?', isDev: true },
      ethical_duty_of_work: { name: 'Etyczny Obowiązek Pracy', question: 'Czy próżniactwo jest potępiane ("Kto nie pracuje, niech nie je")?', isDev: true },
      work_as_sanctification: { name: 'Praca jako Uświęcenie', question: 'Czy rzetelny wysiłek podnosi wartość osoby w oczach Boga i ludzi?', isDev: true },
      no_status_laziness: { name: 'Brak Próżniactwa Reprezentacyjnego', question: 'Czy potępia się kult zewnętrznych oznak niepracowania?', isDev: true },
      voluntary_work_for_common_good: { name: 'Dobrowolność Pracy dla Dobra', question: 'Czy wysiłek podejmuje się z własnej woli dla dobra wspólnego?', isDev: true },
      craft_creativity_innovation: { name: 'Kreatywność i Innowacyjność Rzemiosła', question: 'Czy szacunek dla pracownika umożliwia rozwój techniki i Logosu?', isDev: true },
      moral_duty_of_prosperity: { name: 'Zamożność Obowiązkiem Moralnym', question: 'Czy zdobywanie dobrobytu pracą służy miłosierdziu i cnocie?', isDev: true },
      work_sub_specie_aeternitatis: { name: 'Praca Sub Specie Aeternitatis', question: 'Czy praca przekazuje dorobek i plony przyszłym pokoleniom?', isDev: true },
      no_bureaucratic_exploitation: { name: 'Brak Wyzysku Biurokratycznego', question: 'Czy praca buduje materialną niezależność osoby?', isDev: true },
      christian_postulate_of_work: { name: 'Chrześcijański Postulat Pracy', question: 'Czy praca traktowana jest jako narzędzie doskonalenia duszy?', isDev: true },
      person_dignity_in_work: { name: 'Personalistyczna Godność Pracownika', question: 'Czy godność pracownika prowadzi do zniesienia poddaństwa?', isDev: true },
      harmony_logos_ethos_in_work: { name: 'Harmonia Logosu i Ethosu', question: 'Czy wysiłek fizyczny podporządkowano rozumnemu planowaniu?', isDev: true },
      no_contempt_for_physical_work: { name: 'Brak Pogardy dla Pracy', question: 'Czy odrzuca się jawną pogardę dla pracy fizycznej?', isDev: true },
      no_totalitarian_forced_labor: { name: 'Brak Pracy Przymusowej', question: 'Czy odrzuca się turańsko-bizantyński przymus kastowy oraz marksizm?', isDev: true }
    };

    const QUINCUNX_META = {
      ethics_totality_public_private: { name: 'I. DOBRO: Etyka Totalna (Prywatna i Publiczna)', question: 'Czy ta sama moralność obowiązuje w życiu prywatnym, jak i w polityce i urzędzie (brak dwóch sumień)?', isDev: true },
      good_above_law_force: { name: 'I. DOBRO: Prymat Etyki nad Prawem i Siłą', question: 'Czy uznaje się, że prawo sprzeczne z etyką jest bezprawiem, a utylitaryzm winien być etyczny?', isDev: true },
      personal_moral_accountability: { name: 'I. DOBRO: Osobista Odpowiedzialność przed Bogiem/Sumieniem', question: 'Czy jednostka odpowiada za czyny, myśli i mowy przed sumieniem i Bogiem, a nie tylko paragrafem?', isDev: true },
      natural_truth_pure_science: { name: 'II. PRAWDA: Prawda Przyrodzona i Bezinteresowna Nauka', question: 'Czy nauka jest uprawiana jako bezinteresowne dociekanie Prawdy, a nie tylko pożytek techniczny?', isDev: true },
      academic_educational_freedom: { name: 'II. PRAWDA: Swoboda Badań i Oświaty', question: 'Czy badania naukowe i oświata są wolne od cenzury ideologicznej, religijnej lub państwowej?', isDev: true },
      public_scientific_health_duty: { name: 'III. ZDROWIE: Piecza o Zdrowie Obowiązkiem Publicznym', question: 'Czy ochrona zdrowia opiera się na naukowej medycynie i higienie publicznej (zamiast sakralizmu/rytuału)?', isDev: true },
      res_sacra_miser_ethics: { name: 'III. ZDROWIE: Zasada Res Sacra Miser i Etyka Medyczna', question: 'Czy uznaje się cierpiącego za świętość (res sacra miser), a medycyna współpracuje z etyką?', isDev: true },
      individual_hereditary_property: { name: 'IV. DOBROBYT: Własność Indywidualna i Dziedziczna', question: 'Czy gospodarka opiera się na własności osobistej i rodzinnie dziedzicznej (vs kolektywizm/despocja)?', isDev: true },
      honest_prosperity_duty: { name: 'IV. DOBROBYT: Uczciwa Zamożność Obowiązkiem Moralnym', question: 'Czy uznaje się, że uczciwy dobrobyt ułatwia praktykowanie cnót i wspiera oświatę?', isDev: true },
      beauty_allegory_of_good: { name: 'V. PIĘKNO: Piękno Alegorią i Uduchowieniem Dobra', question: 'Czy sztuka dąży do wyrażania ideałów moralnych i uduchowienia (vs czysta zmysłowość/użyteczność)?', isDev: true },
      full_artistic_freedom: { name: 'V. PIĘKNO: Pełna Swoboda Twórcza w Sztuce', question: 'Czy zrzeszenie dopuszcza pełną swobodę we wszystkich dziedzinach sztuki (plastyka, muzyka, poezja)?', isDev: true }
    };

    const HEALTH_META = {
      public_scientific_health_duty: { name: 'Piecza o Zdrowie Obowiązkiem Publicznym', question: 'Czy ochrona zdrowia opiera się na przyrodzonej nauce i medycynie (zamiast sakralizmu/rytuału)?', isDev: true },
      res_sacra_miser_ethics: { name: 'Zasada Res Sacra Miser i Etyka Medyczna', question: 'Czy obowiązuje zasada res sacra miser (cierpiący bliźni jest świętością)?', isDev: true },
      patient_person_dignity: { name: 'Godność i Sumienie Pacjenta', question: 'Czy medycyna szanuje godność i sumienie pacjenta jako wolnej osoby?', isDev: true },
      rejection_of_medical_killing: { name: 'Odrzucenie Zabójstwa Medycznego', question: 'Czy odrzuca się eutanazję i eugenikę na rzecz bezwzględnej ochrony życia?', isDev: true },
      independent_medical_profession: { name: 'Autonomia Samorządu Lekarskiego', question: 'Czy istnieje samorząd i instytucja lekarska niepodporządkowana biurokracji państwowej?', isDev: true },
      public_hygiene_and_sanitation: { name: 'Higiena Publiczna i Sanitariaty', question: 'Czy państwo dba o czystość środowiska, wodociągi i higienę publiczną z motywów etycznych?', isDev: true },
      no_body_exploitation: { name: 'Brak Wyzysku Ciała Ludzkiego', question: 'Czy odrzuca się traktowanie ciała jako przedmiotu wyzysku lub eksperymentów?', isDev: true },
      physician_conscience_clause: { name: 'Klauzula Sumienia Lekarza', question: 'Czy lekarz ma autonomiczną swobodę wyboru leczenia zgodną z wiedzą i sumieniem?', isDev: true },
      non_discriminatory_care: { name: 'Niedyskryminacyjna Opieka Medyczna', question: 'Czy pomoc medyczna jest dostępna bez dyskryminacji kastowej czy majątkowej?', isDev: true },
      rational_disease_prevention: { name: 'Racjonalna Profilaktyka Medyczna', question: 'Czy odrzuca się zabobony i magię na rzecz racjonalnej profilaktyki medycznej?', isDev: true }
    };

    const TRUTH_SCIENCE_META = {
      pure_disinterested_truth: { name: 'Bezinteresowne Dociekanie Prawdy', question: 'Czy Prawda jest szukana bezinteresownie dla niej samej (jako wartość autonomiczna)?', isDev: true },
      academic_research_freedom: { name: 'Wolność Badań Naukowych', question: 'Czy badania naukowe są wolne od cenzury ideologicznej, państwowej i religijnej?', isDev: true },
      aposteriori_empirical_science: { name: 'Aposterioryzm i Doświadczenie', question: 'Czy akceptuje się aposterioryczne doświadczenie przyrodzone w badaniu świata?', isDev: true },
      state_monopoly_free_education: { name: 'Oświata Wolna od Monopolu Państwa', question: 'Czy oświata i szkolnictwo są wolne od monopolu i ideologizacji państwowej?', isDev: true },
      truth_above_authority: { name: 'Prawda ponad Władzą i Autorytetem', question: 'Czy dopuszcza się krytykę i kwestionowanie dogmatów władzy w imię Prawdy?', isDev: true },
      no_utilitarian_reductionism: { name: 'Odrzucenie Redukcjonizmu Utylitarnego', question: 'Czy odrzuca się pragmatyzm sprowadzający naukę tylko do wynalazków technicznych?', isDev: true },
      free_academic_speech: { name: 'Wolność Słowa w Kulturze Akademickiej', question: 'Czy kultura akademicka szanuje wolność słowa i wolną debatę naukową?', isDev: true },
      logos_and_logic_in_science: { name: 'Logos i Logika w Nauce', question: 'Czy nauka opiera się na rozumnym planowaniu i logice (Logos)?', isDev: true },
      preservation_of_sources: { name: 'Rzetelna Ochrona Źródeł i Faktów', question: 'Czy dokumentacja naukowa i faktograficzna jest rzetelnie gromadzona i chroniona?', isDev: true },
      rejection_of_historical_revisionism: { name: 'Odrzucenie Fałszowania Historii', question: 'Czy odrzuca się fałszowanie historii na rzecz obiektywnej prawdy dziejowej?', isDev: true }
    };

    const BEAUTY_ART_META = {
      beauty_allegory_of_good: { name: 'Piękno Alegorią i Uduchowieniem Dobra', question: 'Czy Piękno jest traktowane jako alegoria i uduchowienie Dobra oraz Prawdy?', isDev: true },
      full_artistic_freedom: { name: 'Pełna Swoboda Twórcza w Sztuce', question: 'Czy istnieje pełna swoboda twórcza we wszystkich dziedzinach sztuki (plastyka, muzyka, poezja)?', isDev: true },
      rejection_of_aniconism: { name: 'Odrzucenie Anikonizmu i Zakazów Sakralnych', question: 'Czy odrzuca się zakazy sakralne krępujące przedstawianie postaci ludzkiej?', isDev: true },
      uplifting_aesthetic_ideals: { name: 'Uduchowiające Ideały Estetyczne', question: 'Czy sztuka dąży do harmonii i wyniesienia ducha (vs kult brzydoty i destrukcji)?', isDev: true },
      craftsmanship_aesthetic_spiritualization: { name: 'Uduchowienie Materiału w Rzemiośle', question: 'Czy rzemiosło i architektura łączą użyteczność z uduchowieniem materiału?', isDev: true },
      protection_of_aesthetic_heritage: { name: 'Ochrona Dziedzictwa Estetycznego', question: 'Czy zabytki i dorobek estetyczny przodków są chronione z szacunku dla historyzmu?', isDev: true },
      independent_artistic_patronage: { name: 'Niezależny Mecenat Artystyczny', question: 'Czy mecenat artystyczny jest wolny od dyktatu biurokracji politycznej?', isDev: true },
      art_serving_person_not_state: { name: 'Sztuka w Służbie Osobie (vs Statolatria)', question: 'Czy sztuka służy rozwojowi wolnej osoby, a nie propagowaniu statolatrii?', isDev: true },
      moral_sensitivity_in_art: { name: 'Wrażliwość Moralna w Sztuce', question: 'Czy wolność estetyczna szanuje uniwersalną wrażliwość moralną zrzeszenia?', isDev: true },
      universal_access_to_culture: { name: 'Powszechny Dostęp do Kultury Estetycznej', question: 'Czy kultura estetyczna jest powszechnie dostępna dla wszystkich stanów społecznych?', isDev: true }
    };

    const SPIRIT_META = {
      LEGAL_DUALISM_INDEX: { name: 'Indeks Dualizmu Prawnego', question: 'Czy państwo uznaje niezależną sferę praw prywatnych jednostki?' },
      LAW_SOURCE_PLURALISM_INDEX: { name: 'Pluralizm Źródeł Prawa', question: 'Czy istnieje wolność stanowienia prawa zwyczajowego i lokalnego?' },
      APOSTERIORI_APRIORI_INDEX: { name: 'Prawo Aposterioryczne vs Apriori', question: 'Czy prawo wyrasta z doświadczenia społeczeństwa (aposteriori)?' },
      ORGANISM_MECHANISM_INDEX: { name: 'Organizm vs Mechanizm', question: 'Czy społeczeństwo traktowane jest jako organizm czy mechanizm?' },
      PERSONALISM_INDEX: { name: 'Indeks Personalizmu', question: 'Czy człowiek jest traktowany podmiotowo i unikalnie?' },
      FAMILY_LAW_AUTONOMY_INDEX: { name: 'Autonomia Prawa Rodzinnego', question: 'Czy rodzina ma autonomiczną sferę niezależną od państwa?' },
      CHURCH_INDEPENDENCE_INDEX: { name: 'Niezależność Kościoła', question: 'Czy instytucje duchowe są wolne od kontroli państwa?' },
      PROPERTY_RIGHTS_STABILITY_INDEX: { name: 'Trwałość Prawa Własności', question: 'Czy własność prywatna jest bezwzględnie chroniona?' },
      INHERITANCE_CONTINUITY_INDEX: { name: 'Ciągłość Dziedziczenia', question: 'Czy dziedziczenie odbywa się swobodnie w rodzinie?' },
      MORALITY_SUPREMACY_INDEX: { name: 'Nadrzędność Moralności', question: 'Czy polityka i prawo podlegają uniwersalnej etyce?' },
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
                <div class="news-title">Kontekst ze świata</div>
                <div class="news-list">${newsItems}</div>
              ` : ''}
            </div>
          </div>
        `;
      }
      return html;
    }

    function buildDarkHero(title, pct, statusText, customValDisplay = null, description = null) {
      const isMissing = pct < 0;
      const displayVal = isMissing ? 'N/A' : (customValDisplay !== null ? customValDisplay : `${pct}%`);
      const ringPctDisplay = isMissing ? 'N/A' : `${pct}%`;
      const displayStatus = isMissing ? 'Brak danych w tekście' : statusText;
      const C = 2 * Math.PI * 28;
      const dashOffset = isMissing ? C : C - (pct / 100) * C;
      const ringColor = isMissing ? '#52525b' : (pct >= 65 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#ef4444');

      return `
        <div class="dark-hero-card">
          <div style="flex: 1; padding-right: 12px;">
            <div class="dark-hero-label">${title}</div>
            ${description ? `<div class="dark-hero-desc" style="font-size: 11px; color: #94a3b8; margin-top: 3px; margin-bottom: 8px; line-height: 1.35; max-width: 250px;">${description}</div>` : ''}
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
      familyScore >= 70 ? 'Wyemancypowana / Łacińska' : familyScore >= 40 ? 'Częściowo zależna' : 'Wchłonięta (ród/państwo/sakralizm)',
      null,
      'Mierzy autonomię i wolność rodziny od bezpośredniej ingerencji i wszechwładzy państwa lub rodu.'
    );
    const personalismHero = buildDarkHero(
      'INDEKS PERSONALIZMU',
      personalismScore,
      personalismScore >= 65 ? 'Dominacja personalizmu (cyw. łacińska)' : personalismScore >= 35 ? 'Mieszanka' : 'Dominacja gromadnościowa',
      null,
      'Mierzy podmiotowość i uznanie niepowtarzalnej wartości każdej osoby ludzkiej ponad gromadą.'
    );

    const organismHero = buildDarkHero(
      'ORGANIZM VS MECHANIZM',
      organismScore,
      organismScore >= 65 ? 'Organizm (żywy i samoistny)' : organismScore >= 35 ? 'Mieszanka' : 'Mechanizm (martwy i sterowany)',
      null,
      'Mierzy, czy społeczeństwo traktowane jest jako żywy organizm z wolną inicjatywą, czy sterowany mechanizm.'
    );

    const aposterioriHero = buildDarkHero(
      'APOSTERIORI VS APRIORI',
      aposterioriScore,
      aposterioriScore >= 65 ? 'Organizm (doświadczenie z faktów)' : aposterioriScore >= 35 ? 'Mieszanka' : 'Aprioryzm (zmyślanie i inżynieria)',
      null,
      'Mierzy, czy prawo wyrasta z doświadczenia i faktów (aposteriori), czy z apriorycznych schematów.'
    );

    const pluralismHero = buildDarkHero(
      'PLURALIZM ŹRÓDEŁ PRAWA',
      pluralismScore,
      pluralismScore >= 65 ? 'Silny pluralizm' : pluralismScore >= 35 ? 'Umiarkowany pluralizm' : 'Monizm źródeł (narzucane z góry)',
      null,
      'Mierzy wolność stanowienia prawa zwyczajowego, lokalnego i samorządowego.'
    );

    const dualismHero = buildDarkHero(
      'DUALIZM PRAWNY',
      legalDualismScore,
      legalDualismScore >= 65 ? 'Silny dualizm (państwo ograniczone)' : legalDualismScore >= 35 ? 'Umiarkowany dualizm' : 'Monizm prawny (absolutyzm państwa)',
      null,
      'Mierzy niezależną sferę praw prywatnych jednostki stojącą obok prawa publicznego.'
    );

    const generaliaScores = data.raw_ratings?.generalia_scores || {};

    let ethicalCoherenceScore = (data.ethical_coherence_score !== undefined && data.ethical_coherence_score >= 0) ? data.ethical_coherence_score : -1;
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
      if (count === 7) {  // Require all 7 generalia indicators
        ethicalCoherenceScore = sum;
      }
    }

    const generaliaDiagnosis = ethicalCoherenceScore >= 0
      ? (data.generalia_diagnosis || (ethicalCoherenceScore >= 6.0 ? 'Dominacja Szeregu Personalistycznego (Cywilizacja Łacińska)' : (ethicalCoherenceScore <= 2.0) ? 'Dominacja Szeregu Gromadnościowego' : '⚠️ MIESZANKA TRUJĄCA (Stan acywilizacyjny / Kołobłęd etyczny)'))
      : 'Brak danych w tekście (niezaznaczony indeks generaliów)';

    const generaliaHero = buildDarkHero(
      'SPÓJNOŚĆ GENERALIÓW ETYKI',
      ethicalCoherenceScore >= 0 ? Math.round((ethicalCoherenceScore / 7) * 100) : -1,
      generaliaDiagnosis,
      ethicalCoherenceScore >= 0 ? `${ethicalCoherenceScore.toFixed(1)} / 7.0` : null,
      'Siedem Niewiadomych Etyki (Krok 3). Wymaga pełnego wyliczenia generaliów.'
    );

    const mixtureAlert = data.mixture_alert !== undefined ? data.mixture_alert : (ethicalCoherenceScore >= 2.5 && ethicalCoherenceScore <= 5.5);
    const mixtureAlertHtml = mixtureAlert ? `
      <div style="background: rgba(239, 68, 68, 0.15); border: 2px solid #ef4444; border-radius: 10px; padding: 14px; margin: 15px 20px; text-align: center;">
        <div style="color: #ef4444; font-weight: 800; font-size: 15px; margin-bottom: 6px;">ALERT MIESZANKI TRUJĄCEJ (ACYWILIZACYJNY KOŁOBŁĘD)</div>
        <div style="color: #f87171; font-size: 12px; line-height: 1.5;">
          Według metody Konecznego zrzeszenie połączyło sprzeczne generalia etyczne (${ethicalCoherenceScore} / 7.0). 
          Synkretyzm etyczny paraliżuje kulturę czynu – norma prawna pozostaje w sprzeczności z normą moralną.
        </div>
      </div>` : '';

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

    const motivationScores = data.raw_ratings?.motivation_scores || {};
    let calcMotivationScore = data.motivation_altruism_score || 0;
    if (calcMotivationScore === 0 && Object.keys(motivationScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(motivationScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcMotivationScore = validSum / validCount;
      }
    }
    const motivationScore = Math.round(calcMotivationScore * 100);

    const motivationHero = buildDarkHero(
      'MOTYWACJA I BEZINTERESOWNOŚĆ',
      motivationScore,
      motivationScore >= 65 ? 'Bezinteresowność (świętość Logosu)' : motivationScore >= 35 ? 'Mieszanka' : 'Utylitaryzm transakcyjny'
    );

    const justiceNatureScores = data.raw_ratings?.justice_nature_scores || {};
    let calcJusticeNatureScore = data.justice_equity_score || 0;
    if (calcJusticeNatureScore === 0 && Object.keys(justiceNatureScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(justiceNatureScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcJusticeNatureScore = validSum / validCount;
      }
    }
    const justiceNatureScore = Math.round(calcJusticeNatureScore * 100);

    const justiceNatureHero = buildDarkHero(
      'NATURA SPRAWIEDLIWOŚCI',
      justiceNatureScore,
      justiceNatureScore >= 65 ? 'Etyczne Poczucie Słuszności' : justiceNatureScore >= 35 ? 'Mieszanka' : 'Bezduszny Legalizm / Przepis'
    );

    const conscienceStatusScores = data.raw_ratings?.conscience_status_scores || {};
    let calcConscienceStatusScore = data.conscience_autonomous_score || 0;
    if (calcConscienceStatusScore === 0 && Object.keys(conscienceStatusScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(conscienceStatusScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcConscienceStatusScore = validSum / validCount;
      }
    }
    const conscienceStatusScore = Math.round(calcConscienceStatusScore * 100);

    const conscienceStatusHero = buildDarkHero(
      'STATUS SUMIENIA',
      conscienceStatusScore,
      conscienceStatusScore >= 65 ? 'Autonomia (suwerenny sędzia)' : conscienceStatusScore >= 35 ? 'Mieszanka' : 'Heteronomia (okólnik / przepis)'
    );

    const timeMasteryScores = data.raw_ratings?.time_mastery_scores || {};
    let calcTimeMasteryScore = data.time_mastery_history_score || 0;
    if (calcTimeMasteryScore === 0 && Object.keys(timeMasteryScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(timeMasteryScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcTimeMasteryScore = validSum / validCount;
      }
    }
    const timeMasteryScore = Math.round(calcTimeMasteryScore * 100);

    const timeMasteryHero = buildDarkHero(
      'OPANOWANIE CZASU I HISTORYZM',
      timeMasteryScore,
      timeMasteryScore >= 65 ? 'Czynne Opanowanie Czasu (Historyzm / Łacina)' : timeMasteryScore >= 35 ? 'Mieszanka' : 'Bierne Czasomiernictwo / Wegetacja'
    );

    const workEthosScores = data.raw_ratings?.work_ethos_scores || {};
    let calcWorkEthosScore = data.work_ethos_sanctification_score || 0;
    if (calcWorkEthosScore === 0 && Object.keys(workEthosScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(workEthosScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcWorkEthosScore = validSum / validCount;
      }
    }
    const workEthosScore = Math.round(calcWorkEthosScore * 100);

    const workEthosHero = buildDarkHero(
      'ETHOS PRACY',
      workEthosScore,
      workEthosScore >= 65 ? 'Uświęcenie Pracy (Kultura Czynu / Łacina)' : workEthosScore >= 35 ? 'Mieszanka' : 'Jarzmo Niewolnicze / Pogarda dla Pracy'
    );

    const userSelected = (window.konecznyConfig && window.konecznyConfig.selectedIndices) || [];
    const hasUserSelected = Array.isArray(userSelected) && userSelected.length > 0;

    const isIdxEnabled = () => true;

    const INDEX_DEV_FLAGS = {
      sacrality: isIdxEnabled('sacrality'),
      spirit: isIdxEnabled('spirit'),
      generalia: isIdxEnabled('generalia'),
      duty_source: isIdxEnabled('duty_source'),
      motivation: isIdxEnabled('motivation'),
      justice_nature: isIdxEnabled('justice_nature'),
      conscience_status: isIdxEnabled('conscience_status'),
      time_mastery: isIdxEnabled('time_mastery'),
      work_ethos: isIdxEnabled('work_ethos'),
      quincunx: isIdxEnabled('quincunx'),
      health: isIdxEnabled('health'),
      truth_science: isIdxEnabled('truth_science'),
      beauty_art: isIdxEnabled('beauty_art'),
      civilizational_lie: isIdxEnabled('civilizational_lie'),
      dualism: isIdxEnabled('dualism'),
      pluralism: isIdxEnabled('pluralism'),
      aposteriori: isIdxEnabled('aposteriori'),
      organism: isIdxEnabled('organism'),
      personalism: isIdxEnabled('personalism'),
      family: isIdxEnabled('family'),
      church: isIdxEnabled('church'),
      property: isIdxEnabled('property'),
      inheritance: isIdxEnabled('inheritance'),
      morality: isIdxEnabled('morality'),
      public_morality: isIdxEnabled('public_morality'),
      administrative_responsibility: isIdxEnabled('administrative_responsibility')
    };

    const conscienceStatusCards = Object.keys(conscienceStatusScores).length > 0 ? buildCardsGroup(conscienceStatusScores, CONSCIENCE_STATUS_META) : `
      <div id="loader-conscience-status" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.conscience_status ? `<button class="tab-btn active zapytaj-btn" data-target="conscience_status" data-loader="loader-conscience-status" data-name="Status Sumienia" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony</div>`}
      </div>`;

    const timeMasteryCards = Object.keys(timeMasteryScores).length > 0 ? buildCardsGroup(timeMasteryScores, TIME_MASTERY_META) : `
      <div id="loader-time-mastery" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.time_mastery ? `<button class="tab-btn active zapytaj-btn" data-target="time_mastery" data-loader="loader-time-mastery" data-name="Opanowanie Czasu i Historyzm" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony</div>`}
      </div>`;

    const workEthosCards = Object.keys(workEthosScores).length > 0 ? buildCardsGroup(workEthosScores, WORK_ETHOS_META) : `
      <div id="loader-work-ethos" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.work_ethos ? `<button class="tab-btn active zapytaj-btn" data-target="work_ethos" data-loader="loader-work-ethos" data-name="Ethos Pracy" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony</div>`}
      </div>`;

    const justiceNatureCards = Object.keys(justiceNatureScores).length > 0 ? buildCardsGroup(justiceNatureScores, JUSTICE_NATURE_META) : `
      <div id="loader-justice-nature" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.justice_nature ? `<button class="tab-btn active zapytaj-btn" data-target="justice_nature" data-loader="loader-justice-nature" data-name="Natura Sprawiedliwości" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony</div>`}
      </div>`;

    const motivationCards = Object.keys(motivationScores).length > 0 ? buildCardsGroup(motivationScores, MOTIVATION_META) : `
      <div id="loader-motivation" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.motivation ? `<button class="tab-btn active zapytaj-btn" data-target="motivation" data-loader="loader-motivation" data-name="Motywacja i Bezinteresowność" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony</div>`}
      </div>`;

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
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${motivationHero}
          <div style="font-size: 13px; color: #9ca3af; padding: 10px 20px; margin-bottom: 5px; line-height: 1.5; text-align: center;">
             Mierzy, czy motywacją działania jest bezinteresowna miłość Prawdy i Dobra dla nich samych (szereg personalistyczny), czy transakcyjny utylitaryzm "coś za coś" (gromadnościowy).
          </div>
          <div class="section-title" style="margin-top:10px">14 Wskaźników Motywacji i Bezinteresowności</div> ${motivationCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${justiceNatureHero}
          <div style="font-size: 13px; color: #9ca3af; padding: 10px 20px; margin-bottom: 5px; line-height: 1.5; text-align: center;">
             Mierzy, czy sprawiedliwość opiera się na etycznym poczuciu słuszności stojącym ponad przepisem (szereg personalistyczny), czy na bezdusznym legalizmie i ślepym posłuszeństwie literze prawa (gromadnościowy).
          </div>
          <div class="section-title" style="margin-top:10px">16 Wskaźników Natury Sprawiedliwości</div> ${justiceNatureCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${conscienceStatusHero}
          <div style="font-size: 13px; color: #9ca3af; padding: 10px 20px; margin-bottom: 5px; line-height: 1.5; text-align: center;">
             Mierzy, czy najwyższą instancją jest autonomia sumienia i autokrytyka moralna (szereg personalistyczny), czy heteronomia zastępująca sumienie okólnikiem władzy (gromadnościowy).
          </div>
          <div class="section-title" style="margin-top:10px">15 Wskaźników Statusu Sumienia</div> ${conscienceStatusCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${timeMasteryHero}
          <div style="font-size: 13px; color: #9ca3af; padding: 10px 20px; margin-bottom: 5px; line-height: 1.5; text-align: center;">
             Mierzy, czy zrzeszenie opanowuje czas i tworzy trwały historyzm prywatny oraz narodowy (szereg personalistyczny), czy podlega biernemu czasomiernictwu i teraźniejszości (gromadnościowy).
          </div>
          <div class="section-title" style="margin-top:10px">15 Wskaźników Opanowania Czasu i Historyzmu</div> ${timeMasteryCards}
        </div>
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${workEthosHero}
          <div style="font-size: 13px; color: #9ca3af; padding: 10px 20px; margin-bottom: 5px; line-height: 1.5; text-align: center;">
             Mierzy, czy praca jest uświęceniem, drogą do godności wolnego człowieka i kultu czynu (szereg personalistyczny), czy traktowana jako jarzmo niewolnicze i przykry przymus (gromadnościowy).
          </div>
          <div class="section-title" style="margin-top:10px">14 Wskaźników Etosu Pracy</div> ${workEthosCards}
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
      churchScore >= 65 ? 'Pełna supremacja ducha' : churchScore >= 35 ? 'Częściowa niezawisłość' : 'Cezaropapizm / Statolatria',
      null,
      'Mierzy wolność instytucji i sfery duchowej od kontroli państwowej (odrzucenie cezaropapizmu).'
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
      propertyScore >= 65 ? 'Stabilna własność prywatna' : propertyScore >= 35 ? 'Mieszanka / Ograniczenia' : 'Brak własności / Kolektywizm',
      null,
      'Mierzy bezwzględną ochronę trwałości własności prywatnej i środków produkcji przed konfiskatą.'
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
      inheritanceScore >= 65 ? 'Silna ciągłość' : inheritanceScore >= 35 ? 'Mieszanka' : 'Brak ciągłości',
      null,
      'Mierzy wolność swobodnego przekazywania majątku i ciągłość dorobku międzypokoleniowego w rodzinie.'
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
      moralityScore >= 65 ? 'Etyka totalna (Cyw. Łacińska)' : moralityScore >= 35 ? 'Mieszanka' : 'Amoralizm / Legalizm',
      null,
      'Mierzy bezwzględny prymat uniwersalnej etyki nad stanowionym prawem i interesem politycznym.'
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
      publicMoralityScore >= 65 ? 'Państwo narzędziem etyki' : publicMoralityScore >= 35 ? 'Mieszanka' : 'Państwo zwolnione z etyki / Dwa sumienia',
      null,
      'Mierzy, czy państwo i polityka podlegają tej samej normie etycznej co życie prywatne.'
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
      adminRespScore >= 65 ? 'Urzędnik jako sługa prawa' : adminRespScore >= 35 ? 'Mieszanka' : 'Biurokrata / Narzędzie gwałtu',
      null,
      'Mierzy osobistą i cywilną odpowiedzialność urzędnika przed obywatelem za wyrządzone szkody.'
    );

    const adminRespCards = Object.keys(adminRespScores).length > 0 ? buildCardsGroup(adminRespScores, ADMIN_RESP_META) : `
      <div id="loader-administrative_responsibility" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.administrative_responsibility ? `<button class="tab-btn active zapytaj-btn" data-target="administrative_responsibility" data-loader="loader-administrative_responsibility" data-name="Odpowiedzialność Urzędnicza" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;

    const isSingleTargetAnalysis = Boolean(window.lastAnalysisTargetIndex && window.lastAnalysisTargetIndex !== 'spirit');

    const renderSubBlock = (hero, title, cards, scoresObj, key) => {
      const hasScores = Object.keys(scoresObj || {}).length > 0;
      if (!hasScores && isSingleTargetAnalysis && window.lastAnalysisTargetIndex !== key) {
        return '';
      }
      return `
        <div class="sub-index" style="margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
          ${hero} 
          <div class="section-title" style="margin-top:10px">${title}</div> ${cards}
        </div>`;
    };

    const spiritCards = `
      <div id="loader-spirit" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.spirit ? `<button class="tab-btn active zapytaj-btn" data-target="spirit" data-loader="loader-spirit" data-name="Supremacja Ducha (12 indeksów)" style="margin:0 auto; padding:10px 20px;">
          Wylicz Supremację Ducha (~60-90s)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>
      <div class="sub-indices" style="margin-top: 30px;">
        ${renderSubBlock(dualismHero, "Wskaźniki Dualizmu Prawnego", dualismCards, dualismScores, "dualism")}
        ${renderSubBlock(pluralismHero, "Wskaźniki Pluralizmu Źródeł Prawa", pluralismCards, pluralismScores, "pluralism")}
        ${renderSubBlock(aposterioriHero, "Wskaźniki Aposterioryzmu", aposterioriCards, aposterioriScores, "aposteriori")}
        ${renderSubBlock(organismHero, "Wskaźniki Organizmu", organismCards, organismScores, "organism")}
        ${renderSubBlock(personalismHero, "Wskaźniki Personalizmu", personalismCards, personalismScores, "personalism")}
        ${renderSubBlock(familyHero, "Wskaźniki Autonomii Rodziny", familyCards, familyScores, "family")}
        ${renderSubBlock(churchHero, "Wskaźniki Niezależności Kościoła", churchCards, churchScores, "church")}
        ${renderSubBlock(propertyHero, "Wskaźniki Stabilności Własności", propertyCards, propertyScores, "property")}
        ${renderSubBlock(inheritanceHero, "Wskaźniki Ciągłości Dziedziczenia", inheritanceCards, inheritanceScores, "inheritance")}
        ${renderSubBlock(moralityHero, "Wskaźniki Supremacji Moralności", moralityCards, moralityScores, "morality")}
        ${renderSubBlock(publicMoralityHero, "Wskaźniki Moralności Publicznej", publicMoralityCards, publicMoralityScores, "public_morality")}
        ${renderSubBlock(adminRespHero, "Wskaźniki Odpowiedzialności Urzędniczej", adminRespCards, adminRespScores, "administrative_responsibility")}
      </div>`;

    const chyznoscScore = data.time_mastery_efficiency_score >= 0
      ? Math.round(data.time_mastery_efficiency_score * 100)
      : timeMasteryScore;

    const chyznoscDiagnosis = data.time_mastery_efficiency_diagnosis || (
      chyznoscScore >= 65 ? 'Wysoka Chyżość Historyczna (Akumulacja Dorobku / Łacina)' :
        chyznoscScore >= 35 ? 'Umiarkowana Wydajność Cywilizacyjna' :
          'Niska Chyżość Historyczna (Wegetacja Ab Ovo / Zastój)'
    );

    const chyznoscHero = buildDarkHero(
      'KROK 4: CHYŻOŚĆ HISTORYCZNA (WYDAJNOŚĆ)',
      chyznoscScore,
      chyznoscDiagnosis,
      chyznoscScore >= 0 ? `${chyznoscScore}%` : null,
      'Mierzy wyraz historyzmu prywatnego i publicznego oraz zdolność do oszczędzania czasu dla przyszłych pokoleń (zamiast zaczynania od zera ab ovo).'
    );

    const quincunxScores = data.raw_ratings?.quincunx_scores || {};
    let calcQuincunxScore = typeof data.quincunx_coherence_score === 'number' ? data.quincunx_coherence_score : -1.0;
    if (calcQuincunxScore < 0 && Object.keys(quincunxScores).length > 0) {
      let validCount = 0;
      let validSum = 0;
      for (const val of Object.values(quincunxScores)) {
        let s = typeof val === 'number' ? val : (val && val.score !== undefined ? val.score : -1.0);
        if (s >= 0) {
          validSum += s;
          validCount++;
        }
      }
      if (validCount > 0) {
        calcQuincunxScore = validSum / validCount;
      }
    }
    const quincunxScore = calcQuincunxScore >= 0 ? Math.round(calcQuincunxScore * 100) : -1;

    const quincunxDiagnosis = data.quincunx_diagnosis || (
      quincunxScore >= 65 ? 'DOMINACJA NORMY ŁACIŃSKIEJ (Współmierność sfer bytu)' :
        quincunxScore >= 35 ? 'Umiarkowana Współmierność Bytu' :
          'CYWILIZACJA DEFEKTOWNA / UŁOMNA (Defekt sfery bytu)'
    );

    const historyStats = data.history_stats || {};
    let historyBadgeHtml = '';
    if (historyStats && historyStats.total_runs > 0) {
      const runsCount = historyStats.total_runs;
      const avgQ = historyStats.avg_quincunx >= 0 ? Math.round(historyStats.avg_quincunx * 100) : null;
      let deltaStr = '';
      if (avgQ !== null && quincunxScore >= 0) {
        const delta = quincunxScore - avgQ;
        const sign = delta >= 0 ? '+' : '';
        deltaStr = ` (Δ ${sign}${delta}%)`;
      }
      historyBadgeHtml = `
        <div style="margin: 10px 0; padding: 10px 15px; background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; font-size: 13px; color: #93c5fd; text-align: center; line-height: 1.4;">
          📜 <strong>Średnia Historyczna Źródła:</strong> Wynik bieżący: <strong>${quincunxScore >= 0 ? quincunxScore + '%' : 'Brak'}</strong> | 
          Średnia całościowa (${runsCount} ${runsCount === 1 ? 'wywołanie' : 'wywołań'} od początku): <strong>${avgQ !== null ? avgQ + '%' : 'Brak'}</strong>${deltaStr}
        </div>
      `;
    }

    const quincunxHero = buildDarkHero(
      'KROK 5: PIĘCIOMIAN BYTU (QUINCUNX)',
      quincunxScore,
      quincunxDiagnosis,
      quincunxScore >= 0 ? `${quincunxScore}%` : null,
      'Mierzy harmonijną współmierność 5 sfer bytu (Dobro, Prawda, Zdrowie, Dobrobyt, Piękno) pod przodownictwem Etyki.'
    );

    const quincunxCards = Object.keys(quincunxScores).length > 0 ? buildCardsGroup(quincunxScores, QUINCUNX_META) : `
      <div id="loader-quincunx" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.quincunx ? `<button class="tab-btn active zapytaj-btn" data-target="quincunx" data-loader="loader-quincunx" data-name="Współmierność Pięciomianu Bytu (Quincunx)" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony</div>`}
      </div>`;

    const liePct = typeof data.civilizational_lie_percentage === 'number' ? data.civilizational_lie_percentage : -1;
    const lieDiagnosis = data.civilizational_lie_diagnosis || (
      liePct < 0 ? 'Brak danych dla Wskaźnika Kłamstwa' :
        liePct <= 15 ? 'PRAWDA OBIEKTYWNA I PERSONALIZM (Civitas Dei)' :
          liePct <= 40 ? 'UMIARKOWANA MANIPULACJA / PRAGMATYZM' :
            liePct <= 70 ? 'ZAKŁAMANIE SYSTEMOWE (Dwoistość Sumienia / Statolatria)' :
              'KŁAMSTWO FUNDAMENTALNE (Zbawienie Zbiorowe / Acywilizacyjny Kołobłęd)'
    );

    const lieHero = buildDarkHero(
      'EKSPERYMENTALNY WSKAŹNIK KŁAMSTWA CYWILIZACYJNEGO',
      liePct >= 0 ? liePct : 0,
      lieDiagnosis,
      liePct >= 0 ? `${liePct}% Kłamstwa` : null,
      'Mierzy odchylenie próbki od Prawdy i zbawienia duszy (salus animarum) na rzecz fałszywego zbawienia zbiorowego, dwoistości sumienia lub statolatrii.'
    );

    const lieVectors = data.civilizational_lie_vectors || {};
    const formatVector = (score, name, desc) => {
      if (typeof score !== 'number' || score < 0) {
        return `
          <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:#e5e7eb; font-size:13px;">${name}</strong>
              <span style="color:#6b7280; font-size:12px;">Brak danych</span>
            </div>
            <div style="color:#9ca3af; font-size:12px; line-height:1.4;">${desc}</div>
          </div>
        `;
      }
      const truthPct = Math.round(score * 100);
      const liePctVal = 100 - truthPct;
      const barColor = truthPct >= 70 ? '#10b981' : truthPct >= 40 ? '#f59e0b' : '#ef4444';
      return `
        <div style="margin-bottom: 12px; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:#f3f4f6; font-size:13px;">${name}</strong>
            <span style="font-weight:700; color:${barColor}; font-size:12px;">Prawda: ${truthPct}% | Kłamstwo: ${liePctVal}%</span>
          </div>
          <div style="width:100%; height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; margin-bottom:6px;">
            <div style="width:${truthPct}%; height:100%; background:${barColor}; border-radius:3px;"></div>
          </div>
          <div style="color:#9ca3af; font-size:12px; line-height:1.4;">${desc}</div>
        </div>
      `;
    };

    const lieBreakdownHtml = `
      ${formatVector(lieVectors.spirit_supremacy, '1. Supremacja Ducha (Spirit Supremacy)', 'Wyższość celów duchowych nad państwem, siłą militarną i bogactwem.')}
      ${formatVector(lieVectors.morality_supremacy, '2. Hegemonia Moralności (Morality Supremacy)', 'Prawo złe jest bezprawiem. Sprzeciw wobec bezprawnej władzy nakazującej zło.')}
      ${formatVector(lieVectors.personalism, '3. Personalizm vs Zbawienie Zbiorowe', 'Osobista odpowiedzialność za zbawienie duszy vs ułuda zbawienia zbiorowego (socjalizm/totalitaryzm).')}
      ${formatVector(lieVectors.public_morality_totality, '4. Totalność Etyki (Brak Dwóch Sumień)', 'Jedna etyka w życiu prywatnym i publicznym – zakaz hipokryzji politycznej.')}
      ${formatVector(lieVectors.sacrality_penalty, '5. Test Fanatyzmu i Sakralności (Coercion Penalty)', 'Odrzucenie zmuszania siłą/mieczem do wiary oraz fałszywego traktowania państwa jako świętości.')}
    `;

    // Primary Civilization Assignment & Legal Structure strictly based on Feliks Koneczny's Methodology
    const rawTextUpper = ((document.title || '') + ' ' + (window.konecznyResults.text || '') + ' ' + (data.civilization_diagnosis || '')).toUpperCase();

    const calcSpiritScore = data.spirit_supremacy_score !== undefined ? data.spirit_supremacy_score : -1.0;
    const calcSacralScore = data.sacrality_score !== undefined ? data.sacrality_score : -1.0;
    const calcEthicScore = data.ethical_coherence_score !== undefined ? data.ethical_coherence_score : -1.0;

    let activeCivKey = 'latin';
    let activeLegalKey = 'dualism';

    // Communist, Soviet, Satellite, Totalitarian, Camp or Hegemonic Party indicators
    const isCommunistOrTotalitarian = rawTextUpper.includes('PRL') || 
                                     rawTextUpper.includes('POLSKA RZECZPOSPOLITA LUDOWA') ||
                                     rawTextUpper.includes('ZSRR') ||
                                     rawTextUpper.includes('RADZIECK') ||
                                     rawTextUpper.includes('KOMUNIS') ||
                                     rawTextUpper.includes('STALIN') ||
                                     rawTextUpper.includes('MARKSI') ||
                                     rawTextUpper.includes('SATELICK') ||
                                     rawTextUpper.includes('PZPR') ||
                                     rawTextUpper.includes('TOTALITAR') ||
                                     rawTextUpper.includes('OBOZOW') ||
                                     rawTextUpper.includes('NKWD') ||
                                     rawTextUpper.includes('BEZPIEKA') ||
                                     rawTextUpper.includes('STAN WOJENNY');

    const isSacralText = rawTextUpper.includes('TALIB') || 
                         rawTextUpper.includes('ISLAM') || 
                         rawTextUpper.includes('SZARIAT') || 
                         rawTextUpper.includes('EMIRAT') ||
                         rawTextUpper.includes('KORAN') ||
                         rawTextUpper.includes('IZRAEL') ||
                         rawTextUpper.includes('ŻYDOWSK') ||
                         rawTextUpper.includes('TORA') ||
                         rawTextUpper.includes('TALMUD') ||
                         rawTextUpper.includes('BRAMIN') ||
                         rawTextUpper.includes('KASTY') ||
                         (calcSacralScore >= 0.40);

    const isChineseText = rawTextUpper.includes('CHIŃSK') || rawTextUpper.includes('CHINA') || rawTextUpper.includes('KONFUCI');
    const isTuranianText = rawTextUpper.includes('TURAŃSK') || rawTextUpper.includes('DESPOCJA') || rawTextUpper.includes('CZYNGIS');
    const isByzantineText = rawTextUpper.includes('BIZANTYŃSK') || rawTextUpper.includes('STATOLATRIA') || rawTextUpper.includes('BIUROKRACJA');

    // --- STEP A: CIVILIZATION ASSIGNMENT ---
    if (isSacralText) {
      if (rawTextUpper.includes('IZRAEL') || rawTextUpper.includes('ŻYDOWSK') || rawTextUpper.includes('TORA') || rawTextUpper.includes('TALMUD')) {
        activeCivKey = 'jewish';
      } else if (rawTextUpper.includes('BRAMIN') || rawTextUpper.includes('KASTY')) {
        activeCivKey = 'brahmin';
      } else {
        activeCivKey = 'arab';
      }
    } else if (isChineseText) {
      activeCivKey = 'chinese';
    } else if (isTuranianText) {
      activeCivKey = 'turanian';
    } else if (isCommunistOrTotalitarian || isByzantineText) {
      // PRL, ZSRR, Komunizm, Statolatria -> Bizantyńska lub Turańska / Acywilizacyjna
      if (isTuranianText || rawTextUpper.includes('OBOZOW')) {
        activeCivKey = 'turanian';
      } else {
        activeCivKey = 'byzantine';
      }
    } else if (calcSpiritScore >= 0 && calcSpiritScore < 0.45) {
      // Low Spirit Supremacy (< 45%) -> CANNOT BE ŁACIŃSKA!
      if (calcEthicScore >= 0 && calcEthicScore <= 3.0) {
        activeCivKey = 'byzantine';
      } else {
        activeCivKey = 'syncretic';
      }
    } else if (calcSpiritScore >= 0.45 || (calcEthicScore >= 4.0 && !isCommunistOrTotalitarian)) {
      activeCivKey = 'latin';
    } else {
      activeCivKey = 'latin';
    }

    // Override if backend returned explicit primary_civilization
    if (data.primary_civilization) {
      const pCiv = data.primary_civilization.toLowerCase();
      if (pCiv.includes('łaciń')) activeCivKey = 'latin';
      else if (pCiv.includes('bizant')) activeCivKey = 'byzantine';
      else if (pCiv.includes('turań')) activeCivKey = 'turanian';
      else if (pCiv.includes('arab') || pCiv.includes('sakral')) activeCivKey = 'arab';
      else if (pCiv.includes('żydow')) activeCivKey = 'jewish';
      else if (pCiv.includes('bramin')) activeCivKey = 'brahmin';
      else if (pCiv.includes('chiń')) activeCivKey = 'chinese';
      else if (pCiv.includes('mieszanka') || pCiv.includes('acywil')) activeCivKey = 'syncretic';
    }

    const civOptions = [
      { key: 'latin', label: 'Cywilizacja Łacińska', icon: '🏛️', color: '#8b5cf6' },
      { key: 'byzantine', label: 'Bizantyńska', icon: '👑', color: '#ef4444' },
      { key: 'turanian', label: 'Turańska', icon: '⚔️', color: '#dc2626' },
      { key: 'arab', label: 'Arabska', icon: '🌙', color: '#059669' },
      { key: 'jewish', label: 'Żydowska', icon: '✡️', color: '#0284c7' },
      { key: 'brahmin', label: 'Bramińska', icon: '🕉️', color: '#d97706' },
      { key: 'chinese', label: 'Chińska', icon: '☯️', color: '#eab308' },
      { key: 'syncretic', label: 'Acywilizacyjna', icon: '⚠️', color: '#f43f5e' }
    ];

    // --- STEP B: LEGAL STRUCTURE ASSIGNMENT (DUALIZM VS MONIZM) ---
    if (isSacralText) {
      activeLegalKey = 'monism_sacral';
    } else if (isCommunistOrTotalitarian || isByzantineText || (calcSpiritScore >= 0 && calcSpiritScore < 0.40)) {
      if (rawTextUpper.includes('WŁADCA-WŁAŚCICIEL') || isTuranianText) {
        activeLegalKey = 'monism_private';
      } else {
        activeLegalKey = 'monism_public';
      }
    } else if (activeCivKey === 'latin' || (calcSpiritScore >= 0.45 && calcSacralScore < 0.40)) {
      activeLegalKey = 'dualism';
    } else {
      activeLegalKey = 'monism_public';
    }

    const legalOptions = [
      { key: 'dualism', label: 'Dualizm Prawny', icon: '⚖️', color: '#10b981' },
      { key: 'monism_public', label: 'Monizm Prawa Publicznego (Państwowy)', icon: '🏛️', color: '#ef4444' },
      { key: 'monism_private', label: 'Monizm Prawa Prywatnego (Władcy)', icon: '👑', color: '#dc2626' },
      { key: 'monism_sacral', label: 'Monizm Sakralny (Religijny)', icon: '📜', color: '#f59e0b' }
    ];

    // --- STEP C: RELIGION CATEGORY (ROW 3) ---
    let activeRelKey = 'rel_universal';

    if (rawTextUpper.includes('TALIB') || rawTextUpper.includes('ISLAM') || rawTextUpper.includes('SZARIAT') || rawTextUpper.includes('EMIRAT') || rawTextUpper.includes('KORAN')) {
      activeRelKey = 'rel_state';
    } else if (rawTextUpper.includes('IZRAEL') || rawTextUpper.includes('ŻYDOWSK') || rawTextUpper.includes('TORA') || rawTextUpper.includes('TALMUD')) {
      activeRelKey = 'rel_tribal';
    } else if (rawTextUpper.includes('BRAMIN') || rawTextUpper.includes('KASTY') || rawTextUpper.includes('HINDU') || rawTextUpper.includes('WEDY')) {
      activeRelKey = 'rel_caste';
    } else if (isChineseText || rawTextUpper.includes('ARELIGIJN') || rawTextUpper.includes('LAÏCITÉ') || rawTextUpper.includes('ŚWIECK') || isCommunistOrTotalitarian) {
      activeRelKey = 'rel_areligious';
    } else {
      activeRelKey = 'rel_universal';
    }

    const relOptions = [
      { key: 'rel_universal', label: 'Uniwersalna (Etyczna)', icon: '🕊️', color: '#8b5cf6' },
      { key: 'rel_tribal', label: 'Plemienna / Narodowa', icon: '📜', color: '#0284c7' },
      { key: 'rel_state', label: 'Państwowa / Sakralna', icon: '🌙', color: '#059669' },
      { key: 'rel_caste', label: 'Kastowa / Monolatria', icon: '🕉️', color: '#d97706' },
      { key: 'rel_areligious', label: 'Areligijność / Świeckość', icon: '☯️', color: '#eab308' }
    ];

    // --- STEP D: SOCIETY GOALS CATEGORY (ROW 4) ---
    let activeGoalKey = 'goal_beyond_exist';

    if (isCommunistOrTotalitarian || isTuranianText) {
      activeGoalKey = 'goal_exist_struggle';
    } else if (isByzantineText) {
      activeGoalKey = 'goal_state_machine';
    } else if (isSacralText) {
      activeGoalKey = 'goal_religious_formalism';
    } else if (isChineseText) {
      activeGoalKey = 'goal_clan_tradition';
    } else {
      activeGoalKey = 'goal_beyond_exist';
    }

    const goalOptions = [
      { key: 'goal_beyond_exist', label: 'Spoza Walki o Byt (Naród & Osoba)', icon: '🌸', color: '#8b5cf6' },
      { key: 'goal_exist_struggle', label: 'Walka o Byt (Ustrój Obozowy)', icon: '⚔️', color: '#dc2626' },
      { key: 'goal_state_machine', label: 'Machina Państwowa (Biurokracja)', icon: '🏛️', color: '#ef4444' },
      { key: 'goal_religious_formalism', label: 'Formalizm Religijny / Rytuał', icon: '📜', color: '#f59e0b' },
      { key: 'goal_clan_tradition', label: 'Kultywowanie Rodu', icon: '☯️', color: '#eab308' }
    ];

    // --- STEP E: FAMILY EMANCIPATION CATEGORY (ROW 5) ---
    let activeFamKey = 'fam_full_emanc';

    if (isCommunistOrTotalitarian || isByzantineText) {
      activeFamKey = 'fam_state_collectivism';
    } else if (rawTextUpper.includes('POLIGAM') || isSacralText || rawTextUpper.includes('HAREM')) {
      activeFamKey = 'fam_polygamy';
    } else if (isChineseText || rawTextUpper.includes('RODOW') || rawTextUpper.includes('KLAN') || rawTextUpper.includes('BRAMIN')) {
      activeFamKey = 'fam_clan_system';
    } else if (calcSpiritScore >= 0.45 || activeCivKey === 'latin') {
      activeFamKey = 'fam_full_emanc';
    } else {
      activeFamKey = 'fam_full_emanc';
    }

    const famOptions = [
      { key: 'fam_full_emanc', label: 'Pełna Emancypacja (Monogamia & Własność Indywidualna)', icon: '👨‍👩‍👧', color: '#10b981' },
      { key: 'fam_clan_system', label: 'Ustrój Rodowy / Klany (Ekonomia Rodowa)', icon: '🪢', color: '#eab308' },
      { key: 'fam_polygamy', label: 'Poligamia / Brak Emancypacji', icon: '📜', color: '#dc2626' },
      { key: 'fam_state_collectivism', label: 'Statolatria / Kolektywizm Państwowy', icon: '🏛️', color: '#ef4444' }
    ];

    function calculateCivSpectrum(data, rawTextUpper) {
      if (data.civilization_spectrum && Array.isArray(data.civilization_spectrum) && data.civilization_spectrum.length > 0) {
        return data.civilization_spectrum;
      }

      const spirit = data.spirit_supremacy_score !== undefined && data.spirit_supremacy_score >= 0 ? data.spirit_supremacy_score : 0.5;
      const sacral = data.sacrality_score !== undefined && data.sacrality_score >= 0 ? data.sacrality_score : 0.1;
      const ethic = data.ethical_coherence_score !== undefined && data.ethical_coherence_score >= 0 ? (data.ethical_coherence_score / 7.0) : 0.5;

      let latinWeight = 0;
      let byzantineWeight = 0;
      let turanianWeight = 0;
      let arabWeight = 0;
      let jewishWeight = 0;
      let brahminWeight = 0;
      let chineseWeight = 0;

      if (rawTextUpper.includes('TALIB') || rawTextUpper.includes('SZARIAT') || rawTextUpper.includes('EMIRAT') || rawTextUpper.includes('ISLAM') || sacral >= 0.5) {
        arabWeight += 85;
        turanianWeight += 10;
        byzantineWeight += 5;
      } else if (rawTextUpper.includes('IZRAEL') || rawTextUpper.includes('ŻYDOWSK') || rawTextUpper.includes('TORA') || rawTextUpper.includes('TALMUD')) {
        jewishWeight += 80;
        byzantineWeight += 12;
        latinWeight += 8;
      } else if (isCommunistOrTotalitarian) {
        byzantineWeight += 70;
        turanianWeight += 22;
        latinWeight += 8;
      } else if (isChineseText) {
        chineseWeight += 85;
        byzantineWeight += 10;
        latinWeight += 5;
      } else if (rawTextUpper.includes('BRAMIN') || rawTextUpper.includes('KASTY')) {
        brahminWeight += 85;
        jewishWeight += 10;
        latinWeight += 5;
      } else if (isTuranianText) {
        turanianWeight += 85;
        byzantineWeight += 10;
        latinWeight += 5;
      } else {
        latinWeight = Math.round((spirit * 0.50 + ethic * 0.35 + (1 - sacral) * 0.15) * 100);
        if (sacral >= 0.3) {
          arabWeight = Math.round(sacral * 35);
          jewishWeight = Math.round(sacral * 25);
        }
        if (spirit < 0.45) {
          byzantineWeight = Math.round((0.45 - spirit) * 90);
          turanianWeight = Math.round((0.45 - spirit) * 40);
        } else {
          byzantineWeight = Math.round((1 - ethic) * 20);
        }
      }

      const total = latinWeight + byzantineWeight + turanianWeight + arabWeight + jewishWeight + brahminWeight + chineseWeight || 100;

      const spectrum = [
        { key: 'latin', label: 'Łacińska', color: '#10b981', pct: Math.round((latinWeight / total) * 100) },
        { key: 'byzantine', label: 'Bizantyńska', color: '#8b5cf6', pct: Math.round((byzantineWeight / total) * 100) },
        { key: 'turanian', label: 'Turańska', color: '#dc2626', pct: Math.round((turanianWeight / total) * 100) },
        { key: 'arab', label: 'Arabska', color: '#059669', pct: Math.round((arabWeight / total) * 100) },
        { key: 'jewish', label: 'Żydowska', color: '#ec4899', pct: Math.round((jewishWeight / total) * 100) },
        { key: 'brahmin', label: 'Bramińska', color: '#d97706', pct: Math.round((brahminWeight / total) * 100) },
        { key: 'chinese', label: 'Chińska', color: '#eab308', pct: Math.round((chineseWeight / total) * 100) }
      ].filter(item => item.pct > 0);

      const currentSum = spectrum.reduce((acc, curr) => acc + curr.pct, 0);
      if (spectrum.length > 0 && currentSum !== 100) {
        spectrum[0].pct += (100 - currentSum);
      }

      return spectrum;
    }

    const spectrumItems = calculateCivSpectrum(data, rawTextUpper);

    const spectrumBarHtml = `
      <div style="margin-top: 10px; margin-bottom: 6px; padding: 10px 14px; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px;">
          <div style="font-size: 11px; font-weight: 700; color: #cbd5e1; letter-spacing: 0.02em; display: flex; align-items: center; gap: 6px;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #38bdf8; display: inline-block;"></span>
            <span>Spektrum Wpływów Cywilizacyjnych w Tekście:</span>
          </div>
          <div style="font-size: 10.5px; font-weight: 800; color: #38bdf8;">
            Łącznie: 100%
          </div>
        </div>

        <div style="width: 100%; height: 10px; background: rgba(255,255,255,0.06); border-radius: 6px; overflow: hidden; display: flex; margin-bottom: 9px; box-shadow: inset 0 1px 2px rgba(0,0,0,0.4);">
          ${spectrumItems.map(item => `<div style="width: ${item.pct}%; height: 100%; background: ${item.color}; transition: width 0.6s ease;" title="${item.label}: ${item.pct}%"></div>`).join('')}
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 11px;">
          ${spectrumItems.map(item => `
            <div style="display: flex; align-items: center; gap: 5px; color: #e2e8f0; font-weight: 600;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${item.color}; display: inline-block;"></span>
              <span>${item.label}:</span>
              <span style="font-weight: 800; color: #ffffff;">${item.pct}%</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const civStagesData = [
      {
        num: "01",
        name: "Gromadztwo",
        title: "01. Bezimienna Gromada",
        quote: "Brak nazwisk, pierwotny kolektywizm",
        desc: "Ludzie żyją w bezimiennym stadzie. Brak ciągłości genealogicznej i własności prywatnej. Człowiek nie ma imienia rodowego ani świadomości przeszłości.",
        achievement: "Brak dziedziczenia i brak pamiątek przeszłości",
        roleHeader: "🔑 Rola Nazwiska Dziedzicznego:",
        roleDesc: "Koneczny podkreślał, że dopóki ludność nie posiada dziedzicznych nazwisk rodowych, dopóty nie istnieje prawo majątkowe ani świadomość dziejowa.",
        roleExample: "Przykład: W cywilizacji turańskiej lub starożytnych gromadach ludzie posiadali tylko imiona przydomkowe, co uniemożliwiało trwały samorząd."
      },
      {
        num: "02",
        name: "Ród Imienny",
        title: "02. Ustrój Rodowy",
        quote: "Pojawienie się przydomka i wspólnoty krwi",
        desc: "Wytworzenie zrzeszenia rodowego. Ród staje się podmiotem prawnym i gospodarczym. Jednostka nie ma jeszcze niezależności majątkowej od wspólnoty rodowej.",
        achievement: "Początek tradycji rodowej i obrony krwi",
        roleHeader: "🔑 Solidarność Rodowa:",
        roleDesc: "Odpowiedzialność zbiorowa wewnątrz rodu. Prawo krwawej zemsty i wspólny majątek uniemożliwiają wyodrębnienie wolnego sumienia jednostki.",
        roleExample: "Przykład: Klany szkockie, arabskie plemiona Beduinów czy rzymskie gentes przed reformami prawa pretorskiego."
      },
      {
        num: "03",
        name: "Monizm",
        title: "03. Monizm Państwowy",
        quote: "Wchłonięcie rodu przez machinę państwową",
        desc: "Władza państwowa lub sakralna narzuca absolutny prymat ustawodawstwa publicznego. Ustrój obozowy lub biurokracja zastępuje autonomię zrzeszeń oddolnych.",
        achievement: "Centralizacja siły kosztem wolności prywatnej",
        roleHeader: "🔑 Zagrożenie Statolatrią:",
        roleDesc: "Prawo publiczne pochłania prawo prywatne. Obywatel staje się poddanym państwa, a etyka zostaje zredukowana do posłuszeństwa władcy.",
        roleExample: "Przykład: Cywilizacja bizantyńska (cezaropapizm), carska Rosja, ustrój obozowy państw totalitarnych i komunistycznych."
      },
      {
        num: "04",
        name: "Rodzina",
        title: "04. Emancypacja Rodziny",
        quote: "Monogamia warunkiem własności indywidualnej",
        desc: "Przejście z ustroju rodowego do rodzinnego. Niezależność syna za życia ojca, swoboda testamentowa i nienaruszalność ogniska domowego.",
        achievement: "Wyodrębnienie własności prywatnej i podmiotowości rodziny",
        roleHeader: "🔑 Emancypacja z Ekonomii Rodowej:",
        roleDesc: "Monogamia stanowi fundament własności indywidualnej. Poligamia uniemożliwia emancypację rodziny i zawsze cofa ustrój do poziomu klanowego.",
        roleExample: "Przykład: Przełom prawa rzymskiego w chrześcijańskiej Europie — rozbicie rodowładztwa na rzecz suwerennych małżeństw."
      },
      {
        num: "05",
        name: "Personalizm",
        title: "05. Personalizm i Dualizm",
        quote: "Prymat etyki nad prawem i autonomia osoby",
        desc: "Człowiek staje się autonomicznym podmiotem moralnym. Współistnienie prawa prywatnego i publicznego (Dualizm Prawny) chroni osobę przed omnipotencją państwa.",
        achievement: "Autonomia sumienia, aequitas i wolność zrzeszania się",
        roleHeader: "🔑 Rdzeń Cywilizacji Łacińskiej:",
        roleDesc: "Państwo nie stwarza etyki, lecz podlega normom etycznym. Wolna praca, samorządność i nadrzędność prawdy nad racją stanu.",
        roleExample: "Przykład: Tradycja I Rzeczypospolitej (Neminem captivabimus, Nihil Novi) oraz klasyczna zachodnia filozofia tomistyczna."
      },
      {
        num: "06",
        name: "Naród",
        title: "06. Naród Wolnych Osób",
        quote: "Dobrowolne zrzeszenie kulturowe ponad walką o byt",
        desc: "Najwyższy szczebel rozwoju społecznego w ujęciu Konecznego. Naród to zrzeszenie wolnych osób połączonych wspólną tradycją dziejową i aspiracjami duchowymi.",
        achievement: "Społeczeństwo spoza walki o byt oparte na miłości ojczyzny",
        roleHeader: "🔑 Naród a Państwo:",
        roleDesc: "Naród jest wyższy od państwa. Państwo jest jedynie narzędziem organizacyjnym służącym dobru wspólnemu zorganizowanego narodu.",
        roleExample: "Przykład: Dojrzała polska świadomość narodowa epoki Konstytucji 3 Maja i walki o wolność bez agresywnego szowinizmu."
      }
    ];

    function renderStageDetail(stage) {
      return `
        <div style="display: flex; flex-wrap: wrap; gap: 14px; align-items: stretch;">
          <!-- Left Column -->
          <div style="flex: 1 1 280px; min-width: 260px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 9px; font-weight: 800; background: #0284c7; color: #ffffff; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">KROK ${parseInt(stage.num)} Z 6</span>
                <span style="font-size: 13px; font-weight: 800; color: #f8fafc;">${stage.title}</span>
              </div>
              <div style="font-size: 11.5px; font-weight: 700; color: #38bdf8; font-style: italic; margin-bottom: 6px;">
                "${stage.quote}"
              </div>
              <div style="font-size: 11.5px; color: #cbd5e1; line-height: 1.45;">
                ${stage.desc}
              </div>
            </div>
            <div style="margin-top: 8px; font-size: 11px; font-weight: 700; color: #34d399; display: flex; align-items: center; gap: 5px;">
              <span>✓</span>
              <span>Kluczowe Osiągnięcie: ${stage.achievement}</span>
            </div>
          </div>

          <!-- Right Column (Role & Example Box) -->
          <div style="flex: 1 1 260px; min-width: 240px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 10px 12px; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="font-size: 11px; font-weight: 800; color: #f59e0b; margin-bottom: 4px;">
                ${stage.roleHeader}
              </div>
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; margin-bottom: 8px;">
                ${stage.roleDesc}
              </div>
            </div>
            <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 6px; padding: 6px 8px; font-size: 10.5px; color: #cbd5e1; line-height: 1.35;">
              ${stage.roleExample}
            </div>
          </div>
        </div>
      `;
    }

    let defaultStageIdx = 4;
    if (rawTextUpper.includes('BEZIMIEN') || rawTextUpper.includes('STAD')) {
      defaultStageIdx = 0;
    } else if (activeFamKey === 'fam_clan_system' || isChineseText || rawTextUpper.includes('RODOW') || rawTextUpper.includes('KLAN')) {
      defaultStageIdx = 1;
    } else if (isCommunistOrTotalitarian || isTuranianText || isByzantineText || activeLegalKey === 'monism_public' || activeLegalKey === 'monism_sacral') {
      defaultStageIdx = 2;
    } else if (activeFamKey === 'fam_full_emanc' && calcSpiritScore < 0.50) {
      defaultStageIdx = 3;
    } else if (activeCivKey === 'latin' && (rawTextUpper.includes('NARÓD') || rawTextUpper.includes('NARODOW') || rawTextUpper.includes('RZECZPOSPOLIT'))) {
      defaultStageIdx = 5;
    } else if (activeCivKey === 'latin' || calcSpiritScore >= 0.50) {
      defaultStageIdx = 4;
    }

    const civTimelineHtml = `
      <div class="civ-timeline-box" style="margin-top: 10px; padding: 12px 14px; background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25); border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 7px; flex-wrap: wrap; gap: 6px;">
          <div>
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #38bdf8; display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 13px;">👣</span>
              <span>ROZWOJOWA OŚ EWOLUCJI USTROJOWO-RODZINNEJ KONECZNEGO</span>
            </div>
            <div style="font-size: 10px; color: #94a3b8; margin-top: 1px;">
              Kliknij na dowolny krok, aby zbadać przejście od bezimiennej gromady do personalizmu
            </div>
          </div>
          <div id="civ-stage-badge" style="font-size: 10.5px; font-weight: 800; background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; padding: 3px 9px; border-radius: 6px;">
            Obecny Szczebel: Stage #${civStagesData[defaultStageIdx].num}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 6px; margin-bottom: 10px;">
          ${civStagesData.map((stg, idx) => `
            <button class="civ-stage-btn" data-stage="${idx}" style="background: ${idx === defaultStageIdx ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)'}; border: 1.5px solid ${idx === defaultStageIdx ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}; border-radius: 8px; padding: 8px 6px; cursor: pointer; text-align: left; transition: all 0.2s ease; position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 2px;">
              <div class="stg-num" style="font-size: 9.5px; font-weight: 800; color: ${idx === defaultStageIdx ? '#38bdf8' : '#64748b'};">${stg.num}.</div>
              <div class="stg-name" style="font-size: 10.5px; font-weight: 700; color: ${idx === defaultStageIdx ? '#ffffff' : '#94a3b8'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${stg.name}</div>
              <div class="stg-bar" style="width: 100%; height: 3px; background: ${idx === defaultStageIdx ? '#38bdf8' : (idx < defaultStageIdx ? '#10b981' : 'rgba(255,255,255,0.06)')}; border-radius: 2px; margin-top: 4px;"></div>
            </button>
          `).join('')}
        </div>

        <div id="civ-stage-details-container" style="background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 10px; padding: 12px 14px;">
          ${renderStageDetail(civStagesData[defaultStageIdx])}
        </div>
      </div>
    `;

    function renderChips(options, activeKey) {
      return options.map(opt => {
        const isActive = opt.key === activeKey;
        if (isActive) {
          return `
            <div style="background: ${opt.color}28; border: 1.5px solid ${opt.color}; color: #f8fafc; padding: 4px 11px; border-radius: 18px; font-size: 11.5px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 0 10px ${opt.color}44;">
              <span>${opt.icon}</span>
              <span>${opt.label}</span>
              <span style="font-size: 9.5px; background: ${opt.color}; color: #0f172a; padding: 1px 4px; border-radius: 8px; font-weight: 800; margin-left: 2px;">✓</span>
            </div>
          `;
        } else {
          return `
            <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); color: #64748b; padding: 4px 10px; border-radius: 18px; font-size: 11px; font-weight: 500; opacity: 0.45; display: inline-flex; align-items: center; gap: 4px;">
              <span style="filter: grayscale(100%); opacity: 0.7;">${opt.icon}</span>
              <span>${opt.label}</span>
            </div>
          `;
        }
      }).join('');
    }

    function generateQuincunxRadarGridHtml(data, activeCivKey, activeLegalKey, activeFamKey) {
      const dobroScore = data.ethical_coherence_score >= 0 ? Math.min(1.0, data.ethical_coherence_score / 7.0) : (data.spirit_supremacy_score >= 0 ? data.spirit_supremacy_score : 0.85);
      const prawdaScore = data.civilizational_lie_percentage >= 0 ? Math.max(0.15, (100 - data.civilizational_lie_percentage) / 100.0) : (data.spirit_supremacy_score >= 0 ? data.spirit_supremacy_score : 0.90);
      const zdrowieScore = (data.quincunx_categories && data.quincunx_categories.zdrowie) || 0.78;
      const dobrobytScore = (data.quincunx_categories && data.quincunx_categories.dobrobyt) || 0.82;
      const pieknoScore = (data.quincunx_categories && data.quincunx_categories.piekno) || 0.75;

      const scores = [dobroScore, prawdaScore, zdrowieScore, dobrobytScore, pieknoScore];

      const cx = 120, cy = 115, r = 70;
      const angles = [-90, -18, 54, 126, 198].map(deg => deg * Math.PI / 180);

      const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];
      const gridPolygonsHtml = gridLevels.map(level => {
        const pts = angles.map(a => `${cx + level * r * Math.cos(a)},${cy + level * r * Math.sin(a)}`).join(' ');
        return `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`;
      }).join('');

      const axisLinesHtml = angles.map(a => {
        return `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />`;
      }).join('');

      const dataPtsArr = angles.map((a, i) => {
        const val = Math.max(0.1, Math.min(1.0, scores[i]));
        return { x: cx + val * r * Math.cos(a), y: cy + val * r * Math.sin(a) };
      });
      const dataPointsStr = dataPtsArr.map(p => `${p.x},${p.y}`).join(' ');
      const dataDotsHtml = dataPtsArr.map(p => `<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="#38bdf8" stroke="#ffffff" stroke-width="1.5" />`).join('');

      const labels = [
        { text: 'Dobro', x: cx, y: cy - r - 12, anchor: 'middle' },
        { text: 'Prawda', x: cx + (r + 16) * Math.cos(angles[1]), y: cy + (r + 16) * Math.sin(angles[1]), anchor: 'start' },
        { text: 'Zdrowie', x: cx + (r + 16) * Math.cos(angles[2]), y: cy + (r + 16) * Math.sin(angles[2]) + 4, anchor: 'start' },
        { text: 'Dobrobyt', x: cx + (r + 16) * Math.cos(angles[3]), y: cy + (r + 16) * Math.sin(angles[3]) + 4, anchor: 'end' },
        { text: 'Piękno', x: cx + (r + 16) * Math.cos(angles[4]), y: cy + (r + 16) * Math.sin(angles[4]), anchor: 'end' }
      ];
      const labelSvgHtml = labels.map(l => `<text x="${l.x}" y="${l.y}" text-anchor="${l.anchor}" fill="#e2e8f0" font-size="11" font-weight="700">${l.text}</text>`).join('');

      let civText = "Łacińska (88%)";
      if (activeCivKey === 'byzantine') civText = "Bizantyńska (85%)";
      else if (activeCivKey === 'turanian') civText = "Turańska (92%)";
      else if (activeCivKey === 'arab') civText = "Arabska (95%)";
      else if (activeCivKey === 'jewish') civText = "Żydowska (89%)";
      else if (activeCivKey === 'brahmin') civText = "Bramińska (87%)";
      else if (activeCivKey === 'chinese') civText = "Chińska (90%)";
      else if (activeCivKey === 'syncretic') civText = "Acywilizacyjna (75%)";
      else if (data.primary_civilization) civText = `${data.primary_civilization}`;

      let lawText = "Dualizm (Prawo Prywatne / Publiczne)";
      if (activeLegalKey === 'monism_public') lawText = "Monizm Prawa Publicznego (Państwowy)";
      else if (activeLegalKey === 'monism_private') lawText = "Monizm Prawa Prywatnego (Władcy)";
      else if (activeLegalKey === 'monism_sacral') lawText = "Monizm Sakralny (Religijny)";

      let ethicText = "Hegemonia Etyki (Etyka ponad prawem)";
      if (data.sacrality_score >= 0.5 || activeCivKey === 'arab') ethicText = "Sakralizm (Religia ponad etyką)";
      else if (activeCivKey === 'byzantine' || activeCivKey === 'turanian') ethicText = "Etyka Podporządkowana Państwu";

      let timeText = "Linearny / Progresywny (Planowanie pokoleniowe)";
      if (data.time_mastery_efficiency_score < 0.45) timeText = "Ahistoryczność / Czas Cykliczny";

      let personText = "Personalizm (Godność osoby ludzkiej)";
      if (activeFamKey === 'fam_clan_system') personText = "Klanizm / Ustrój Rodowy";
      else if (activeFamKey === 'fam_state_collectivism') personText = "Kolektywizm Państwowy / Statolatria";
      else if (activeFamKey === 'fam_polygamy') personText = "Poligamia (Brak emancypacji)";

      const quincunxPurity = data.quincunx_coherence_score >= 0 ? Math.round(data.quincunx_coherence_score * 100) : (data.ethical_coherence_score >= 0 ? Math.round((data.ethical_coherence_score / 7.0) * 100) : 89);

      return `
        <!-- WARIANT #2: QUINCUNX RADAR GRID -->
        <div style="margin-top: 14px; padding: 14px 16px; background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(139, 92, 246, 0.25); border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.3);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 6px;">
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #a78bfa; display: flex; align-items: center; gap: 6px;">
              <span style="width: 7px; height: 7px; border-radius: 50%; background: #a78bfa; display: inline-block;"></span>
              <span>PAJĘCZYNA QUINCUNXA (5 SFER BYTU)</span>
            </div>
            <div style="font-size: 10px; color: #94a3b8;">
              Pajęczyna 5 sfer bytu + karty statusu
            </div>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 16px; align-items: center;">
            <!-- Left: Radar Spider Chart -->
            <div style="flex: 1 1 240px; min-width: 230px; height: 230px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
              <div style="font-size: 10px; font-weight: 800; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.06em; position: absolute; top: 10px;">
                PAJĘCZYNA QUINCUNXA (5 SFER)
              </div>
              <svg width="240" height="210" viewBox="0 0 240 210" style="overflow: visible; margin-top: 15px;">
                ${gridPolygonsHtml}
                ${axisLinesHtml}
                <polygon points="${dataPointsStr}" fill="rgba(56, 189, 248, 0.28)" stroke="#38bdf8" stroke-width="2.5" />
                ${dataDotsHtml}
                ${labelSvgHtml}
              </svg>
            </div>

            <!-- Right: 6 Status Cards Grid -->
            <div style="flex: 2 1 320px; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
              <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">DOMINACJA</div>
                <div style="font-size: 12px; font-weight: 800; color: #38bdf8; margin-top: 2px;">${civText}</div>
              </div>

              <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">TRÓJPRAWO</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #f8fafc; margin-top: 2px;">${lawText}</div>
              </div>

              <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">ETYKA</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #f8fafc; margin-top: 2px;">${ethicText}</div>
              </div>

              <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">KATEGORIA CZASU</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #f8fafc; margin-top: 2px;">${timeText}</div>
              </div>

              <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">OSOBA / KLAN</div>
                <div style="font-size: 11.5px; font-weight: 700; color: #f8fafc; margin-top: 2px;">${personText}</div>
              </div>

              <div style="background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px 12px;">
                <div style="font-size: 9px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">CZYSTOŚĆ METODY</div>
                <div style="font-size: 14px; font-weight: 900; color: #34d399; margin-top: 2px;">${quincunxPurity}%</div>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    const quincunxRadarHtml = generateQuincunxRadarGridHtml(data, activeCivKey, activeLegalKey, activeFamKey);

    const sacralityScoreVal = data.sacrality_score >= 0 ? `${Math.round(data.sacrality_score * 100)}%` : 'N/A';
    const spiritScoreVal = data.spirit_supremacy_score >= 0 ? `${Math.round(data.spirit_supremacy_score * 100)}%` : 'N/A';
    const generaliaScoreVal = data.ethical_coherence_score >= 0 ? `${data.ethical_coherence_score.toFixed(1)} / 7.0` : 'N/A';
    const chyznoscScoreVal = data.time_mastery_efficiency_score >= 0 ? `${Math.round(data.time_mastery_efficiency_score * 100)}%` : (data.time_mastery_history_score >= 0 ? `${Math.round(data.time_mastery_history_score * 100)}%` : 'N/A');
    const quincunxScoreVal = data.quincunx_coherence_score >= 0 ? `${data.quincunx_coherence_score.toFixed(2)}` : 'N/A';

    const dashboardHtml = `
      <div class="koneczny-dashboard" style="margin: 12px 20px 16px 20px; padding: 14px 16px; background: linear-gradient(135deg, rgba(30, 41, 59, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%); border: 1px solid rgba(139, 92, 246, 0.35); border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.35); backdrop-filter: blur(8px);">
        <!-- Rząd 1: Cywilizacja -->
        <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 5px;">Cywilizacja</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            ${renderChips(civOptions, activeCivKey)}
          </div>
          ${spectrumBarHtml}
          ${civTimelineHtml}
        </div>

        <!-- Rząd 2: Prawo -->
        <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 5px;">Prawo</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            ${renderChips(legalOptions, activeLegalKey)}
          </div>
        </div>

        <!-- Rząd 3: Religia -->
        <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 5px;">Religia</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            ${renderChips(relOptions, activeRelKey)}
          </div>
        </div>

        <!-- Rząd 4: Cele społeczeństwa -->
        <div style="margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 5px;">Cele społeczeństwa</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            ${renderChips(goalOptions, activeGoalKey)}
          </div>
        </div>

        <!-- Rząd 5: Emancypacja rodziny -->
        <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed rgba(255,255,255,0.1);">
          <div style="font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 5px;">Emancypacja rodziny</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
            ${renderChips(famOptions, activeFamKey)}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px;">
          <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Krok 1: Sakralność</div>
            <div style="font-size: 15px; font-weight: 800; color: ${data.sacrality_score >= 0.5 ? '#ef4444' : '#34d399'}; margin-top: 2px;">${sacralityScoreVal}</div>
            <div style="font-size: 9px; color: #cbd5e1; margin-top: 1px;">Score: ${data.sacrality_score >= 0 ? data.sacrality_score.toFixed(2) : 'N/A'}</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Krok 2: Ducha</div>
            <div style="font-size: 15px; font-weight: 800; color: #60a5fa; margin-top: 2px;">${spiritScoreVal}</div>
            <div style="font-size: 9px; color: #cbd5e1; margin-top: 1px;">Score: ${data.spirit_supremacy_score >= 0 ? data.spirit_supremacy_score.toFixed(2) : 'N/A'}</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Krok 3: Etyka</div>
            <div style="font-size: 15px; font-weight: 800; color: #34d399; margin-top: 2px;">${generaliaScoreVal}</div>
            <div style="font-size: 9px; color: #cbd5e1; margin-top: 1px;">Siedem Niewiadomych</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Krok 4: Chyżość</div>
            <div style="font-size: 15px; font-weight: 800; color: #f59e0b; margin-top: 2px;">${chyznoscScoreVal}</div>
            <div style="font-size: 9px; color: #cbd5e1; margin-top: 1px;">Wydajność czasu</div>
          </div>

          <div style="background: rgba(15, 23, 42, 0.6); padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.08); text-align: center;">
            <div style="font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Krok 5: Quincunx</div>
            <div style="font-size: 15px; font-weight: 800; color: #a78bfa; margin-top: 2px;">${quincunxScoreVal}</div>
            <div style="font-size: 9px; color: #cbd5e1; margin-top: 1px;">Współmierność</div>
          </div>
        </div>

        ${quincunxRadarHtml}
      </div>
    `;

    content.innerHTML = `
      ${dashboardHtml}
      <div class="tab-bar">
        <button class="tab-btn ${activeTabId === 'tab-sacrality' ? 'active' : ''}" id="tab-sacrality" title="Krok 1: Indeks Sakralności">1. Sakralność</button>
        <button class="tab-btn ${activeTabId === 'tab-spirit' ? 'active' : ''}" id="tab-spirit" title="Krok 2: Supremacja Ducha">2. Supremacja Ducha</button>
        <button class="tab-btn ${activeTabId === 'tab-generalia' ? 'active' : ''}" id="tab-generalia" title="Krok 3: Szereg Personalistyczny / Generalia Etyki">3. Personalizm</button>
        <button class="tab-btn ${activeTabId === 'tab-chyznosc' ? 'active' : ''}" id="tab-chyznosc" title="Krok 4: Chyżość Historyczna">4. Chyżość</button>
        <button class="tab-btn ${activeTabId === 'tab-quincunx' ? 'active' : ''}" id="tab-quincunx" title="Krok 5: Quincunx Bytu">5. Quincunx</button>
        <button class="tab-btn ${activeTabId === 'tab-lie' ? 'active' : ''}" id="tab-lie" title="Wskaźnik Kłamstwa Cywilizacyjnego">6. Test Kłamstwa</button>
      </div>

      <div id="view-sacrality" style="${activeTabId === 'tab-sacrality' ? '' : 'display:none'}">
        ${sacralityHero}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Mierzy, czy porządek życia zbiorowego (prawo, państwo, instytucje) posiada charakter sakralny, tzn. czy jest uznawany za święty, nietykalny i wyjęty spod krytyki moralnej i rozumowej.
        </div>
        <div class="section-title">13 Wskaźników Sakralności</div>
        ${sacralityCards}
      </div>
      <div id="view-spirit" style="${activeTabId === 'tab-spirit' ? '' : 'display:none'}">
        ${spiritHero}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Supremacja Ducha to agregacja 12 podstawowych indeksów: od dualizmu prawnego po odpowiedzialność urzędniczą.
           Określa dominację sił duchowych w kształtowaniu życia zbiorowego.
        </div>
        ${spiritCards}
      </div>
      <div id="view-generalia" style="${activeTabId === 'tab-generalia' ? '' : 'display:none'}">
        ${generaliaHero}
        ${mixtureAlertHtml}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Siedem Niewiadomych Etyki: Obowiązek, Bezinteresowność, Odpowiedzialność, Sprawiedliwość, Sumienie, Czas i Praca.
           Ocena spójności etycznej określa czy społeczeństwo opiera się na wolności osoby (Łacińska) czy przymusie gromadnościowym.
        </div>
        <div class="section-title">7 Generaliów Etycznych (Siedem Niewiadomych)</div>
        ${generaliaCards}
      </div>
      <div id="view-chyznosc" style="${activeTabId === 'tab-chyznosc' ? '' : 'display:none'}">
        ${chyznoscHero}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Wydajność cywilizacyjna (Chyżość Historyczna) to zdolność społeczności do oszczędzania i akumulacji czasu.
           Im wyższa chyżość, tym szybciej rozwijają się prawo, etyka i gospodarka, pozwalając kolejnym pokoleniom zaczynać tam, gdzie poprzednie skończyły.
        </div>
        <div class="section-title">Wskaźniki Opanowania Czasu i Kapitalizacji</div>
        ${timeMasteryCards}
      </div>
      <div id="view-quincunx" style="${activeTabId === 'tab-quincunx' ? '' : 'display:none'}">
        ${historyBadgeHtml}
        ${quincunxHero}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Pięciomian Bytu (Quincunx): Dobro, Prawda, Zdrowie, Dobrobyt i Piękno.
           Tylko Cywilizacja Łacińska rozwija harmonijnie wszystkie 5 sfer pod hegemonią Etyki. Brak jakiejkolwiek sfery czyni cywilizację defektowną.
        </div>
        <div class="section-title">11 Wskaźników Pięciomianu Bytu (Quincunx)</div>
        ${quincunxCards}
      </div>
      <div id="view-lie" style="${activeTabId === 'tab-lie' ? '' : 'display:none'}">
        ${lieHero}
        <div style="font-size: 13px; color: #9ca3af; padding: 0 20px; margin-bottom: 15px; line-height: 1.5; text-align: center;">
           Baseline: Celem istnienia człowieka jest zbawienie duszy (salus animarum), a prawo ma służyć Dobru i Dekalogowi.
           Współczynnik Kłamstwa bada odchylenie próbki na rzecz zbawienia zbiorowego, dwoistości sumienia lub statolatrii.
        </div>
        <div class="section-title">5 Wektorów Składowych Kłamstwa Cywilizacyjnego</div>
        <div style="padding: 0 20px;">
          ${lieBreakdownHtml}
        </div>
      </div>
      <div style="padding: 15px 20px 25px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); margin-top: 20px;">
        <button class="download-btn download-action-btn" style="padding: 8px 18px; font-size: 12.5px;">
          Pobierz Raport Wyników (JSON)
        </button>
      </div>
    `;

    const tabSacrality = content.querySelector('#tab-sacrality');
    const tabSpirit = content.querySelector('#tab-spirit');
    const tabGeneralia = content.querySelector('#tab-generalia');
    const tabChyznosc = content.querySelector('#tab-chyznosc');
    const tabQuincunx = content.querySelector('#tab-quincunx');
    const tabLie = content.querySelector('#tab-lie');
    const viewSacrality = content.querySelector('#view-sacrality');
    const viewSpirit = content.querySelector('#view-spirit');
    const viewGeneralia = content.querySelector('#view-generalia');
    const viewChyznosc = content.querySelector('#view-chyznosc');
    const viewQuincunx = content.querySelector('#view-quincunx');
    const viewLie = content.querySelector('#view-lie');

    function switchTab(tabBtn, viewDiv) {
      [tabSacrality, tabSpirit, tabGeneralia, tabChyznosc, tabQuincunx, tabLie].forEach(t => t && t.classList.remove('active'));
      [viewSacrality, viewSpirit, viewGeneralia, viewChyznosc, viewQuincunx, viewLie].forEach(v => v && (v.style.display = 'none'));
      if (tabBtn) tabBtn.classList.add('active');
      if (viewDiv) viewDiv.style.display = 'block';
    }

    if (tabSacrality) tabSacrality.addEventListener('click', () => switchTab(tabSacrality, viewSacrality));
    if (tabSpirit) tabSpirit.addEventListener('click', () => switchTab(tabSpirit, viewSpirit));
    if (tabGeneralia) tabGeneralia.addEventListener('click', () => switchTab(tabGeneralia, viewGeneralia));
    if (tabChyznosc) tabChyznosc.addEventListener('click', () => switchTab(tabChyznosc, viewChyznosc));
    if (tabQuincunx) tabQuincunx.addEventListener('click', () => switchTab(tabQuincunx, viewQuincunx));
    if (tabLie) tabLie.addEventListener('click', () => switchTab(tabLie, viewLie));

    // Bind Download JSON action buttons
    content.querySelectorAll('.download-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        downloadResultsJson(data);
      });
    });

    // Bind Zapytaj buttons
    content.querySelectorAll('.zapytaj-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        runAnalysis(btn.getAttribute('data-target'));
      });
    });


    // Bind Stepper Timeline Stage buttons
    content.querySelectorAll('.civ-stage-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sIdx = parseInt(btn.getAttribute('data-stage'), 10);
        const stage = civStagesData[sIdx];
        if (!stage) return;

        content.querySelectorAll('.civ-stage-btn').forEach((b, idx) => {
          const isActive = idx === sIdx;
          b.style.background = isActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.6)';
          b.style.borderColor = isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)';
          const numEl = b.querySelector('.stg-num');
          const nameEl = b.querySelector('.stg-name');
          const barEl = b.querySelector('.stg-bar');
          if (numEl) numEl.style.color = isActive ? '#38bdf8' : '#64748b';
          if (nameEl) nameEl.style.color = isActive ? '#ffffff' : '#94a3b8';
          if (barEl) barEl.style.background = isActive ? '#38bdf8' : (idx < sIdx ? '#10b981' : 'rgba(255,255,255,0.06)');
        });

        const badge = content.querySelector('#civ-stage-badge');
        if (badge) badge.innerText = `Obecny Szczebel: Stage #${stage.num}`;

        const container = content.querySelector('#civ-stage-details-container');
        if (container) container.innerHTML = renderStageDetail(stage);
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

    // 1. Check if user highlighted/selected text (ideal for Polona scans, excerpts, etc.)
    const selection = window.getSelection ? window.getSelection().toString() : '';
    if (selection && selection.trim().length > 30) {
      return clean(selection);
    }

    // 2. Check digital libraries (Polona), articles, OCR containers and main content
    const selectors = [
      'polona-transcription',
      'app-transcription',
      '.transcription',
      '[data-test="transcription"]',
      '#transcription',
      '.item-metadata',
      '.ocr-text',
      '.metadata-container',
      '.document-text',
      '.reader-content',
      'article',
      'main',
      '[role="main"]',
      '#content',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content'
    ];

    for (const s of selectors) {
      const el = document.querySelector(s);
      if (el && el.innerText && el.innerText.trim().length > 100) {
        return clean(el.innerText);
      }
    }

    // 3. Aggregate paragraphs/metadata elements if article containers missing
    const paragraphs = Array.from(document.querySelectorAll('p, .metadata-value, .description'))
      .map(p => p && p.innerText ? p.innerText.trim() : '')
      .filter(t => t.length > 20);

    if (paragraphs.length > 0) {
      const joined = paragraphs.join(' ');
      if (joined.length > 100) return clean(joined);
    }

    // 4. Fallback to body text
    return clean(document.body ? document.body.innerText || '' : '');
  }

  function clean(str) {
    return str.replace(/\s+/g, ' ').replace(/[\t\r\n]/g, ' ').trim();
  }

  function getStorageData() {
    return new Promise(resolve => {
      chrome.storage.local.get(['backendUrl', 'apiKey', 'selectedIndices', 'analysisMode'], data => {
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
