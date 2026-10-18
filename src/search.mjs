/**
 * packages/korean-elementary-learning-map-mcp/src/search.mjs
 * 
 * In-memory search functions for elementary standards, topics, and clusters.
 */

import { normalizeCode, normalizeText } from './normalize.mjs';

export { normalizeText };

export function suggestSimilar(candidates, target, limit = 3) {
  const normTarget = normalizeText(target);
  if (!normTarget) return [];

  const scored = [];
  for (const item of candidates) {
    const norm = normalizeText(item);
    if (!norm) continue;
    let score = 0;
    if (norm === normTarget) score = 100;
    else if (norm.includes(normTarget) || normTarget.includes(norm)) score = 50;
    else {
      // character bigram Jaccard similarity
      const targetGrams = new Set();
      for (let i = 0; i < normTarget.length - 1; i++) targetGrams.add(normTarget.slice(i, i + 2));
      const itemGrams = new Set();
      for (let i = 0; i < norm.length - 1; i++) itemGrams.add(norm.slice(i, i + 2));

      let intersection = 0;
      for (const g of targetGrams) if (itemGrams.has(g)) intersection++;
      const union = targetGrams.size + itemGrams.size - intersection;
      score = union > 0 ? (intersection / union) * 40 : 0;
    }
    if (score > 10) scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.item);
}

export function searchStandards(store, query = '', options = {}) {
  const { subject, gradeBand, limit = 20, offset = 0 } = options;
  const normQuery = normalizeText(query);
  const codeCandidate = normalizeCode(query);

  let results = store.standards;

  // Filter by subject
  if (subject) {
    const normSubj = normalizeText(subject);
    results = results.filter(
      (s) =>
        normalizeText(s.subjectKorean).includes(normSubj) ||
        normalizeText(s.subject).includes(normSubj)
    );
  }

  // Filter by gradeBand (1-2, 3-4, 5-6)
  if (gradeBand) {
    const normBand = normalizeText(gradeBand);
    results = results.filter((s) => normalizeText(s.gradeBand) === normBand);
  }

  // Filter by query (exact code match or substring match in code, domain, summary)
  if (normQuery) {
    results = results.filter((s) => {
      const codeMatch = normalizeCode(s.code).includes(codeCandidate) || normalizeText(s.code).includes(normQuery);
      const summaryMatch = normalizeText(s.summary).includes(normQuery);
      const domainMatch = normalizeText(s.domainKorean).includes(normQuery) || normalizeText(s.domain).includes(normQuery);
      return codeMatch || summaryMatch || domainMatch;
    });
  }

  const total = results.length;
  const paged = results.slice(offset, offset + limit).map((s) => ({
    code: s.code,
    key: s.key,
    subject: s.subjectKorean,
    gradeBand: s.gradeBand,
    domain: s.domainKorean,
    summary: s.summary,
    sourceLocator: s.sourceLocator,
    connectedTopicCount: store.topicsByStandardKey.get(s.key)?.length || 0,
  }));

  return {
    total,
    offset,
    limit,
    items: paged,
  };
}

export function searchTopics(store, query = '', options = {}) {
  const { subject, gradeBand, facetKey, topicRole, limit = 20, offset = 0 } = options;
  const normQuery = normalizeText(query);

  let results = store.topics;

  if (subject) {
    const normSubj = normalizeText(subject);
    results = results.filter(
      (t) =>
        normalizeText(t.subjectKorean).includes(normSubj) ||
        normalizeText(t.subject).includes(normSubj)
    );
  }

  if (gradeBand) {
    const normBand = normalizeText(gradeBand);
    results = results.filter((t) => normalizeText(t.gradeBand) === normBand);
  }

  if (facetKey) {
    const normFacet = normalizeText(facetKey);
    results = results.filter((t) => normalizeText(t.facetKey) === normFacet);
  }

  if (topicRole) {
    results = results.filter((t) => t.topicRole === topicRole);
  }

  if (normQuery) {
    results = results.filter((t) => {
      const nameMatch = normalizeText(t.name).includes(normQuery) || normalizeText(t.titleKorean).includes(normQuery);
      const descMatch = normalizeText(t.description).includes(normQuery);
      const stdMatch = normalizeText(t.sourceStandardCode).includes(normQuery);
      const evidenceMatch = (t.evidence || []).some((ev) => normalizeText(ev).includes(normQuery));
      const promptMatch = normalizeText(t.assessmentPrompt).includes(normQuery);
      return nameMatch || descMatch || stdMatch || evidenceMatch || promptMatch;
    });
  }

  const total = results.length;
  const paged = results.slice(offset, offset + limit).map((t) => ({
    id: t.id,
    name: t.titleKorean || t.name,
    subject: t.subjectKorean,
    gradeBand: t.gradeBand,
    domain: t.domainKorean,
    standardCode: t.sourceStandardCode,
    facetKey: t.facetKey,
    topicRole: t.topicRole,
    type: t.type,
    evidenceCount: (t.evidence || []).length,
    hasAssessmentPrompt: Boolean(t.assessmentPrompt),
    hasMisconceptions: Boolean(t.misconceptions?.length),
  }));

  return {
    total,
    offset,
    limit,
    items: paged,
  };
}

export function searchClusters(store, query = '', options = {}) {
  const { subject, gradeBand, limit = 20, offset = 0 } = options;
  const normQuery = normalizeText(query);

  let results = store.clusters;

  if (subject) {
    const normSubj = normalizeText(subject);
    results = results.filter(
      (c) =>
        normalizeText(c.subjectKorean).includes(normSubj) ||
        normalizeText(c.subject).includes(normSubj)
    );
  }

  if (gradeBand) {
    const normBand = normalizeText(gradeBand);
    results = results.filter((c) => normalizeText(c.gradeBand) === normBand);
  }

  if (normQuery) {
    results = results.filter((c) => {
      const nameMatch = normalizeText(c.name).includes(normQuery) || normalizeText(c.titleKorean).includes(normQuery);
      const domainMatch = normalizeText(c.domainKorean).includes(normQuery);
      const summaryMatch = normalizeText(c.summary).includes(normQuery);
      return nameMatch || domainMatch || summaryMatch;
    });
  }

  const total = results.length;
  const paged = results.slice(offset, offset + limit).map((c) => ({
    id: c.id,
    title: c.titleKorean || c.name,
    subject: c.subjectKorean,
    gradeBand: c.gradeBand,
    domain: c.domainKorean,
    topicCount: c.topicCount,
    summary: c.summary,
    parentSummary: c.parentSummary,
  }));

  return {
    total,
    offset,
    limit,
    items: paged,
  };
}
