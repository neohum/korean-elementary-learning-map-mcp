import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStore } from '../src/data-store.mjs';
import { searchStandards, searchTopics, searchClusters, suggestSimilar } from '../src/search.mjs';

test('2. Search engine verification across standards, topics, and clusters', () => {
  const store = loadStore();

  // 1. Search standards by code
  const stdResult1 = searchStandards(store, '4수01-08');
  assert.ok(stdResult1.items.length >= 1);
  assert.equal(stdResult1.items[0].code, '[4수01-08]');

  // 2. Search standards by subject and keyword
  const mathFractions = searchStandards(store, '분수', { subject: '수학', gradeBand: '3-4' });
  assert.ok(mathFractions.items.length > 0);
  assert.ok(mathFractions.items.some((item) => item.summary.includes('분수')));

  // 3. Search topics
  const topicsResult = searchTopics(store, '나눗셈', { subject: '수학', facetKey: 'concept' });
  assert.ok(topicsResult.items.length > 0);
  assert.equal(topicsResult.items[0].facetKey, 'concept');

  // 4. Search clusters
  const clusterResult = searchClusters(store, '미술');
  assert.ok(clusterResult.items.length > 0);
  assert.ok(clusterResult.items[0].subject.includes('미술'));

  // 5. Suggest similar
  const candidates = ['나눗셈', '곱셈', '분수', '소수', '도형'];
  const suggested = suggestSimilar(candidates, '나눗샘');
  assert.ok(suggested.includes('나눗셈'));
});
