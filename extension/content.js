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

    /* ── Loading ── */
    .loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 0;
      gap: 14px;
    }
    .spinner-photo {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      animation: spin 3s linear infinite;
      box-shadow: 0 0 0 3px #18181b, 0 0 0 5px #e4e4e7;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loader-label { font-size:13px; color:#71717a; font-weight:500; }

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

  // ── Analysis ──────────────────────────────────────────
  async function runAnalysis(targetIndexStr = null) {
    content.innerHTML = `
      <div class="loader">
        <img class="spinner-photo" src="${konecznyImg}" alt="Analizuję...">
        <div class="loader-label" id="loader-label-text">Profesor analizuje tekst…</div>
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
      "Oceniam podejście do dziedziczenia własności..."
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
      "Czy praca dla korporacji to powrót cywilizacji chińskiej?"
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
    }, 2800);

    try {
      const config = await getStorageData();
      const backendUrl = config.backendUrl || 'http://localhost:8000';
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
      clearInterval(window.konecznyLoadingInterval);
      content.innerHTML = `
        <div class="error-box">
          <strong>Błąd analizy</strong>
          ${err.message}
          <div class="error-hint">Upewnij się, że backend FastAPI działa i klucz API Gemini jest ustawiony.</div>
        </div>
      `;
    }
  }


  // Global state
  window.konecznyResults = window.konecznyResults || { raw_ratings: {} };
  // ── Render ─────────────────────────────────────────────
  function renderResults() {
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
      FAMILY_AUTONOMY: { name: 'Autonomia Rodziny', question: 'Czy autonomia rodziny jest, ograniczona, czy jej nie ma?' },
      PROPERTY_PROTECTION: { name: 'Ochrona Własności', question: 'Czy własność prywatna jest chroniona, warunkowo chroniona czy nie ma?' },
      NATURAL_INHERITANCE: { name: 'Dziedziczenie Naturalne', question: 'Czy dziedziczenie jest naturalnie regulowane czy kontrolowane?' },
      POWER_LIMITS: { name: 'Granice Władzy', question: 'Czy istnieją granice władzy realne, formalne czy brak?' },
      OPPOSITION_RIGHT: { name: 'Prawo Sprzeciwu', question: 'Czy jest możliwość sprzeciwu, jest ograniczona, nie ma?' },
      STATE_MORALITY_SUBORDINATION: { name: 'Podporządkowanie Państwa Moralności', question: 'Czy państwo jest podporządkowane moralności całe, częściowo czy wcale?' },
      DIVINE_VS_CAESAR: { name: 'Boskie i Cesarskie', question: 'Czy jest podział na to co boskie i cesarskie?' },
      RULER_ETHICS_EQUALITY: { name: 'Zrównanie Etyczne Władcy', question: 'Czy państwo i król podlegają tym samym normom etycznym?' },
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
      STATOLATRY_PUBLIC_MONISM: { name: 'Statolatria (Monizm Publ.)', question: 'Czy jest zjawisko statolatrii jako monizm prawa publicznego?' },
      PRIVATE_LAW_MONISM: { name: 'Monizm Prawa Prywatnego', question: 'Czy jest monizm prawa prywatnego jak w turańszczyźnie?' },
      CITIZENS_AS_HOSTAGES: { name: 'Obywatele jako Zakładnicy', question: 'Czy mieszkańcy są niewolnikami albo zakładnikami władcy?' },
      SACRAL_LAW_MONOPOLY: { name: 'Monopol Prawa Sakralnego', question: 'Czy drobiazgowe prawo rytualne wyklucza autonomiczne prawo świeckie?' },
      EXCESS_REGULATION: { name: 'Nadmiar Przepisów', question: 'Czy jest nadmiar przepisów pożerających prawo prywatne?' }
    };

    const PLURALISM_META = {
      MULTIPLE_LAW_SOURCES: { name: 'Wielosc Zrodel Prawa', question: 'Czy prawo ma wiele współistniejących źródeł (prawo naturalne, etyka, zwyczaj)?' },
      SINGLE_LAW_SOURCE: { name: 'Jedno Zrodlo Prawa', question: 'Czy prawo ma jedno źródło takie jak państwo, doktryna, albo wola władcy?' },
      LAW_DISCOVERY_VS_CREATION: { name: 'Odkrywanie czy Narzucanie', question: 'Czy prawo jest odkrywane i porządkowane, czy wytwarzane i narzucane?' },
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
      SINGLE_IMMUTABLE_SOURCE: { name: 'Niezmienne Zrodlo', question: 'Czy źródło prawa jest jedno i niezmienne (jak w Żydowskiej)?' },
      WODZ_WILL_VS_MULTIPLE: { name: 'Wola Wodza', question: 'Czy źródłem prawa jest wyłącznie wola wodza?' },
      STATE_ONLY_LAW_SOURCE: { name: 'Panstwo Jedyne Zrodlo', question: 'Czy tylko państwo jest źródłem prawa?' },
      SOCIALIST_DOCTRINE_COERCION: { name: 'Doktryna Socjalistyczna', question: 'Czy socjalizm i garstka doktrynerów wymyśla formuły by naginać narody?' }
    };

    const APOSTERIORI_META = {
      LAW_SANCTIONING_FACTS_VS_IDEAS: { name: 'Fakty czy Pomysly', question: 'Czy prawo sankcjonuje istniejące fakty z doświadczenia (aposteriori) czy zmyślone pomysły (apriori)?' },
      STATE_AS_EDUCATOR: { name: 'Panstwo Wychowawca', question: 'Czy państwo przypisuje sobie rolę wychowawcy społeczeństwa przez ustawy?' },
      INDUCTION_VS_DEDUCTION: { name: 'Indukcja czy Dedukcja', question: 'Czy system prawny opiera się na indukcji z faktów czy na dedukcji z formuły?' },
      UNITY_BY_DIVERSITY_VS_UNIFORMITY: { name: 'Rozmaitosc czy Jednostajnosc', question: 'Czy jedność zrzeszenia buduje się przez rozmaitość czy przez narzuconą jednostajność?' },
      SOCIAL_ENGINEERING_CULT: { name: 'Inzynieria Spoleczna', question: 'Czy istnieje kult biur planowania i inżynierii społecznej?' },
      ETHICS_PRECEDES_LAW: { name: 'Etyka Wyprzedza Prawo', question: 'Czy etyka wyprzedza prawo, czy prawo wyprzedza etykę?' },
      HISTORICISM_AS_BASE: { name: 'Historyzm jako Podstawa', question: 'Czy istnieje historyzm jako podstawa aposteriorycznego prawodawstwa?' },
      HISTORICISM_FOUNDATION: { name: 'Fundament Historyzmu', question: 'Czy istnieje historyzm jako fundament aposterioryzmu?' },
      HUMAN_PERSONALISM_PRESENCE: { name: 'Obecnosc Personalizmu', question: 'Czy istnieje personalizm osoby ludzkiej z wolną wolą utrudniającą ujęcie w sztywne ramy aprioryzmu?' },
      LEGAL_DUALISM_PRESENCE: { name: 'Obecnosc Dualizmu', question: 'Czy istnieje dualizm prawny (brak narzucanej woli obozowej)?' },
      FAMILY_EMANCIPATION_FOR_EXPERIENCE: { name: 'Emancypacja Rodziny dla Doswiadczenia', question: 'Czy rodzina jest wyemancypowana by prawo mogło oprzeć się na doświadczeniu?' },
      NORMS_IMMUTABLE_VS_EVOLVING: { name: 'Normy Niezmienne czy Ewoluujace', question: 'Czy normy życia są podane z góry i nie podlegają ewolucji, czy ewoluują z doświadczenia?' },
      MECHANICAL_SOCIETY_METHOD: { name: 'Metoda Mechaniczna', question: 'Czy metoda zrzeszenia jest mechaniczna?' },
      ENDLESS_UTOPIAN_PLANNING: { name: 'Planowanie Utopii', question: 'Czy planuje się bez końca utopie i urojone prawa?' },
      EXCESSIVE_LEGISLATION_APRIORI: { name: 'Nadmiar Ustaw', question: 'Czy jest nadmiar ustaw próbujących przewidzieć każdy krok człowieka?' }
    };

    const ORGANISM_META = {
      SELF_HEALING_CAPACITY: { name: 'Zdolnosc Samoleczenia', question: 'Czy zrzeszenie posiada zdolność do samoleczenia (organizm), czy wymaga naprawy z zewnątrz (mechanizm)?' },
      UNITY_IN_DIVERSITY: { name: 'Jednosc w Rozmaitosci', question: 'Czy jedność budowana jest przez różnorodność, czy przez jednostajność?' },
      ENGINEERING_GOVERNMENT: { name: 'Rzady Inzynierskie', question: 'Czy władza traktuje społeczeństwo jak maszynę (aprioryzm)?' },
      ACTION_CULTURE_VS_PASSIVITY: { name: 'Kultura Czynu', question: 'Czy motorem działania jest kultura czynu (organizm), czy bierność i ślepe posłuszeństwo (mechanizm)?' },
      BUREAUCRACY_ELEPHANTIASIS: { name: 'Przerost Biurokracji', question: 'Czy istnieje elephantiasis biurokracji i ustawodawstwa?' },
      ABSTRACTS_RECOGNITION: { name: 'Rola Abstraktow', question: 'Czy zrzeszenie uznaje rolę abstraktów (idei) wykraczających poza walkę o byt?' },
      STATE_AS_TOOL_VS_GOAL: { name: 'Panstwo jako Cel/Srodek', question: 'Czy państwo jest celem samym w sobie, czy narzędziem (środkiem) dla społeczeństwa?' },
      PERSONALISM_FREE_WILL: { name: 'Personalizm i Wolna Wola', question: 'Czy panuje personalizm i szacunek dla wolnej woli człowieka?' },
      LEGAL_DUALISM_NECESSITY: { name: 'Koniecznosc Dualizmu', question: 'Czy jest dualizm prawny jako oparcie dla społeczeństwa?' },
      HISTORICISM_TRADITION: { name: 'Historyzm i Tradycja', question: 'Czy organizm wyrasta z doświadczeń pokoleń (historyzm i aposterioryzm)?' },
      APRIORISM_PLANNING: { name: 'Aprioryzm i Planowanie', question: 'Czy dominuje aprioryzm i odgórne planowanie zmyślonej rzeczywistości?' },
      COERCION_AS_MAIN_BOND: { name: 'Przymus jako Wiez', question: 'Czy przymus jest główną więzią zrzeszenia?' }
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
      GOD_RELATION_PERSONAL_VS_COLLECTIVE: { name: 'Relacja z Bogiem', question: 'Czy relacja z Bogiem jest osobista czy zbiorowa (z przynależności do narodu/kasty)?' },
      RESPONSIBILITY_PERSONAL_VS_COLLECTIVE: { name: 'Odpowiedzialnosc Osobista', question: 'Czy odpowiedzialność jest osobista czy zbiorowa?' },
      CONFESSION_PERSONAL_VS_COLLECTIVE: { name: 'Spowiedz', question: 'Czy spowiedź jest osobista czy gromadna?' },
      FAMILY_EMANCIPATION_FROM_CLAN: { name: 'Emancypacja z Rodu', question: 'Czy syn zostaje usamodzielniony (emancypacja rodziny) czy należy do seniora rodu?' },
      WOMAN_PERSONAL_FREEDOM: { name: 'Wolnosc Kobiety', question: 'Czy kobieta jest wolna osobiście czy jest własnością rodu, kasty, ojca, męża?' },
      PRIVATE_PROPERTY_INDEPENDENCE: { name: 'Niezaleznosc przez Wlasnosc', question: 'Czy istnieje własność prywatna dająca niezależność od władzy?' },
      NEIGHBOR_DUTY_UNIVERSAL_VS_TRIBAL: { name: 'Obowiazek Blizniego', question: 'Czy obowiązek bliźniego dotyczy wszystkich, czy tylko "swoich"?' },
      WORK_AS_SANCTIFICATION_VS_COERCION: { name: 'Stosunek do Pracy', question: 'Czy praca to uświęcenie i droga osobista, czy ciężar przymusu?' },
      PERSONAL_RESPONSIBILITY_PRESENCE: { name: 'Obecnosc Odpowiedzialnosci', question: 'Czy istnieje wykształcona odpowiedzialność osobista?' },
      FAMILY_EMANCIPATION_GENERAL: { name: 'Emancypacja Rodziny', question: 'Czy jest emancypacja rodziny z systemu rodowego?' },
      STATUS_BY_BIRTH_PRIVILEGE: { name: 'Status z Urodzenia', question: 'Czy status zależy od przywileju urodzenia?' },
      STATUS_BY_CASTE_MEMBERSHIP: { name: 'Status z Kasty', question: 'Czy status zależy od przynależności do kasty?' },
      LEGAL_MONISM_PRESENCE: { name: 'Monizm Prawny (Trybik)', question: 'Czy jest monizm prawny (statolatria), robiący z jednostki trybik?' },
      UNIFORMITY_MECHANICISM_PRESENCE: { name: 'Jednostajnosc (Anarchizm)', question: 'Czy jest mechanicyzm traktujący personalizm jako wymysł i anarchię?' },
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
                <span class="answer-pct" style="color:${barColor}">${pct}</span>
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

    function buildDarkHero(title, pct, statusText) {
      const isMissing = pct < 0;
      const displayPct = isMissing ? 'N/A' : `${pct}%`;
      const displayStatus = isMissing ? 'Brak danych w tekście' : statusText;
      const C = 2 * Math.PI * 28;
      const dashOffset = isMissing ? C : C - (pct / 100) * C;
      const ringColor = isMissing ? '#52525b' : (pct >= 65 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#ef4444');

      return `
        <div class="dark-hero-card">
          <div>
            <div class="dark-hero-label">${title}</div>
            <div class="dark-hero-val" style="color: ${isMissing ? '#a1a1aa' : '#fff'}">${displayPct}</div>
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
            <div class="dark-ring-pct" style="color: ${isMissing ? '#71717a' : '#fff'}">${displayPct}</div>
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

    const INDEX_DEV_FLAGS = {
      sacrality: false,
      spirit: false,
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
      administrative_responsibility: true
    };


    const sacralityCards = Object.keys(sacralityScores).length > 0 ? buildCardsGroup(sacralityScores, SACRALITY_META) : `
      <div id="loader-sacrality" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.sacrality ? `<button class="tab-btn active zapytaj-btn" data-target="sacrality" data-loader="loader-sacrality" data-name="Indeks Sakralności i Duch" style="margin:0 auto; padding:10px 20px;">
          Zapytaj (Pobierz dane)
        </button>` : `<div style="color:#666; font-size:14px; padding:15px; background:rgba(255,255,255,0.05); border-radius:8px;">Indeks obecnie wyłączony (isUnderDev = false)</div>`}
      </div>`;
      
    const spiritCards = Object.keys(spiritScores).length > 0 ? buildCardsGroup(spiritScores, SPIRIT_META) : `
      <div id="loader-spirit" style="padding:20px; text-align:center;">
        ${INDEX_DEV_FLAGS.spirit ? `<button class="tab-btn active zapytaj-btn" data-target="spirit" data-loader="loader-spirit" data-name="Supremacja Ducha" style="margin:0 auto; padding:10px 20px;">
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

    content.innerHTML = `
      <div class="tab-bar">
        <button class="tab-btn active" id="tab-sacrality">Indeks Sakralności</button>
        <button class="tab-btn" id="tab-spirit">Supremacja Ducha</button>
        <button class="tab-btn" id="tab-dualism">Dualizm Prawny</button>
        <button class="tab-btn" id="tab-pluralism">Pluralizm Źródeł Prawa</button>
        <button class="tab-btn" id="tab-aposteriori">Aposteriori vs Apriori</button>
        <button class="tab-btn" id="tab-organism">Organizm vs Mechanizm</button>
        <button class="tab-btn" id="tab-personalism">Personalizm</button>
        <button class="tab-btn" id="tab-family">Autonomia Rodziny</button>
        <button class="tab-btn" id="tab-church">Niezależność Kościoła</button>
        <button class="tab-btn" id="tab-property">Stabilność Własności</button>
        <button class="tab-btn" id="tab-inheritance">Ciągłość Dziedziczenia</button>
        <button class="tab-btn" id="tab-morality">Supremacja Moralności</button>
        <button class="tab-btn" id="tab-public_morality">Moralność Publiczna</button>
        <button class="tab-btn" id="tab-admin_resp">Odpowiedzialność Urzędnicza</button>
      </div>

      <div id="view-sacrality">
        ${sacralityHero}
        <div class="section-title">13 Wskaźników Sakralności</div>
        ${sacralityCards}
      </div>
      <div id="view-spirit" style="display:none">
        ${spiritHero}
        <div class="section-title">12 Wskaźników Cywilizacyjnych</div>
        ${spiritCards}
      </div>
      <div id="view-dualism" style="display:none">
        ${dualismHero}
        <div class="section-title">25 Wskaźników Dualizmu Prawnego</div>
        ${dualismCards}
      </div>
      <div id="view-pluralism" style="display:none">
        ${pluralismHero}
        <div class="section-title">20 Wskaźników Pluralizmu</div>
        ${pluralismCards}
      </div>
      <div id="view-aposteriori" style="display:none">
        ${aposterioriHero}
        <div class="section-title">15 Wskaźników Aposterioryzmu</div>
        ${aposterioriCards}
      </div>
      <div id="view-organism" style="display:none">
        ${organismHero}
        <div class="section-title">12 Wskaźników Organizmu</div>
        ${organismCards}
      </div>
      <div id="view-personalism" style="display:none">
        ${personalismHero}
        <div class="section-title">16 Wskaźników Personalizmu</div>
        ${personalismCards}
      </div>
      <div id="view-family" style="display:none">
        ${familyHero}
        <div class="section-title">14 Wskaźników Autonomii Rodziny</div>
        ${familyCards}
      </div>
      <div id="view-church" style="display:none">
        ${churchHero}
        <div class="section-title">15 Wskaźników Niezawisłości Kościoła</div>
        ${churchCards}
      </div>
      <div id="view-property" style="display:none">
        ${propertyHero}
        <div class="section-title">13 Wskaźników Stabilności Własności</div>
        ${propertyCards}
      </div>
      <div id="view-inheritance" style="display:none">
        ${inheritanceHero}
        <div class="section-title">15 Wskaźników Ciągłości Dziedziczenia</div>
        ${inheritanceCards}
      </div>
      <div id="view-morality" style="display:none">
        ${moralityHero}
        <div class="section-title">15 Wskaźników Supremacji Moralności</div>
        ${moralityCards}
      </div>
      <div id="view-public_morality" style="display:none">
        ${publicMoralityHero}
        <div class="section-title">16 Wskaźników Moralności Publicznej</div>
        ${publicMoralityCards}
      </div>
      <div id="view-admin_resp" style="display:none">
        ${adminRespHero}
        <div class="section-title">16 Wskaźników Odpowiedzialności Urzędniczej</div>
        ${adminRespCards}
      </div>
    `;

    const tabSacrality = content.querySelector('#tab-sacrality');
    const tabSpirit    = content.querySelector('#tab-spirit');
    const tabDualism   = content.querySelector('#tab-dualism');
    const tabPluralism = content.querySelector('#tab-pluralism');
    const tabAposteriori = content.querySelector('#tab-aposteriori');
    const tabOrganism = content.querySelector('#tab-organism');
    const tabPersonalism = content.querySelector('#tab-personalism');
    const tabFamily = content.querySelector('#tab-family');
    const tabChurch = content.querySelector('#tab-church');
    const tabProperty = content.querySelector('#tab-property');
    const tabInheritance = content.querySelector('#tab-inheritance');
    const tabMorality = content.querySelector('#tab-morality');
    const tabPublicMorality = content.querySelector('#tab-public_morality');
    const tabAdminResp = content.querySelector('#tab-admin_resp');
    const viewSacrality = content.querySelector('#view-sacrality');
    const viewSpirit    = content.querySelector('#view-spirit');
    const viewDualism   = content.querySelector('#view-dualism');
    const viewPluralism = content.querySelector('#view-pluralism');
    const viewAposteriori = content.querySelector('#view-aposteriori');
    const viewOrganism = content.querySelector('#view-organism');
    const viewPersonalism = content.querySelector('#view-personalism');
    const viewFamily = content.querySelector('#view-family');
    const viewChurch = content.querySelector('#view-church');
    const viewProperty = content.querySelector('#view-property');
    const viewInheritance = content.querySelector('#view-inheritance');
    const viewMorality = content.querySelector('#view-morality');
    const viewPublicMorality = content.querySelector('#view-public_morality');
    const viewAdminResp = content.querySelector('#view-admin_resp');

    function switchTab(tabBtn, viewDiv) {
      [tabSacrality, tabSpirit, tabDualism, tabPluralism, tabAposteriori, tabOrganism, tabPersonalism, tabFamily, tabChurch, tabProperty, tabInheritance, tabMorality, tabPublicMorality, tabAdminResp].forEach(t => t.classList.remove('active'));
      [viewSacrality, viewSpirit, viewDualism, viewPluralism, viewAposteriori, viewOrganism, viewPersonalism, viewFamily, viewChurch, viewProperty, viewInheritance, viewMorality, viewPublicMorality, viewAdminResp].forEach(v => v.style.display = 'none');
      tabBtn.classList.add('active');
      viewDiv.style.display = 'block';
    }

    tabSacrality.addEventListener('click', () => switchTab(tabSacrality, viewSacrality));
    tabSpirit.addEventListener('click', () => switchTab(tabSpirit, viewSpirit));
    tabDualism.addEventListener('click', () => switchTab(tabDualism, viewDualism));
    tabPluralism.addEventListener('click', () => switchTab(tabPluralism, viewPluralism));
    tabAposteriori.addEventListener('click', () => switchTab(tabAposteriori, viewAposteriori));
    tabOrganism.addEventListener('click', () => switchTab(tabOrganism, viewOrganism));
    tabPersonalism.addEventListener('click', () => switchTab(tabPersonalism, viewPersonalism));
    tabFamily.addEventListener('click', () => switchTab(tabFamily, viewFamily));
    tabChurch.addEventListener('click', () => switchTab(tabChurch, viewChurch));
    tabProperty.addEventListener('click', () => switchTab(tabProperty, viewProperty));
    tabInheritance.addEventListener('click', () => switchTab(tabInheritance, viewInheritance));
    tabMorality.addEventListener('click', () => switchTab(tabMorality, viewMorality));
    tabPublicMorality.addEventListener('click', () => switchTab(tabPublicMorality, viewPublicMorality));
    tabAdminResp.addEventListener('click', () => switchTab(tabAdminResp, viewAdminResp));

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
      chrome.storage.local.get(['backendUrl','apiKey'], resolve);
    });
  }

})();
