/**
 * packages/korean-elementary-learning-map-mcp/src/graph.mjs
 * 
 * Graph traversal and topological sorting for elementary learning dependencies.
 */

function getPrereqMap(store, layer) {
  if (layer === 'official') return store.officialPrereqs;
  return store.allPrereqs;
}

function getUnlocksMap(store, layer) {
  if (layer === 'official') return store.officialUnlocks;
  return store.allUnlocks;
}

export function directEdges(store, topicId, layer = 'official') {
  const prereqMap = getPrereqMap(store, layer);
  const unlocksMap = getUnlocksMap(store, layer);

  const rawPrereqs = prereqMap.get(topicId) || [];
  const rawUnlocks = unlocksMap.get(topicId) || [];

  const mapEdge = (e, targetId) => {
    const targetTopic = store.topicsById.get(targetId);
    return {
      edgeId: e.id,
      layer: e.layer,
      relationKind: e.relationKind,
      strength: e.strength,
      reason: e.reason,
      basis: e.basis,
      topicId: targetId,
      name: targetTopic?.titleKorean || targetTopic?.name || targetId,
      subject: targetTopic?.subjectKorean,
      gradeBand: targetTopic?.gradeBand,
      standardCode: targetTopic?.sourceStandardCode,
      sourceLocator: e.sourceLocator,
    };
  };

  return {
    topicId,
    layer,
    prerequisites: rawPrereqs.map((e) => mapEdge(e, e.prerequisiteId)),
    unlocks: rawUnlocks.map((e) => mapEdge(e, e.topicId)),
  };
}

/**
 * Traverses transitive prerequisites or unlocks and returns a topologically sorted sequence.
 */
export function learningPath(store, topicId, options = {}) {
  const { layer = 'official', direction = 'prerequisites', maxDepth = 20 } = options;
  const edgeMap = direction === 'prerequisites' ? getPrereqMap(store, layer) : getUnlocksMap(store, layer);

  const visited = new Set();
  const collectedEdges = [];
  const depthMap = new Map(); // topicId -> min depth

  function dfs(currId, currentDepth) {
    if (currentDepth > maxDepth) return;
    const existingDepth = depthMap.get(currId);
    if (existingDepth !== undefined && existingDepth <= currentDepth) return;
    depthMap.set(currId, currentDepth);

    const edges = edgeMap.get(currId) || [];
    for (const e of edges) {
      const nextId = direction === 'prerequisites' ? e.prerequisiteId : e.topicId;
      collectedEdges.push(e);
      visited.add(nextId);
      dfs(nextId, currentDepth + 1);
    }
  }

  dfs(topicId, 0);

  // If no edges found, return empty sequence
  if (visited.size === 0) {
    return {
      targetTopicId: topicId,
      direction,
      layer,
      totalCount: 0,
      path: [],
    };
  }

  // Topological sorting for prerequisites (Kahn's algorithm)
  // Subgraph nodes = visited U { topicId }
  const allNodes = Array.from(visited);
  if (!allNodes.includes(topicId)) allNodes.push(topicId);

  // In-degree map: for prerequisites, prerequisiteId must be completed BEFORE topicId
  const inDegree = new Map(allNodes.map((n) => [n, 0]));
  const adj = new Map(allNodes.map((n) => [n, []]));

  for (const e of collectedEdges) {
    const from = direction === 'prerequisites' ? e.prerequisiteId : e.topicId;
    const to = direction === 'prerequisites' ? e.topicId : e.prerequisiteId;

    if (inDegree.has(to) && inDegree.has(from)) {
      adj.get(from).push(to);
      inDegree.set(to, inDegree.get(to) + 1);
    }
  }

  const queue = allNodes.filter((n) => inDegree.get(n) === 0);
  const sorted = [];

  while (queue.length > 0) {
    const curr = queue.shift();
    sorted.push(curr);

    for (const neighbor of adj.get(curr) || []) {
      const newDeg = inDegree.get(neighbor) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) {
        queue.push(neighbor);
      }
    }
  }

  // Append any cycle remnants
  for (const n of allNodes) {
    if (!sorted.includes(n)) sorted.push(n);
  }

  const path = sorted.map((id, index) => {
    const t = store.topicsById.get(id);
    return {
      step: index + 1,
      id,
      name: t?.titleKorean || t?.name || id,
      subject: t?.subjectKorean,
      gradeBand: t?.gradeBand,
      domain: t?.domainKorean,
      standardCode: t?.sourceStandardCode,
      facetKey: t?.facetKey,
      topicRole: t?.topicRole,
      isTarget: id === topicId,
    };
  });

  return {
    targetTopicId: topicId,
    direction,
    layer,
    totalCount: path.length,
    path,
  };
}
