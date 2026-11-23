import json
import os
import shutil
import subprocess
import tempfile

import pytest

from backend.analyzer import calculate_koneczny_metrics

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXT_DIR = os.path.join(REPO_ROOT, "extension")


def _run_node_esm(js_code: str) -> dict:
    """Runs an ES module test script against extension JS files in a temporary ESM directory."""
    tmp_dir = tempfile.mkdtemp(prefix="koneczny_js_test_")
    try:
        services_dst = os.path.join(tmp_dir, "services")
        shutil.copytree(os.path.join(EXT_DIR, "services"), services_dst)
        shutil.copy2(os.path.join(EXT_DIR, "background.js"), os.path.join(tmp_dir, "background.js"))
        with open(os.path.join(tmp_dir, "package.json"), "w", encoding="utf-8") as f:
            json.dump({"type": "module"}, f)

        script_path = os.path.join(tmp_dir, "runner.mjs")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(js_code)

        proc = subprocess.run(
            ["node", script_path],
            capture_output=True,
            text=True,
            check=False,
        )
        assert proc.returncode == 0, f"Node test failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        last_line = proc.stdout.strip().splitlines()[-1]
        return json.loads(last_line)
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


@pytest.mark.unit
def test_js_engine_math_parity_with_python():
    sample_llm_data = {
        "sacrality_scores": {"RELIGIOUS_LAW_SUPREMACY": {"score": 0.1}},
        "legal_dualism_scores": {"PRIVATE_RIGHTS_SPHERE": {"score": 0.9}},
        "church_independence_scores": {"hierarch_appointment": {"score": 0.85}},
        "conscience_status_scores": {"conscience_as_supreme_judge": {"score": 0.8}},
        "personalism_scores": {"PERSONAL_RESPONSIBILITY_PRESENCE": {"score": 0.9}},
        "public_morality_totality_scores": {"two_consciences_rejection": {"score": 0.85}},
        "generalia_scores": {"a": 1, "b": 1, "c": 1, "d": 1, "e": 1, "f": 1, "g": 1},
        "time_mastery_scores": {
            "scientific_chronology": 0.8,
            "active_critical_tradition": 0.8,
            "hereditary_surnames": 0.9,
            "capitalization_of_time": 0.9,
        },
        "health_scores": {"public_scientific_health_duty": 0.8},
        "truth_science_scores": {"pure_disinterested_truth": 0.8},
        "beauty_art_scores": {"beauty_allegory_of_good": 0.8},
        "work_ethos_scores": {"manual_work_dignity": 0.8},
    }

    py_metrics = calculate_koneczny_metrics(sample_llm_data)

    js_out = _run_node_esm(f"""
import {{ calculateKonecznyMetrics, applyMantisGates }} from './services/konecznyEngine.js';
const sample = {json.dumps(sample_llm_data)};
const jsMetrics = calculateKonecznyMetrics(sample);
const mantis = applyMantisGates('Konstytucja i prawo prywatne', jsMetrics);
console.log(JSON.stringify({{ jsMetrics, mantis }}));
""")

    js_metrics = js_out["jsMetrics"]
    for key in [
        "sacrality_score",
        "legal_dualism_score",
        "spirit_supremacy_score",
        "ethical_coherence_score",
        "mixture_alert",
        "time_mastery_efficiency_score",
        "quincunx_coherence_score",
    ]:
        assert js_metrics[key] == py_metrics[key], f"Mismatch for {key}: JS={js_metrics[key]} vs PY={py_metrics[key]}"

    for cat_key, cat_val in py_metrics["quincunx_categories"].items():
        assert js_metrics["quincunx_categories"][cat_key] == pytest.approx(cat_val, abs=0.011)

    assert js_out["mantis"]["primary_civilization"] == "Łacińska"
    assert len(js_out["mantis"]["mantis_gates"]) == 5


@pytest.mark.unit
def test_prompts_modes_and_pdf_prompt_shape():
    js_out = _run_node_esm("""
import { buildTasksForAnalysis, INDICATOR_ITEM_SCHEMA } from './services/prompts.js';
const mantisTasks = buildTasksForAnalysis('A'.repeat(100), 'mantis', null, false);
const liteTasks = buildTasksForAnalysis('A'.repeat(100), 'lite', null, false);
const fullTasks = buildTasksForAnalysis('A'.repeat(100), 'full', null, false);
const spiritTasks = buildTasksForAnalysis('A'.repeat(100), 'full', ['spirit'], false);
const pdfTasks = buildTasksForAnalysis('', 'mantis', null, true);
console.log(JSON.stringify({
  mantisCount: mantisTasks.length,
  liteCount: liteTasks.length,
  fullCount: fullTasks.length,
  spiritCount: spiritTasks.length,
  pdfCount: pdfTasks.length,
  pdfPrompt: pdfTasks[0].prompt,
  requiredFields: INDICATOR_ITEM_SCHEMA.required,
}));
""")

    assert js_out["mantisCount"] == 6
    assert js_out["liteCount"] == 7
    assert js_out["fullCount"] == 24
    assert js_out["spiritCount"] == 12
    assert js_out["pdfCount"] == 6
    assert "załączony dokument PDF" in js_out["pdfPrompt"]
    assert "news_examples" in js_out["requiredFields"]


@pytest.mark.unit
def test_gemini_client_models_and_pdf_handling():
    gemini_client_path = os.path.join(EXT_DIR, "services", "geminiClient.js")
    with open(gemini_client_path, "r", encoding="utf-8") as f:
        src = f.read()
    assert "gemini-1.5-flash" not in src
    assert "gemini-3.6-flash" in src

    js_out = _run_node_esm("""
import { fetchPdfAsPart } from './services/geminiClient.js';

// Mock small PDF (<= 12 MB) -> inlineData
globalThis.fetch = async () => ({
  ok: true,
  arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer, // %PDF
});
const smallPart = await fetchPdfAsPart('https://example.com/small.pdf', 'test-key');

// Mock large PDF (> 12 MB) -> Gemini Files API upload
let uploadCalled = false;
globalThis.fetch = async (url) => {
  if (url.includes('/upload/v1beta/files')) {
    uploadCalled = true;
    return {
      ok: true,
      json: async () => ({ file: { uri: 'https://generativelanguage.googleapis.com/v1beta/files/abc123' } }),
    };
  }
  return {
    ok: true,
    arrayBuffer: async () => new Uint8Array(13 * 1024 * 1024).buffer,
  };
};
const largePart = await fetchPdfAsPart('https://example.com/large.pdf', 'test-key');

console.log(JSON.stringify({ smallPart, largePart, uploadCalled }));
""")

    assert js_out["smallPart"]["inlineData"]["mimeType"] == "application/pdf"
    assert js_out["smallPart"]["inlineData"]["data"] == "JVBERg=="
    assert js_out["uploadCalled"] is True
    assert js_out["largePart"]["fileData"]["mimeType"] == "application/pdf"
    assert js_out["largePart"]["fileData"]["fileUri"].endswith("/files/abc123")


@pytest.mark.unit
def test_background_service_worker_handles_pdf_analysis():
    js_out = _run_node_esm("""
let listener = null;
globalThis.chrome = {
  runtime: {
    onMessage: {
      addListener(fn) { listener = fn; },
    },
  },
  storage: {
    local: {
      get(_keys, cb) { cb({}); },
      set(_obj, cb) { if (cb) cb(); },
    },
  },
};

globalThis.fetch = async (url) => {
  if (url.endsWith('.pdf')) {
    return {
      ok: true,
      arrayBuffer: async () => new Uint8Array([37, 80, 68, 70]).buffer,
    };
  }
  return {
    ok: true,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify({
              sacrality_scores: { RELIGIOUS_LAW_SUPREMACY: { score: 0.1, explanation: 'ok', news_examples: ['a','b','c'] } },
              legal_dualism_scores: { PRIVATE_RIGHTS_SPHERE: { score: 0.9, explanation: 'ok', news_examples: ['a','b','c'] } },
              church_independence_scores: { hierarch_appointment: { score: 0.9, explanation: 'ok', news_examples: ['a','b','c'] } },
              conscience_status_scores: { conscience_as_supreme_judge: { score: 0.9, explanation: 'ok', news_examples: ['a','b','c'] } },
              personalism_scores: { PERSONAL_RESPONSIBILITY_PRESENCE: { score: 0.9, explanation: 'ok', news_examples: ['a','b','c'] } },
              public_morality_totality_scores: { two_consciences_rejection: { score: 0.9, explanation: 'ok', news_examples: ['a','b','c'] } },
            }),
          }],
        },
      }],
    }),
  };
};

await import('./background.js');

const response = await new Promise((resolve) => {
  listener(
    {
      action: 'ANALYZE_TEXT',
      apiKey: 'AIzaTestKey',
      payload: { pdf_url: 'https://orka.sejm.gov.pl/Druk/3003.pdf', url: 'https://orka.sejm.gov.pl/Druk/3003.pdf', title: 'Druk nr 3003', mode: 'mantis' },
    },
    {},
    resolve
  );
});

console.log(JSON.stringify(response));
""")

    assert js_out["ok"] is True
    assert js_out["data"]["analyzed_via"] == "chrome-direct"
    assert js_out["data"]["primary_civilization"] == "Łacińska"
    assert len(js_out["data"]["mantis_gates"]) == 5


@pytest.mark.unit
def test_talibowie_mentioning_hinduism_not_misclassified_as_brahmin():
    js_out = _run_node_esm("""
import { applyMantisGates } from './services/konecznyEngine.js';
const metrics = {
  sacrality_score: 0.9,
  legal_dualism_score: 0.1,
  church_independence_score: 0.1,
  conscience_status_score: 0.2,
  personalism_score: 0.15,
  public_morality_totality_score: 0.2,
};
const text = 'Talibowie wprowadzili szariat oparty na Koranie i prześladowali mniejszości, w tym wyznawców hinduizmu.';
const res = applyMantisGates(text, metrics);
console.log(JSON.stringify(res));
""")
    assert js_out["primary_civilization"] == "Sakralna uniwersalistyczna (wg Konecznego: arabska)"
    assert "kastowy" not in js_out["civilization_diagnosis"].lower()


@pytest.mark.unit
def test_deutschland_mentioning_china_not_misclassified_as_chinese():
    js_out = _run_node_esm("""
import { applyMantisGates } from './services/konecznyEngine.js';
const metrics = {
  sacrality_score: 0,
  legal_dualism_score: -1,
  church_independence_score: -1,
  conscience_status_score: -1,
  personalism_score: -1,
  public_morality_totality_score: -1,
};
const text = 'Deutschland ist die drittgrößte Volkswirtschaft der Welt nach den Vereinigten Staaten und China.';
const res = applyMantisGates(text, metrics);
console.log(JSON.stringify(res));
""")
    assert js_out["primary_civilization"] != "Chińska"
    assert js_out["primary_civilization"] == "Nieokreślona (Brak danych)"
    assert len(js_out["mantis_gates"]) == 5


@pytest.mark.unit
def test_sacral_subtype_near_threshold_is_undetermined_and_ignores_keywords():
    """K3.3/K3.4: wynik blisko progu -> wariant nierozstrzygnięty; słowa kluczowe w tekście nie wpływają na wynik."""
    js_out = _run_node_esm("""
import { applyMantisGates } from './services/konecznyEngine.js';
const metrics = {
  sacrality_score: 0.8,
  legal_dualism_score: 0.1,
  church_independence_score: 0.1,
  conscience_status_score: 0.36,
  personalism_score: 0.5,
  public_morality_totality_score: 0.3,
};
const text = 'Tora, Talmud, halacha, rabin, Izrael.';
const res = applyMantisGates(text, metrics);
console.log(JSON.stringify(res));
""")
    assert js_out["primary_civilization"] == "Sakralna (wariant nierozstrzygnięty)"
    assert "talmud" not in js_out["civilization_diagnosis"].lower()


@pytest.mark.unit
def test_sacral_communal_variant_uses_regime_label_not_group_name():
    """K3.1: wariant opisany typem ustroju; nazwa Konecznego tylko w nawiasie."""
    js_out = _run_node_esm("""
import { applyMantisGates } from './services/konecznyEngine.js';
const metrics = {
  sacrality_score: 0.85,
  legal_dualism_score: 0.1,
  church_independence_score: 0.1,
  conscience_status_score: 0.45,
  personalism_score: 0.55,
  public_morality_totality_score: 0.3,
};
const res = applyMantisGates('Kodeks prawa kanonicznego', metrics);
console.log(JSON.stringify(res));
""")
    assert js_out["primary_civilization"] == "Sakralna wspólnotowo-rodowa (wg Konecznego: żydowska)"
    assert "talmud" not in js_out["civilization_diagnosis"].lower()
    assert "kazuistyka" not in js_out["civilization_diagnosis"].lower()
