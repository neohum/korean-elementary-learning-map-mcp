/**
 * packages/korean-elementary-learning-map-mcp/src/data-store.mjs
 * 
 * In-memory indexed datastore with SHA-256 verification against manifest.json.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeCode } from './normalize.mjs';

const defaultDataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'kr');

export const CORE_FILES = [
  'curriculum-standards.json',
  'topics.json',
  'dependencies.json',
  'dependencies.candidate.json',
  'clusters.json',
];

export { normalizeCode };

function readVerified(dataDir, manifest, file) {
  const expected = manifest.files[file];
  if (!expected) {
    throw new Error(`manifest.json에 ${file} 항목이 없습니다.`);
  }
  const raw = readFileSync(join(dataDir, file));
  const sha256 = createHash('sha256').update(raw).digest('hex');
  if (sha256 !== expected.sha256) {
    throw new Error(
      `${file} 체크섬 불일치 — 설치본이 손상되었습니다. (manifest=${expected.sha256}, 실제=${sha256})`
    );
  }
  return JSON.parse(raw.toString('utf8'));
}

export function loadStore(dataDir = defaultDataDir) {
  const manifest = JSON.parse(readFileSync(join(dataDir, 'manifest.json'), 'utf8'));

  const { curricula } = readVerified(dataDir, manifest, 'curriculum-standards.json');
  const { topics } = readVerified(dataDir, manifest, 'topics.json');
  const { dependencies: officialDependencies } = readVerified(dataDir, manifest, 'dependencies.json');
  const { dependencies: candidateDependencies } = readVerified(dataDir, manifest, 'dependencies.candidate.json');
  const { clusters } = readVerified(dataDir, manifest, 'clusters.json');

  // 1. Standards indexing
  const allStandards = [];
  const standardsByCode = new Map();
  const standardsByKey = new Map();
  const standardsBySubject = new Map();

  for (const curriculum of curricula) {
    const subjName = curriculum.subjectKorean || curriculum.subject;
    if (!standardsBySubject.has(subjName)) {
      standardsBySubject.set(subjName, []);
    }

    for (const standard of curriculum.standards || []) {
      const record = {
        ...standard,
        curriculumId: curriculum.id,
        curriculumName: curriculum.name,
      };
      allStandards.push(record);
      const codeKey = normalizeCode(standard.code);
      standardsByCode.set(codeKey, record);
      standardsByKey.set(standard.key, record);
      standardsBySubject.get(subjName).push(record);
    }
  }

  // 2. Topics indexing
  const topicsById = new Map();
  const topicsByStandardKey = new Map();
  const topicsByStandardCode = new Map();

  for (const topic of topics) {
    topicsById.set(topic.id, topic);

    for (const stdKey of topic.standards || []) {
      if (!topicsByStandardKey.has(stdKey)) topicsByStandardKey.set(stdKey, []);
      topicsByStandardKey.get(stdKey).push(topic);
    }

    if (topic.sourceStandardCode) {
      const codeKey = normalizeCode(topic.sourceStandardCode);
      if (!topicsByStandardCode.has(codeKey)) topicsByStandardCode.set(codeKey, []);
      topicsByStandardCode.get(codeKey).push(topic);
    }
  }

  // 3. Clusters indexing
  const clustersById = new Map();
  const clustersBySubject = new Map();
  for (const cluster of clusters) {
    clustersById.set(cluster.id, cluster);
    const subjName = cluster.subjectKorean || cluster.subject;
    if (!clustersBySubject.has(subjName)) {
      clustersBySubject.set(subjName, []);
    }
    clustersBySubject.get(subjName).push(cluster);
  }

  // 4. Dependencies indexing (official & candidate)
  const officialPrereqs = new Map(); // topicId -> [edge]
  const officialUnlocks = new Map(); // prerequisiteId -> [edge]

  for (const edge of officialDependencies) {
    if (!officialPrereqs.has(edge.topicId)) officialPrereqs.set(edge.topicId, []);
    officialPrereqs.get(edge.topicId).push(edge);

    if (!officialUnlocks.has(edge.prerequisiteId)) officialUnlocks.set(edge.prerequisiteId, []);
    officialUnlocks.get(edge.prerequisiteId).push(edge);
  }

  const allPrereqs = new Map(); // topicId -> [edge]
  const allUnlocks = new Map(); // prerequisiteId -> [edge]

  for (const edge of [...officialDependencies, ...candidateDependencies]) {
    if (!allPrereqs.has(edge.topicId)) allPrereqs.set(edge.topicId, []);
    allPrereqs.get(edge.topicId).push(edge);

    if (!allUnlocks.has(edge.prerequisiteId)) allUnlocks.set(edge.prerequisiteId, []);
    allUnlocks.get(edge.prerequisiteId).push(edge);
  }

  return {
    manifest,
    curricula,
    standards: allStandards,
    standardsByCode,
    standardsByKey,
    standardsBySubject,
    topics,
    topicsById,
    topicsByStandardKey,
    topicsByStandardCode,
    clusters,
    clustersById,
    clustersBySubject,
    officialDependencies,
    candidateDependencies,
    officialPrereqs,
    officialUnlocks,
    allPrereqs,
    allUnlocks,
  };
}
