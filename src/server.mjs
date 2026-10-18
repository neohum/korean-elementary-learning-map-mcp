/**
 * packages/korean-elementary-learning-map-mcp/src/server.mjs
 * 
 * Model Context Protocol (MCP) server for 2022 Revised Korean Elementary Curriculum Learning Map.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { normalizeCode, normalizeText } from './normalize.mjs';
import { searchStandards, searchTopics, searchClusters, suggestSimilar } from './search.mjs';
import { directEdges, learningPath } from './graph.mjs';
import { buildRoadmap } from './roadmap.mjs';
import { diagnoseLearningGap } from './gap-diagnosis.mjs';

const SERVER_INFO = { name: 'korean-elementary-learning-map', version: '0.1.0' };

const GRADE_BAND_ENUM = z.enum(['1-2', '3-4', '5-6']).describe('초등학교 학년군 (1-2: 1~2학년, 3-4: 3~4학년, 5-6: 5~6학년)');

function ok(payload) {
  return { content: [{ type: 'text', text: JSON.stringify(payload, null, 2) }] };
}

function fail(message, suggestions = []) {
  const text = suggestions.length ? `${message} 유사 후보: ${suggestions.join(', ')}` : message;
  return { content: [{ type: 'text', text }], isError: true };
}

function aboutText(store) {
  const { manifest } = store;
  return [
    '# 한국 초등 2022 개정 교육과정 학습 지도 (Learning Map) MCP 서버',
    '',
    `- 데이터 릴리스: ${manifest.taxonomyVersion} (${manifest.generatedAt})`,
    `- 데이터 규모: 11개 교과 · 성취기준 620개 · 학습 주제 1,956개 · 공식 선수관계 416개 (후보 1,877개) · 클러스터 152개`,
    '- 대상 교과: 국어, 수학, 과학, 사회, 도덕, 영어(EFL), 실과(기술·가정)/정보, 통합교과, 미술, 음악, 체육',
    '- 학년군 체계: 초등학교 1~2학년 (1-2), 3~4학년 (3-4), 5~6학년 (5-6)',
    '- 데이터 원천: 대한민국 2022 개정 초등 교육과정 고시본 및 DECK6/korean-elementary-learning-map (MIT)',
    '- 라이선스: MIT. 국가 교육과정 공공 저작물 기반이며, 성취기준 요약, 관찰 성취 증거, 평가 질문, 오개념, 선수 학습 경로를 제공합니다.',
    '- 주요 기능: 성취기준/주제 검색, 선수·후속 학습 관계 위상 정렬 탐색, 단원 로드맵, 학습 결손 역추적 진단.',
  ].join('\n');
}

export function createServer(store) {
  const server = new McpServer(SERVER_INFO);

  // ── Resources ──
  server.registerResource(
    'about',
    'about://korean-elementary-learning-map',
    {
      title: '한국 초등 교육과정 학습 지도 안내',
      description: '초등 교육과정 데이터 출처, 교과 범위, 라이선스 및 데이터 통계',
      mimeType: 'text/markdown',
    },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: 'text/markdown', text: aboutText(store) }],
    })
  );

  // ── Tools ──

  // Tool 1: list_curricula
  server.registerTool(
    'list_curricula',
    {
      title: '초등 교과 목록 및 요약',
      description: '초등학교 11개 교과(국어, 수학, 과학, 사회, 도덕, 영어, 실과, 통합교과, 미술, 음악, 체육) 및 학년군별 성취기준 수 요약을 조회합니다.',
      inputSchema: {
        subject: z.string().optional().describe('특정 교과명 필터 (예: 수학, 과학, 국어)'),
      },
    },
    async ({ subject }) => {
      let curricula = store.curricula;
      if (subject) {
        const normSubj = normalizeText(subject);
        curricula = curricula.filter(
          (c) =>
            normalizeText(c.subjectKorean).includes(normSubj) ||
            normalizeText(c.subject).includes(normSubj)
        );
      }

      const items = curricula.map((c) => {
        const standards = c.standards || [];
        const bandCounts = { '1-2': 0, '3-4': 0, '5-6': 0 };
        for (const s of standards) {
          if (bandCounts[s.gradeBand] !== undefined) {
            bandCounts[s.gradeBand]++;
          }
        }
        return {
          id: c.id,
          subjectKorean: c.subjectKorean,
          subjectEnglish: c.subject,
          totalStandards: standards.length,
          gradeBandDistribution: bandCounts,
          sourcePdf: c.sourceIds?.[0] || '공식 고시본',
        };
      });

      return ok({
        schoolLevel: 'elementary',
        totalCurricula: items.length,
        curricula: items,
      });
    }
  );

  // Tool 2: search_standards
  server.registerTool(
    'search_standards',
    {
      title: '성취기준 검색',
      description: '초등학교 성취기준을 코드(예: 4수01-08, [2국01-01]), 키워드, 교과, 학년군으로 검색합니다.',
      inputSchema: {
        query: z.string().optional().describe('성취기준 코드 또는 내용 키워드 (예: 나눗셈, 4수01-08, 분수, 식물의 한살이)'),
        subject: z.string().optional().describe('교과명 필터 (예: 수학, 과학, 국어)'),
        gradeBand: GRADE_BAND_ENUM.optional(),
        limit: z.number().min(1).max(50).default(20).optional().describe('결과 개수 제한 (기본: 20, 최대: 50)'),
        offset: z.number().min(0).default(0).optional().describe('페이징 시작 인덱스'),
      },
    },
    async (args) => {
      const result = searchStandards(store, args.query, args);
      return ok(result);
    }
  );

  // Tool 3: get_standard
  server.registerTool(
    'get_standard',
    {
      title: '성취기준 상세 조회',
      description: '성취기준 코드(예: [4수01-08] 또는 4수01-08)로 성취기준 요약, 소속 영역, 출처, 연결된 세부 학습 주제 목록을 조회합니다.',
      inputSchema: {
        code: z.string().describe('성취기준 코드 (예: [4수01-08], 2국01-01, [6과02-01])'),
      },
    },
    async ({ code }) => {
      const normCode = normalizeCode(code);
      const std = store.standardsByCode.get(normCode);

      if (!std) {
        const candidates = store.standards.map((s) => s.code);
        const suggestions = suggestSimilar(candidates, code, 3);
        return fail(`성취기준 코드 ${code}를 찾을 수 없습니다.`, suggestions);
      }

      const connectedTopics = store.topicsByStandardKey.get(std.key) || [];

      return ok({
        code: std.code,
        key: std.key,
        subject: std.subjectKorean,
        gradeBand: std.gradeBand,
        domain: std.domainKorean,
        summary: std.summary,
        sourceSection: std.sourceSection,
        sourceLocator: std.sourceLocator,
        connectedTopics: connectedTopics.map((t) => ({
          id: t.id,
          name: t.titleKorean || t.name,
          facetKey: t.facetKey,
          topicRole: t.topicRole,
          evidenceCount: (t.evidence || []).length,
          hasAssessmentPrompt: Boolean(t.assessmentPrompt),
          hasMisconceptions: Boolean(t.misconceptions?.length),
        })),
      });
    }
  );

  // Tool 4: search_topics
  server.registerTool(
    'search_topics',
    {
      title: '세부 학습 주제 검색',
      description: '1,956개 초등 세부 학습 주제를 키워드, 교과, 학년군, facet(개념, 절차, 적용 등), 역할로 검색합니다.',
      inputSchema: {
        query: z.string().optional().describe('주제명, 성취 증거, 평가 질문 등 검색 키워드'),
        subject: z.string().optional().describe('교과명 필터 (예: 수학, 과학, 사회)'),
        gradeBand: GRADE_BAND_ENUM.optional(),
        facetKey: z
          .enum(['concept', 'procedure', 'representation', 'application', 'inquiry', 'communication', 'reflection', 'core'])
          .optional()
          .describe('학습 관점 facet (concept: 개념, procedure: 절차/계산, inquiry: 탐구, application: 적용/해결 등)'),
        topicRole: z.enum(['anchor', 'facet', 'auxiliary']).optional().describe('주제 역할 (anchor: 핵심 앵커, facet: 세부 분면)'),
        limit: z.number().min(1).max(50).default(20).optional(),
        offset: z.number().min(0).default(0).optional(),
      },
    },
    async (args) => {
      const result = searchTopics(store, args.query, args);
      return ok(result);
    }
  );

  // Tool 5: get_topic
  server.registerTool(
    'get_topic',
    {
      title: '세부 학습 주제 상세 조회',
      description: '주제 ID로 학생 관찰 성취 증거(evidence), 교사용 평가 질문(assessmentPrompt), 흔히 나타나는 오개념(misconceptions) 및 원문 출처를 조회합니다.',
      inputSchema: {
        id: z.string().describe('세부 학습 주제 ID (예: kr.mt.integrated.healthy-life.healthy-body.2geon0101.01)'),
      },
    },
    async ({ id }) => {
      const topic = store.topicsById.get(id);
      if (!topic) {
        const candidates = store.topics.map((t) => t.id);
        const suggestions = suggestSimilar(candidates, id, 3);
        return fail(`학습 주제 ID ${id}를 찾을 수 없습니다.`, suggestions);
      }

      // Check for direct prerequisite edges
      const edges = directEdges(store, id, 'official');
      const candidateEdges = directEdges(store, id, 'all');

      return ok({
        id: topic.id,
        name: topic.titleKorean || topic.name,
        subject: topic.subjectKorean,
        gradeBand: topic.gradeBand,
        domain: topic.domainKorean,
        curriculumArea: topic.curriculumAreaKorean,
        standardCode: topic.sourceStandardCode,
        facetKey: topic.facetKey,
        topicRole: topic.topicRole,
        type: topic.type,
        description: topic.description,
        evidence: topic.evidence || [],
        assessmentPrompt: topic.assessmentPrompt || null,
        misconceptions: topic.misconceptions || [],
        directPrerequisites: edges.prerequisites,
        candidatePrerequisitesCount: candidateEdges.prerequisites.length,
        directUnlocks: edges.unlocks,
        sourceLocator: topic.contentSourceLocator || topic.sourceLocator,
      });
    }
  );

  // Tool 6: get_prerequisites
  server.registerTool(
    'get_prerequisites',
    {
      title: '선수 및 후속 학습 관계 조회',
      description: '주제의 선행 학습 요건(prerequisites) 또는 이 주제가 개방하는 후속 개념(unlocks)을 조회합니다. depth가 "all"이면 위상 정렬된 전체 학습 경로를 반환합니다.',
      inputSchema: {
        topicId: z.string().describe('학습 주제 ID'),
        layer: z.enum(['official', 'candidate', 'all']).default('official').optional().describe('관계 층위 (official: 416개 공식 고시 근거, candidate: 1,877개 추천 순서, all: 전체 합집합)'),
        direction: z.enum(['prerequisites', 'unlocks']).default('prerequisites').optional().describe('탐색 방향 (prerequisites: 먼저 알아야 할 선수 개념, unlocks: 이후 배울 후속 개념)'),
        depth: z.enum(['1', 'all']).default('1').optional().describe('탐색 깊이 (1: 직전/직후 직접 관계, all: 위상 정렬된 전이적 전체 학습 경로)'),
      },
    },
    async ({ topicId, layer = 'official', direction = 'prerequisites', depth = '1' }) => {
      const topic = store.topicsById.get(topicId);
      if (!topic) {
        return fail(`학습 주제 ${topicId}를 찾을 수 없습니다.`);
      }

      if (depth === '1') {
        const edges = directEdges(store, topicId, layer);
        return ok({
          topicId,
          topicName: topic.titleKorean || topic.name,
          direction,
          layer,
          results: direction === 'prerequisites' ? edges.prerequisites : edges.unlocks,
        });
      }

      const pathResult = learningPath(store, topicId, { layer, direction, maxDepth: 20 });
      return ok(pathResult);
    }
  );

  // Tool 7: get_learning_roadmap
  server.registerTool(
    'get_learning_roadmap',
    {
      title: '교과별 학습 로드맵 조회',
      description: '특정 초등 교과 및 학년군의 영역 ➔ 클러스터 ➔ 성취기준 계층형 로드맵을 조회합니다.',
      inputSchema: {
        subject: z.string().describe('교과명 (예: 수학, 과학, 국어, 사회)'),
        gradeBand: GRADE_BAND_ENUM.optional().describe('학년군 필터 (1-2, 3-4, 5-6)'),
      },
    },
    async ({ subject, gradeBand }) => {
      const roadmap = buildRoadmap(store, { subject, gradeBand });
      return ok(roadmap);
    }
  );

  // Tool 8: list_clusters
  server.registerTool(
    'list_clusters',
    {
      title: '학습 클러스터 목록 검색',
      description: '초등 152개 학습 단원 클러스터 목록을 교과 및 학년군별로 검색합니다.',
      inputSchema: {
        query: z.string().optional().describe('클러스터명 또는 영역 키워드'),
        subject: z.string().optional().describe('교과명 필터 (예: 수학, 미술, 음악)'),
        gradeBand: GRADE_BAND_ENUM.optional(),
        limit: z.number().min(1).max(50).default(20).optional(),
        offset: z.number().min(0).default(0).optional(),
      },
    },
    async (args) => {
      const result = searchClusters(store, args.query, args);
      return ok(result);
    }
  );

  // Tool 9: get_cluster
  server.registerTool(
    'get_cluster',
    {
      title: '학습 클러스터 상세 조회',
      description: '클러스터 ID로 포함된 세부 주제 목록과 학부모/교사용 요약을 조회합니다.',
      inputSchema: {
        id: z.string().describe('클러스터 ID (예: kr.cluster.art.3-4.unit-1)'),
      },
    },
    async ({ id }) => {
      const cluster = store.clustersById.get(id);
      if (!cluster) {
        const candidates = store.clusters.map((c) => c.id);
        const suggestions = suggestSimilar(candidates, id, 3);
        return fail(`클러스터 ID ${id}를 찾을 수 없습니다.`, suggestions);
      }

      const topics = (cluster.topics || []).map((tid) => {
        const t = store.topicsById.get(tid);
        return {
          id: tid,
          name: t?.titleKorean || t?.name || tid,
          standardCode: t?.sourceStandardCode,
          facetKey: t?.facetKey,
          topicRole: t?.topicRole,
        };
      });

      return ok({
        id: cluster.id,
        title: cluster.titleKorean || cluster.name,
        subject: cluster.subjectKorean,
        gradeBand: cluster.gradeBand,
        domain: cluster.domainKorean,
        summary: cluster.summary,
        parentSummary: cluster.parentSummary,
        topicCount: topics.length,
        topics,
      });
    }
  );

  // Tool 10: diagnose_learning_gap (초등 특화 기능)
  server.registerTool(
    'diagnose_learning_gap',
    {
      title: '초등 학습 결손 진단 및 선수 복습 처방',
      description: '학생이 특정 개념(주제 ID 또는 성취기준 코드)에서 오답을 내거나 어려움을 겪을 때, 위상수학적 역추적으로 이전 학년군의 필수 선수 결손 개념을 진단하고 단계별 복습 경로를 처방합니다.',
      inputSchema: {
        standardCode: z.string().optional().describe('성취기준 코드 (예: [6수01-11], [4수01-08])'),
        topicId: z.string().optional().describe('또는 세부 학습 주제 ID'),
        errorContext: z.string().optional().describe('학생의 오류 상황 또는 관찰된 오답 유형'),
        layer: z.enum(['official', 'candidate', 'all']).default('all').optional().describe('선수관계 층위 (all 권장)'),
      },
    },
    async (args) => {
      try {
        const diagnosis = diagnoseLearningGap(store, args);
        return ok(diagnosis);
      } catch (err) {
        return fail(err.message);
      }
    }
  );

  return server;
}
