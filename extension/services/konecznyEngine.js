/**
 * Pure JavaScript port of the Koneczny Civilization Engine (`backend/analyzer.py`).
 * Implements exact mathematical scoring for Steps 1-5 and Mantis 6-gate decision tree.
 */

function extractScore(valInfo) {
  if (typeof valInfo === 'number' && !Number.isNaN(valInfo)) {
    return valInfo;
  }
  if (valInfo && typeof valInfo === 'object' && typeof valInfo.score === 'number') {
    return valInfo.score;
  }
  return -1.0;
}

function calcAvg(llmData, categoryKey) {
  const categoryData = llmData?.[categoryKey];
  if (!categoryData || typeof categoryData !== 'object') {
    return -1.0;
  }
  const validVals = [];
  for (const valInfo of Object.values(categoryData)) {
    const val = extractScore(valInfo);
    if (val >= 0) {
      validVals.push(val);
    }
  }
  if (validVals.length === 0) return -1.0;
  return validVals.reduce((sum, v) => sum + v, 0) / validVals.length;
}

function extractAvgFromSources(sources) {
  const vals = [];
  for (const src of sources) {
    if (!src || typeof src !== 'object') continue;
    for (const v of Object.values(src)) {
      const s = extractScore(v);
      if (s >= 0) vals.push(s);
    }
  }
  if (vals.length === 0) return -1.0;
  return vals.reduce((sum, v) => sum + v, 0) / vals.length;
}

function pickKeys(obj, keys) {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const k of keys) {
    if (k in obj) out[k] = obj[k];
  }
  return out;
}

function roundTo(val, decimals) {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

/**
 * Calculates all Koneczny indices, Step 2 Spirit Supremacy, Step 3 Generalia,
 * Step 4 Chyżość Historyczna, and Step 5 Quincunx Coherence Score.
 * @param {object} llmData Raw score dictionaries returned by Gemini prompts
 * @returns {object} Computed scores and diagnoses matching backend/analyzer.py
 */
export function calculateKonecznyMetrics(llmData) {
  const data = llmData || {};

  const result = {
    sacrality_score: calcAvg(data, 'sacrality_scores'),
    legal_dualism_score: calcAvg(data, 'legal_dualism_scores'),
    law_source_pluralism_score: calcAvg(data, 'law_source_pluralism_scores'),
    aposteriori_apriori_score: calcAvg(data, 'aposteriori_apriori_scores'),
    organism_mechanism_score: calcAvg(data, 'organism_mechanism_scores'),
    personalism_score: calcAvg(data, 'personalism_scores'),
    family_law_autonomy_score: calcAvg(data, 'family_law_autonomy_scores'),
    church_independence_score: calcAvg(data, 'church_independence_scores'),
    property_rights_stability_score: calcAvg(data, 'property_rights_stability_scores'),
    inheritance_continuity_score: calcAvg(data, 'inheritance_continuity_scores'),
    morality_supremacy_score: calcAvg(data, 'morality_supremacy_scores'),
    public_morality_totality_score: calcAvg(data, 'public_morality_totality_scores'),
    administrative_responsibility_score: calcAvg(data, 'administrative_responsibility_scores'),
    duty_source_personalistic_score: calcAvg(data, 'duty_source_scores'),
    motivation_altruism_score: calcAvg(data, 'motivation_scores'),
    justice_equity_score: calcAvg(data, 'justice_nature_scores'),
    conscience_autonomous_score: calcAvg(data, 'conscience_status_scores'),
    time_mastery_history_score: calcAvg(data, 'time_mastery_scores'),
    work_ethos_sanctification_score: calcAvg(data, 'work_ethos_scores'),
  };

  // Step 2: Global Spirit Supremacy Score from 12 indices
  const spiritScores = [
    result.legal_dualism_score,
    result.law_source_pluralism_score,
    result.aposteriori_apriori_score,
    result.organism_mechanism_score,
    result.personalism_score,
    result.family_law_autonomy_score,
    result.church_independence_score,
    result.property_rights_stability_score,
    result.inheritance_continuity_score,
    result.morality_supremacy_score,
    result.public_morality_totality_score,
    result.administrative_responsibility_score,
  ];
  const validSpirit = spiritScores.filter((s) => s >= 0);
  result.spirit_supremacy_score = validSpirit.length > 0
    ? roundTo(validSpirit.reduce((a, b) => a + b, 0) / validSpirit.length, 2)
    : -1.0;

  // Step 3: Generalia ethical coherence score
  const generaliaData = data.generalia_scores || {};
  const genVals = [];
  for (const genInfo of Object.values(generaliaData)) {
    const val = extractScore(genInfo);
    if (val >= 0) genVals.push(val);
  }

  if (genVals.length > 0) {
    const coherenceSum = genVals.reduce((a, b) => a + b, 0);
    result.ethical_coherence_score = roundTo(coherenceSum, 1);
    if (coherenceSum >= 6.0) {
      result.generalia_diagnosis = 'Dominacja Szeregu Personalistycznego (Cywilizacja Łacińska)';
      result.mixture_alert = false;
    } else if (coherenceSum <= 2.0) {
      result.generalia_diagnosis = 'Dominacja Szeregu Gromadnościowego (Pozostałe cywilizacje)';
      result.mixture_alert = false;
    } else {
      result.generalia_diagnosis = '⚠️ MIESZANKA TRUJĄCA (Stan acywilizacyjny / Kołobłęd etyczny)';
      result.mixture_alert = true;
    }
  } else {
    result.ethical_coherence_score = -1.0;
    result.generalia_diagnosis = 'Brak danych generaliów';
    result.mixture_alert = false;
  }

  // Step 4: Chyżość Historyczna (Wydajność Cywilizacyjna)
  const tmScores = data.time_mastery_scores || {};
  const sChronology = extractScore(tmScores.scientific_chronology);
  const sTradition = extractScore(tmScores.active_critical_tradition);
  const sSurnames = extractScore(tmScores.hereditary_surnames);
  const sCap = extractScore(tmScores.capitalization_of_time);

  let validTmWeightSum = 0;
  let wSum = 0;
  if (sChronology >= 0) {
    wSum += 0.2 * sChronology;
    validTmWeightSum += 0.2;
  }
  if (sTradition >= 0) {
    wSum += 0.2 * sTradition;
    validTmWeightSum += 0.2;
  }
  if (sSurnames >= 0) {
    wSum += 0.3 * sSurnames;
    validTmWeightSum += 0.3;
  }
  if (sCap >= 0) {
    wSum += 0.3 * sCap;
    validTmWeightSum += 0.3;
  }

  const assignTimeMasteryDiagnosis = (score) => {
    if (score >= 0.65) {
      return 'Dominacja Cywilizacji Łacińskiej (Wysoka Chyżość Historyczna / Akumulacja Dorobku)';
    }
    if (score >= 0.35) {
      return 'Umiarkowana Wydajność Cywilizacyjna (Stan Synkretyczny / Mieszanka)';
    }
    if (score >= 0) {
      return 'Niska Chyżość Historyczna (Brak Historyzmu / Wegetacja Ab Ovo / Zastój)';
    }
    return 'Brak danych dla Kroku 4';
  };

  if (validTmWeightSum > 0) {
    const effScore = roundTo(wSum / validTmWeightSum, 2);
    result.time_mastery_efficiency_score = effScore;
    result.time_mastery_efficiency_diagnosis = assignTimeMasteryDiagnosis(effScore);
  } else {
    const effHistory = result.time_mastery_history_score;
    result.time_mastery_efficiency_score = effHistory;
    result.time_mastery_efficiency_diagnosis = assignTimeMasteryDiagnosis(effHistory);
  }

  // Step 5: QUINCUNX_COHERENCE_INDEX
  const qData = data.quincunx_scores || {};
  const healthData = data.health_scores || {};
  const truthData = data.truth_science_scores || {};
  const beautyData = data.beauty_art_scores || {};

  // I. DOBRO (Moralność)
  const dScore = extractAvgFromSources([
    pickKeys(qData, ['ethics_totality_public_private', 'good_above_law_force', 'personal_moral_accountability']),
    data.morality_supremacy_scores,
    data.public_morality_totality_scores,
    data.conscience_status_scores,
    data.duty_source_scores,
  ]);

  // II. PRAWDA (Nauka)
  const pScore = extractAvgFromSources([
    truthData,
    pickKeys(qData, ['natural_truth_pure_science', 'academic_educational_freedom']),
    data.aposteriori_apriori_scores,
    data.law_source_pluralism_scores,
  ]);

  // III. ZDROWIE (Higiena)
  const zScore = extractAvgFromSources([
    healthData,
    pickKeys(qData, ['public_scientific_health_duty', 'res_sacra_miser_ethics']),
  ]);

  // IV. DOBROBYT (Gospodarka)
  const dbScore = extractAvgFromSources([
    data.work_ethos_scores,
    data.property_rights_stability_scores,
    data.inheritance_continuity_scores,
    data.family_law_autonomy_scores,
    pickKeys(qData, ['individual_hereditary_property', 'honest_prosperity_duty']),
  ]);

  // V. PIĘKNO (Sztuka)
  const piScore = extractAvgFromSources([
    beautyData,
    pickKeys(qData, ['beauty_allegory_of_good', 'full_artistic_freedom']),
  ]);

  const qCats = [dScore, pScore, zScore, dbScore, piScore];
  const validQCats = qCats.filter((c) => c >= 0);

  if (validQCats.length > 0) {
    const numCats = validQCats.length;
    let geoMean = 0.0;
    if (!validQCats.some((c) => c === 0.0)) {
      const prod = validQCats.reduce((acc, c) => acc * c, 1.0);
      geoMean = Math.pow(prod, 1.0 / numCats);
    }

    const meanVal = validQCats.reduce((a, b) => a + b, 0) / numCats;
    const variance = numCats > 1
      ? validQCats.reduce((sum, c) => sum + Math.pow(c - meanVal, 2), 0) / numCats
      : 0.0;
    const stdDev = Math.sqrt(variance);
    const consistencyFactor = Math.max(0.0, 1.0 - stdDev / (meanVal > 0 ? meanVal : 1.0));

    const otherScores = qCats.filter((c, idx) => idx !== 0 && c >= 0);
    const otherMax = otherScores.length > 0 ? Math.max(...otherScores) : 0.0;
    let hegemonyPenalty = 1.0;
    if (dScore >= 0 && otherMax > dScore) {
      const diff = otherMax - dScore;
      hegemonyPenalty = Math.max(0.5, roundTo(1.0 - diff / 1.5, 2));
    }

    const qFinal = roundTo(geoMean * consistencyFactor * hegemonyPenalty, 2);
    result.quincunx_coherence_score = qFinal;
    result.quincunx_categories = {
      good: roundTo(dScore, 2),
      truth: roundTo(pScore, 2),
      health: roundTo(zScore, 2),
      prosperity: roundTo(dbScore, 2),
      beauty: roundTo(piScore, 2),
    };

    const sphereNote = numCats < 5 ? ` (ocena z ${numCats}/5 sfer)` : '';

    if (validQCats.some((c) => c <= 0.1)) {
      result.quincunx_diagnosis = `CYWILIZACJA DEFEKTOWNA / UŁOMNA (Defekt sfery bytu)${sphereNote}`;
    } else if (hegemonyPenalty < 0.90) {
      result.quincunx_diagnosis = `⚠️ ZWICHNIĘCIE PIĘCIOMIANU (Zaniedbanie Etyki na rzecz Materializmu/Państwa)${sphereNote}`;
    } else if (qFinal >= 0.65 && consistencyFactor >= 0.75) {
      if (numCats === 5) {
        result.quincunx_diagnosis = 'PEŁNIA CYWILIZACJI ŁACIŃSKIEJ (Harmonia 5/5 sfer Pięciomianu pod przodownictwem Etyki)';
      } else {
        result.quincunx_diagnosis = `DOMINACJA NORMY ŁACIŃSKIEJ (Niepełny Pięciomian: ${numCats}/5 sfer w tekście)`;
      }
    } else if (consistencyFactor < 0.60 && numCats > 1) {
      result.quincunx_diagnosis = `⚠️ ACYWILIZACYJNA NIEWSPÓŁMIERNOŚĆ (Mieszanka Metod Niszcząca Siły Społeczne)${sphereNote}`;
    } else {
      result.quincunx_diagnosis = `Umiarkowana Współmierność Bytu${sphereNote}`;
    }
  } else {
    result.quincunx_coherence_score = -1.0;
    result.quincunx_diagnosis = 'Brak danych dla Kroku 5 w tekście';
  }

  return result;
}

/**
 * Evaluates Mantis 6-gate Pareto decision tree on top of calculated metrics.
 * @param {string} text Analyzed page text
 * @param {object} metrics Output of calculateKonecznyMetrics
 * @returns {object} Updated metrics with primary_civilization, civilization_diagnosis, and mantis_gates
 */
export function applyMantisGates(text, metrics) {
  const result = { ...metrics, mode: 'jmantis' };

  const sacScore = result.sacrality_score ?? -1.0;
  const dualScore = result.legal_dualism_score ?? -1.0;
  const churchScore = result.church_independence_score ?? -1.0;
  let conscienceScore = result.conscience_status_score ?? -1.0;
  if (conscienceScore < 0 && 'conscience_autonomous_score' in result) {
    conscienceScore = result.conscience_autonomous_score ?? -1.0;
  }
  const persScore = result.personalism_score ?? -1.0;
  const pubMoralScore = result.public_morality_totality_score ?? -1.0;

  const isSacral = sacScore >= 0.40;
  const textUpper = (text || '').toUpperCase();

  const gateSteps = [
    {
      gate: 1,
      name: 'Bramka 1: Sakralność vs Świeckość (SACRALITY_INDEX)',
      score: sacScore,
      decision: isSacral
        ? 'Ścieżka Sakralna (Monizm Prawno-Religijny)'
        : 'Ścieżka Świecko-Rozumowa (Łacińska / Bizantyńska / Turańska)',
    },
  ];

  let primaryCiv = '';
  let diag = '';

  if (isSacral) {
    // Klasyfikacja podtypów sakralnych wyłącznie na podstawie profilu indeksów (bez słów kluczowych)
    const isJewishSacral = conscienceScore >= 0.35 && persScore >= 0.40;
    const isBrahminSacral = !isJewishSacral && sacScore >= 0.91 && persScore >= 0.20 && persScore <= 0.25 && conscienceScore >= 0.20;

    let subTypeDecision;
    let scopeDecision;
    let famDecision;

    if (isJewishSacral) {
      primaryCiv = 'Żydowska';
      diag = 'Monizm Prawno-Sakralny (Etyka rodowo-wspólnotowa, kazuistyka talmudyczna)';
      subTypeDecision = 'Etyka Rodowo-Wspólnotowa (Cywilizacja Żydowska)';
      scopeDecision = 'Etyka Rodowo-Wspólnotowa';
      famDecision = 'Monogamia Rodowa i Prawo Majątkowe Rodu';
    } else if (isBrahminSacral) {
      primaryCiv = 'Bramińska';
      diag = 'Monizm Kastowo-Rytualny (Brak pojęcia osoby, podział kastowy)';
      subTypeDecision = 'Ustrój Kastowo-Rytualny (Cywilizacja Bramińska)';
      scopeDecision = 'Hierarchia Kastowa / Karma i Reinkarnacja';
      famDecision = 'Ustrój Wielorodzinny i Brak Indywidualizmu';
    } else {
      primaryCiv = 'Arabska / Sakralna';
      diag = 'Monizm Prawno-Religijny (Teokracja, Szariat, ustrój obozowo-religijny)';
      subTypeDecision = 'Państwowy Monizm Szariatu i Władza Teokratyczna (Cywilizacja Arabska)';
      scopeDecision = 'Powszechny Zasięg Prawa Sakralnego / Umma';
      famDecision = 'Poligamia i Ustrój Obozowo-Religijny';
    }

    gateSteps.push(
      {
        gate: 2,
        name: 'Bramka 2: Typ Monizmu Sakralnego',
        score: sacScore,
        decision: subTypeDecision,
      },
      {
        gate: 3,
        name: 'Bramka 3: Zasięg Etyki Sakralnej (Umma vs Ród vs Kasty)',
        score: pubMoralScore,
        decision: scopeDecision,
      },
      {
        gate: 4,
        name: 'Bramka 4: Emancypacja Rodziny & Ustrój Małżeński',
        score: persScore,
        decision: famDecision,
      },
      {
        gate: 5,
        name: 'Bramka 5: Weryfikacja Dualizmu Prawnego (LEGAL_DUALISM_INDEX)',
        score: dualScore,
        decision: dualScore < 0.35
          ? 'Całkowity brak dualizmu świeckiego — Czysty Monizm Teokratyczny'
          : 'Szczątkowy Dualizm',
      },
    );
  } else if (dualScore < 0) {
    // Brak danych dla Bramki 2 (dualScore === -1) — nie zakładamy sztucznie Monizmu ani żadnej cywilizacji
    primaryCiv = 'Nieokreślona (Brak danych)';
    diag = 'Brak wystarczających danych o dualizmie prawnym i etyce w analizowanym fragmencie tekstu.';
    gateSteps.push(
      {
        gate: 2,
        name: 'Bramka 2: Dualizm Prawny vs Monizm (LEGAL_DUALISM_INDEX)',
        score: dualScore,
        decision: 'Brak danych w tekście (-1) — nie można rozstrzygnąć między Dualizmem a Monizmem',
      },
      {
        gate: 3,
        name: 'Bramka 3: Relacja Władza-Religia (CHURCH_INDEPENDENCE)',
        score: churchScore,
        decision: 'Brak danych w tekście (-1)',
      },
      {
        gate: 4,
        name: 'Bramka 4: Status Sumienia (CONSCIENCE_STATUS)',
        score: conscienceScore,
        decision: 'Brak danych w tekście (-1)',
      },
      {
        gate: 5,
        name: 'Bramka 5: Podmiotowość Jednostki (PERSONALISM_INDEX)',
        score: persScore,
        decision: 'Brak danych w tekście (-1)',
      },
    );
  } else {
    const isDual = dualScore >= 0.48;

    gateSteps.push({
      gate: 2,
      name: 'Bramka 2: Dualizm Prawny vs Monizm (LEGAL_DUALISM_INDEX)',
      score: dualScore,
      decision: isDual
        ? 'Dualizm Prawny — Rozdział prawa prywatnego i publicznego (Łacińska)'
        : 'Monizm Prawny — Pochłonięcie prawa przez państwo lub władcę (Bizantyńska / Turańska)',
    });

    if (isDual) {
      primaryCiv = 'Łacińska';
      diag = 'Dominacja norm personalistycznych i dualizm prawny (Prymat etyki nad ustawą)';

      gateSteps.push(
        {
          gate: 3,
          name: 'Bramka 3: Niezależność Religii od Państwa (CHURCH_INDEPENDENCE)',
          score: churchScore,
          decision: 'Autonomia Kościoła i Sumienia (Prymat Etyki nad Władzą)',
        },
        {
          gate: 4,
          name: 'Bramka 4: Status Sumienia (CONSCIENCE_STATUS)',
          score: conscienceScore,
          decision: 'Jednolita moralność w życiu prywatnym i publicznym (Brak dwóch sumień)',
        },
        {
          gate: 5,
          name: 'Bramka 5: Podmiotowość Jednostki (PERSONALISM_INDEX)',
          score: persScore,
          decision: 'Personalizm — Osoba ludzka niezależnym podmiotem prawa i wolnej woli',
        },
      );
    } else {
      // Rozróżnienie cywilizacji monizmu świeckiego wyłącznie na podstawie profilu indeksów
      const isCampRegime = (persScore >= 0 && persScore < 0.25) || (churchScore >= 0 && churchScore < 0.20 && persScore >= 0 && persScore < 0.30);
      const isChinese = !isCampRegime && dualScore >= 0.05 && dualScore < 0.35 && churchScore >= 0.25 && conscienceScore >= 0.35 && persScore >= 0.35;

      let b3Dec;
      let b4Dec;
      let b5Dec;

      if (isChinese) {
        primaryCiv = 'Chińska';
        diag = 'Monizm Etykietalno-Rodowy (Konfucjanizm, kult przodków, aczasowość, prymat rodu)';
        b3Dec = 'Areligijność / Kult Przodków i Rytuał Li (Cywilizacja Chińska)';
        b4Dec = 'Etykieta i Konwenans Społeczny zamiast dogmatu sumienia';
        b5Dec = 'Ustrój Rodowy — Jednostka podporządkowana ciągłości rodu i tradycji';
      } else if (isCampRegime) {
        primaryCiv = 'Turańska';
        diag = 'Monizm Prawa Prywatnego Władcy (Ustrój obozowy, brak stabilnej własności)';
        b3Dec = 'Monizm Władcy / Czysta Siła Fizyczna (Cywilizacja Turańska)';
        b4Dec = 'Brak etyki w prawie — Decyduje bezwzględna wola wodza i dyscyplina';
        b5Dec = 'Ustrój Obozowy — Człowiek zredukowany do żołnierza / narzędzia wodza';
      } else {
        primaryCiv = 'Bizantyńska';
        diag = 'Monizm Prawa Publicznego (Cezaropapizm, biurokracja, dwoistość sumienia)';
        b3Dec = 'Cezaropapizm / Podporządkowanie Religii Państwu (Bizantynizm)';
        b4Dec = 'Dwoistość Sumienia — Etyka prywatna vs Racja Stanu';
        b5Dec = 'Statolatria — Obywatel zredukowany do funkcji w machinie państwowej';
      }

      gateSteps.push(
        {
          gate: 3,
          name: 'Bramka 3: Relacja Władza-Religia (CHURCH_INDEPENDENCE)',
          score: churchScore,
          decision: b3Dec,
        },
        {
          gate: 4,
          name: 'Bramka 4: Status Sumienia (CONSCIENCE_STATUS)',
          score: conscienceScore,
          decision: b4Dec,
        },
        {
          gate: 5,
          name: 'Bramka 5: Podmiotowość Jednostki (PERSONALISM_INDEX)',
          score: persScore,
          decision: b5Dec,
        },
      );
    }
  }

  result.primary_civilization = primaryCiv;
  result.civilization_diagnosis = diag;
  result.mantis_gates = gateSteps;
  return result;
}

