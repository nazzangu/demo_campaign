# Demo Campaign Builder

CRM 캠페인 플로우를 시각적으로 설계하고 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

### 캠페인 관리
- 캠페인 생성, 제목/설명 인라인 편집
- 캠페인 상태 관리: 초안 → 운영 → 일시정지 → 완료/폐기
- 캠페인 카드에 시뮬레이션 결과 요약 표시 (예상 대상, 발송, 성공/실패율)

### 캠페인 빌더
- 드래그 앤 드롭 기반 플로우 에디터 (Vue Flow)
- 노드 간 연결/삭제 (Delete 키), 자동 정렬 (Dagre 레이아웃)
- 상태별 헤더 버튼 변경 (초안: 저장/시작, 운영: 수정/일시정지/종료, 폐기: 조회 전용)
- 저장 시 유효성 검증 (미연결/미설정 노드, 시작일 필수, 세그먼트 시 분기 노드 필수)
- 운영 중 수정 시 변경 내역 확인 모달
- 노드명 더블클릭 인라인 편집
- **시뮬레이션**: 플로우 기반 예상 대상수 시뮬레이션, 각 노드별 도달 인원 뱃지 표시, 하단 퍼널 요약 패널
- **브랜치 엣지 라벨**: 분기 노드에서 나가는 연결선에 그룹명과 색상 자동 표시, 설정 변경 시 동기화
- **자동 정렬 개선**: 브랜치 하위 노드가 그룹 순서(좌→우) 대로 정렬, 결과 노드 겹침 방지

### 지원 노드
| 구분 | 노드 | 설명 |
|------|------|------|
| 진입 | 진입 조건 | 대상 사용자(모든 사용자/세그먼트), 시작일, 종료 조건 설정. 설정값 노드에 실시간 반영 |
| 채널 | 푸시 메시지 | 앱 선택, 일반/리치 푸시, 메시지 작성 + 휴대폰 미리보기, 개인화 변수, 발송 방식/조건/주기, 전환 이벤트, 테스트 발송 |
| 채널 | 알림톡 메시지 | 카카오톡 채널, 템플릿 선택 모달(검색/상세/미리보기), 발송 제한, 수신 동의 |
| 채널 | 문자메시지 | SMS/LMS/MMS 유형, 바이트 카운터, 개인화 변수, 미리보기, 발송 제한, 수신 동의, 테스트 발송 |
| 채널 | 브랜드 메시지, 웹훅 | 기본 메시지 설정 |
| 분기 | 사용자 기반 분기 | 코호트 규칙 빌더 (이벤트/기간/집계/속성 필터, AND/OR 조합), 세그먼트 가져오기, 그 외 사용자 그룹 토글 |
| 분기 | 이벤트 기반 분기 | 이벤트 조건 + 속성 필터 + 대기 시간 설정, 세그먼트 가져오기, 그 외 사용자 그룹 토글 |
| 리워드 | 쿠폰/포인트 | 리워드 선택, 메모 작성, 설정 완료 상태 관리 |
| 기타 | 대기 시간 | 분/시간/일 단위 대기 |
| 결과 | 발송 성공/실패 | 채널 노드에 자동 연결, 후속 액션 연결 가능 |

### 캠페인 운영 현황
- 상태별 요약 카드 (전체/운영/일시정지/초안/완료/폐기)
- 상태 필터 + 캠페인명 검색
- 상태별 액션 버튼 (시작/일시정지/중지/폐기/조회)
- 확인 모달 + 토스트 알림

### 캠페인 모니터링
- 캠페인 선택 드롭다운 (운영 중/완료/일시정지 캠페인)
- 진행 상태 배너 (운영 상태, 기간, 경과일)
- 대상/발송/성공/실패 요약 카드 (진행률 바)
- 반응률 현황: 오픈율, 클릭율, 전환율, 수신거부율 (원형 링 차트)
- 채널별 발송 현황 테이블 (대상/발송/성공/실패/오픈/클릭)
- 일별 발송 추이 스택 바 차트
- 최초 조회 시 첫 번째 캠페인 자동 선택

### 캠페인 성과 분석
- **단일 캠페인 분석**
  - KPI 카드 5종: 총 매출, 주문 건수, 객단가(AOV), 전환율(CVR), ROAS (이전 기간 대비 증감)
  - 전환 퍼널: 발송 → 수신 → 오픈 → 클릭 → 전환 (단계별 이탈율 시각화)
  - 일별 매출 추이 바 차트
  - 채널별 매출 성과 테이블: 발송/클릭/전환/매출/CVR/CPA

- **다중 캠페인 비교** (최대 5개)
  - 성과 비교 테이블: 총 매출, 주문수, 객단가, CVR, ROAS
  - 매출 / CVR / ROAS 비교 바 차트

### 캠페인 추천
- 과거 캠페인 성과 인사이트 요약 (총 실행 캠페인, 최고 전환율 채널, 평균 전환율, 최고 성과 캠페인)
- 5가지 추천 캠페인: 휴면 고객 재활성화, 장바구니 리타겟팅, 첫 구매 유도, 재구매 유도, 등급 업그레이드
- 추천 카드: 신뢰도, 예상 대상/전환율/매출, 플로우 미리보기, 추천 근거 태그
- 상세 보기: 추천 근거 상세 목록 + 참고 과거 캠페인 정보
- 캠페인 생성 버튼: 클릭 시 캠페인 자동 생성 + 플로우 그래프 저장 + 빌더 이동

### 세그먼트 관리
- 사용자 기반 / 이벤트 기반 세그먼트 CRUD
- 유형 필터 (전체/사용자 기반/이벤트 기반) + 검색
- 생성/편집 모달: 캠페인 빌더와 동일한 CohortRuleBuilder, EventBranchBuilder 사용
- 조건 요약 카드, 복제/삭제 기능
- 캠페인 빌더 브랜치 설정에서 "세그먼트 가져오기" 연동
- localStorage 기반 영구 저장

### 템플릿 관리
- 채널별 메시지 템플릿 목록 및 관리
- 채널 선택 + 템플릿명 입력으로 생성
- 채널별 설정 폼 (Push/SMS/카카오 등)
- 설정 상태 뱃지, 수정/삭제

### 설정 관리
- 7개 탭: 이벤트, 속성, 푸시 앱, 개인화 변수, 채널, 리워드 유형, 리워드 아이템
- 항목별 CRUD (추가/수정/삭제)
- 채널 활성/비활성 토글, 색상 변경 (캠페인 빌더 사이드바에 실시간 반영)
- 리워드 유형(쿠폰/포인트) 관리
- 변경사항 저장/취소/초기화 (하단 고정 저장 바 + 토스트)
- localStorage 기반 영구 저장

## 기술 스펙

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Vue 3 | 3.4 | UI 프레임워크 (Composition API, SFC) |
| TypeScript | 5.4 | 타입 안전성 |
| Vite | 5.3 | 빌드 도구 + 개발 서버 |
| Vue Router | 4.3 | 클라이언트 라우팅 (10개 페이지) |
| Pinia | 2.1 | 상태 관리 (campaign, settings) |
| Vue Flow | 1.41 | 플로우 에디터 (노드/엣지 그래프) |
| Dagre | 1.1 | 자동 레이아웃 알고리즘 |
| Axios | 1.7 | HTTP 클라이언트 |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Java | 17+ | 런타임 |
| Spring Boot | 3.2 | 웹 프레임워크 |
| Spring Data JPA | - | ORM |
| H2 Database | - | 내장 DB (개발용) |
| Flyway | 9.22 | DB 마이그레이션 |
| Lombok | - | 보일러플레이트 제거 |

## 프로젝트 구조

```
demo_campaign/
├── backend/                          # Spring Boot API 서버
│   ├── src/main/java/com/democampaign/
│   │   ├── DemoCampaignApplication.java
│   │   ├── config/                   # WebConfig (CORS)
│   │   ├── domain/campaign/          # Entity, Repository, Enum
│   │   ├── service/                  # CampaignService
│   │   └── web/                      # Controller, DTO
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/             # Flyway SQL
│
├── frontend/                         # Vue 3 SPA
│   └── src/
│       ├── api/                      # Axios 클라이언트
│       ├── components/
│       │   ├── campaign/             # CampaignHeader (상태별 버튼, 시뮬레이션)
│       │   ├── canvas/               # FlowCanvas
│       │   ├── config-panels/        # 노드별 설정 폼 (12개)
│       │   │   ├── NodeConfigPanel   # 노드 타입별 폼 라우팅
│       │   │   ├── PushConfigForm    # 푸시 (미리보기, 테스트 발송)
│       │   │   ├── SmsConfigForm     # 문자 (SMS/LMS/MMS, 바이트 카운터)
│       │   │   ├── KakaoConfigForm   # 알림톡 (템플릿 선택 모달)
│       │   │   ├── BranchConfigForm  # 분기 (코호트 규칙/이벤트 조건, 세그먼트 가져오기)
│       │   │   ├── CohortRuleBuilder # 사용자 기반 코호트 규칙 빌더
│       │   │   ├── EventBranchBuilder # 이벤트 기반 조건 빌더
│       │   │   ├── RewardConfigForm  # 리워드 (쿠폰/포인트 선택)
│       │   │   ├── WaitConfigForm    # 대기 시간 설정
│       │   │   ├── ChannelConfigForm # 기본 채널 설정
│       │   │   └── TemplatePickerModal # 알림톡 템플릿 선택 모달
│       │   ├── nodes/                # 커스텀 노드 컴포넌트 (6개, 시뮬레이션 뱃지 포함)
│       │   │   ├── EntryConditionNode
│       │   │   ├── ChannelNode       # 인라인 이름 편집, 성공/실패 핸들
│       │   │   ├── BranchNode        # 그룹별 색상 핸들, 동적 핸들 위치
│       │   │   ├── WaitNode
│       │   │   ├── RewardNode        # 인라인 이름 편집
│       │   │   └── ResultNode        # 후속 액션 연결 가능 (source 핸들)
│       │   └── sidebar/              # 노드 팔레트 (settings store 연동)
│       ├── composables/
│       │   ├── useFlowBuilder        # 노드/엣지 CRUD, 반응성 보장
│       │   ├── useAutoLayout         # Dagre 레이아웃 + 브랜치 그룹 순서 정렬
│       │   └── useDragAndDrop        # 드래그 앤 드롭 처리
│       ├── stores/                   # Pinia 상태 관리
│       │   ├── campaignStore         # 캠페인 데이터
│       │   └── settingsStore         # 글로벌 설정 (이벤트, 속성, 채널, 리워드 등)
│       ├── types/
│       │   ├── campaign.ts           # Campaign, CampaignStatus, ApiResponse
│       │   └── flow.ts               # NodeType (15종), 각종 Config 인터페이스
│       ├── utils/
│       │   └── nodeDefaults          # 노드 기본 데이터, 색상
│       └── views/                    # 페이지 컴포넌트 (10개)
│           ├── CampaignOpsView       # 운영 현황 (상태 관리, 폐기)
│           ├── CampaignListView      # 캠페인 관리 (카드 + 시뮬레이션 요약)
│           ├── CampaignBuilderView   # 캠페인 빌더 (시뮬레이션, 엣지 라벨, 유효성)
│           ├── CampaignMonitoringView # 캠페인 모니터링 (반응률, 채널별 현황)
│           ├── CampaignAnalyticsView # 캠페인 성과 분석 (단일/다중 비교)
│           ├── CampaignRecommendView # 캠페인 추천 (AI 기반 제안, 자동 생성)
│           ├── SegmentManageView     # 세그먼트 관리 (CRUD, 빌더 연동)
│           ├── TemplatesView         # 템플릿 관리
│           ├── SettingsView          # 설정 관리 (7탭 CRUD)
│           └── RewardsView           # 리워드 관리
```

## 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 캠페인 운영 현황 | 상태 요약, 시작/일시정지/중지/폐기 관리 |
| `/campaigns` | 캠페인 관리 | 캠페인 카드 목록, 시뮬레이션 요약, 생성 |
| `/campaigns/:id/builder` | 캠페인 빌더 | 플로우 에디터, 시뮬레이션, 노드 설정, 상태별 액션 |
| `/monitoring` | 캠페인 모니터링 | 발송 현황, 반응률, 채널별 통계, 일별 추이 |
| `/analytics` | 캠페인 성과 분석 | 단일/다중 캠페인 매출 지표 분석 |
| `/recommend` | 캠페인 추천 | 과거 이력 기반 캠페인 추천, 자동 생성 |
| `/segments` | 세그먼트 관리 | 사용자/이벤트 기반 세그먼트 CRUD |
| `/templates` | 템플릿 관리 | 채널별 메시지 템플릿 관리 |
| `/settings` | 설정 관리 | 이벤트/속성/푸시앱/변수/채널/리워드 CRUD |

## 실행 방법

### 사전 요구사항
- **Java 17** 이상 (JDK 설치)
- **Node.js 18** 이상

### 1. 저장소 클론
```bash
git clone https://github.com/nazzangu/demo_campaign.git
cd demo_campaign
```

### 2. 백엔드 실행
```bash
cd backend

# macOS / Linux
./gradlew bootRun

# Windows (PowerShell)
.\gradlew.bat bootRun
```
- 서버: `http://localhost:8080`
- H2 콘솔: `http://localhost:8080/h2-console`
- 별도 DB 설치 불필요 (H2 내장 DB 사용)

### 3. 프론트엔드 실행
```bash
cd frontend
npm install
npm run dev
```
- 앱: `http://localhost:5173`
- API 요청은 Vite 프록시를 통해 백엔드(8080)로 전달

### 4. 접속
브라우저에서 `http://localhost:5173` 접속

## API 엔드포인트

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/campaigns` | 캠페인 목록 |
| GET | `/api/campaigns/:id` | 캠페인 상세 |
| POST | `/api/campaigns` | 캠페인 생성 |
| PATCH | `/api/campaigns/:id` | 캠페인 수정 (이름, 설명) |
| DELETE | `/api/campaigns/:id` | 캠페인 폐기 (ARCHIVED 상태 변경) |
| PUT | `/api/campaigns/:id/flow` | 플로우 저장 |
| POST | `/api/campaigns/:id/activate` | 캠페인 시작 |
| POST | `/api/campaigns/:id/pause` | 캠페인 일시정지 |
| POST | `/api/campaigns/:id/stop` | 캠페인 중지 |

## 캠페인 상태 흐름

```
DRAFT (초안)
  ├─ 시작 → ACTIVE (운영)
  └─ 폐기 → ARCHIVED (폐기)

ACTIVE (운영)
  ├─ 일시정지 → PAUSED (일시정지)
  └─ 중지 → COMPLETED (완료)

PAUSED (일시정지)
  ├─ 재시작 → ACTIVE (운영)
  └─ 중지 → COMPLETED (완료)

COMPLETED (완료) → 조회만 가능
ARCHIVED (폐기) → 조회만 가능
```
