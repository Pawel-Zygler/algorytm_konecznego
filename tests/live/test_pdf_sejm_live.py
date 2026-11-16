import json
import os
import shutil
import subprocess
import tempfile

import pytest
from dotenv import load_dotenv

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EXT_DIR = os.path.join(REPO_ROOT, "extension")
SEJM_DRUK_3003_PDF_URL = (
    "https://orka.sejm.gov.pl/Druki10ka.nsf/0/7C7FD6F6C20FF209C1258E5100241710/%24File/3003.pdf"
)


def _load_gemini_api_key() -> str:
    load_dotenv(os.path.join(REPO_ROOT, "backend", ".env"))
    return (os.environ.get("GEMINI_API_KEY") or "").strip()


@pytest.mark.live
def test_sejm_druk_3003_pdf_live_direct_extension():
    """Live integration test downloading Sejm Druk 3003 PDF and analyzing it via standalone extension JS."""
    api_key = _load_gemini_api_key()
    if not api_key:
        pytest.skip("Brak GEMINI_API_KEY w środowisku lub backend/.env")

    tmp_dir = tempfile.mkdtemp(prefix="koneczny_live_pdf_")
    try:
        shutil.copytree(os.path.join(EXT_DIR, "services"), os.path.join(tmp_dir, "services"))
        shutil.copy2(os.path.join(EXT_DIR, "background.js"), os.path.join(tmp_dir, "background.js"))
        with open(os.path.join(tmp_dir, "package.json"), "w", encoding="utf-8") as f:
            json.dump({"type": "module"}, f)

        runner = os.path.join(tmp_dir, "live_runner.mjs")
        with open(runner, "w", encoding="utf-8") as f:
            f.write(f"""
let listener = null;
globalThis.chrome = {{
  runtime: {{
    onMessage: {{
      addListener(fn) {{ listener = fn; }},
    }},
  }},
  storage: {{
    local: {{
      get(_keys, cb) {{ cb({{}}); }},
      set(_obj, cb) {{ if (cb) cb(); }},
    }},
  }},
}};

await import('./background.js');

const response = await new Promise((resolve) => {{
  listener(
    {{
      action: 'ANALYZE_TEXT',
      apiKey: {json.dumps(api_key)},
      payload: {{
        pdf_url: {json.dumps(SEJM_DRUK_3003_PDF_URL)},
        url: {json.dumps(SEJM_DRUK_3003_PDF_URL)},
        title: 'Druk nr 3003 - Projekt ustawy o środkach ograniczających',
        mode: 'mantis',
      }},
    }},
    {{}},
    resolve
  );
}});

console.log(JSON.stringify(response));
""")

        proc = subprocess.run(
            ["node", runner],
            capture_output=True,
            text=True,
            timeout=180,
            check=False,
        )
        assert proc.returncode == 0, f"Node live runner failed:\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}"
        last_line = proc.stdout.strip().splitlines()[-1]
        res = json.loads(last_line)

        if not res.get("ok") and "HTTP 403" in (res.get("error") or ""):
            pytest.skip("orka.sejm.gov.pl odrzuciło klienta Node (Imperva WAF HTTP 403 — w Chrome używa cookies sesji przeglądarki)")

        assert res.get("ok") is True, f"Analysis failed: {res.get('error')}"
        data = res["data"]
        assert data["analyzed_via"] == "chrome-direct"
        assert data.get("primary_civilization")
        assert len(data.get("mantis_gates", [])) == 5

        raw_ratings = data.get("raw_ratings", {})
        assert "sacrality_scores" in raw_ratings
        assert "legal_dualism_scores" in raw_ratings
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
