import test from 'node:test';
import assert from 'node:assert/strict';
import { loadStore } from '../src/data-store.mjs';
import { directEdges, learningPath } from '../src/graph.mjs';

test('3. Graph traversal and learning path verification', () => {
  const store = loadStore();

  // Find a topic with official prerequisites
  const sampleEdge = store.officialDependencies[0];
  assert.ok(sampleEdge);

  const direct = directEdges(store, sampleEdge.topicId, 'official');
  assert.ok(direct.prerequisites.length > 0);
  assert.equal(direct.prerequisites[0].topicId, sampleEdge.prerequisiteId);

  // Transitive learning path
  const path = learningPath(store, sampleEdge.topicId, {
    layer: 'official',
    direction: 'prerequisites',
  });
  assert.ok(path.totalCount >= 2);
  assert.ok(path.path.some((p) => p.isTarget));
});
