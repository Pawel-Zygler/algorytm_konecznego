import os
import json
import time
import re
import requests
import json_repair
from typing import Dict, Any
from backend import config
from backend import rag

INDEX_DEV_FLAGS = {
    "sacrality": True,
    "spirit": True,
    "generalia": True,
    "duty_source": True,
    "motivation": True,
    "responsibility_type": False,
    "justice_nature": True,
    "conscience_status": True,
    "time_mastery": True,
    "work_ethos": True,
    "quincunx": True,
    "health": True,
    "truth_science": True,
    "beauty_art": True,
    "civilizational_lie": True,
    "dualism": True,
    "pluralism": True,
    "aposteriori": True,
    "organism": True,
    "personalism": True,
    "family": True,
    "church": True,
    "property": True,
    "inheritance": True,
    "morality": True,
    "public_morality": True,
    "administrative_responsibility": True
}

indicator_item = {
    "type": "object", 
    "properties": {
        "score": {"type": "number"}, 
        "explanation": {"type": "string", "maxLength": 140}, 
        "news_examples": {"type": "array", "items": {"type": "string", "maxLength": 75}, "minItems": 3, "maxItems": 3}
    }, 
    "required": ["score", "explanation", "news_examples"]
}

# Cache indices context at module load - not per request!
_INDICES_CONTEXT_CACHE: str = ""

def get_indices_context() -> str:
    """Reads index files once and caches them in memory."""
    global _INDICES_CONTEXT_CACHE
    if _INDICES_CONTEXT_CACHE:
        return _INDICES_CONTEXT_CACHE
    
    context_parts = []
    if os.path.exists(config.INDICES_DIR):
        for filename in sorted(os.listdir(config.INDICES_DIR)):
            file_path = os.path.join(config.INDICES_DIR, filename)
            if os.path.isfile(file_path) and not filename.startswith('.'):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        # Limit each file to 2000 chars to keep prompt lean
                        content = f.read(2000)
                    context_parts.append(f"=== {filename} ===\n{content}\n")
                except Exception as e:
                    print(f"Error reading index file {filename}: {e}")

    _INDICES_CONTEXT_CACHE = "\n".join(context_parts)
    return _INDICES_CONTEXT_CACHE

def call_gemini_api(prompt: str, system_instruction: str, api_key: str, schema: dict) -> str:
    """Calls Gemini API with multi-key rotation, 429 rate limit retry parsing, and model fallback."""
    headers = {"Content-Type": "application/json"}

    # Build key pool (supports comma-separated keys from request or config .env)
    candidate_keys = []
    if api_key:
        candidate_keys.extend([k.strip() for k in api_key.split(",") if k.strip()])
    if config.GEMINI_API_KEY:
        candidate_keys.extend([k.strip() for k in config.GEMINI_API_KEY.split(",") if k.strip()])
    
    # Deduplicate keys while preserving order
    key_pool = []
    for k in candidate_keys:
        if k not in key_pool:
            key_pool.append(k)

    if not key_pool:
        raise Exception("No Gemini API Key provided. Set GEMINI_API_KEY in .env or popup settings.")

    data = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
            "maxOutputTokens": 8192,
            "responseSchema": schema
        }
    }

    last_error = None

    for current_key in key_pool:
        for model_name in config.GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={current_key}"
            
            # Allow up to 2 retry attempts per (key, model) if 429 retryDelay is reasonable
            for attempt in range(2):
                try:
                    response = requests.post(url, headers=headers, json=data, timeout=120)
                    if response.status_code == 200:
                        res_json = response.json()
                        content_text = res_json['candidates'][0]['content']['parts'][0]['text']
                        return content_text
                    
                    elif response.status_code == 429:
                        last_error = f"Model {model_name} quota exceeded (429): {response.text}"
                        
                        # Parse retry delay from error text
                        match = re.search(r'retry in (\d+(?:\.\d+)?)s', response.text, re.IGNORECASE)
                        delay_match = re.search(r'"retryDelay":\s*"(\d+)s"', response.text)
                        
                        retry_secs = 5.0
                        if match:
                            retry_secs = float(match.group(1))
                        elif delay_match:
                            retry_secs = float(delay_match.group(1))
                            
                        if retry_secs <= 25 and attempt == 0:
                            wait_time = min(retry_secs + 0.5, 25)
                            print(f"⚠️ Quota 429 hit on {model_name} (Key: ...{current_key[-4:]}). Waiting {wait_time:.1f}s before retry...")
                            time.sleep(wait_time)
                            continue  # Retry attempt 1
                        else:
                            print(f"⚠️ Quota 429 on {model_name}. Rotating key/model...")
                            break  # Move to next model
                    elif response.status_code in [400, 403]:
                        last_error = f"Key ...{current_key[-4:]} invalid for Gemini ({response.status_code}): {response.text}"
                        print(f"⚠️ {last_error}. Skipping key...")
                        key_invalid = True
                        break  # Break out of model attempts, move to next key

                    elif response.status_code in [404, 500, 503]:
                        last_error = f"Model {model_name} error ({response.status_code}): {response.text}"
                        print(f"⚠️ {last_error}. Trying next model...")
                        if response.status_code in [500, 503]:
                            time.sleep(2)
                        break  # Move to next model

                except requests.exceptions.RequestException as e:
                    last_error = f"Network error on {model_name}: {str(e)}"
                    print(f"⚠️ {last_error}. Trying next model...")
                    break
            
            if 'key_invalid' in locals() and key_invalid:
                del key_invalid
                break  # Skip remaining models for this invalid key

    raise Exception(f"All Gemini models & API keys failed. Last error: {last_error}")

def calculate_koneczny_metrics(llm_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Calculates indices by averaging their indicator scores.
    Ignores scores that are < 0 (which signify missing data).
    If all are missing, returns -1.0.
    """
    def _calc_avg(category_key: str) -> float:
        category_data = llm_data.get(category_key, {})
        valid_vals = []
        for val_info in category_data.values():
            val = -1.0
            if isinstance(val_info, (int, float)):
                val = float(val_info)
            elif isinstance(val_info, dict):
                val = float(val_info.get("score", -1.0))
            if val >= 0:
                valid_vals.append(val)
        
        return sum(valid_vals) / len(valid_vals) if valid_vals else -1.0

    result = {
        "sacrality_score": _calc_avg("sacrality_scores"),
        "legal_dualism_score": _calc_avg("legal_dualism_scores"),
        "law_source_pluralism_score": _calc_avg("law_source_pluralism_scores"),
        "aposteriori_apriori_score": _calc_avg("aposteriori_apriori_scores"),
        "organism_mechanism_score": _calc_avg("organism_mechanism_scores"),
        "personalism_score": _calc_avg("personalism_scores"),
        "family_law_autonomy_score": _calc_avg("family_law_autonomy_scores"),
        "church_independence_score": _calc_avg("church_independence_scores"),
        "property_rights_stability_score": _calc_avg("property_rights_stability_scores"),
        "inheritance_continuity_score": _calc_avg("inheritance_continuity_scores"),
        "morality_supremacy_score": _calc_avg("morality_supremacy_scores"),
        "public_morality_totality_score": _calc_avg("public_morality_totality_scores"),
        "administrative_responsibility_score": _calc_avg("administrative_responsibility_scores"),
        "duty_source_personalistic_score": _calc_avg("duty_source_scores"),
        "motivation_altruism_score": _calc_avg("motivation_scores"),
        "justice_equity_score": _calc_avg("justice_nature_scores"),
        "conscience_autonomous_score": _calc_avg("conscience_status_scores"),
        "time_mastery_history_score": _calc_avg("time_mastery_scores"),
        "work_ethos_sanctification_score": _calc_avg("work_ethos_scores"),
    }
    # Calculate global spirit supremacy score from 12 indices
    spirit_scores = [
        result["legal_dualism_score"], result["law_source_pluralism_score"], result["aposteriori_apriori_score"],
        result["organism_mechanism_score"], result["personalism_score"], result["family_law_autonomy_score"],
        result["church_independence_score"], result["property_rights_stability_score"], result["inheritance_continuity_score"],
        result["morality_supremacy_score"], result["public_morality_totality_score"], result["administrative_responsibility_score"]
    ]
    valid_spirit = [s for s in spirit_scores if s >= 0]
    result["spirit_supremacy_score"] = round(sum(valid_spirit) / len(valid_spirit), 2) if valid_spirit else -1.0
    # Calculate Generalia (Step 3) ethical coherence score
    generalia_data = llm_data.get("generalia_scores", {})
    gen_vals = []
    for gen_info in generalia_data.values():
        val = -1.0
        if isinstance(gen_info, (int, float)):
            val = float(gen_info)
        elif isinstance(gen_info, dict):
            val = float(gen_info.get("score", -1.0))
        if val >= 0:
            gen_vals.append(val)

    if gen_vals:
        coherence_sum = sum(gen_vals)
        result["ethical_coherence_score"] = round(coherence_sum, 1)
        if coherence_sum >= 6.0:
            result["generalia_diagnosis"] = "Dominacja Szeregu Personalistycznego (Cywilizacja Łacińska)"
            result["mixture_alert"] = False
        elif coherence_sum <= 2.0:
            result["generalia_diagnosis"] = "Dominacja Szeregu Gromadnościowego (Pozostałe cywilizacje)"
            result["mixture_alert"] = False
        else:
            result["generalia_diagnosis"] = "⚠️ MIESZANKA TRUJĄCA (Stan acywilizacyjny / Kołobłęd etyczny)"
            result["mixture_alert"] = True
    else:
        result["ethical_coherence_score"] = -1.0
        result["generalia_diagnosis"] = "Brak danych generaliów"
        result["mixture_alert"] = False

    # Calculate Step 4: Chyżość Historyczna (Wydajność Cywilizacyjna)
    tm_scores = llm_data.get("time_mastery_scores", {})
    def _get_tm_val(key: str) -> float:
        v = tm_scores.get(key)
        if isinstance(v, (int, float)): return float(v)
        if isinstance(v, dict): return float(v.get("score", -1.0))
        return -1.0

    s_chronology = _get_tm_val("scientific_chronology")
    s_tradition = _get_tm_val("active_critical_tradition")
    s_surnames = _get_tm_val("hereditary_surnames")
    s_cap = _get_tm_val("capitalization_of_time")

    valid_tm_weights = []
    w_sum = 0.0
    if s_chronology >= 0:
        w_sum += 0.2 * s_chronology
        valid_tm_weights.append(0.2)
    if s_tradition >= 0:
        w_sum += 0.2 * s_tradition
        valid_tm_weights.append(0.2)
    if s_surnames >= 0:
        w_sum += 0.3 * s_surnames
        valid_tm_weights.append(0.3)
    if s_cap >= 0:
        w_sum += 0.3 * s_cap
        valid_tm_weights.append(0.3)

    if valid_tm_weights:
        eff_score = round(w_sum / sum(valid_tm_weights), 2)
        result["time_mastery_efficiency_score"] = eff_score
        if eff_score >= 0.65:
            result["time_mastery_efficiency_diagnosis"] = "Dominacja Cywilizacji Łacińskiej (Wysoka Chyżość Historyczna / Akumulacja Dorobku)"
        elif eff_score >= 0.35:
            result["time_mastery_efficiency_diagnosis"] = "Umiarkowana Wydajność Cywilizacyjna (Stan Synkretyczny / Mieszanka)"
        else:
            result["time_mastery_efficiency_diagnosis"] = "Niska Chyżość Historyczna (Brak Historyzmu / Wegetacja Ab Ovo / Zastój)"
    else:
        result["time_mastery_efficiency_score"] = result.get("time_mastery_history_score", -1.0)
        eff_history = result.get("time_mastery_history_score", -1.0)
        if eff_history >= 0.65:
            result["time_mastery_efficiency_diagnosis"] = "Dominacja Cywilizacji Łacińskiej (Wysoka Chyżość Historyczna / Akumulacja Dorobku)"
        elif eff_history >= 0.35:
            result["time_mastery_efficiency_diagnosis"] = "Umiarkowana Wydajność Cywilizacyjna (Stan Synkretyczny / Mieszanka)"
        elif eff_history >= 0:
            result["time_mastery_efficiency_diagnosis"] = "Niska Chyżość Historyczna (Brak Historyzmu / Wegetacja Ab Ovo / Zastój)"
        else:
            result["time_mastery_efficiency_diagnosis"] = "Brak danych dla Kroku 4"

    # Calculate Step 5: QUINCUNX_COHERENCE_INDEX (Syntetyczna Współmierność Pięciomianu Bytu)
    q_data = llm_data.get("quincunx_scores", {})
    health_data = llm_data.get("health_scores", {})
    truth_data = llm_data.get("truth_science_scores", {})
    beauty_data = llm_data.get("beauty_art_scores", {})

    def _extract_avg(sources):
        vals = []
        for src in sources:
            if not isinstance(src, dict): continue
            for k, v in src.items():
                if isinstance(v, (int, float)): s = float(v)
                elif isinstance(v, dict): s = float(v.get("score", -1.0))
                else: s = -1.0
                if s >= 0: vals.append(s)
        return sum(vals) / len(vals) if vals else -1.0

    # I. DOBRO (Moralność)
    d_score = _extract_avg([
        {k: v for k, v in q_data.items() if k in ["ethics_totality_public_private", "good_above_law_force", "personal_moral_accountability"]},
        llm_data.get("morality_supremacy_scores", {}),
        llm_data.get("public_morality_totality_scores", {}),
        llm_data.get("conscience_status_scores", {}),
        llm_data.get("duty_source_scores", {})
    ])

    # II. PRAWDA (Nauka)
    p_score = _extract_avg([
        truth_data,
        {k: v for k, v in q_data.items() if k in ["natural_truth_pure_science", "academic_educational_freedom"]},
        llm_data.get("aposteriori_apriori_scores", {}),
        llm_data.get("law_source_pluralism_scores", {})
    ])

    # III. ZDROWIE (Higiena)
    z_score = _extract_avg([
        health_data,
        {k: v for k, v in q_data.items() if k in ["public_scientific_health_duty", "res_sacra_miser_ethics"]}
    ])

    # IV. DOBROBYT (Gospodarka)
    db_score = _extract_avg([
        llm_data.get("work_ethos_scores", {}),
        llm_data.get("property_rights_stability_scores", {}),
        llm_data.get("inheritance_continuity_scores", {}),
        llm_data.get("family_law_autonomy_scores", {}),
        {k: v for k, v in q_data.items() if k in ["individual_hereditary_property", "honest_prosperity_duty"]}
    ])

    # V. PIĘKNO (Sztuka)
    pi_score = _extract_avg([
        beauty_data,
        {k: v for k, v in q_data.items() if k in ["beauty_allegory_of_good", "full_artistic_freedom"]}
    ])

    q_cats = [d_score, p_score, z_score, db_score, pi_score]
    valid_q_cats = [c for c in q_cats if c >= 0]

    if valid_q_cats:
        num_cats = len(valid_q_cats)
        if any(c == 0.0 for c in valid_q_cats):
            geo_mean = 0.0
        else:
            prod = 1.0
            for c in valid_q_cats:
                prod *= c
            geo_mean = prod ** (1.0 / float(num_cats))

        import math
        mean_val = sum(valid_q_cats) / float(num_cats)
        variance = sum((c - mean_val) ** 2 for c in valid_q_cats) / float(num_cats) if num_cats > 1 else 0.0
        std_dev = math.sqrt(variance)
        consistency_factor = max(0.0, 1.0 - (std_dev / (mean_val if mean_val > 0 else 1.0)))

        # Hegemony of Goodness Penalty: Goodness (D) must lead
        other_max = max([c for idx, c in enumerate(q_cats) if idx != 0 and c >= 0], default=0.0)
        hegemony_penalty = 1.0
        if d_score >= 0 and other_max > d_score:
            diff = other_max - d_score
            hegemony_penalty = max(0.5, round(1.0 - (diff / 1.5), 2))

        q_final = round(geo_mean * consistency_factor * hegemony_penalty, 2)
        result["quincunx_coherence_score"] = q_final
        result["quincunx_categories"] = {
            "good": round(d_score, 2),
            "truth": round(p_score, 2),
            "health": round(z_score, 2),
            "prosperity": round(db_score, 2),
            "beauty": round(pi_score, 2)
        }

        sphere_note = f" (ocena z {num_cats}/5 sfer)" if num_cats < 5 else ""

        if any(c <= 0.1 for c in valid_q_cats):
            result["quincunx_diagnosis"] = f"CYWILIZACJA DEFEKTOWNA / UŁOMNA (Defekt sfery bytu){sphere_note}"
        elif hegemony_penalty < 0.90:
            result["quincunx_diagnosis"] = f"⚠️ ZWICHNIĘCIE PIĘCIOMIANU (Zaniedbanie Etyki na rzecz Materializmu/Państwa){sphere_note}"
        elif q_final >= 0.65 and consistency_factor >= 0.75:
            if num_cats == 5:
                result["quincunx_diagnosis"] = "PEŁNIA CYWILIZACJI ŁACIŃSKIEJ (Harmonia 5/5 sfer Pięciomianu pod przodownictwem Etyki)"
            else:
                result["quincunx_diagnosis"] = f"DOMINACJA NORMY ŁACIŃSKIEJ (Niepełny Pięciomian: {num_cats}/5 sfer w tekście)"
        elif consistency_factor < 0.60 and num_cats > 1:
            result["quincunx_diagnosis"] = f"⚠️ ACYWILIZACYJNA NIEWSPÓŁMIERNOŚĆ (Mieszanka Metod Niszcząca Siły Społeczne){sphere_note}"
        else:
            result["quincunx_diagnosis"] = f"Umiarkowana Współmierność Bytu{sphere_note}"
    else:
        result["quincunx_coherence_score"] = -1.0
        result["quincunx_diagnosis"] = "Brak danych dla Kroku 5 w tekście"

    # Calculate Experimental Meta-Index: CIVILIZATIONAL_LIE_INDEX (Współczynnik Kłamstwa Cywilizacyjnego)
    # Baseline: Salus animarum suprema lex, Civitas Dei, Hegemony of Morality & Personalism.
    
    # 1. SPIRIT SUPREMACY VECTOR
    v_spirit = _extract_avg([
        llm_data.get("spirit_supremacy_scores", {}),
        llm_data.get("organism_mechanism_scores", {}),
        {k: v for k, v in q_data.items() if k in ["natural_truth_pure_science", "beauty_allegory_of_good"]}
    ])
    if v_spirit < 0 and result.get("spirit_supremacy_score", -1.0) >= 0:
        v_spirit = result["spirit_supremacy_score"]

    # 2. MORALITY SUPREMACY VECTOR
    v_morality = _extract_avg([
        llm_data.get("morality_supremacy_scores", {}),
        llm_data.get("duty_source_scores", {}),
        llm_data.get("conscience_status_scores", {}),
        llm_data.get("justice_nature_scores", {}),
        {k: v for k, v in q_data.items() if k in ["good_above_law_force", "personal_moral_accountability"]}
    ])
    if v_morality < 0 and result.get("ethical_coherence_score", -1.0) >= 0:
        v_morality = min(1.0, max(0.0, result["ethical_coherence_score"] / 7.0))
    elif v_morality < 0 and d_score >= 0:
        v_morality = d_score

    # 3. PERSONALISM VECTOR
    v_personalism = _extract_avg([
        llm_data.get("personalism_scores", {}),
        llm_data.get("property_rights_stability_scores", {}),
        llm_data.get("inheritance_continuity_scores", {}),
        llm_data.get("family_law_autonomy_scores", {}),
        {k: v for k, v in q_data.items() if k in ["individual_hereditary_property", "personal_moral_accountability"]}
    ])
    if v_personalism < 0 and result.get("personalism_score", -1.0) >= 0:
        v_personalism = result["personalism_score"]

    # 4. PUBLIC MORALITY TOTALITY VECTOR
    v_totality = _extract_avg([
        llm_data.get("public_morality_totality_scores", {}),
        llm_data.get("conscience_status_scores", {}),
        {k: v for k, v in q_data.items() if k in ["ethics_totality_public_private", "good_above_law_force"]}
    ])
    if v_totality < 0 and result.get("public_morality_totality_score", -1.0) >= 0:
        v_totality = result["public_morality_totality_score"]

    # 5. SACRALITY / FANATICISM VECTOR
    v_sacrality = _extract_avg([
        llm_data.get("sacrality_scores", {}),
        {k: v for k, v in q_data.items() if k in ["academic_educational_freedom", "full_artistic_freedom"]}
    ])
    if v_sacrality < 0 and result.get("sacrality_score", -1.0) >= 0:
        v_sacrality = result["sacrality_score"]

    lie_vectors = [v for v in [v_spirit, v_morality, v_personalism, v_totality] if v >= 0]

    if lie_vectors:
        truth_score = sum(lie_vectors) / float(len(lie_vectors))
        
        # Fanaticism / Forced Sacrality Penalty
        if v_sacrality > 0.65:
            truth_score *= max(0.2, 1.0 - (v_sacrality - 0.65))

        lie_score = max(0.0, min(1.0, 1.0 - truth_score))
        lie_pct = round(lie_score * 100, 1)

        result["civilizational_lie_score"] = round(lie_score, 2)
        result["civilizational_lie_percentage"] = lie_pct
        result["civilizational_lie_vectors"] = {
            "spirit_supremacy": round(v_spirit, 2) if v_spirit >= 0 else -1.0,
            "morality_supremacy": round(v_morality, 2) if v_morality >= 0 else -1.0,
            "personalism": round(v_personalism, 2) if v_personalism >= 0 else -1.0,
            "public_morality_totality": round(v_totality, 2) if v_totality >= 0 else -1.0,
            "sacrality_penalty": round(1.0 - v_sacrality, 2) if v_sacrality >= 0 else -1.0
        }

        if lie_pct <= 15.0:
            result["civilizational_lie_diagnosis"] = "PRAWDA OBIEKTYWNA I PERSONALIZM (Civitas Dei)"
        elif lie_pct <= 40.0:
            result["civilizational_lie_diagnosis"] = "UMIARKOWANA MANIPULACJA / PRAGMATYZM"
        elif lie_pct <= 70.0:
            result["civilizational_lie_diagnosis"] = "⚠️ ZAKŁAMANIE SYSTEMOWE (Dwoistość Sumienia / Statolatria)"
        else:
            result["civilizational_lie_diagnosis"] = "🚨 KŁAMSTWO FUNDAMENTALNE (Zbawienie Zbiorowe / Acywilizacyjny Kołobłęd)"
    else:
        result["civilizational_lie_score"] = -1.0
        result["civilizational_lie_percentage"] = -1.0
        result["civilizational_lie_diagnosis"] = "Brak danych dla Wskaźnika Kłamstwa"
        result["civilizational_lie_vectors"] = {}

    result["raw_ratings"] = llm_data
    return result


schema_6 = {
    "type": "object",
    "properties": {
        "family_law_autonomy_scores": {
            "type": "object",
            "properties": {
                "adult_son_independence": indicator_item,
                "family_emancipation_from_clan": indicator_item,
                "son_adulthood_during_fathers_life": indicator_item,
                "wife_treated_as_free_person": indicator_item,
                "marriage_by_mutual_consent": indicator_item,
                "lifelong_monogamy": indicator_item,
                "state_religion_interferes_home_life": indicator_item,
                "exclusive_parental_care_rights": indicator_item,
                "property_independent_of_clan_state": indicator_item,
                "family_law_inaccessible_to_state": indicator_item,
                "polygamy_exists": indicator_item,
                "state_regulates_private_life": indicator_item,
                "family_autonomy_disappears_to_state": indicator_item,
                "sacralization_of_life": indicator_item
            },
            "required": [
                "adult_son_independence", "family_emancipation_from_clan", "son_adulthood_during_fathers_life",
                "wife_treated_as_free_person", "marriage_by_mutual_consent", "lifelong_monogamy",
                "state_religion_interferes_home_life", "exclusive_parental_care_rights", "property_independent_of_clan_state",
                "family_law_inaccessible_to_state", "polygamy_exists", "state_regulates_private_life",
                "family_autonomy_disappears_to_state", "sacralization_of_life"
            ]
        },
        "family_law_news_1": { "type": "string" },
        "family_law_news_2": { "type": "string" },
        "family_law_news_3": { "type": "string" },
        "family_law_justification": { "type": "string" }
    },
    "required": [
        "family_law_autonomy_scores",
        "family_law_news_1", "family_law_news_2", "family_law_news_3", "family_law_justification"
    ]
}

schema_7 = {
    "type": "object",
    "properties": {
        "church_independence_scores": {
            "type": "object",
            "properties": {
                "hierarch_appointment": indicator_item, "dogmatic_disputes": indicator_item,
                "economic_independence": indicator_item, "moral_sanctions_on_rulers": indicator_item,
                "canon_law_separation": indicator_item, "brachium_saeculare": indicator_item,
                "total_ethics": indicator_item, "divine_vs_caesar": indicator_item,
                "personalism_presence": indicator_item, "freedom_of_conversion": indicator_item,
                "caesaropapism_absence": indicator_item, "cuius_regio_absence": indicator_item,
                "statolatry_absence": indicator_item, "sacralism_absence": indicator_item,
                "confessional_bureaucracy_absence": indicator_item
            },
            "required": [
                "hierarch_appointment", "dogmatic_disputes", "economic_independence", "moral_sanctions_on_rulers",
                "canon_law_separation", "brachium_saeculare", "total_ethics", "divine_vs_caesar",
                "personalism_presence", "freedom_of_conversion", "caesaropapism_absence", "cuius_regio_absence",
                "statolatry_absence", "sacralism_absence", "confessional_bureaucracy_absence"
            ]
        },
        "church_news_1": { "type": "string" },
        "church_news_2": { "type": "string" },
        "church_news_3": { "type": "string" },
        "church_justification": { "type": "string" }
    },
    "required": [
        "church_independence_scores",
        "church_news_1", "church_news_2", "church_news_3", "church_justification"
    ]
}

schema_8 = {
    "type": "object",
    "properties": {
        "property_rights_stability_scores": {
            "type": "object",
            "properties": {
                "absolute_property_vs_usufruct": indicator_item, "real_estate_as_ideal": indicator_item,
                "neminem_captivabimus": indicator_item, "family_continuity_of_property": indicator_item,
                "inheritance_as_personality_extension": indicator_item, "official_liability": indicator_item,
                "ius_primi_occupantis": indicator_item, "lifelong_monogamy": indicator_item,
                "son_emancipation": indicator_item, "property_in_private_law": indicator_item,
                "sacralization_of_property_absence": indicator_item, "fiscalism_bureaucracy_absence": indicator_item,
                "socialism_collectivism_absence": indicator_item
            },
            "required": [
                "absolute_property_vs_usufruct", "real_estate_as_ideal", "neminem_captivabimus", "family_continuity_of_property",
                "inheritance_as_personality_extension", "official_liability", "ius_primi_occupantis", "lifelong_monogamy",
                "son_emancipation", "property_in_private_law", "sacralization_of_property_absence", "fiscalism_bureaucracy_absence",
                "socialism_collectivism_absence"
            ]
        },
        "property_news_1": { "type": "string" },
        "property_news_2": { "type": "string" },
        "property_news_3": { "type": "string" },
        "property_justification": { "type": "string" }
    },
    "required": [
        "property_rights_stability_scores",
        "property_news_1", "property_news_2", "property_news_3", "property_justification"
    ]
}

schema_9 = {
    "type": "object",
    "properties": {
        "inheritance_continuity_scores": {
            "type": "object",
            "properties": {
                "inheritance_as_personality_extension": indicator_item, "inheritance_tax_absence": indicator_item,
                "majorat_or_indivisibility": indicator_item, "real_estate_retention_encouraged": indicator_item,
                "real_estate_primary_inheritance": indicator_item, "family_estate_ideal": indicator_item,
                "son_emancipation_before_death": indicator_item, "primogeniture_privilege": indicator_item,
                "family_emancipation_from_clan": indicator_item, "lifelong_monogamy": indicator_item,
                "historism_and_hereditary_surnames": indicator_item, "usufruct_system_absence": indicator_item,
                "speculative_capital_absence": indicator_item, "statolatry_absence": indicator_item,
                "collectivism_socialism_absence": indicator_item
            },
            "required": [
                "inheritance_as_personality_extension", "inheritance_tax_absence", "majorat_or_indivisibility", "real_estate_retention_encouraged",
                "real_estate_primary_inheritance", "family_estate_ideal", "son_emancipation_before_death", "primogeniture_privilege",
                "family_emancipation_from_clan", "lifelong_monogamy", "historism_and_hereditary_surnames", "usufruct_system_absence",
                "speculative_capital_absence", "statolatry_absence", "collectivism_socialism_absence"
            ]
        },
        "inheritance_news_1": { "type": "string" },
        "inheritance_news_2": { "type": "string" },
        "inheritance_news_3": { "type": "string" },
        "inheritance_justification": { "type": "string" }
    },
    "required": [
        "inheritance_continuity_scores",
        "inheritance_news_1", "inheritance_news_2", "inheritance_news_3", "inheritance_justification"
    ]
}

def analyze_sample(text: str, api_key: str = None, target_indices: list = None) -> Dict[str, Any]:
    """
    Wczytuje indeksy, konstruuje prompt, wysyła zapytanie do Gemini i kalkuluje wyniki Konecznego.
    """
    key = api_key or config.GEMINI_API_KEY
    if not key:
        raise ValueError("Brak klucza API Gemini (ustaw GEMINI_API_KEY w środowisku lub prześlij w nagłówku).")
        
    indices_context = get_indices_context()

    schema_1 = {
        "type": "object",
        "properties": {
            "sacrality_scores": {
                "type": "object",
                "properties": {
                    "RELIGIOUS_LAW_SUPREMACY": indicator_item, "THEOCRATIC_AUTHORITY": indicator_item,
                    "FAMILY_RELIGIOUS_CONTROL": indicator_item, "RELIGIOUS_EDUCATION": indicator_item,
                    "PROPERTY_RELIGIOUS_CONTROL": indicator_item, "SACRAL_CRIMINAL_LAW": indicator_item,
                    "RELIGIOUS_TIME_CALENDAR": indicator_item, "SCIENCE_RELIGION_FUSION": indicator_item,
                    "ETHICS_RELIGION_IDENTITY": indicator_item, "SACRAL_ECONOMICS": indicator_item,
                    "SOCIAL_HIERARCHY_RELIGIOUS": indicator_item, "STATE_CHURCH_UNITY": indicator_item,
                    "APOSTASY_PUNISHMENT": indicator_item
                },
                "required": ["RELIGIOUS_LAW_SUPREMACY", "THEOCRATIC_AUTHORITY", "FAMILY_RELIGIOUS_CONTROL", "RELIGIOUS_EDUCATION", "PROPERTY_RELIGIOUS_CONTROL", "SACRAL_CRIMINAL_LAW", "RELIGIOUS_TIME_CALENDAR", "SCIENCE_RELIGION_FUSION", "ETHICS_RELIGION_IDENTITY", "SACRAL_ECONOMICS", "SOCIAL_HIERARCHY_RELIGIOUS", "STATE_CHURCH_UNITY", "APOSTASY_PUNISHMENT"]
            }
        },
        "required": ["sacrality_scores"]
    }

    schema_1_spirit = {
        "type": "object",
        "properties": {
            "spirit_supremacy_scores": {
                "type": "object",
                "properties": {
                    "LEGAL_DUALISM_INDEX": indicator_item, "LAW_SOURCE_PLURALISM_INDEX": indicator_item,
                    "APOSTERIORI_APRIORI_INDEX": indicator_item, "ORGANISM_MECHANISM_INDEX": indicator_item,
                    "PERSONALISM_INDEX": indicator_item, "FAMILY_LAW_AUTONOMY_INDEX": indicator_item,
                    "CHURCH_INDEPENDENCE_INDEX": indicator_item, "PROPERTY_RIGHTS_STABILITY_INDEX": indicator_item,
                    "INHERITANCE_CONTINUITY_INDEX": indicator_item, "MORALITY_SUPREMACY_INDEX": indicator_item,
                    "PUBLIC_MORALITY_TOTALITY_INDEX": indicator_item, "ADMINISTRATIVE_RESPONSIBILITY_INDEX": indicator_item
                },
                "required": ["LEGAL_DUALISM_INDEX", "LAW_SOURCE_PLURALISM_INDEX", "APOSTERIORI_APRIORI_INDEX", "ORGANISM_MECHANISM_INDEX", "PERSONALISM_INDEX", "FAMILY_LAW_AUTONOMY_INDEX", "CHURCH_INDEPENDENCE_INDEX", "PROPERTY_RIGHTS_STABILITY_INDEX", "INHERITANCE_CONTINUITY_INDEX", "MORALITY_SUPREMACY_INDEX", "PUBLIC_MORALITY_TOTALITY_INDEX", "ADMINISTRATIVE_RESPONSIBILITY_INDEX"]
            }
        },
        "required": ["spirit_supremacy_scores"]
    }

    schema_2 = {
        "type": "object",
        "properties": {
            "legal_dualism_scores": {
                "type": "object",
                "properties": {
                    "PRIVATE_RIGHTS_SPHERE": indicator_item, "FAMILY_AUTONOMY": indicator_item, "PROPERTY_PROTECTION": indicator_item,
                    "NATURAL_INHERITANCE": indicator_item, "POWER_LIMITS": indicator_item, "OPPOSITION_RIGHT": indicator_item,
                    "STATE_MORALITY_SUBORDINATION": indicator_item, "DIVINE_VS_CAESAR": indicator_item, "RULER_ETHICS_EQUALITY": indicator_item,
                    "INDEPENDENT_JUDICIARY": indicator_item, "OFFICIAL_RESPONSIBILITY": indicator_item, "APOSTERIORI_LAW": indicator_item,
                    "ASSOCIATION_AUTONOMY": indicator_item, "LAND_OWNERSHIP_FULL": indicator_item, "LOCAL_LAW_TOLERANCE": indicator_item,
                    "LAW_CONSCIENCE_EQUALITY": indicator_item, "FAMILY_EMANCIPATION": indicator_item, "SOCIETY_PRIMACY": indicator_item,
                    "SOCIETY_AS_GOAL": indicator_item, "CHURCH_INDEPENDENCE": indicator_item, "NO_STATOLATRY_PUBLIC_MONISM": indicator_item,
                    "NO_PRIVATE_LAW_MONISM": indicator_item, "CITIZENS_ARE_FREE": indicator_item, "NO_SACRAL_LAW_MONOPOLY": indicator_item,
                    "NO_EXCESS_REGULATION": indicator_item
                },
                "required": [
                    "PRIVATE_RIGHTS_SPHERE", "FAMILY_AUTONOMY", "PROPERTY_PROTECTION", "NATURAL_INHERITANCE", "POWER_LIMITS", 
                    "OPPOSITION_RIGHT", "STATE_MORALITY_SUBORDINATION", "DIVINE_VS_CAESAR", "RULER_ETHICS_EQUALITY", 
                    "INDEPENDENT_JUDICIARY", "OFFICIAL_RESPONSIBILITY", "APOSTERIORI_LAW", "ASSOCIATION_AUTONOMY", 
                    "LAND_OWNERSHIP_FULL", "LOCAL_LAW_TOLERANCE", "LAW_CONSCIENCE_EQUALITY", "FAMILY_EMANCIPATION", 
                    "SOCIETY_PRIMACY", "SOCIETY_AS_GOAL", "CHURCH_INDEPENDENCE", "NO_STATOLATRY_PUBLIC_MONISM", 
                    "NO_PRIVATE_LAW_MONISM", "CITIZENS_ARE_FREE", "NO_SACRAL_LAW_MONOPOLY", "NO_EXCESS_REGULATION"
                ]
            }
        },
        "required": ["legal_dualism_scores"]
    }
    

    schema_3 = {
        "type": "object",
        "properties": {
            "law_source_pluralism_scores": {
                "type": "object",
                "properties": {
                    "MULTIPLE_LAW_SOURCES": indicator_item, "SINGLE_LAW_SOURCE": indicator_item, "LAW_DISCOVERY_VS_CREATION": indicator_item,
                    "UNJUST_LAW_CHALLENGE": indicator_item, "LAW_JUDGEABILITY": indicator_item, "CAN_LAW_BE_BAD": indicator_item,
                    "LAW_SUBJECT_TO_REASON": indicator_item, "CUSTOMARY_LAW_RECOGNITION": indicator_item, "SOCIAL_GROUPS_STATUTES": indicator_item,
                    "RULER_SUBJECT_TO_LAW": indicator_item, "LAW_FROM_ETHICS_OR_DOGMA": indicator_item, "IUS_GENTIUM_PRESENCE": indicator_item,
                    "MEDITATION_VS_EXPERIENCE": indicator_item, "INDEPENDENT_CORPORATIONS": indicator_item, "PRIVATE_PUBLIC_LAW_SPLIT": indicator_item,
                    "SOCIETY_PRIMACY_OVER_STATE": indicator_item, "SINGLE_IMMUTABLE_SOURCE": indicator_item, "WODZ_WILL_VS_MULTIPLE": indicator_item,
                    "STATE_ONLY_LAW_SOURCE": indicator_item, "SOCIALIST_DOCTRINE_COERCION": indicator_item
                },
                "required": [
                    "MULTIPLE_LAW_SOURCES", "SINGLE_LAW_SOURCE", "LAW_DISCOVERY_VS_CREATION", "UNJUST_LAW_CHALLENGE", "LAW_JUDGEABILITY",
                    "CAN_LAW_BE_BAD", "LAW_SUBJECT_TO_REASON", "CUSTOMARY_LAW_RECOGNITION", "SOCIAL_GROUPS_STATUTES", "RULER_SUBJECT_TO_LAW",
                    "LAW_FROM_ETHICS_OR_DOGMA", "IUS_GENTIUM_PRESENCE", "MEDITATION_VS_EXPERIENCE", "INDEPENDENT_CORPORATIONS",
                    "PRIVATE_PUBLIC_LAW_SPLIT", "SOCIETY_PRIMACY_OVER_STATE", "SINGLE_IMMUTABLE_SOURCE", "WODZ_WILL_VS_MULTIPLE",
                    "STATE_ONLY_LAW_SOURCE", "SOCIALIST_DOCTRINE_COERCION"
                ]
            }
        },
        "required": ["law_source_pluralism_scores"]
    }


    schema_4 = {
        "type": "object",
        "properties": {
            "aposteriori_apriori_scores": {
                "type": "object",
                "properties": {
                    "LAW_SANCTIONING_FACTS_VS_IDEAS": indicator_item, "STATE_AS_EDUCATOR": indicator_item,
                    "INDUCTION_VS_DEDUCTION": indicator_item, "UNITY_BY_DIVERSITY_VS_UNIFORMITY": indicator_item,
                    "SOCIAL_ENGINEERING_CULT": indicator_item, "ETHICS_PRECEDES_LAW": indicator_item,
                    "HISTORICISM_AS_BASE": indicator_item, "HISTORICISM_FOUNDATION": indicator_item,
                    "HUMAN_PERSONALISM_PRESENCE": indicator_item, "LEGAL_DUALISM_PRESENCE": indicator_item,
                    "FAMILY_EMANCIPATION_FOR_EXPERIENCE": indicator_item, "NORMS_IMMUTABLE_VS_EVOLVING": indicator_item,
                    "MECHANICAL_SOCIETY_METHOD": indicator_item, "ENDLESS_UTOPIAN_PLANNING": indicator_item,
                    "EXCESSIVE_LEGISLATION_APRIORI": indicator_item
                },
                "required": [
                    "LAW_SANCTIONING_FACTS_VS_IDEAS", "STATE_AS_EDUCATOR", "INDUCTION_VS_DEDUCTION",
                    "UNITY_BY_DIVERSITY_VS_UNIFORMITY", "SOCIAL_ENGINEERING_CULT", "ETHICS_PRECEDES_LAW",
                    "HISTORICISM_AS_BASE", "HISTORICISM_FOUNDATION", "HUMAN_PERSONALISM_PRESENCE",
                    "LEGAL_DUALISM_PRESENCE", "FAMILY_EMANCIPATION_FOR_EXPERIENCE", "NORMS_IMMUTABLE_VS_EVOLVING",
                    "MECHANICAL_SOCIETY_METHOD", "ENDLESS_UTOPIAN_PLANNING", "EXCESSIVE_LEGISLATION_APRIORI"
                ]
            }
        },
        "required": ["aposteriori_apriori_scores"]
    }


    schema_5 = {
        "type": "object",
        "properties": {
            "organism_mechanism_scores": {
                "type": "object",
                "properties": {
                    "SELF_HEALING_CAPACITY": indicator_item, "UNITY_IN_DIVERSITY": indicator_item,
                    "ENGINEERING_GOVERNMENT": indicator_item, "ACTION_CULTURE_VS_PASSIVITY": indicator_item,
                    "BUREAUCRACY_ELEPHANTIASIS": indicator_item, "ABSTRACTS_RECOGNITION": indicator_item,
                    "STATE_AS_TOOL_VS_GOAL": indicator_item, "PERSONALISM_FREE_WILL": indicator_item,
                    "LEGAL_DUALISM_NECESSITY": indicator_item, "HISTORICISM_TRADITION": indicator_item,
                    "APRIORISM_PLANNING": indicator_item, "COERCION_AS_MAIN_BOND": indicator_item
                },
                "required": [
                    "SELF_HEALING_CAPACITY", "UNITY_IN_DIVERSITY", "ENGINEERING_GOVERNMENT", "ACTION_CULTURE_VS_PASSIVITY",
                    "BUREAUCRACY_ELEPHANTIASIS", "ABSTRACTS_RECOGNITION", "STATE_AS_TOOL_VS_GOAL", "PERSONALISM_FREE_WILL",
                    "LEGAL_DUALISM_NECESSITY", "HISTORICISM_TRADITION", "APRIORISM_PLANNING", "COERCION_AS_MAIN_BOND"
                ]
            }
        },
        "required": ["organism_mechanism_scores"]
    }

    schema_5_pers = {
        "type": "object",
        "properties": {
            "personalism_scores": {
                "type": "object",
                "properties": {
                    "GOD_RELATION_PERSONAL_VS_COLLECTIVE": indicator_item, "RESPONSIBILITY_PERSONAL_VS_COLLECTIVE": indicator_item,
                    "CONFESSION_PERSONAL_VS_COLLECTIVE": indicator_item, "FAMILY_EMANCIPATION_FROM_CLAN": indicator_item,
                    "WOMAN_PERSONAL_FREEDOM": indicator_item, "PRIVATE_PROPERTY_INDEPENDENCE": indicator_item,
                    "NEIGHBOR_DUTY_UNIVERSAL_VS_TRIBAL": indicator_item, "WORK_AS_SANCTIFICATION_VS_COERCION": indicator_item,
                    "PERSONAL_RESPONSIBILITY_PRESENCE": indicator_item, "FAMILY_EMANCIPATION_GENERAL": indicator_item,
                    "STATUS_BY_BIRTH_PRIVILEGE": indicator_item, "STATUS_BY_CASTE_MEMBERSHIP": indicator_item,
                    "LEGAL_MONISM_PRESENCE": indicator_item, "UNIFORMITY_MECHANICISM_PRESENCE": indicator_item,
                    "HISTORICISM_PRESENCE": indicator_item, "HEREDITARY_SURNAMES_PRESENCE": indicator_item
                },
                "required": [
                    "GOD_RELATION_PERSONAL_VS_COLLECTIVE", "RESPONSIBILITY_PERSONAL_VS_COLLECTIVE", "CONFESSION_PERSONAL_VS_COLLECTIVE",
                    "FAMILY_EMANCIPATION_FROM_CLAN", "WOMAN_PERSONAL_FREEDOM", "PRIVATE_PROPERTY_INDEPENDENCE",
                    "NEIGHBOR_DUTY_UNIVERSAL_VS_TRIBAL", "WORK_AS_SANCTIFICATION_VS_COERCION", "PERSONAL_RESPONSIBILITY_PRESENCE",
                    "FAMILY_EMANCIPATION_GENERAL", "STATUS_BY_BIRTH_PRIVILEGE", "STATUS_BY_CASTE_MEMBERSHIP", "LEGAL_MONISM_PRESENCE",
                    "UNIFORMITY_MECHANICISM_PRESENCE", "HISTORICISM_PRESENCE", "HEREDITARY_SURNAMES_PRESENCE"
                ]
            }
        },
        "required": ["personalism_scores"]
    }

    # Retrieve relevant passages (only 3 - less context = faster)
    book_passages = []
    try:
        book_passages = rag.retrieve_relevant_passages(text, n_results=3)
    except Exception as e:
        print(f"RAG retrieval warning: {e}")

    rag_context = rag.format_passages_for_prompt(book_passages) if book_passages else ""

    # Limit text to 8000 chars (was 15000)
    trimmed_text = text[:8000]

    def run_query(prompt_txt, sys_instr, schema_obj):
        raw_res = call_gemini_api(prompt_txt, sys_instr, key, schema_obj)
        cleaned = raw_res.strip()
        try:
            parsed = json.loads(cleaned)
        except Exception:
            try:
                parsed = json_repair.repair_json(cleaned, return_objects=True)
                if not isinstance(parsed, dict):
                    raise ValueError("Naprawiony JSON nie jest obiektem dict")
            except Exception as err:
                raise ValueError(f"Błąd dekodowania JSON: {err}. Otrzymany tekst: {raw_res[:300]}...")
        return parsed

    # --- CALL 1: Sacrality ---
    sys_inst_1 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze (0.0-1.0):
1. INDEKS SAKRALNOŚCI (13 wskaźników)

BARDZO WAŻNE ZASADY DOTYCZĄCE NEWSÓW I UZASADNIENIA:
- Musisz wygenerować PEŁNY komplet 13 wskaźników. Aby zmieścić się w limicie znaków, UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie, 60-80 znaków).
- BRAK DANYCH: Jeśli w tekście absolutnie nie ma informacji pozwalających ocenić wskaźnik, MUSISZ ustawić score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Wszystkie 3 nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju, podmiotu i kontekstu analizowanego tekstu.
- ABSOLUTNIE NIE podawaj generycznych przykładów z innych krajów (np. o Talibach, Szariacie, Afganistanie, Iranie itp.), jeśli analizowany tekst dotyczy innego kraju!
- Jeśli wskaźnik wynosi 0.0 lub nie występuje w tekście, nagłówki newsowe muszą odzwierciedlać aktualny stan w analizowanym kraju."""
    
    prompt_1 = f"""Kontekst metodologiczny Konecznego:
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 13 wskaźników sakralności wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 1b: Spirit Supremacy ---
    sys_inst_1b = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze (0.0-1.0):
1. SUPREMACJA DUCHA / INDEKSY CYWILIZACYJNE KONECZNEGO (12 wskaźników)

BARDZO WAŻNE ZASADY DOTYCZĄCE NEWSÓW I UZASADNIENIA:
- Musisz wygenerować PEŁNY komplet 12 wskaźników. Aby zmieścić się w limicie znaków, UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie, 60-80 znaków).
- BRAK DANYCH: Jeśli w tekście absolutnie nie ma informacji pozwalających ocenić wskaźnik, MUSISZ ustawić score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Wszystkie 3 nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju, podmiotu i kontekstu analizowanego tekstu.
- Jeśli wskaźnik wynosi 0.0 lub nie występuje w tekście, nagłówki newsowe muszą odzwierciedlać aktualny stan w analizowanym kraju."""

    prompt_1b = f"""Kontekst metodologiczny Konecznego:
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 12 wskaźników cywilizacyjnych wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""
    
    # --- CALL 2: Legal Dualism ---
    sys_inst_2 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS DUALIZMU PRAWA (25 wskaźników)

BARDZO WAŻNE ZASADY DOTYCZĄCE NEWSÓW I UZASADNIENIA:
- Musisz wygenerować PEŁNY komplet 25 wskaźników dualizmu prawa. UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Wszystkie 3 nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_2 = f"""Kontekst metodologiczny Konecznego (Dualizm Prawa określa czy państwo jest oparte na społeczeństwie/organizmie, czy też społeczeństwo jest jedynie przedmiotem eksploatacji państwa):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 25 wskaźników DUALIZMU PRAWA (legal_dualism_scores) dla wybranego poniższego tekstu. Upewnij się, że opierasz się na tekście lub kontekście danego kraju.

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""


    # --- CALL 3: Law Source Pluralism ---
    sys_inst_3 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS PLURALIZMU ŹRÓDEŁ PRAWA (20 wskaźników)

BARDZO WAŻNE ZASADY DOTYCZĄCE NEWSÓW I UZASADNIENIA:
- Musisz wygenerować PEŁNY komplet 20 wskaźników. UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Wszystkie 3 nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_3 = f"""Kontekst metodologiczny Konecznego (Pluralizm Źródeł Prawa określa czy państwo i wola władcy to jedyne źródło, czy współistnieje z etyką, zwyczajem i religią):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 20 wskaźników PLURALIZMU ŹRÓDEŁ PRAWA (law_source_pluralism_scores) dla wybranego poniższego tekstu. Upewnij się, że opierasz się na tekście lub kontekście danego kraju.

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""


    # --- CALL 4: Aposteriori Apriori ---
    sys_inst_4 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS APOSTERIORI VS APRIORI (15 wskaźników)

BARDZO WAŻNE ZASADY DOTYCZĄCE NEWSÓW I UZASADNIENIA:
- Musisz wygenerować PEŁNY komplet 15 wskaźników. UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Wszystkie 3 nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_4 = f"""Kontekst metodologiczny Konecznego (Aposteriori vs Apriori bada, czy prawo sankcjonuje życie z doświadczenia, czy tworzy nowe utopie dla społeczeństwa pod przymusem):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 15 wskaźników APOSTERIORI VS APRIORI (aposteriori_apriori_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""


    # --- CALL 5: Organism ---
    sys_inst_5 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze (0.0-1.0):
1. INDEKS ORGANIZMU VS MECHANIZMU (12 wskaźników)

BARDZO WAŻNE ZASADY DOTYCZĄCE NEWSÓW I UZASADNIENIA:
- Musisz wygenerować PEŁNY komplet 12 wskaźników organizmu. UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Wszystkie 3 nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_5 = f"""Kontekst metodologiczny Konecznego (Organizm to żywe społeczeństwo z różnorodnością i historią. Mechanizm to sterowane odgórnie martwe państwo inżynieryjne):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 12 wskaźników ORGANIZMU (organism_mechanism_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 5b: Personalism ---
    sys_inst_5b = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze (0.0-1.0):
1. INDEKS PERSONALIZMU (16 wskaźników)

BARDZO WAŻNE ZASADY DOTYCZĄCE NEWSÓW I UZASADNIENIA:
- Musisz wygenerować PEŁNY komplet 16 wskaźników personalizmu. UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Wszystkie 3 nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_5b = f"""Kontekst metodologiczny Konecznego:
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 16 wskaźników PERSONALIZMU (personalism_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""


    # --- CALL 6: Family Law Autonomy ---
    sys_inst_6 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS AUTONOMII PRAWA RODZINNEGO (14 wskaźników)

BARDZO WAŻNE ZASADY:
- UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_6 = f"""Kontekst metodologiczny Konecznego (Emancypacja rodziny od rodu i państwa, monogamia, własność):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 14 wskaźników AUTONOMII PRAWA RODZINNEGO (family_law_autonomy_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 7: Church Independence ---
    sys_inst_7 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS NIEZAWISŁOŚCI KOŚCIOŁA (15 wskaźników)

BARDZO WAŻNE ZASADY:
- UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Jeśli w tekście absolutnie nie ma informacji pozwalających ocenić wskaźnik, MUSISZ ustawić score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_7 = f"""Kontekst metodologiczny Konecznego (Niezawisłość Kościoła, supremacja ducha, brak cezaropapizmu):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 15 wskaźników NIEZAWISŁOŚCI KOŚCIOŁA (church_independence_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 8: Property Rights Stability ---
    sys_inst_8 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS STABILNOŚCI WŁASNOŚCI (13 wskaźników)

BARDZO WAŻNE ZASADY:
- UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_8 = f"""Kontekst metodologiczny Konecznego (Stabilność Własności, Neminem Captivabimus, Ius Primi Occupantis):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 13 wskaźników STABILNOŚCI WŁASNOŚCI (property_rights_stability_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 9: Inheritance Continuity ---
    sys_inst_9 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS CIĄGŁOŚCI DZIEDZICZENIA (15 wskaźników)

BARDZO WAŻNE ZASADY:
- UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    prompt_9 = f"""Kontekst metodologiczny Konecznego (Ciągłość Dziedziczenia, Majorat, Ziemia, Podatki spadkowe):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 15 wskaźników CIĄGŁOŚCI DZIEDZICZENIA (inheritance_continuity_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 10: Morality Supremacy ---
    sys_inst_10 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS SUPREMACJI MORALNOŚCI (15 wskaźników)

BARDZO WAŻNE ZASADY:
- WSZYSTKIE ODPOWIEDZI MUSZĄ BYĆ W JĘZYKU POLSKIM (wyjaśnienia, tytuły newsów, uzasadnienia).
- UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""
    schema_10 = {
        "type": "object",
        "properties": {
            "morality_supremacy_scores": {
                "type": "object",
                "properties": {
                    "ethics_over_law_primacy": indicator_item,
                    "total_ethics": indicator_item,
                    "politics_bound_by_ethics": indicator_item,
                    "ethics_over_wealth_primacy": indicator_item,
                    "moral_utilitarianism": indicator_item,
                    "ethics_over_science_primacy": indicator_item,
                    "immoral_science_rejection": indicator_item,
                    "ethics_over_art_primacy": indicator_item,
                    "immoral_art_rejection": indicator_item,
                    "voluntarism_over_coercion": indicator_item,
                    "duty_over_obedience": indicator_item,
                    "conscience_as_highest_instance": indicator_item,
                    "personal_responsibility": indicator_item,
                    "legalism_absence": indicator_item,
                    "state_amoralism_absence": indicator_item
                },
                "required": [
                    "ethics_over_law_primacy",
                    "total_ethics",
                    "politics_bound_by_ethics",
                    "ethics_over_wealth_primacy",
                    "moral_utilitarianism",
                    "ethics_over_science_primacy",
                    "immoral_science_rejection",
                    "ethics_over_art_primacy",
                    "immoral_art_rejection",
                    "voluntarism_over_coercion",
                    "duty_over_obedience",
                    "conscience_as_highest_instance",
                    "personal_responsibility",
                    "legalism_absence",
                    "state_amoralism_absence"
                ]
            },
            "morality_news_1": {"type": "string"},
            "morality_news_2": {"type": "string"},
            "morality_news_3": {"type": "string"},
            "morality_justification": {"type": "string"}
        },
        "required": [
            "morality_supremacy_scores",
            "morality_news_1",
            "morality_news_2",
            "morality_news_3",
            "morality_justification"
        ]
    }

    prompt_10 = f"""Kontekst metodologiczny Konecznego (Supremacja Moralności):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 15 wskaźników SUPREMACJI MORALNOŚCI (morality_supremacy_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 11: Public Morality Totality ---
    sys_inst_11 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS TOTALNOŚCI MORALNOŚCI PUBLICZNEJ (16 wskaźników)

BARDZO WAŻNE ZASADY:
- WSZYSTKIE ODPOWIEDZI MUSZĄ BYĆ W JĘZYKU POLSKIM (wyjaśnienia, tytuły newsów, uzasadnienia).
- UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    schema_11 = {
        "type": "object",
        "properties": {
            "public_morality_totality_scores": {
                "type": "object",
                "properties": {
                    "two_consciences_rejection": indicator_item,
                    "state_bound_by_decalogue": indicator_item,
                    "politics_as_ethical_domain": indicator_item,
                    "unethical_law_is_lawless": indicator_item,
                    "evil_in_name_of_state_remains_evil": indicator_item,
                    "stricter_ethics_for_public_figures": indicator_item,
                    "duty_to_fight_public_evil": indicator_item,
                    "ethics_over_law_primacy_public": indicator_item,
                    "personal_responsibility_in_public": indicator_item,
                    "legal_dualism_presence": indicator_item,
                    "good_as_dominant_category": indicator_item,
                    "dual_ethics_absence": indicator_item,
                    "physical_force_supremacy_absence": indicator_item,
                    "statolatry_absence": indicator_item,
                    "legalism_replacing_conscience_absence": indicator_item,
                    "caesaropapism_absence": indicator_item
                },
                "required": [
                    "two_consciences_rejection",
                    "state_bound_by_decalogue",
                    "politics_as_ethical_domain",
                    "unethical_law_is_lawless",
                    "evil_in_name_of_state_remains_evil",
                    "stricter_ethics_for_public_figures",
                    "duty_to_fight_public_evil",
                    "ethics_over_law_primacy_public",
                    "personal_responsibility_in_public",
                    "legal_dualism_presence",
                    "good_as_dominant_category",
                    "dual_ethics_absence",
                    "physical_force_supremacy_absence",
                    "statolatry_absence",
                    "legalism_replacing_conscience_absence",
                    "caesaropapism_absence"
                ]
            },
            "public_morality_news_1": {"type": "string"},
            "public_morality_news_2": {"type": "string"},
            "public_morality_news_3": {"type": "string"},
            "public_morality_justification": {"type": "string"}
        },
        "required": [
            "public_morality_totality_scores",
            "public_morality_news_1",
            "public_morality_news_2",
            "public_morality_news_3",
            "public_morality_justification"
        ]
    }

    prompt_11 = f"""Kontekst metodologiczny Konecznego (Totalność Moralności Publicznej):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 16 wskaźników TOTALNOŚCI MORALNOŚCI PUBLICZNEJ (public_morality_totality_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # --- CALL 12: Administrative Responsibility ---
    sys_inst_12 = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w 1 wymiarze (0.0-1.0):
1. INDEKS ODPOWIEDZIALNOŚCI URZĘDNICZEJ (16 wskaźników)

BARDZO WAŻNE ZASADY:
- WSZYSTKIE ODPOWIEDZI MUSZĄ BYĆ W JĘZYKU POLSKIM (wyjaśnienia, tytuły newsów, uzasadnienia).
- UZASADNIENIA MUSZĄ BYĆ BARDZO KRÓTKIE (max 1 zdanie).
- BRAK DANYCH: Oceniaj wskaźniki (0.0-1.0) nawet na podstawie poszlak. Tylko gdy tekst CAŁKOWICIE pomija zagadnienie, ustaw score: -1.0.
- NAGŁÓWKI NEWSOWE muszą być ZWIĘZŁE (max 5-8 słów).
- Nagłówki newsowe oraz uzasadnienie MUSZĄ odnosić się BEZPOŚREDNIO do kraju i kontekstu analizowanego tekstu."""

    schema_12 = {
        "type": "object",
        "properties": {
            "administrative_responsibility_scores": {
                "type": "object",
                "properties": {
                    "personal_liability_for_damages": indicator_item,
                    "material_guarantee_for_reliability": indicator_item,
                    "single_conscience_in_public": indicator_item,
                    "obedience_to_ethics_over_orders": indicator_item,
                    "official_as_legal_entity": indicator_item,
                    "independent_administrative_judiciary": indicator_item,
                    "office_as_civic_service": indicator_item,
                    "legal_dualism_presence_admin": indicator_item,
                    "personalism_in_administration": indicator_item,
                    "ethics_over_law_primacy_admin": indicator_item,
                    "decentralization_and_self_gov": indicator_item,
                    "totalitarian_state_absence": indicator_item,
                    "monism_of_public_law_absence": indicator_item,
                    "dual_ethics_absence_admin": indicator_item,
                    "camp_system_absence": indicator_item,
                    "kormlenie_system_absence": indicator_item
                },
                "required": [
                    "personal_liability_for_damages",
                    "material_guarantee_for_reliability",
                    "single_conscience_in_public",
                    "obedience_to_ethics_over_orders",
                    "official_as_legal_entity",
                    "independent_administrative_judiciary",
                    "office_as_civic_service",
                    "legal_dualism_presence_admin",
                    "personalism_in_administration",
                    "ethics_over_law_primacy_admin",
                    "decentralization_and_self_gov",
                    "totalitarian_state_absence",
                    "monism_of_public_law_absence",
                    "dual_ethics_absence_admin",
                    "camp_system_absence",
                    "kormlenie_system_absence"
                ]
            },
            "administrative_responsibility_news_1": {"type": "string"},
            "administrative_responsibility_news_2": {"type": "string"},
            "administrative_responsibility_news_3": {"type": "string"},
            "administrative_responsibility_justification": {"type": "string"}
        },
        "required": [
            "administrative_responsibility_scores",
            "administrative_responsibility_news_1",
            "administrative_responsibility_news_2",
            "administrative_responsibility_news_3",
            "administrative_responsibility_justification"
        ]
    }

    prompt_12 = f"""Kontekst metodologiczny Konecznego (Odpowiedzialność Urzędnicza):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 16 wskaźników ODPOWIEDZIALNOŚCI URZĘDNICZEJ (administrative_responsibility_scores) dla wybranego poniższego tekstu. 

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_generalia = {
        "type": "object",
        "properties": {
            "generalia_scores": {
                "type": "object",
                "properties": {
                    "duty_source_personalistic": indicator_item,
                    "motivation_altruism": indicator_item,
                    "responsibility_personal": indicator_item,
                    "justice_equity": indicator_item,
                    "conscience_autonomous": indicator_item,
                    "time_mastery_historicism": indicator_item,
                    "work_ethos_sanctification": indicator_item
                },
                "required": [
                    "duty_source_personalistic",
                    "motivation_altruism",
                    "responsibility_personal",
                    "justice_equity",
                    "conscience_autonomous",
                    "time_mastery_historicism",
                    "work_ethos_sanctification"
                ]
            },
            "generalia_news_1": {"type": "string"},
            "generalia_news_2": {"type": "string"},
            "generalia_news_3": {"type": "string"},
            "generalia_justification": {"type": "string"}
        },
        "required": [
            "generalia_scores",
            "generalia_news_1",
            "generalia_news_2",
            "generalia_news_3",
            "generalia_justification"
        ]
    }

    sys_inst_generalia = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze Kroku 3 algorytmu (7 GENERALIÓW ETYKI - Siedem Niewiadomych Etyki):
1. duty_source_personalistic: Źródło Obowiązku (1.0 = Wewnętrzne/Etyka przed prawem, 0.0 = Zewnętrzne/Przymus/Okólnik)
2. motivation_altruism: Motywacja i Bezinteresowność (1.0 = Bezinteresowne Dobro i Prawda, 0.0 = Utylitaryzm/Transakcyjność)
3. responsibility_personal: Rodzaj Odpowiedzialności (1.0 = Osobista/Indywidualna za własne czyny, 0.0 = Zbiorowa/Rodu/Kasty/Gromady)
4. justice_equity: Natura Sprawiedliwości (1.0 = Słuszność Etyczna ponad ustawą, 0.0 = Bezbronny Legalizm/Strictum Ius/Shylock)
5. conscience_autonomous: Status Sumienia (1.0 = Autonomia Sumienia i autokrytyka moralna, 0.0 = Heteronomia/Litera prawa)
6. time_mastery_historicism: Opanowanie Czasu (1.0 = Historyzm/Kapitalizacja Czasu/Era, 0.0 = Wegetacja bezwymiarowa)
7. work_ethos_sanctification: Ethos Pracy (1.0 = Uświęcenie i godność człowieka wolnego, 0.0 = Przymus/Jarzmo)

Wszystkie wskaźniki przyjmują wartości binarne 1.0 (Szereg Personalistyczny / Łaciński) lub 0.0 (Szereg Gromadnościowy). Jeśli absolutnie brak danych, podaj score: -1.0.
Zwróć zwięzłe przykłady i uzasadnienie w JSON."""

    prompt_generalia = f"""Kontekst metodologiczny Konecznego (7 Generaliów Etyki):
{indices_context[:3500]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę 7 GENERALIÓW ETYKI (generalia_scores) dla poniższego tekstu.

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_duty_source = {
        "type": "object",
        "properties": {
            "duty_source_scores": {
                "type": "object",
                "properties": {
                    "ethics_over_law": indicator_item,
                    "voluntary_action": indicator_item,
                    "direct_god_relation": indicator_item,
                    "autonomous_conscience": indicator_item,
                    "unwavering_commitment": indicator_item,
                    "universal_ethics": indicator_item,
                    "personal_creativity": indicator_item,
                    "ethics_primacy": indicator_item,
                    "personal_confession": indicator_item,
                    "no_statolatry": indicator_item,
                    "no_camp_system": indicator_item,
                    "no_sacral_casuistry": indicator_item,
                    "no_collectivism": indicator_item
                },
                "required": [
                    "ethics_over_law", "voluntary_action", "direct_god_relation", "autonomous_conscience",
                    "unwavering_commitment", "universal_ethics", "personal_creativity", "ethics_primacy",
                    "personal_confession", "no_statolatry", "no_camp_system", "no_sacral_casuistry", "no_collectivism"
                ]
            },
            "duty_source_news_1": {"type": "string"},
            "duty_source_news_2": {"type": "string"},
            "duty_source_news_3": {"type": "string"},
            "duty_source_justification": {"type": "string"}
        },
        "required": [
            "duty_source_scores", "duty_source_news_1", "duty_source_news_2", "duty_source_news_3", "duty_source_justification"
        ]
    }

    sys_inst_duty_source = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 13 WSKAŹNIKÓW PERSONALISTYCZNEGO ŹRÓDŁA OBOWIĄZKU (duty_source_scores):
1. ethics_over_law: Poczucie obowiązku wyprzedza prawo stanowione
2. voluntary_action: Dobrowolność spełniania obowiązków (zamiast lęku przed przymusem)
3. direct_god_relation: Bezpośrednia relacja z Siłą Wyższą i sumieniem
4. autonomous_conscience: Autonomia sumienia jako autokrytyka moralna
5. unwavering_commitment: Niezależność obowiązku od sakralnego zrzucenia zobowiązań
6. universal_ethics: Uniwersalizm obowiązku wobec każdego człowieka (bliźniego)
7. personal_creativity: Obowiązek pobudza do twórczości i osobistej inicjatywy
8. ethics_primacy: Prymat etyki nad prawem
9. personal_confession: Spowiedź osobista jako szkoła odpowiedzialności indywidualnej
10. no_statolatry: Odrzucenie statolatrii i wszechwładzy państwa zwalniającej z etyki
11. no_camp_system: Odrzucenie turańskiego ustroju obozowego
12. no_sacral_casuistry: Odrzucenie sakralnej kazuistyki prawnej zastępującej sumienie
13. no_collectivism: Odrzucenie kolektywizmu uszczęśliwiającego pod przymusem

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (gdzie 1.0 oznacza pełne urzeczywistnienie szeregu personalistycznego / łacińskiego). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_duty_source = f"""Kontekst metodologiczny Konecznego (Źródło Obowiązku):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 13 wskaźników PERSONALISTYCZNEGO ŹRÓDŁA OBOWIĄZKU (duty_source_scores) dla poniższego tekstu.

BARDZO WAŻNA ZASADA DLA NEWS_EXAMPLES:
Każdy z 3 nagłówków w news_examples MUSI bezwzględnie zawierać nazwę kraju / państwa / podmiotu opisanego w analizowanym tekście (np. jeśli tekst dotyczy Izraela, napiszesz 'Krytyka ustawy o państwie narodowym w Izraelu', 'Spory o charakter prawny państwa w Izraelu', 'Rola ustaw zasadniczych w sądownictwie Izraela' zamiast ogólnych fraz bez wskazania państwa).

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_motivation = {
        "type": "object",
        "properties": {
            "motivation_scores": {
                "type": "object",
                "properties": {
                    "truth_for_truth_sake": indicator_item,
                    "altruistic_faith": indicator_item,
                    "res_sacra_miser": indicator_item,
                    "ethical_utilitarianism": indicator_item,
                    "idealistic_public_service": indicator_item,
                    "art_for_beauty": indicator_item,
                    "voluntary_sacrifice": indicator_item,
                    "morality_leadership": indicator_item,
                    "person_as_end": indicator_item,
                    "sanctification_of_intent": indicator_item,
                    "no_transactional_utilitarianism": indicator_item,
                    "no_contractual_religion": indicator_item,
                    "no_totalitarian_utilitarianism": indicator_item,
                    "no_biologism_force": indicator_item
                },
                "required": [
                    "truth_for_truth_sake", "altruistic_faith", "res_sacra_miser", "ethical_utilitarianism",
                    "idealistic_public_service", "art_for_beauty", "voluntary_sacrifice", "morality_leadership",
                    "person_as_end", "sanctification_of_intent", "no_transactional_utilitarianism",
                    "no_contractual_religion", "no_totalitarian_utilitarianism", "no_biologism_force"
                ]
            },
            "motivation_news_1": {"type": "string"},
            "motivation_news_2": {"type": "string"},
            "motivation_news_3": {"type": "string"},
            "motivation_justification": {"type": "string"}
        },
        "required": [
            "motivation_scores", "motivation_news_1", "motivation_news_2", "motivation_news_3", "motivation_justification"
        ]
    }

    sys_inst_motivation = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 14 WSKAŹNIKÓW MOTYWACJI I BEZINTERESOWNOŚCI (motivation_scores):
1. truth_for_truth_sake: Prawda i nauka szukana dla niej samej (czysta ciekawość)
2. altruistic_faith: Wiara i religia oparta na bezinteresownej miłości
3. res_sacra_miser: Zasada res sacra miser (bezinteresowna pomoc cierpiącym)
4. ethical_utilitarianism: Prymat etyki nad zyskiem (utylitaryzm musi być etyczny)
5. idealistic_public_service: Służba publiczna dla ideału Dobra wspólnego
6. art_for_beauty: Sztuka i twórczość służąca bezinteresownemu Pięknu
7. voluntary_sacrifice: Wartość dobrowolnego poświęcenia i wyrzeczenia
8. morality_leadership: Etyka jako przodowniczka i hegemon życia publicznego
9. person_as_end: Personalizm (człowiek jako cel sam w sobie, nie narzędzie)
10. sanctification_of_intent: Uświęcenie intencji (wewnętrzna motywacja)
11. no_transactional_utilitarianism: Odrzucenie utylitaryzmu transakcyjnego
12. no_contractual_religion: Odrzucenie religijności kontraktowej
13. no_totalitarian_utilitarianism: Odrzucenie utylitaryzmu totalnego
14. no_biologism_force: Odrzucenie biologizmu, siły i eliminowania słabych

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (gdzie 1.0 oznacza pełne urzeczywistnienie szeregu personalistycznego / łacińskiego). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_motivation = f"""Kontekst metodologiczny Konecznego (Motywacja - Bezinteresowność):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Przeprowadź analizę WSZYSTKICH 14 wskaźników MOTYWACJI I BEZINTERESOWNOŚCI (motivation_scores) dla poniższego tekstu.

BARDZO WAŻNA ZASADA DLA NEWS_EXAMPLES:
Każdy z 3 nagłówków w news_examples MUSI bezwzględnie zawierać nazwę kraju / państwa / podmiotu opisanego w analizowanym tekście (np. jeśli tekst dotyczy Izraela, napiszesz 'Krytyka ustawy o państwie narodowym w Izraelu', 'Spory o charakter prawny państwa w Izraelu', 'Rola ustaw zasadniczych w sądownictwie Izraela' zamiast ogólnych fraz bez wskazania państwa).

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_justice_nature = {
        "type": "object",
        "properties": {
            "justice_nature_scores": {
                "type": "object",
                "properties": {
                    "equity_over_letter": indicator_item,
                    "judge_conscience_role": indicator_item,
                    "law_from_ethics": indicator_item,
                    "no_shylock_formalism": indicator_item,
                    "state_under_decalogue": indicator_item,
                    "justice_needs_mercy": indicator_item,
                    "no_legislative_elephantiasis": indicator_item,
                    "good_hegemony_over_law": indicator_item,
                    "aposteriori_law": indicator_item,
                    "legal_dualism": indicator_item,
                    "judicial_independence": indicator_item,
                    "ethics_above_law": indicator_item,
                    "no_jewish_casuistry": indicator_item,
                    "no_byzantine_statolatry": indicator_item,
                    "no_camp_turanian_law": indicator_item,
                    "no_socialist_collectivism": indicator_item
                },
                "required": [
                    "equity_over_letter", "judge_conscience_role", "law_from_ethics", "no_shylock_formalism",
                    "state_under_decalogue", "justice_needs_mercy", "no_legislative_elephantiasis", "good_hegemony_over_law",
                    "aposteriori_law", "legal_dualism", "judicial_independence", "ethics_above_law",
                    "no_jewish_casuistry", "no_byzantine_statolatry", "no_camp_turanian_law", "no_socialist_collectivism"
                ]
            },
            "justice_nature_news_1": {"type": "string"},
            "justice_nature_news_2": {"type": "string"},
            "justice_nature_news_3": {"type": "string"},
            "justice_nature_justification": {"type": "string"}
        },
        "required": [
            "justice_nature_scores", "justice_nature_news_1", "justice_nature_news_2", "justice_nature_news_3", "justice_nature_justification"
        ]
    }

    sys_inst_justice_nature = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 16 WSKAŹNIKÓW NATURY SPRAWIEDLIWOŚCI (justice_nature_scores):
1. equity_over_letter: Etyczne poczucie słuszności stoi ponad literą prawa
2. judge_conscience_role: Sędzia orzeka według sumienia (nie maszynka do paragrafów)
3. law_from_ethics: Prawo wywodzi się z etyki (jest jej pieczęcią)
4. no_shylock_formalism: Odrzucenie metody Shylocka i ślepego formalizmu
5. state_under_decalogue: Państwo i jego ustawy podlegają normom moralnym
6. justice_needs_mercy: Miłosierdzie jako niezbędna korekta prawa (res sacra miser)
7. no_legislative_elephantiasis: Odrzucenie elephantiasis ustawodawczej
8. good_hegemony_over_law: Hegemonia Dobra nad prawem (bezprawiem jest co razi etykę)
9. aposteriori_law: Prawo aposterioryczne wyrastające z doświadczenia
10. legal_dualism: Ścisły rozdział prawa prywatnego od publicznego
11. judicial_independence: Niezawisłość sądowa w ocenie zgodności ze słusznością
12. ethics_above_law: Odrzucenie stanu, w którym litera prawa pożera sumienie
13. no_jewish_casuistry: Odrzucenie kazuistyki i troski o litery zamiast myśli
14. no_byzantine_statolatry: Odrzucenie bizantynizmu i statolatrii
15. no_camp_turanian_law: Odrzucenie turańskiego prawa obozowego i woli wodza
16. no_socialist_collectivism: Odrzucenie socjalistycznego posłuszeństwa gromadzie

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (gdzie 1.0 oznacza pełne urzeczywistnienie szeregu personalistycznego / łacińskiego). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_justice_nature = f"""Kontekst metodologiczny Konecznego (Natura Sprawiedliwości):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Musisz przeanalizować i zwrócić DOKŁADNIE WSZYSTKIE 16 WSKAŹNIKÓW NATURY SPRAWIEDLIWOŚCI (justice_nature_scores):
1. equity_over_letter
2. judge_conscience_role
3. law_from_ethics
4. no_shylock_formalism
5. state_under_decalogue
6. justice_needs_mercy
7. no_legislative_elephantiasis
8. good_hegemony_over_law
9. aposteriori_law
10. legal_dualism
11. judicial_independence
12. ethics_above_law
13. no_jewish_casuistry
14. no_byzantine_statolatry
15. no_camp_turanian_law
16. no_socialist_collectivism

Dla każdego z 16 wskaźników podaj wycenę (score 0.0-1.0 lub -1.0), zwięzłe wyjaśnienie (explanation) oraz przykłady (news_examples).

BARDZO WAŻNA ZASADA DLA NEWS_EXAMPLES:
Każdy z 3 nagłówków w news_examples MUSI bezwzględnie zawierać nazwę kraju / państwa / podmiotu opisanego w analizowanym tekście (np. jeśli tekst dotyczy Izraela, napiszesz 'Krytyka ustawy o państwie narodowym w Izraelu', 'Spory o charakter prawny państwa w Izraelu', 'Rola ustaw zasadniczych w sądownictwie Izraela' zamiast ogólnych fraz bez wskazania państwa).

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_conscience_status = {
        "type": "object",
        "properties": {
            "conscience_status_scores": {
                "type": "object",
                "properties": {
                    "no_statutory_morality_only": indicator_item,
                    "conscience_as_supreme_judge": indicator_item,
                    "no_legislative_elephantiasis": indicator_item,
                    "refusal_of_immoral_orders": indicator_item,
                    "personal_accountability_god": indicator_item,
                    "no_shylock_formalism": indicator_item,
                    "ethics_above_law": indicator_item,
                    "personalism_sovereignty": indicator_item,
                    "good_hegemony_over_law": indicator_item,
                    "legal_dualism_privacy": indicator_item,
                    "aposteriori_experience": indicator_item,
                    "no_casuistry_expropriation": indicator_item,
                    "no_byzantine_statolatry": indicator_item,
                    "no_socialist_gregarious_fear": indicator_item,
                    "no_camp_turanian_coercion": indicator_item
                },
                "required": [
                    "no_statutory_morality_only", "conscience_as_supreme_judge", "no_legislative_elephantiasis",
                    "refusal_of_immoral_orders", "personal_accountability_god", "no_shylock_formalism",
                    "ethics_above_law", "personalism_sovereignty", "good_hegemony_over_law", "legal_dualism_privacy",
                    "aposteriori_experience", "no_casuistry_expropriation", "no_byzantine_statolatry",
                    "no_socialist_gregarious_fear", "no_camp_turanian_coercion"
                ]
            },
            "conscience_status_news_1": {"type": "string"},
            "conscience_status_news_2": {"type": "string"},
            "conscience_status_news_3": {"type": "string"},
            "conscience_status_justification": {"type": "string"}
        },
        "required": [
            "conscience_status_scores", "conscience_status_news_1", "conscience_status_news_2", "conscience_status_news_3", "conscience_status_justification"
        ]
    }

    sys_inst_conscience_status = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 15 WSKAŹNIKÓW STATUSU SUMIENIA - AUTONOMIA VS HETERONOMIA (conscience_status_scores):
1. no_statutory_morality_only: Odrzucenie poglądu, że moralność wynika z samego braku kolizji z przepisem
2. conscience_as_supreme_judge: Sumienie uznawane za suwerennego sędziego nad prawem
3. no_legislative_elephantiasis: Odrzucenie skodyfikowania wszystkiego krępującego sumienie
4. refusal_of_immoral_orders: Obowiązek odmowy wykonania rozkazu sprzecznego z Dekalogiem
5. personal_accountability_god: Rachunek sumienia i osobista odpowiedzialność przed Bogiem
6. no_shylock_formalism: Odrzucenie formalizmu Shylocka wbrew słuszności i sumieniu
7. ethics_above_law: Etyka jako przodowniczka prawa (wyznacza granice prawu)
8. personalism_sovereignty: Personalizm (suwerenność jednostki i bezpośrednia relacja z Bogiem)
9. good_hegemony_over_law: Prymat Dobra i etyki totalnej nad prawem i polityką
10. legal_dualism_privacy: Ścisły dualizm prawny gwarantujący wolność sumienia
11. aposteriori_experience: Prawo wyrastające z doświadczenia (aposteriori), nie apriorycznych schematów
12. no_casuistry_expropriation: Odrzucenie wywłaszczenia sumienia przez kazuistykę prawną
13. no_byzantine_statolatry: Odrzucenie bizantynizmu, statolatrii i nieomylności państwa
14. no_socialist_gregarious_fear: Odrzucenie zastępowania sumienia bojaźnią przed gromadą
15. no_camp_turanian_coercion: Odrzucenie turańskiego prawa obozowego i ślepej woli wodza

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (gdzie 1.0 oznacza pełne urzeczywistnienie autonomii sumienia / szereg personalistyczny). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_conscience_status = f"""Kontekst metodologiczny Konecznego (Status Sumienia):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Musisz przeanalizować i zwrócić DOKŁADNIE WSZYSTKIE 15 WSKAŹNIKÓW STATUSU SUMIENIA (conscience_status_scores):
1. no_statutory_morality_only
2. conscience_as_supreme_judge
3. no_legislative_elephantiasis
4. refusal_of_immoral_orders
5. personal_accountability_god
6. no_shylock_formalism
7. ethics_above_law
8. personalism_sovereignty
9. good_hegemony_over_law
10. legal_dualism_privacy
11. aposteriori_experience
12. no_casuistry_expropriation
13. no_byzantine_statolatry
14. no_socialist_gregarious_fear
15. no_camp_turanian_coercion

Dla każdego z 15 wskaźników podaj wycenę (score 0.0-1.0 lub -1.0), zwięzłe wyjaśnienie (explanation) oraz przykłady (news_examples).

BARDZO WAŻNA ZASADA DLA NEWS_EXAMPLES:
Każdy z 3 nagłówków w news_examples MUSI bezwzględnie zawierać nazwę kraju / państwa / podmiotu opisanego w analizowanym tekście (np. jeśli tekst dotyczy Izraela, napiszesz 'Krytyka ustawy o państwie narodowym w Izraelu', 'Spory o charakter prawny państwa w Izraelu', 'Rola ustaw zasadniczych w sądownictwie Izraela' zamiast ogólnych fraz bez wskazania państwa).

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_time_mastery = {
        "type": "object",
        "properties": {
            "time_mastery_scores": {
                "type": "object",
                "properties": {
                    "scientific_chronology": indicator_item,
                    "active_critical_tradition": indicator_item,
                    "hereditary_surnames": indicator_item,
                    "term_discipline": indicator_item,
                    "capitalization_of_time": indicator_item,
                    "sub_specie_aeternitatis": indicator_item,
                    "time_rich_language": indicator_item,
                    "historicism_national_consciousness": indicator_item,
                    "dated_documentation": indicator_item,
                    "latin_historicism_unique": indicator_item,
                    "generational_voluntary_synthesis": indicator_item,
                    "family_emancipation_workshop": indicator_item,
                    "truth_and_goodness_cult": indicator_item,
                    "no_sacral_passive_stagnation": indicator_item,
                    "no_turanian_camp_presentism": indicator_item
                },
                "required": [
                    "scientific_chronology", "active_critical_tradition", "hereditary_surnames", "term_discipline",
                    "capitalization_of_time", "sub_specie_aeternitatis", "time_rich_language", "historicism_national_consciousness",
                    "dated_documentation", "latin_historicism_unique", "generational_voluntary_synthesis", "family_emancipation_workshop",
                    "truth_and_goodness_cult", "no_sacral_passive_stagnation", "no_turanian_camp_presentism"
                ]
            },
            "time_mastery_news_1": {"type": "string"},
            "time_mastery_news_2": {"type": "string"},
            "time_mastery_news_3": {"type": "string"},
            "time_mastery_justification": {"type": "string"}
        },
        "required": [
            "time_mastery_scores", "time_mastery_news_1", "time_mastery_news_2", "time_mastery_news_3", "time_mastery_justification"
        ]
    }

    sys_inst_time_mastery = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 15 WSKAŹNIKÓW OPANOWANIA CZASU I HISTORYZMU (time_mastery_scores):
1. scientific_chronology: Naukowa chronologia i własna era (precyzyjna rachuba lat)
2. active_critical_tradition: Tradycja czynna i krytyczna (przesiewanie spuścizny przodków)
3. hereditary_surnames: Nazwiska dziedziczne i historyzm prywatny (pasmo pokoleń)
4. term_discipline: Pojęcie terminu, punktualności i opanowywania losu
5. capitalization_of_time: Kapitalizowanie czasu dla potomnych (przekazywanie dorobku vs ab ovo)
6. sub_specie_aeternitatis: Myślenie i wysiłek poza własny zgon (sub specie aeternitatis)
7. time_rich_language: Bogactwo pojęć i spójników czasowych w języku
8. historicism_national_consciousness: Poczucie narodowe oparte na historyzmie (synteza Logosu i Ethosu)
9. dated_documentation: Datowane dokumenty i wrażliwość na chronologię
10. latin_historicism_unique: Unikalny historyzm cywilizacji łacińskiej (kultura czynu)
11. generational_voluntary_synthesis: Synteza personalizmu z poczuciem zrzeszeniowym
12. family_emancipation_workshop: Wyodrębniona rodzina jako warsztat historyzmu
13. truth_and_goodness_cult: Kult prawdy i krytyka błędów przodków dla postępu
14. no_sacral_passive_stagnation: Odrzucenie biernej tradycji sakralnej i zastoju
15. no_turanian_camp_presentism: Odrzucenie uwięzienia w mechanicznej teraźniejszości (turańszczyzna / bizantynizm / rewolucjonizm)

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (gdzie 1.0 oznacza pełne opanowanie czasu / historyzm). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_time_mastery = f"""Kontekst metodologiczny Konecznego (Opanowanie Czasu i Historyzm):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Musisz przeanalizować i zwrócić DOKŁADNIE WSZYSTKIE 15 WSKAŹNIKÓW OPANOWANIA CZASU (time_mastery_scores).
BARDZO WAŻNA ZASADA DLA NEWS_EXAMPLES: Każdy z 3 nagłówków w news_examples MUSI bezwzględnie zawierać nazwę kraju / państwa / podmiotu opisanego w analizowanym tekście.

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_work_ethos = {
        "type": "object",
        "properties": {
            "work_ethos_scores": {
                "type": "object",
                "properties": {
                    "manual_work_dignity": indicator_item,
                    "ethical_duty_of_work": indicator_item,
                    "work_as_sanctification": indicator_item,
                    "no_status_laziness": indicator_item,
                    "voluntary_work_for_common_good": indicator_item,
                    "craft_creativity_innovation": indicator_item,
                    "moral_duty_of_prosperity": indicator_item,
                    "work_sub_specie_aeternitatis": indicator_item,
                    "no_bureaucratic_exploitation": indicator_item,
                    "christian_postulate_of_work": indicator_item,
                    "person_dignity_in_work": indicator_item,
                    "harmony_logos_ethos_in_work": indicator_item,
                    "no_contempt_for_physical_work": indicator_item,
                    "no_totalitarian_forced_labor": indicator_item
                },
                "required": [
                    "manual_work_dignity", "ethical_duty_of_work", "work_as_sanctification", "no_status_laziness",
                    "voluntary_work_for_common_good", "craft_creativity_innovation", "moral_duty_of_prosperity",
                    "work_sub_specie_aeternitatis", "no_bureaucratic_exploitation", "christian_postulate_of_work",
                    "person_dignity_in_work", "harmony_logos_ethos_in_work", "no_contempt_for_physical_work",
                    "no_totalitarian_forced_labor"
                ]
            },
            "work_ethos_news_1": {"type": "string"},
            "work_ethos_news_2": {"type": "string"},
            "work_ethos_news_3": {"type": "string"},
            "work_ethos_justification": {"type": "string"}
        },
        "required": [
            "work_ethos_scores", "work_ethos_news_1", "work_ethos_news_2", "work_ethos_news_3", "work_ethos_justification"
        ]
    }

    sys_inst_work_ethos = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 14 WSKAŹNIKÓW ETOSU PRACY (work_ethos_scores):
1. manual_work_dignity: Szacunek dla pracy fizycznej człowieka wolnego (brak odium hańby)
2. ethical_duty_of_work: Etyczny obowiązek pracy ("Kto nie pracuje, niech nie je")
3. work_as_sanctification: Praca jako uświęcenie, kultura czynu i droga do godności
4. no_status_laziness: Potępienie próżniactwa reprezentacyjnego i niepracowania
5. voluntary_work_for_common_good: Dobrowolna praca dla dobra wspólnego (vs przymus państwowy)
6. craft_creativity_innovation: Innowacyjność, wynalazczość i Logos w rzemiośle
7. moral_duty_of_prosperity: Zamożność zdobyta pracą jako obowiązek moralny dla miłosierdzia
8. work_sub_specie_aeternitatis: Praca sub specie aeternitatis dla przyszłych pokoleń
9. no_bureaucratic_exploitation: Budowanie materialnej podmiotowości (vs wyzysk fiskalny)
10. christian_postulate_of_work: Chrześcijański postulat pracy (doskonalenie duszy vs klątwa)
11. person_dignity_in_work: Personalistyczna godność pracownika (zniesienie poddaństwa)
12. harmony_logos_ethos_in_work: Harmonia Logosu i Ethosu w gospodarki
13. no_contempt_for_physical_work: Odrzucenie pogardy dla pracy fizycznej
14. no_totalitarian_forced_labor: Odrzucenie pracy przymusowej (turańszczyzna/bizantynizm/marksizm)

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (gdzie 1.0 oznacza pełny etos pracy wolnej / uświęconej). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_work_ethos = f"""Kontekst metodologiczny Konecznego (Ethos Pracy):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Musisz przeanalizować i zwrócić DOKŁADNIE WSZYSTKIE 14 WSKAŹNIKÓW ETOSU PRACY (work_ethos_scores).
BARDZO WAŻNA ZASADA DLA NEWS_EXAMPLES: Każdy z 3 nagłówków w news_examples MUSI bezwzględnie zawierać nazwę kraju / państwa / podmiotu opisanego w analizowanym tekście.

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    schema_quincunx = {
        "type": "object",
        "properties": {
            "quincunx_scores": {
                "type": "object",
                "properties": {
                    "ethics_totality_public_private": indicator_item,
                    "good_above_law_force": indicator_item,
                    "personal_moral_accountability": indicator_item,
                    "natural_truth_pure_science": indicator_item,
                    "academic_educational_freedom": indicator_item,
                    "public_scientific_health_duty": indicator_item,
                    "res_sacra_miser_ethics": indicator_item,
                    "individual_hereditary_property": indicator_item,
                    "honest_prosperity_duty": indicator_item,
                    "beauty_allegory_of_good": indicator_item,
                    "full_artistic_freedom": indicator_item
                },
                "required": [
                    "ethics_totality_public_private", "good_above_law_force", "personal_moral_accountability",
                    "natural_truth_pure_science", "academic_educational_freedom",
                    "public_scientific_health_duty", "res_sacra_miser_ethics",
                    "individual_hereditary_property", "honest_prosperity_duty",
                    "beauty_allegory_of_good", "full_artistic_freedom"
                ]
            },
            "quincunx_news_1": {"type": "string"},
            "quincunx_news_2": {"type": "string"},
            "quincunx_news_3": {"type": "string"},
            "quincunx_justification": {"type": "string"}
        },
        "required": [
            "quincunx_scores", "quincunx_news_1", "quincunx_news_2", "quincunx_news_3", "quincunx_justification"
        ]
    }

    sys_inst_quincunx = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 11 WSKAŹNIKÓW PIĘCIOMIANU BYTU (QUINCUNX: Dobro, Prawda, Zdrowie, Dobrobyt, Piękno):
DOBRO (Etyka):
1. ethics_totality_public_private: Etyka totalna (ta sama moralność w życiu prywatnym i publicznym)
2. good_above_law_force: Prymat Dobra i Etyki nad stanowionym prawem i siłą
3. personal_moral_accountability: Osobista odpowiedzialność moralna przed Bogiem i sumieniem

PRAWDA (Nauka):
4. natural_truth_pure_science: Prawda przyrodzona i bezinteresowne dociekanie nauki
5. academic_educational_freedom: Wolność badań naukowych i oświaty od ideologii/cenzury

ZDROWIE (Higiena):
6. public_scientific_health_duty: Piecza o zdrowie jako naukowo-etyczny obowiązek publiczny
7. res_sacra_miser_ethics: Zasada res sacra miser (cierpiący świętością) i etyka medyczna

DOBROBYT (Gospodarka):
8. individual_hereditary_property: Fundament własności osobistej i dziedzicznej
9. honest_prosperity_duty: Uczciwa zamożność jako obowiązek moralny ułatwiający cnoty

PIĘKNO (Sztuka):
10. beauty_allegory_of_good: Piękno jako alegoria i uduchowienie Dobra
11. full_artistic_freedom: Pełna swoboda twórcza we wszystkich dziedzinach sztuki

ZASADA POLARYZACJI SCORINGU (0.0 - 1.0):
Wszystkie wskaźniki podawaj w skali 0.0 - 1.0, gdzie:
- 1.0 OZNACZA PEŁNE URZECZYWISTNIENIE MODELU PERSONALISTYCZNEGO / CYWILIZACJI ŁACIŃSKIEJ.
- 0.0 OZNACZA MODEL GROMADNOŚCIOWY / BRAK DANEJ SFERY LUB JEJ DEFEKT.
Jeśli brak danych w tekście: -1.0. Zwróć JSON."""

    prompt_quincunx = f"""Kontekst metodologiczny Konecznego (Pięciomian Bytu - Quincunx):
{indices_context[:3000]}
{rag_context}

BARDZO WAŻNE INSTRUKCJE:
Musisz przeanalizować i zwrócić DOKŁADNIE WSZYSTKIE 11 WSKAŹNIKÓW PIĘCIOMIANU (quincunx_scores).
BARDZO WAŻNA ZASADA DLA NEWS_EXAMPLES: Każdy z 3 nagłówków w news_examples MUSI bezwzględnie zawierać nazwę kraju / państwa / podmiotu opisanego w analizowanym tekście.

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # Schema Health Status
    schema_health = {
        "type": "object",
        "properties": {
            "health_scores": {
                "type": "object",
                "properties": {
                    "public_scientific_health_duty": indicator_item,
                    "res_sacra_miser_ethics": indicator_item,
                    "patient_person_dignity": indicator_item,
                    "rejection_of_medical_killing": indicator_item,
                    "independent_medical_profession": indicator_item,
                    "public_hygiene_and_sanitation": indicator_item,
                    "no_body_exploitation": indicator_item,
                    "physician_conscience_clause": indicator_item,
                    "non_discriminatory_care": indicator_item,
                    "rational_disease_prevention": indicator_item
                },
                "required": [
                    "public_scientific_health_duty", "res_sacra_miser_ethics", "patient_person_dignity",
                    "rejection_of_medical_killing", "independent_medical_profession", "public_hygiene_and_sanitation",
                    "no_body_exploitation", "physician_conscience_clause", "non_discriminatory_care", "rational_disease_prevention"
                ]
            },
            "health_news_1": {"type": "string"},
            "health_news_2": {"type": "string"},
            "health_news_3": {"type": "string"},
            "health_justification": {"type": "string"}
        },
        "required": ["health_scores", "health_news_1", "health_news_2", "health_news_3", "health_justification"]
    }

    sys_inst_health = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 10 WSKAŹNIKÓW STATUSU ZDROWIA I HIGIENY (Sfera III Quincunxa):
1. public_scientific_health_duty: Piecza o zdrowie jako naukowo-etyczny obowiązek publiczny (vs rytuał)
2. res_sacra_miser_ethics: Zasada res sacra miser (cierpiący bliźni świętością) i etyka medyczna
3. patient_person_dignity: Szacunek dla godności i sumienia pacjenta jako wolnej osoby
4. rejection_of_medical_killing: Odrzucenie zabójstwa medycznego (eutanazja, eugenika)
5. independent_medical_profession: Autonomiczny samorząd lekarski wolny od biurokracji państwowej
6. public_hygiene_and_sanitation: Troska o czystość środowiska, wodociągi i higienę publiczną
7. no_body_exploitation: Odrzucenie traktowania ciała jako przedmiotu wyzysku / eksperymentów
8. physician_conscience_clause: Klauzula sumienia i swoboda leczenia dla lekarza
9. non_discriminatory_care: Dostępność pomocy medycznej bez dyskryminacji kastowej/majątkowej
10. rational_disease_prevention: Racjonalna profilaktyka medyczna zamiast magii i zabobonów

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (1.0 = Łacina / Personalizm). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_health = f"""Kontekst metodologiczny Konecznego (Status Zdrowia i Higieny):
{indices_context[:3000]}
{rag_context}

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # Schema Truth and Science
    schema_truth_science = {
        "type": "object",
        "properties": {
            "truth_science_scores": {
                "type": "object",
                "properties": {
                    "pure_disinterested_truth": indicator_item,
                    "academic_research_freedom": indicator_item,
                    "aposteriori_empirical_science": indicator_item,
                    "state_monopoly_free_education": indicator_item,
                    "truth_above_authority": indicator_item,
                    "no_utilitarian_reductionism": indicator_item,
                    "free_academic_speech": indicator_item,
                    "logos_and_logic_in_science": indicator_item,
                    "preservation_of_sources": indicator_item,
                    "rejection_of_historical_revisionism": indicator_item
                },
                "required": [
                    "pure_disinterested_truth", "academic_research_freedom", "aposteriori_empirical_science",
                    "state_monopoly_free_education", "truth_above_authority", "no_utilitarian_reductionism",
                    "free_academic_speech", "logos_and_logic_in_science", "preservation_of_sources", "rejection_of_historical_revisionism"
                ]
            },
            "truth_science_news_1": {"type": "string"},
            "truth_science_news_2": {"type": "string"},
            "truth_science_news_3": {"type": "string"},
            "truth_science_justification": {"type": "string"}
        },
        "required": ["truth_science_scores", "truth_science_news_1", "truth_science_news_2", "truth_science_news_3", "truth_science_justification"]
    }

    sys_inst_truth_science = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 10 WSKAŹNIKÓW AUTONOMII PRAWDY I NAUKI (Sfera II Quincunxa):
1. pure_disinterested_truth: Bezinteresowne dociekanie Prawdy dla niej samej
2. academic_research_freedom: Wolność badań naukowych od cenzury ideologicznej/państwowej
3. aposteriori_empirical_science: Aposterioryczne doświadczenie przyrodzone w badaniu świata
4. state_monopoly_free_education: Oświata wolna od monopolu i ideologizacji państwowej
5. truth_above_authority: Prawo do krytyki dogmatów władzy w imię Prawdy
6. no_utilitarian_reductionism: Odrzucenie pragmatyzmu sprowadzającego naukę tylko do techniki
7. free_academic_speech: Wolność słowa i otwarta debata w kulturze akademickiej
8. logos_and_logic_in_science: Oparcie nauki na logice i rozumnym planowaniu (Logos)
9. preservation_of_sources: Rzetelna ochrona źródeł, faktów i dokumentacji
10. rejection_of_historical_revisionism: Odrzucenie fałszowania historii na rzecz prawdy dziejowej

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (1.0 = Łacina / Wolność nauki). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_truth_science = f"""Kontekst metodologiczny Konecznego (Autonomia Prawdy i Nauki):
{indices_context[:3000]}
{rag_context}

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # Schema Beauty and Art
    schema_beauty_art = {
        "type": "object",
        "properties": {
            "beauty_art_scores": {
                "type": "object",
                "properties": {
                    "beauty_allegory_of_good": indicator_item,
                    "full_artistic_freedom": indicator_item,
                    "rejection_of_aniconism": indicator_item,
                    "uplifting_aesthetic_ideals": indicator_item,
                    "craftsmanship_aesthetic_spiritualization": indicator_item,
                    "protection_of_aesthetic_heritage": indicator_item,
                    "independent_artistic_patronage": indicator_item,
                    "art_serving_person_not_state": indicator_item,
                    "moral_sensitivity_in_art": indicator_item,
                    "universal_access_to_culture": indicator_item
                },
                "required": [
                    "beauty_allegory_of_good", "full_artistic_freedom", "rejection_of_aniconism",
                    "uplifting_aesthetic_ideals", "craftsmanship_aesthetic_spiritualization", "protection_of_aesthetic_heritage",
                    "independent_artistic_patronage", "art_serving_person_not_state", "moral_sensitivity_in_art", "universal_access_to_culture"
                ]
            },
            "beauty_art_news_1": {"type": "string"},
            "beauty_art_news_2": {"type": "string"},
            "beauty_art_news_3": {"type": "string"},
            "beauty_art_justification": {"type": "string"}
        },
        "required": ["beauty_art_scores", "beauty_art_news_1", "beauty_art_news_2", "beauty_art_news_3", "beauty_art_justification"]
    }

    sys_inst_beauty_art = """Jesteś ekspertem historiozofii Feliksa Konecznego. Oceniasz przysłany TEKST w wymiarze 10 WSKAŹNIKÓW STATUSU PIĘKNA I SZTUKI (Sfera V Quincunxa):
1. beauty_allegory_of_good: Piękno jako alegoria i uduchowienie Dobra oraz Prawdy
2. full_artistic_freedom: Pełna swoboda twórcza we wszystkich dziedzinach sztuki
3. rejection_of_aniconism: Odrzucenie zakazów sakralnych krępujących sztukę (anikonizm)
4. uplifting_aesthetic_ideals: Sztuka dążąca do harmonii i uduchowienia (vs kult brzydoty)
5. craftsmanship_aesthetic_spiritualization: Uduchowienie materiału w rzemiośle i architekturze
6. protection_of_aesthetic_heritage: Ochrona zabytków i dziedzictwa estetycznego przodków
7. independent_artistic_patronage: Mecenat artystyczny wolny od dyktatu biurokracji państwowej
8. art_serving_person_not_state: Sztuka służąca rozwojowi osoby (vs propaganda statolatrii)
9. moral_sensitivity_in_art: Wolność estetyczna szanująca wrażliwość moralną
10. universal_access_to_culture: Powszechny dostęp do kultury estetycznej dla wszystkich stanów

Wszystkie wskaźniki podawaj w skali 0.0 - 1.0 (1.0 = Łacina / Wolna sztuka). Jeśli brak danych: -1.0. Zwróć JSON."""

    prompt_beauty_art = f"""Kontekst metodologiczny Konecznego (Status Piękna i Sztuki):
{indices_context[:3000]}
{rag_context}

TEKST DO ANALIZY:
{trimmed_text}
Zwróć JSON."""

    # Execute calls conditionally based on target_indices
    if target_indices is None:
        # Default for development if not specified
        target_indices = [k for k, v in INDEX_DEV_FLAGS.items() if v]

    # Map "spirit" to its 12 component indices
    if "spirit" in target_indices:
        for idx in ["dualism", "pluralism", "aposteriori", "organism", "personalism", "family", "church", "property", "inheritance", "morality", "public_morality", "administrative_responsibility"]:
            if idx not in target_indices:
                target_indices.append(idx)

    # Map "civilizational_lie" to its component indices
    if "civilizational_lie" in target_indices:
        for idx in ["quincunx", "duty_source", "morality", "public_morality", "personalism", "sacrality"]:
            if idx not in target_indices:
                target_indices.append(idx)

    import concurrent.futures

    tasks = []
    if "sacrality" in target_indices: tasks.append((prompt_1, sys_inst_1, schema_1))
    if "generalia" in target_indices: tasks.append((prompt_generalia, sys_inst_generalia, schema_generalia))
    if "duty_source" in target_indices: tasks.append((prompt_duty_source, sys_inst_duty_source, schema_duty_source))
    if "motivation" in target_indices: tasks.append((prompt_motivation, sys_inst_motivation, schema_motivation))
    if "justice_nature" in target_indices: tasks.append((prompt_justice_nature, sys_inst_justice_nature, schema_justice_nature))
    if "conscience_status" in target_indices: tasks.append((prompt_conscience_status, sys_inst_conscience_status, schema_conscience_status))
    if "time_mastery" in target_indices: tasks.append((prompt_time_mastery, sys_inst_time_mastery, schema_time_mastery))
    if "work_ethos" in target_indices: tasks.append((prompt_work_ethos, sys_inst_work_ethos, schema_work_ethos))
    if "quincunx" in target_indices: tasks.append((prompt_quincunx, sys_inst_quincunx, schema_quincunx))
    if "health" in target_indices: tasks.append((prompt_health, sys_inst_health, schema_health))
    if "truth_science" in target_indices: tasks.append((prompt_truth_science, sys_inst_truth_science, schema_truth_science))
    if "beauty_art" in target_indices: tasks.append((prompt_beauty_art, sys_inst_beauty_art, schema_beauty_art))
    if "dualism" in target_indices: tasks.append((prompt_2, sys_inst_2, schema_2))
    if "pluralism" in target_indices: tasks.append((prompt_3, sys_inst_3, schema_3))
    if "aposteriori" in target_indices: tasks.append((prompt_4, sys_inst_4, schema_4))
    if "organism" in target_indices: tasks.append((prompt_5, sys_inst_5, schema_5))
    if "personalism" in target_indices: tasks.append((prompt_5b, sys_inst_5b, schema_5_pers))
    if "family" in target_indices: tasks.append((prompt_6, sys_inst_6, schema_6))
    if "church" in target_indices: tasks.append((prompt_7, sys_inst_7, schema_7))
    if "property" in target_indices: tasks.append((prompt_8, sys_inst_8, schema_8))
    if "inheritance" in target_indices: tasks.append((prompt_9, sys_inst_9, schema_9))
    if "morality" in target_indices: tasks.append((prompt_10, sys_inst_10, schema_10))
    if "public_morality" in target_indices: tasks.append((prompt_11, sys_inst_11, schema_11))
    if "administrative_responsibility" in target_indices: tasks.append((prompt_12, sys_inst_12, schema_12))

    llm_data = {}
    
    if tasks:
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            future_to_task = {executor.submit(run_query, t[0], t[1], t[2]): t for t in tasks}
            for future in concurrent.futures.as_completed(future_to_task):
                try:
                    res = future.result()
                    if res:
                        llm_data.update(res)
                except Exception as exc:
                    print(f"Task generated an exception: {exc}")

    # Run math calculations and return unified structure
    result = calculate_koneczny_metrics(llm_data)
    return result
