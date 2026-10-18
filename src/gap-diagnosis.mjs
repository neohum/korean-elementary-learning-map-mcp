/**
 * packages/korean-elementary-learning-map-mcp/src/gap-diagnosis.mjs
 * 
 * Elementary learning gap diagnosis and targeted prerequisite remediation advisor.
 */

import { normalizeCode } from './normalize.mjs';
import { learningPath } from './graph.mjs';

export function diagnoseLearningGap(store, options = {}) {
  const { topicId, standardCode, errorContext, layer = 'all' } = options;

  let targetTopic = null;

  if (topicId) {
    targetTopic = store.topicsById.get(topicId);
  } else if (standardCode) {
    const codeKey = normalizeCode(standardCode);
    const topics = store.topicsByStandardCode.get(codeKey) || [];
    // Prefer anchor topic
    targetTopic = topics.find((t) => t.topicRole === 'anchor') || topics[0];
  }

  if (!targetTopic) {
    throw new Error(
      `대상을 찾을 수 없습니다. topicId(${topicId}) 또는 standardCode(${standardCode})를 확인하세요.`
    );
  }

  // Trace upstream prerequisites using DAG topological learning path
  const pathResult = learningPath(store, targetTopic.id, {
    layer,
    direction: 'prerequisites',
    maxDepth: 15,
  });

  // Extract all predecessor topics (excluding target itself)
  const prereqTopics = pathResult.path.filter((p) => !p.isTarget);

  // Group by gradeBand to identify foundational gaps from lower grades
  const lowerGradeGaps = [];
  const sameGradeGaps = [];

  for (const item of prereqTopics) {
    const t = store.topicsById.get(item.id);
    if (!t) continue;

    const std = store.standardsByCode.get(normalizeCode(t.sourceStandardCode));

    const gapItem = {
      topicId: t.id,
      name: t.titleKorean || t.name,
      gradeBand: t.gradeBand,
      domain: t.domainKorean,
      standardCode: t.sourceStandardCode,
      standardSummary: std?.summary || '',
      misconceptions: t.misconceptions || [],
      evidenceChecklist: t.evidence || [],
      diagnosticPrompt: t.assessmentPrompt || '',
    };

    if (t.gradeBand !== targetTopic.gradeBand) {
      lowerGradeGaps.push(gapItem);
    } else {
      sameGradeGaps.push(gapItem);
    }
  }

  const standard = store.standardsByCode.get(normalizeCode(targetTopic.sourceStandardCode));

  return {
    diagnosedTarget: {
      topicId: targetTopic.id,
      name: targetTopic.titleKorean || targetTopic.name,
      subject: targetTopic.subjectKorean,
      gradeBand: targetTopic.gradeBand,
      domain: targetTopic.domainKorean,
      standardCode: targetTopic.sourceStandardCode,
      standardSummary: standard?.summary || '',
      commonMisconceptions: targetTopic.misconceptions || [],
      errorContext: errorContext || null,
    },
    prerequisiteCount: prereqTopics.length,
    foundationalLowerGradeGaps: lowerGradeGaps,
    sameGradePrerequisites: sameGradeGaps,
    recommendedRemediationOrder: pathResult.path.map((p) => ({
      step: p.step,
      topicId: p.id,
      name: p.name,
      gradeBand: p.gradeBand,
      standardCode: p.standardCode,
      isTarget: p.isTarget,
    })),
  };
}
