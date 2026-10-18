# korean-elementary-learning-map-mcp

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.11-brightgreen.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Curriculum](https://img.shields.io/badge/Curriculum-2022%20개정%20초등-orange.svg)](https://ncic.re.kr)
[![MCP](https://img.shields.io/badge/MCP-Model%20Context%20Protocol-purple.svg)](https://modelcontextprotocol.io/)

**대한민국 초등학교 1~6학년 2022 개정 교육과정 학습 온톨로지 그래프와 역방향 학습 결손 진단을 AI가 직접 탐색하고 처방할 수 있도록 지원하는 MCP(Model Context Protocol) 서버**입니다.

Claude Desktop, Claude Code, Cursor, Windsurf, Google Antigravity 등 MCP 표준을 지원하는 모든 AI 에이전트에 연결하여, 초등 11개 전 교과의 620개 성취기준, 1,956개 미시 학습 주제, 2,293개 선수학습 위계망, 152개 단원 클러스터, 그리고 **초등학생 기초학력 진단 및 이전 학년 선수 결손 역추적 진단**을 제공합니다.

---

## 📌 주요 특징

1. **초등 11개 전 교과 & 3대 학년군 전수 포괄**:
   - 국어, 수학, 사회, 과학, 도덕, 영어(EFL), 실과(기술·가정/정보), 통합교과(바른 생활, 슬기로운 생활, 즐거운 생활), 음악, 미술, 체육 11개 교과 수록.
   - 초등 교육과정 편제에 맞춘 `1-2`, `3-4`, `5-6` 3대 학년군 체계 완전 지원.
2. **초등 맞춤형 역방향 학습 결손 진단기 (`diagnose_learning_gap`)**:
   - 초등 고학년에서 분수 연산, 비와 비율, 나눗셈 등에 어려움을 겪는 경우, 1~2학년 및 3~4학년군 기초 개념(구구단, 자릿값, 묶음셈 등)으로 거슬러 올라가는 **Kahn 위상정렬 기반 역방향 DAG(Directed Acyclic Graph) 탐색**.
   - 단순 오답 확인을 넘어선 **선수 개념 결손 원인 역추적 및 맞춤 보충 학습 로드맵** 자동 생성.
3. **이중 선수학습 레이어 (`official` / `candidate`)**:
   - 교육부 2022 개정 교육과정 성취기준 해설 및 내용 체계표에 근거한 공식 인과관계 416건(`official`).
   - 교육학적 분해 순서 및 지도 위계를 보완한 추천 인과관계 1,877건(`candidate`).
4. **오타 및 표기 변형에 강한 정규화 검색 엔진**:
   - `4수01-08`, `[4수01-08]`, `4수 01 08` 등 다양한 코드 표기를 표준 규격으로 자동 정규화.
   - Bigram Jaccard 유사도 기반 오타 교정 추천 탑재.
5. **순수 로컬 인메모리 & Zero-External-API**:
   - 외부 API나 네트워크 호출 없이 SHA-256 검증된 로컬 데이터셋으로 밀리초(ms) 단위의 초고속 그래프 순회 및 검색 수행.
   - 완전한 `stdio` JSON-RPC 2.0 표준 준수로 연결 안정성 보장.

---

## 📊 데이터셋 규모 (Data Statistics)

| 항목 | 수량 | 세부 내용 및 특징 |
| :--- | ---: | :--- |
| **교과(Curricula)** | **11개** | 국어, 수학, 사회, 과학, 도덕, 영어, 실과, 통합교과, 미술, 음악, 체육 |
| **학년군(Grade Bands)** | **3개** | 초등 `1-2`학년군, `3-4`학년군, `5-6`학년군 |
| **성취기준(Standards)** | **620개** | 교육부 2022 개정 교육과정 공식 고시 코드 체계 전수 수록 |
| **세부 학습 주제(Topics)**| **1,956개** | 개념(concept), 절차(procedure), 탐구(inquiry) 등 8대 facet 및 평가 문항·오개념 수록 |
| **선수학습 관계(Official)**| **416개** | 국가 교육과정 공식 문서가 명시한 선이수 인과관계 |
| **선수학습 관계(Candidate)**| **1,877개** | 교육학적 위계 분해를 통해 도출된 추천 학습 연결망 |
| **총 선수학습 엣지** | **2,293개** | 순환 참조 없는 유향 비순환 그래프(DAG) 검증 완료 |
| **학습 클러스터(Clusters)**| **152개** | 단원 및 대주제 단위 그루핑 및 교사용/학부모용 요약 |

---

## 🛠️ 제공 도구 10종 상세 (MCP Tools)

### 1. `list_curricula`
- **설명**: 지원하는 초등 11개 교과 목록과 학년군별 성취기준 수를 요약 조회합니다.
- **파라미터**:
  - `grade_band` *(선택, string)*: `"1-2" | "3-4" | "5-6"`

### 2. `search_standards`
- **설명**: 성취기준 코드, 키워드, 교과, 학년군으로 성취기준을 검색합니다.
- **파라미터**:
  - `query` *(선택, string)*: 검색어 (예: `"분수"`, `"나눗셈"`, `"4수01-08"`)
  - `curriculum` *(선택, string)*: 교과명 (예: `"수학"`, `"국어"`)
  - `grade_band` *(선택, string)*: `"1-2" | "3-4" | "5-6"`
  - `limit` *(선택, integer, 기본값 20)*: 최대 결과 수

### 3. `get_standard`
- **설명**: 성취기준 코드로 상세 해설, 소속 클러스터, 하위 미시 주제 목록 및 직접 선수/후속 성취기준을 조회합니다.
- **파라미터**:
  - `code` *(필수, string)*: 성취기준 코드 (예: `"4수01-08"`, `"[6수01-11]"`)

### 4. `search_topics`
- **설명**: 1,956개 미시 세부 학습 주제를 키워드, 교과, 학년군, facet(개념/원리, 절차/기능, 탐구 등)으로 검색합니다.
- **파라미터**:
  - `query` *(선택, string)*: 검색 키워드 (예: `"덧셈"`, `"받아올림"`)
  - `curriculum` *(선택, string)*: 교과명
  - `grade_band` *(선택, string)*: `"1-2" | "3-4" | "5-6"`
  - `facet` *(선택, string)*: `"concept" | "procedure" | "inquiry" | "attitude" | "application" | "representation" | "metacognition" | "communication"`
  - `limit` *(선택, integer, 기본값 20)*: 최대 결과 수

### 5. `get_topic`
- **설명**: 주제 ID로 관찰 성취 증거(`evidence`), 평가 발문 문항(`assessmentPrompt`), 학생들의 흔한 오개념(`misconceptions`), 추천 수업 전략을 조회합니다.
- **파라미터**:
  - `topic_id` *(필수, string)*: 주제 고유 식별자

### 6. `get_prerequisites`
- **설명**: 특정 주제의 선수(선이수) 또는 후속(발전) 학습 경로를 위상 정렬하여 조회합니다.
- **파라미터**:
  - `topic_id` *(필수, string)*: 주제 ID
  - `direction` *(선택, string, 기본값 `"prerequisites"`)*: `"prerequisites"` (선수학습 추적) 또는 `"unlocks"` (후속학습 추적)
  - `depth` *(선택, string, 기본값 `"all"`)*: `"1"` (직접 연결 1단계) 또는 `"all"` (전이적 전체 DAG 경로)
  - `layer` *(선택, string, 기본값 `"all"`)*: `"official"` (공식 관계만), `"candidate"` (후보 관계만), `"all"` (전체)

### 7. `get_learning_roadmap`
- **설명**: 특정 교과 및 학년군의 영역 ➔ 클러스터(단원) ➔ 성취기준으로 이어지는 체계적인 계층형 로드맵을 제공합니다.
- **파라미터**:
  - `curriculum` *(필수, string)*: 교과명 (예: `"수학"`, `"과학"`)
  - `grade_band` *(선택, string)*: 학년군 (`"1-2"`, `"3-4"`, `"5-6"`)

### 8. `list_clusters`
- **설명**: 단원 및 영역별 대주제 클러스터 152개의 목록을 조회합니다.
- **파라미터**:
  - `curriculum` *(선택, string)*: 교과명
  - `grade_band` *(선택, string)*: 학년군
  - `query` *(선택, string)*: 검색어

### 9. `get_cluster`
- **설명**: 클러스터 ID로 클러스터 요약 설명 및 포함된 전체 세부 성취기준/주제 목록을 확인합니다.
- **파라미터**:
  - `cluster_id` *(필수, string)*: 클러스터 식별자

### 10. `diagnose_learning_gap` 🌟 (초등 특화)
- **설명**: 학생이 특정 성취기준이나 학습 주제에서 지속적인 오류나 오개념을 보일 때, 하위 학년군으로 거슬러 올라가 근본 결손 원인을 역추적 진단하고 맞춤 보충 학습 단계를 처방합니다.
- **파라미터**:
  - `target` *(필수, string)*: 진단 대상 성취기준 코드(예: `"6수01-11"`) 또는 주제 ID
  - `observed_misconception` *(선택, string)*: 관찰된 학생의 오개념이나 오답 유형 (예: `"분모는 분모끼리 더하고 분자는 분자끼리 더함"`)
  - `max_depth` *(선택, integer, 기본값 4)*: 역추적 최대 탐색 깊이
- **반환 데이터**:
  - 진단 대상 성취기준 상세
  - 관찰된 오개념 분석 및 교정 지도 가이드
  - **이전 학년군별 기초 선수학습 결손 진단 항목 (1-2학년, 3-4학년군 역추적)**
  - 위상 정렬된 단계적 보충 학습 처방 로드맵(Step 1 ➔ Step 2 ➔ Step 3)
  - 교사용 형성평가 체크리스트 문항

---

## 🚀 설치 및 AI 클라이언트 연결 방법

### 1. Claude Desktop 설정
설정 파일(`claude_desktop_config.json`)의 `mcpServers` 블록에 추가합니다.
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "korean-elementary-learning-map": {
      "command": "node",
      "args": [
        "/path/to/korean-elementary-learning-map-mcp/src/cli.mjs"
      ]
    }
  }
}
```

> **npx로 바로 실행하는 경우**:
> ```json
> {
>   "mcpServers": {
>     "korean-elementary-learning-map": {
>       "command": "npx",
>       "args": ["-y", "korean-elementary-learning-map-mcp"]
>     }
>   }
> }
> ```

### 2. Claude Code CLI 연동
터미널에서 명령어 한 줄로 즉시 추가할 수 있습니다:
```bash
claude mcp add korean-elementary-learning-map -- node /path/to/korean-elementary-learning-map-mcp/src/cli.mjs
```

### 3. Cursor IDE 연동
프로젝트 루트의 `.cursor/mcp.json` 파일에 추가합니다:
```json
{
  "mcpServers": {
    "korean-elementary-learning-map": {
      "command": "node",
      "args": ["/path/to/korean-elementary-learning-map-mcp/src/cli.mjs"]
    }
  }
}
```

### 4. Windsurf 연동
Windsurf MCP 설정 파일(`mcp_config.json`)에 등록합니다:
```json
{
  "mcpServers": {
    "korean-elementary-learning-map": {
      "command": "node",
      "args": ["/path/to/korean-elementary-learning-map-mcp/src/cli.mjs"]
    }
  }
}
```

### 5. Google Antigravity / Gemini CLI 연동
`~/.gemini/antigravity-cli/mcp/` 설정에 다음과 같이 등록합니다:
```json
{
  "mcpServers": {
    "korean-elementary-learning-map": {
      "command": "node",
      "args": ["/path/to/korean-elementary-learning-map-mcp/src/cli.mjs"]
    }
  }
}
```

---

## 💡 AI 프롬프트 활용 예시

MCP가 연결된 AI에게 다음과 같이 질문하여 초등 교육과정에 부합하는 정확한 답변을 얻을 수 있습니다.

- **결손 진단**:
  > "초등학교 6학년 학생이 분수의 나눗셈 계산을 전혀 하지 못하고 멈칫거립니다. 3~4학년군과 5~6학년군 선수학습 체계를 역추적해서 어느 단계에서 결손이 발생했는지 진단하고 맞춤 보충 학습 순서를 짜주세요."
- **수업 설계 & 학습 로드맵**:
  > "초등 3~4학년군 과학 '동물의 생활' 단원의 학습 로드맵을 클러스터와 성취기준 단위로 보여주고, 학생들이 흔히 겪는 오개념 목록을 알려줘."
- **성취기준 기반 문제 출제**:
  > "성취기준 `[4수01-08]`을 달성했는지 평가할 수 있는 형성평가 문항과 평가 질문(`assessmentPrompt`)을 조회해줘."

---

## 🧪 로컬 개발 및 테스트

```bash
# 저장소 복제
git clone https://github.com/neohum/korean-elementary-learning-map-mcp.git
cd korean-elementary-learning-map-mcp

# 의존성 설치
npm install

# 전체 테스트 실행 (Node.js 기본 내장 test runner)
npm test
```

### 테스트 구성
- `tests/data-store.test.mjs`: SHA-256 데이터 무결성 및 인메모리 색인 적재 테스트
- `tests/search.test.mjs`: 성취기준, 토픽, 클러스터 다차원 검색 및 오타 교정 테스트
- `tests/graph.test.mjs`: 위상정렬 DAG 순회 및 선수·후속 학습 경로 추적 테스트
- `tests/gap-diagnosis.test.mjs`: 하위 학년군 역추적 결손 진단 알고리즘 테스트
- `tests/server.test.mjs`: 10개 MCP 도구 및 `about://` 리소스 등록 인터페이스 테스트

---

## 📜 라이선스 및 데이터 출처 (License & Notice)

- **소프트웨어 라이선스**: [MIT License](LICENSE) (Copyright (c) 2026 neohum)
- **국가 교육과정 공공저작물**:
  - 본 패키지에 수록된 2022 개정 초등 교육과정 성취기준 원문 및 해설은 대한민국 교육부 고시(제2022-33호 별책2 등)에 근거합니다.
  - 대한민국 저작권법 제7조 제2호에 따라 보호받지 않는 공공저작물입니다.
- **학습 온톨로지 데이터셋**:
  - 학습 주제, 관찰 성취 증거, 평가 발문, 오개념, 선수학습 인과관계는 [DECK6/korean-elementary-learning-map](https://github.com/DECK6/korean-elementary-learning-map) (MIT License, 커밋 `9d0ffea`)의 오픈 온톨로지 데이터를 기반으로 제작되었습니다.
- **참조 프로젝트**:
  - 중고등학교 학습 맵 MCP 서버인 [raphysicst-create/korean-secondary-learning-map-mcp](https://github.com/raphysicst-create/korean-secondary-learning-map-mcp)의 아키텍처를 참고하여 초등 교육과정 편제에 맞추어 재설계되었습니다.
