import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStore } from '../src/data-store.mjs';
import { normalizeCode } from '../src/normalize.mjs';

test('1. Datastore integrity and loading verification', () => {
  const store = loadStore();

  assert.equal(store.curricula.length, 11, '11개 초등 교과가 로드되어야 한다');
  assert.equal(store.standards.length, 620, '620개 초등 성취기준이 로드되어야 한다');
  assert.equal(store.topics.length, 1956, '1,956개 초등 세부 주제가 로드되어야 한다');
  assert.equal(store.clusters.length, 152, '152개 학습 클러스터가 로드되어야 한다');
  assert.equal(store.officialDependencies.length, 416, '416개 official 선수관계가 로드되어야 한다');
  assert.equal(store.candidateDependencies.length, 1877, '1,877개 candidate 선수관계가 로드되어야 한다');

  // Verify code normalization indexing
  const std1 = store.standardsByCode.get('[4수01-08]');
  assert.ok(std1, '[4수01-08] 성취기준이 인덱싱되어야 한다');
  assert.equal(std1.subjectKorean, '수학');
  assert.equal(std1.gradeBand, '3-4');

  const std2 = store.standardsByCode.get(normalizeCode('2국01-01'));
  assert.ok(std2, '2국01-01 성취기준이 정규화되어 인덱싱되어야 한다');
  assert.equal(std2.subjectKorean, '국어');
  assert.equal(std2.gradeBand, '1-2');
});
