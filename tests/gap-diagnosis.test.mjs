import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStore } from '../src/data-store.mjs';
import { diagnoseLearningGap } from '../src/gap-diagnosis.mjs';

test('4. Learning gap diagnosis and remediation roadmap verification', () => {
  const store = loadStore();

  // Test gap diagnosis with standardCode
  const result = diagnoseLearningGap(store, {
    standardCode: '4미03-04',
    errorContext: '미술 감상 관점 형성에 어려움을 겪고 질문을 생성하지 못함',
    layer: 'all',
  });

  assert.ok(result.diagnosedTarget);
  assert.equal(result.diagnosedTarget.standardCode, '[4미03-04]');
  assert.ok(result.prerequisiteCount > 0);
  assert.ok(result.recommendedRemediationOrder.length > 0);
});
