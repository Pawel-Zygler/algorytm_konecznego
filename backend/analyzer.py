import os
import json
import time
import requests
import json_repair
from typing import Dict, Any
from backend import config
from backend import rag

INDEX_DEV_FLAGS = {
    "sacrality": False,
    "spirit": False,
    "generalia": False,
    "duty_source": True,
    "motivation": False,
    "responsibility_type": False,
    "justice_nature": False,
    "conscience_status": False,
    "time_mastery": False,
    "work_ethos": False,
    "dualism": False,
    "pluralism": False,
    "aposteriori": False,
    "organism": False,
    "personalism": False,
    "family": False,
    "church": False,
    "property": False,
    "inheritance": False,
    "morality": False,
    "public_morality": False,
    "administrative_responsibility": False
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
    """Calls Gemini API via raw HTTP requests with model fallback."""
    headers = {
        "Content-Type": "application/json"
    }

    data = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "systemInstruction": {
            "parts": [
                {"text": system_instruction}
            ]
        },
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.1,
            "maxOutputTokens": 8192,
            "responseSchema": schema
        }
    }
    
    last_error = None
    for model_name in config.GEMINI_MODELS:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        try:
            response = requests.post(url, headers=headers, json=data, timeout=120)
            if response.status_code == 200:
                res_json = response.json()
                content_text = res_json['candidates'][0]['content']['parts'][0]['text']
                return content_text
            elif response.status_code in [404, 429, 500, 503]:
                # 404 = Model not found, 429 = Quota exceeded, 500/503 = Server errors / High demand
                last_error = f"Model {model_name} failed ({response.status_code}): {response.text}"
                print(last_error + " Trying next model...")
                if response.status_code in [429, 503]:
                    time.sleep(2)
                continue
            else:
                # Other errors (e.g. 400 Bad Request) usually indicate a syntax/schema error, not worth retrying models
                raise Exception(f"Gemini API request failed ({response.status_code}) on model {model_name}: {response.text}")
        except requests.exceptions.RequestException as e:
            last_error = f"Network error on {model_name}: {str(e)}"
            print(last_error + " Trying next model...")
            continue
            
    raise Exception(f"All models failed. Last error: {last_error}")

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
    }
    # Calculate global spirit supremacy score from 12 indices
    spirit_scores = [
        result["legal_dualism_score"], result["law_source_pluralism_score"], result["aposteriori_apriori_score"],
        result["organism_mechanism_score"], result["personalism_score"], result["family_law_autonomy_score"],
        result["church_independence_score"], result["property_rights_stability_score"], result["inheritance_continuity_score"],
        result["morality_supremacy_score"], result["public_morality_totality_score"], result["administrative_responsibility_score"]
    ]
    valid_spirit = [s for s in spirit_scores if s >= 0]
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

    import concurrent.futures

    tasks = []
    if "sacrality" in target_indices: tasks.append((prompt_1, sys_inst_1, schema_1))
    if "generalia" in target_indices: tasks.append((prompt_generalia, sys_inst_generalia, schema_generalia))
    if "duty_source" in target_indices: tasks.append((prompt_duty_source, sys_inst_duty_source, schema_duty_source))
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
