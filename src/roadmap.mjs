/**
 * packages/korean-elementary-learning-map-mcp/src/roadmap.mjs
 * 
 * Builds hierarchical learning roadmaps: Subject -> Domain -> Cluster -> Standards.
 */

import { normalizeText, gradeBandOrder } from './normalize.mjs';

export function buildRoadmap(store, options = {}) {
  const { subject, gradeBand } = options;

  let standards = store.standards;

  if (subject) {
    const normSubj = normalizeText(subject);
    standards = standards.filter(
      (s) =>
        normalizeText(s.subjectKorean).includes(normSubj) ||
        normalizeText(s.subject).includes(normSubj)
    );
  }

  if (gradeBand) {
    const normBand = normalizeText(gradeBand);
    standards = standards.filter((s) => normalizeText(s.gradeBand) === normBand);
  }

  // Sort standards by gradeBand and code
  standards.sort((a, b) => {
    const gDiff = gradeBandOrder(a.gradeBand) - gradeBandOrder(b.gradeBand);
    if (gDiff !== 0) return gDiff;
    return a.code.localeCompare(b.code, 'ko');
  });

  // Group by Domain
  const domainMap = new Map();

  for (const s of standards) {
    const domainKey = `${s.subjectKorean} > ${s.domainKorean || '일반'}`;
    if (!domainMap.has(domainKey)) {
      domainMap.set(domainKey, {
        subject: s.subjectKorean,
        domain: s.domainKorean || '일반',
        standards: [],
      });
    }

    const connectedTopics = store.topicsByStandardKey.get(s.key) || [];
    domainMap.get(domainKey).standards.push({
      code: s.code,
      key: s.key,
      gradeBand: s.gradeBand,
      summary: s.summary,
      topicCount: connectedTopics.length,
      anchorTopic: connectedTopics.find((t) => t.topicRole === 'anchor') || connectedTopics[0] || null,
    });
  }

  // Find relevant clusters
  let clusters = store.clusters;
  if (subject) {
    const normSubj = normalizeText(subject);
    clusters = clusters.filter(
      (c) =>
        normalizeText(c.subjectKorean).includes(normSubj) ||
        normalizeText(c.subject).includes(normSubj)
    );
  }
  if (gradeBand) {
    const normBand = normalizeText(gradeBand);
    clusters = clusters.filter((c) => normalizeText(c.gradeBand) === normBand);
  }

  return {
    subjectFilter: subject || '전체',
    gradeBandFilter: gradeBand || '전체(1-2, 3-4, 5-6)',
    totalStandards: standards.length,
    totalClusters: clusters.length,
    domains: Array.from(domainMap.values()),
    clusters: clusters.map((c) => ({
      id: c.id,
      title: c.titleKorean || c.name,
      domain: c.domainKorean,
      gradeBand: c.gradeBand,
      topicCount: c.topicCount,
      summary: c.summary,
    })),
  };
}
