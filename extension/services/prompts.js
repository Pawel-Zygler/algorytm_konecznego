/**
 * Koneczny Methodological Context, Index Schemas, and Prompt Builder for Direct Chrome Mode.
 * Replaces ChromaDB RAG + backend/analyzer.py prompts with compact static definitions.
 */

export const INDICATOR_ITEM_SCHEMA = {
  type: 'object',
  properties: {
    score: {
      type: 'number',
      description: 'Ocena w skali 0.0 do 1.0 (gdzie 1.0 oznacza pełne spełnienie kryterium, 0.0 brak/zaprzeczenie), lub -1.0 gdy w tekście brak danych.',
    },
    explanation: {
      type: 'string',
      description: 'Zwięzłe uzasadnienie po polsku (1-2 zdania) oparte na analizowanym tekście.',
    },
    news_examples: {
      type: 'array',
      items: { type: 'string' },
      description: 'Dokładnie 3 krótkie hasła/zapytania po polsku do wyszukania kontekstu ze świata lub przykładów prasowych.',
    },
  },
  required: ['score', 'explanation', 'news_examples'],
};

export const KONECZNY_SYSTEM_BASE = `Jesteś ekspertem w dziedzinie nauki o cywilizacjach prof. Feliksa Konecznego.
Kluczowe pojęcia metody Konecznego:
- Cywilizacja to metoda ustroju życia zbiorowego (Łacińska, Bizantyńska, Turańska, Arabska, Żydowska, Bramińska, Chińska).
- Pięciomian Bytu (Quincunx): Dobro (moralność), Prawda (nauka), Zdrowie (higiena), Dobrobyt (ekonomia), Piękno (sztuka) — w cywilizacji łacińskiej spójne pod prymatem Dobra.
- Dualizm prawny (rozdział prawa prywatnego i publicznego) vs Monizm prawny (prawo publiczne pochłania prywatne w Bizancjum, lub prawo prywatne władcy w Turańszczyźnie).
- Personalizm (autonomia osoby i sumienia, jedno sumienie w życiu prywatnym i publicznym) vs Gromadnościowość (kolektywizm, dwoistość sumienia, etyka wspólnotowa).
- Chyżość historyczna: zdolność do akumulacji dorobku pokoleń (chronologia, tradycja krytyczna, dziedziczne nazwiska, kapitalizacja czasu).
- Prawa dziejowe: Nie można być cywilizowanym na dwa sposoby; syntezy międzycywilizacyjne są niemożliwe — mieszanki prowadzą do zaniku sił społecznych (stan acywilizacyjny).

Zasady oceny:
1. Oceniaj WYŁĄCZNIE na podstawie dostarczonego tekstu. Jeśli tekst nie dostarcza przesłanek dla danego wskaźnika, wpisz score = -1.0 i krótkie wyjaśnienie "Brak danych w tekście".
2. Dla każdego wskaźnika podaj DOKŁADNIE 3 krótkie zapytania/przykłady w polu news_examples (po polsku).
3. Zwróć wyłącznie poprawny JSON zgodny ze schematem.`;

export const SPIRIT_COMPONENT_INDICES = [
  'dualism',
  'pluralism',
  'aposteriori',
  'organism',
  'personalism',
  'family',
  'church',
  'property',
  'inheritance',
  'morality',
  'public_morality',
  'administrative_responsibility',
];

export const MANTIS_INDICES = [
  'sacrality',
  'dualism',
  'church',
  'conscience_status',
  'personalism',
  'public_morality',
];

export const LITE_INDICES = [
  'sacrality',
  'dualism',
  'aposteriori',
  'family',
  'church',
  'generalia',
  'quincunx',
];

export const INDEX_DEFINITIONS = {
  sacrality: {
    scoreKey: 'sacrality_scores',
    title: 'Krok 1: Indeks Sakralności',
    focus: 'Czy porządek prawny, ustrój, rodzina, edukacja i własność opierają się na religijnym dogmacie/prawie sakralnym (1.0 = pełna sakralizacja/teokracja, 0.0 = świecko-rozumowy rozdział)?',
    indicators: [
      'RELIGIOUS_LAW_SUPREMACY', 'THEOCRATIC_AUTHORITY', 'FAMILY_RELIGIOUS_CONTROL',
      'RELIGIOUS_EDUCATION', 'PROPERTY_RELIGIOUS_CONTROL', 'SACRAL_CRIMINAL_LAW',
      'RELIGIOUS_TIME_CALENDAR', 'SCIENCE_RELIGION_FUSION', 'ETHICS_RELIGION_IDENTITY',
      'SACRAL_ECONOMICS', 'SOCIAL_HIERARCHY_RELIGIOUS', 'STATE_CHURCH_UNITY', 'APOSTASY_PUNISHMENT',
    ],
  },
  dualism: {
    scoreKey: 'legal_dualism_scores',
    title: 'Dualizm Prawny',
    focus: 'Rozdział prawa prywatnego i publicznego, ochrona rodziny i własności przed wszechwładzą państwa (1.0 = pełny dualizm łaciński, 0.0 = monizm prawny).',
    indicators: [
      'PRIVATE_RIGHTS_SPHERE', 'FAMILY_AUTONOMY', 'PROPERTY_PROTECTION', 'NATURAL_INHERITANCE',
      'POWER_LIMITS', 'OPPOSITION_RIGHT', 'STATE_MORALITY_SUBORDINATION', 'DIVINE_VS_CAESAR',
      'RULER_ETHICS_EQUALITY', 'INDEPENDENT_JUDICIARY', 'OFFICIAL_RESPONSIBILITY', 'APOSTERIORI_LAW',
      'ASSOCIATION_AUTONOMY', 'LAND_OWNERSHIP_FULL', 'LOCAL_LAW_TOLERANCE', 'LAW_CONSCIENCE_EQUALITY',
      'FAMILY_EMANCIPATION', 'SOCIETY_PRIMACY', 'SOCIETY_AS_GOAL', 'CHURCH_INDEPENDENCE',
      'NO_STATOLATRY_PUBLIC_MONISM', 'NO_PRIVATE_LAW_MONISM', 'CITIZENS_ARE_FREE',
      'NO_SACRAL_LAW_MONOPOLY', 'NO_EXCESS_REGULATION',
    ],
  },
  pluralism: {
    scoreKey: 'law_source_pluralism_scores',
    title: 'Pluralizm Źródeł Prawa',
    focus: 'Wielość źródeł prawa (zwyczaj, etyka, statuty korporacji, ius gentium) vs monopol ustawodawczy państwa lub wodza (1.0 = pluralizm łaciński).',
    indicators: [
      'MULTIPLE_LAW_SOURCES', 'SINGLE_LAW_SOURCE', 'LAW_DISCOVERY_VS_CREATION', 'UNJUST_LAW_CHALLENGE',
      'LAW_JUDGEABILITY', 'CAN_LAW_BE_BAD', 'LAW_SUBJECT_TO_REASON', 'CUSTOMARY_LAW_RECOGNITION',
      'SOCIAL_GROUPS_STATUTES', 'RULER_SUBJECT_TO_LAW', 'LAW_FROM_ETHICS_OR_DOGMA', 'IUS_GENTIUM_PRESENCE',
      'MEDITATION_VS_EXPERIENCE', 'INDEPENDENT_CORPORATIONS', 'PRIVATE_PUBLIC_LAW_SPLIT',
      'SOCIETY_PRIMACY_OVER_STATE', 'SINGLE_IMMUTABLE_SOURCE', 'WODZ_WILL_VS_MULTIPLE',
      'STATE_ONLY_LAW_SOURCE', 'SOCIALIST_DOCTRINE_COERCION',
    ],
  },
  aposteriori: {
    scoreKey: 'aposteriori_apriori_scores',
    title: 'Metoda Aposteriori vs Apriori',
    focus: 'Prawo wyrastające z doświadczenia i historii (aposteriori = 1.0) vs inżynieria społeczna i biurokratyczne planowanie odgórne (apriori = 0.0).',
    indicators: [
      'LAW_SANCTIONING_FACTS_VS_IDEAS', 'STATE_AS_EDUCATOR', 'INDUCTION_VS_DEDUCTION',
      'UNITY_BY_DIVERSITY_VS_UNIFORMITY', 'SOCIAL_ENGINEERING_CULT', 'ETHICS_PRECEDES_LAW',
      'HISTORICISM_AS_BASE', 'HISTORICISM_FOUNDATION', 'HUMAN_PERSONALISM_PRESENCE',
      'LEGAL_DUALISM_PRESENCE', 'FAMILY_EMANCIPATION_FOR_EXPERIENCE', 'NORMS_IMMUTABLE_VS_EVOLVING',
      'MECHANICAL_SOCIETY_METHOD', 'ENDLESS_UTOPIAN_PLANNING', 'EXCESSIVE_LEGISLATION_APRIORI',
    ],
  },
  organism: {
    scoreKey: 'organism_mechanism_scores',
    title: 'Organizm vs Mechanizm',
    focus: 'Społeczeństwo jako żywy organizm oparty na dobrowolności i różnorodności (1.0) vs biurokratyczna maszyna oparta na przymusie (0.0).',
    indicators: [
      'SELF_HEALING_CAPACITY', 'UNITY_IN_DIVERSITY', 'ENGINEERING_GOVERNMENT',
      'ACTION_CULTURE_VS_PASSIVITY', 'BUREAUCRACY_ELEPHANTIASIS', 'ABSTRACTS_RECOGNITION',
      'STATE_AS_TOOL_VS_GOAL', 'PERSONALISM_FREE_WILL', 'LEGAL_DUALISM_NECESSITY',
      'HISTORICISM_TRADITION', 'APRIORISM_PLANNING', 'COERCION_AS_MAIN_BOND',
    ],
  },
  personalism: {
    scoreKey: 'personalism_scores',
    title: 'Personalizm',
    focus: 'Podmiotowość osoby ludzkiej, osobista odpowiedzialność i emancypacja rodziny z rodu (1.0 = personalizm łaciński, 0.0 = ustrój gromadnościowy/obozowy).',
    indicators: [
      'GOD_RELATION_PERSONAL_VS_COLLECTIVE', 'RESPONSIBILITY_PERSONAL_VS_COLLECTIVE',
      'CONFESSION_PERSONAL_VS_COLLECTIVE', 'FAMILY_EMANCIPATION_FROM_CLAN', 'WOMAN_PERSONAL_FREEDOM',
      'PRIVATE_PROPERTY_INDEPENDENCE', 'NEIGHBOR_DUTY_UNIVERSAL_VS_TRIBAL',
      'WORK_AS_SANCTIFICATION_VS_COERCION', 'PERSONAL_RESPONSIBILITY_PRESENCE',
      'FAMILY_EMANCIPATION_GENERAL', 'STATUS_BY_BIRTH_PRIVILEGE', 'STATUS_BY_CASTE_MEMBERSHIP',
      'LEGAL_MONISM_PRESENCE', 'UNIFORMITY_MECHANICISM_PRESENCE', 'HISTORICISM_PRESENCE',
      'HEREDITARY_SURNAMES_PRESENCE',
    ],
  },
  family: {
    scoreKey: 'family_law_autonomy_scores',
    title: 'Autonomia Prawa Rodzinnego',
    focus: 'Emancypacja rodziny spod władzy rodu i państwa, dożywotnia monogamia, prawa rodzicielskie (1.0 = pełna autonomia rodziny).',
    indicators: [
      'adult_son_independence', 'family_emancipation_from_clan', 'son_adulthood_during_fathers_life',
      'wife_treated_as_free_person', 'marriage_by_mutual_consent', 'lifelong_monogamy',
      'state_religion_interferes_home_life', 'exclusive_parental_care_rights',
      'property_independent_of_clan_state', 'family_law_inaccessible_to_state',
      'polygamy_exists', 'state_regulates_private_life', 'family_autonomy_disappears_to_state',
      'sacralization_of_life',
    ],
  },
  church: {
    scoreKey: 'church_independence_scores',
    title: 'Niezależność Kościoła i Religii od Państwa',
    focus: 'Brak cezaropapizmu i teokracji; niezależność duchowieństwa i sumienia od władzy państwowej (1.0 = pełna niezależność).',
    indicators: [
      'hierarch_appointment', 'dogmatic_disputes', 'economic_independence', 'moral_sanctions_on_rulers',
      'canon_law_separation', 'brachium_saeculare', 'total_ethics', 'divine_vs_caesar',
      'personalism_presence', 'freedom_of_conversion', 'caesaropapism_absence',
      'cuius_regio_absence', 'statolatry_absence', 'sacralism_absence', 'confessional_bureaucracy_absence',
    ],
  },
  property: {
    scoreKey: 'property_rights_stability_scores',
    title: 'Stabilność Własności Prywatnej',
    focus: 'Pełna, dziedziczna własność prywatna chroniona przed konfiskatą i fiskalizmem państwa lub rodu (1.0 = pełna stabilność własności).',
    indicators: [
      'absolute_property_vs_usufruct', 'real_estate_as_ideal', 'neminem_captivabimus',
      'family_continuity_of_property', 'inheritance_as_personality_extension', 'official_liability',
      'ius_primi_occupantis', 'lifelong_monogamy', 'son_emancipation', 'property_in_private_law',
      'sacralization_of_property_absence', 'fiscalism_bureaucracy_absence', 'socialism_collectivism_absence',
    ],
  },
  inheritance: {
    scoreKey: 'inheritance_continuity_scores',
    title: 'Ciągłość Dziedziczenia',
    focus: 'Dziedziczenie jako przedłużenie osobowości, brak podatków spadkowych i fiskalnego wywłaszczania (1.0 = wysoka ciągłość).',
    indicators: [
      'inheritance_as_personality_extension', 'inheritance_tax_absence', 'majorat_or_indivisibility',
      'real_estate_retention_encouraged', 'real_estate_primary_inheritance', 'family_estate_ideal',
      'son_emancipation_before_death', 'primogeniture_privilege', 'family_emancipation_from_clan',
      'lifelong_monogamy', 'historism_and_hereditary_surnames', 'usufruct_system_absence',
      'speculative_capital_absence', 'statolatry_absence', 'collectivism_socialism_absence',
    ],
  },
  morality: {
    scoreKey: 'morality_supremacy_scores',
    title: 'Prymat Moralności',
    focus: 'Przewaga etyki nad ustawą, siłą, bogactwem i polityką; odrzucenie amoralizmu państwowego (1.0 = pełny prymat etyki).',
    indicators: [
      'ethics_over_law_primacy', 'total_ethics', 'politics_bound_by_ethics', 'ethics_over_wealth_primacy',
      'moral_utilitarianism', 'ethics_over_science_primacy', 'immoral_science_rejection',
      'ethics_over_art_primacy', 'immoral_art_rejection', 'voluntarism_over_coercion',
      'duty_over_obedience', 'conscience_as_highest_instance', 'personal_responsibility',
      'legalism_absence', 'state_amoralism_absence',
    ],
  },
  public_morality: {
    scoreKey: 'public_morality_totality_scores',
    title: 'Totalność Moralności Publicznej',
    focus: 'Odrzucenie dwóch sumień (racja stanu ponad etyką); te same normy moralne w polityce co w życiu prywatnym (1.0 = jedno sumienie).',
    indicators: [
      'two_consciences_rejection', 'state_bound_by_decalogue', 'politics_as_ethical_domain',
      'unethical_law_is_lawless', 'evil_in_name_of_state_remains_evil', 'stricter_ethics_for_public_figures',
      'duty_to_fight_public_evil', 'ethics_over_law_primacy_public', 'personal_responsibility_in_public',
      'legal_dualism_presence', 'good_as_dominant_category', 'dual_ethics_absence',
      'physical_force_supremacy_absence', 'statolatry_absence', 'legalism_replacing_conscience_absence',
      'caesaropapism_absence',
    ],
  },
  administrative_responsibility: {
    scoreKey: 'administrative_responsibility_scores',
    title: 'Odpowiedzialność Administracyjna',
    focus: 'Osobista i majątkowa odpowiedzialność urzędnika za bezprawne decyzje, służba obywatelom zamiast bezkarnej biurokracji (1.0 = wysoka odpowiedzialność).',
    indicators: [
      'personal_liability_for_damages', 'material_guarantee_for_reliability', 'single_conscience_in_public',
      'obedience_to_ethics_over_orders', 'official_as_legal_entity', 'independent_administrative_judiciary',
      'office_as_civic_service', 'legal_dualism_presence_admin', 'personalism_in_administration',
      'ethics_over_law_primacy_admin', 'decentralization_and_self_gov', 'totalitarian_state_absence',
      'monism_of_public_law_absence', 'dual_ethics_absence_admin', 'camp_system_absence', 'kormlenie_system_absence',
    ],
  },
  generalia: {
    scoreKey: 'generalia_scores',
    title: 'Krok 3: 7 Generaliów Etyki',
    focus: '7 ogólnych pojęć etycznych (0.0 = gromadnościowość/przymus, 1.0 = szereg personalistyczny łaciński).',
    indicators: [
      'duty_source_personalistic', 'motivation_altruism', 'responsibility_personal',
      'justice_equity', 'conscience_autonomous', 'time_mastery_historicism', 'work_ethos_sanctification',
    ],
  },
  duty_source: {
    scoreKey: 'duty_source_scores',
    title: 'Źródło Obowiązku',
    focus: 'Obowiązek płynący z autonomicznego sumienia i etyki (1.0) vs zewnętrzny przymus państwowy lub stadny (0.0).',
    indicators: [
      'ethics_over_law', 'voluntary_action', 'direct_god_relation', 'autonomous_conscience',
      'unwavering_commitment', 'universal_ethics', 'personal_creativity', 'ethics_primacy',
      'personal_confession', 'no_statolatry', 'no_camp_system', 'no_sacral_casuistry', 'no_collectivism',
    ],
  },
  motivation: {
    scoreKey: 'motivation_scores',
    title: 'Motywacja Czynu',
    focus: 'Bezinteresowność, miłość prawdy i dobra (1.0) vs utylitaryzm transakcyjny lub biologiczna walka (0.0).',
    indicators: [
      'truth_for_truth_sake', 'altruistic_faith', 'res_sacra_miser', 'ethical_utilitarianism',
      'idealistic_public_service', 'art_for_beauty', 'voluntary_sacrifice', 'morality_leadership',
      'person_as_end', 'sanctification_of_intent', 'no_transactional_utilitarianism',
      'no_contractual_religion', 'no_totalitarian_utilitarianism', 'no_biologism_force',
    ],
  },
  justice_nature: {
    scoreKey: 'justice_nature_scores',
    title: 'Natura Sprawiedliwości',
    focus: 'Słuszność (aequitas) i sumienie sędziego ponad martwą literą przepisu (1.0 = sprawiedliwość personalistyczna).',
    indicators: [
      'equity_over_letter', 'judge_conscience_role', 'law_from_ethics', 'no_shylock_formalism',
      'state_under_decalogue', 'justice_needs_mercy', 'no_legislative_elephantiasis',
      'good_hegemony_over_law', 'aposteriori_law', 'legal_dualism', 'judicial_independence',
      'ethics_above_law', 'no_jewish_casuistry', 'no_byzantine_statolatry',
      'no_camp_turanian_law', 'no_socialist_collectivism',
    ],
  },
  conscience_status: {
    scoreKey: 'conscience_status_scores',
    title: 'Status Sumienia',
    focus: 'Autonomia sumienia jako najwyższej instancji, odmowa niegodziwych rozkazów (1.0 = pełna autonomia sumienia).',
    indicators: [
      'no_statutory_morality_only', 'conscience_as_supreme_judge', 'no_legislative_elephantiasis',
      'refusal_of_immoral_orders', 'personal_accountability_god', 'no_shylock_formalism',
      'ethics_above_law', 'personalism_sovereignty', 'good_hegemony_over_law', 'legal_dualism_privacy',
      'aposteriori_experience', 'no_casuistry_expropriation', 'no_byzantine_statolatry',
      'no_socialist_gregarious_fear', 'no_camp_turanian_coercion',
    ],
  },
  time_mastery: {
    scoreKey: 'time_mastery_scores',
    title: 'Krok 4: Stosunek do Czasu (Chyżość Historyczna)',
    focus: 'Naukowa chronologia, tradycja krytyczna, dziedziczne nazwiska, kapitalizacja czasu i dorobku pokoleń (1.0 = wysoka chyżość).',
    indicators: [
      'scientific_chronology', 'active_critical_tradition', 'hereditary_surnames', 'term_discipline',
      'capitalization_of_time', 'sub_specie_aeternitatis', 'time_rich_language',
      'historicism_national_consciousness', 'dated_documentation', 'latin_historicism_unique',
      'generational_voluntary_synthesis', 'family_emancipation_workshop', 'truth_and_goodness_cult',
      'no_sacral_passive_stagnation', 'no_turanian_camp_presentism',
    ],
  },
  work_ethos: {
    scoreKey: 'work_ethos_scores',
    title: 'Etos Pracy',
    focus: 'Godność pracy fizycznej i umysłowej, praca jako powołanie i uświęcenie bez przymusu państwowego (1.0 = etos łaciński).',
    indicators: [
      'manual_work_dignity', 'ethical_duty_of_work', 'work_as_sanctification', 'no_status_laziness',
      'voluntary_work_for_common_good', 'craft_creativity_innovation', 'moral_duty_of_prosperity',
      'work_sub_specie_aeternitatis', 'no_bureaucratic_exploitation', 'christian_postulate_of_work',
      'person_dignity_in_work', 'harmony_logos_ethos_in_work', 'no_contempt_for_physical_work',
      'no_totalitarian_forced_labor',
    ],
  },
  quincunx: {
    scoreKey: 'quincunx_scores',
    title: 'Krok 5: Pięciomian Bytu (Quincunx)',
    focus: 'Współmierność 5 sfer bytu: Dobra, Prawdy, Zdrowia, Dobrobytu i Piękna pod przodownictwem Etyki (1.0 = harmonia).',
    indicators: [
      'ethics_totality_public_private', 'good_above_law_force', 'personal_moral_accountability',
      'natural_truth_pure_science', 'academic_educational_freedom', 'public_scientific_health_duty',
      'res_sacra_miser_ethics', 'individual_hereditary_property', 'honest_prosperity_duty',
      'beauty_allegory_of_good', 'full_artistic_freedom',
    ],
  },
  health: {
    scoreKey: 'health_scores',
    title: 'Zdrowie (Higiena i Etyka Medyczna)',
    focus: 'Godność pacjenta, higiena publiczna oparta na nauce, odrzucenie eutanazji i przymusu na ciele (1.0 = norma łacińska).',
    indicators: [
      'public_scientific_health_duty', 'res_sacra_miser_ethics', 'patient_person_dignity',
      'rejection_of_medical_killing', 'independent_medical_profession', 'public_hygiene_and_sanitation',
      'no_body_exploitation', 'physician_conscience_clause', 'non_discriminatory_care',
      'rational_disease_prevention',
    ],
  },
  truth_science: {
    scoreKey: 'truth_science_scores',
    title: 'Prawda (Nauka Bezinteresowna)',
    focus: 'Wolność badań, metoda empiryczna aposteriori, brak monopolu państwowego/ideologicznego w nauce (1.0 = wolna nauka).',
    indicators: [
      'pure_disinterested_truth', 'academic_research_freedom', 'aposteriori_empirical_science',
      'state_monopoly_free_education', 'truth_above_authority', 'no_utilitarian_reductionism',
      'free_academic_speech', 'logos_and_logic_in_science', 'preservation_of_sources',
      'rejection_of_historical_revisionism',
    ],
  },
  beauty_art: {
    scoreKey: 'beauty_art_scores',
    title: 'Piękno (Sztuka)',
    focus: 'Piękno jako alegoria dobra, wolność twórcza bez cenzury ideologicznej czy anikonizmu (1.0 = sztuka personalistyczna).',
    indicators: [
      'beauty_allegory_of_good', 'full_artistic_freedom', 'rejection_of_aniconism',
      'uplifting_aesthetic_ideals', 'craftsmanship_aesthetic_spiritualization',
      'protection_of_aesthetic_heritage', 'independent_artistic_patronage',
      'art_serving_person_not_state', 'moral_sensitivity_in_art', 'universal_access_to_culture',
    ],
  },
};

function buildSchemaForIndex(def) {
  const indicatorProps = {};
  for (const ind of def.indicators) {
    indicatorProps[ind] = INDICATOR_ITEM_SCHEMA;
  }
  return {
    type: 'object',
    properties: {
      [def.scoreKey]: {
        type: 'object',
        properties: indicatorProps,
        required: def.indicators,
      },
    },
    required: [def.scoreKey],
  };
}

/**
 * Resolves the list of index IDs to execute for the requested mode and optional target_indices.
 */
export function resolveIndicesForMode(mode, targetIndices) {
  const normalizedMode = (mode || 'mantis').toLowerCase();

  if (Array.isArray(targetIndices) && targetIndices.length > 0) {
    const expanded = [];
    for (const idx of targetIndices) {
      if (idx === 'spirit') {
        for (const sIdx of SPIRIT_COMPONENT_INDICES) {
          if (!expanded.includes(sIdx)) expanded.push(sIdx);
        }
      } else if (INDEX_DEFINITIONS[idx] && !expanded.includes(idx)) {
        expanded.push(idx);
      }
    }
    return expanded;
  }

  if (normalizedMode === 'mantis' || normalizedMode === 'jmantis') {
    return [...MANTIS_INDICES];
  }
  if (normalizedMode === 'lite') {
    return [...LITE_INDICES];
  }
  return Object.keys(INDEX_DEFINITIONS);
}

/**
 * Builds the array of LLM query tasks for the selected mode, page text, or PDF document.
 */
export function buildTasksForAnalysis(text, mode, targetIndices, isPdf = false) {
  const indices = resolveIndicesForMode(mode, targetIndices);
  const safeText = text || '';

  return indices.map((indexId) => {
    const def = INDEX_DEFINITIONS[indexId];
    const prompt = isPdf
      ? `Oceń załączony dokument PDF pod kątem indeksu "${def.title}".
Kryterium: ${def.focus}
Wskaźniki do oceny (${def.indicators.length}): ${def.indicators.join(', ')}.`
      : `Oceń poniższy tekst pod kątem indeksu "${def.title}".
Kryterium: ${def.focus}
Wskaźniki do oceny (${def.indicators.length}): ${def.indicators.join(', ')}.

=== TEKST DO ANALIZY ===
${safeText}`;

    return {
      indexId,
      scoreKey: def.scoreKey,
      systemInstruction: KONECZNY_SYSTEM_BASE,
      prompt,
      responseSchema: buildSchemaForIndex(def),
    };
  });
}

