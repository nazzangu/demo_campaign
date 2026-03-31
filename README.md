# Demo Campaign Builder

CRM 캠페인 플로우를 시각적으로 설계하고 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

### 캠페인 관리
- 캠페인 생성, 제목/설명 인라인 편집
- 캠페인 상태 관리: 초안 → 운영 → 일시정지 → 완료/폐기
- 캠페인 목록에서 운영 현황, 설정 관리 페이지 이동

### 캠페인 빌더
- 드래그 앤 드롭 기반 플로우 에디터 (Vue Flow)
- 노드 간 연결/삭제 (Delete 키), 자동 정렬 (Dagre 레이아웃)
- 상태별 헤더 버튼 변경 (초안: 저장/시작, 운영: 수정/일시정지/종료, 폐기: 조회 전용)
- 저장 시 유효성 검증 (미연결/미설정 노드, 시작일 필수, 세그먼트 시 분기 노드 필수)
- 운영 중 수정 시 변경 내역 확인 모달

### 지원 노드
| 구분 | 노드 | 설명 |
|------|------|------|
| 진입 | 진입 조건 | 대상 사용자(모든 사용자/세그먼트), 시작일, 종료 조건 설정. 설정값 노드에 실시간 반영 |
| 채널 | 푸시 메시지 | 앱 선택, 일반/리치 푸시, 메시지 작성 + 휴대폰 미리보기, 개인화 변수, 발송 방식/조건/주기, 전환 이벤트, 테스트 발송 |
| 채널 | 알림톡 메시지 | 카카오톡 채널, 템플릿 선택 모달(검색/상세/미리보기), 발송 제한, 수신 동의 |
| 채널 | 문자메시지 | SMS/LMS/MMS 유형, 바이트 카운터, 개인화 변수, 미리보기, 발송 제한, 수신 동의, 테스트 발송 |
| 채널 | 브랜드 메시지, 웹훅 | 기본 메시지 설정 |
| 분기 | 사용자 기반 분기 | 코호트 규칙 빌더 (이벤트/기간/집계/속성 필터, AND/OR 조합) |
| 분기 | 이벤트 기반 분기 | 이벤트 조건 + 속성 필터 + 대기 시간 설정 |
| 리워드 | 쿠폰/포인트 | 리워드 선택, 메모 작성, 설정 완료 상태 관리 |
| 기타 | 대기 시간 | 분/시간/일 단위 대기 |
| 결과 | 발송 성공/실패 | 채널 노드에 자동 연결, 꺾은선 대칭 배치 |

### 캠페인 운영 현황
- 상태별 요약 카드 (전체/운영/일시정지/초안/완료/폐기)
- 상태 필터 + 캠페인명 검색
- 상태별 액션 버튼 (시작/일시정지/중지/폐기/조회)
- 확인 모달 + 토스트 알림

### 캠페인 모니터링
- 실시간 캠페인 발송 현황 모니터링

### 캠페인 성과 분석
- **단일 캠페인 분석**
  - KPI 카드 5종: 총 매출, 주문 건수, 객단가(AOV), 전환율(CVR), ROAS (이전 기간 대비 증감)
  - 전환 퍼널: 발송 → 수신 → 오픈 → 클릭 → 전환 (단계별 이탈율 시각화)
  - 일별 매출 추이 바 차트 (HSL 그라데이션)
  - 채널별 매출 성과: 도넛 차트 + 발송/클릭/전환/매출/CVR/CPA 테이블
  - 발송 회원별 상세 현황: 상태 분포 바, 요약 카드, 회원 검색/필터/페이지네이션

- **다중 캠페인 비교** (최대 5개)
  - 성과 비교 테이블: 총 매출, 주문수, 객단가, CVR, ROAS
  - 매출 / CVR / ROAS 비교 바 차트 (그라데이션)
  - 캠페인별 회원 상태 분포: 스택 바 차트 + 수치 비교 테이블
  - 중복 수신 회원 분석: 고유/중복 회원 수, 중복 vs 단일 전환율 비교, 캠페인 간 중복 매트릭스
  - 회원 통합 상세 테이블: 전체 캠페인 회원 교차 조회, 캠페인/상태/채널 필터, 중복 수신 필터

### 템플릿 관리
- 메시지 템플릿 목록 및 관리

### 설정 관리
- 7개 탭: 이벤트, 속성, 푸시 앱, 개인화 변수, 채널, 메시지 템플릿, 리워드
- 항목별 CRUD (추가/수정/삭제)
- 채널 활성/비활성 토글, 색상 변경 (캠페인 빌더 사이드바에 실시간 반영)
- 리워드 유형(쿠폰/포인트) 관리
- 변경사항 저장/취소/초기화 (하단 고정 저장 바 + 토스트)
- localStorage 기반 영구 저장

## 기술 스펙

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| Vue 3 | 3.4 | UI 프레임워크 |
| TypeScript | 5.4 | 타입 안전성 |
| Vite | 5.3 | 빌드 도구 |
| Vue Router | 4.3 | 클라이언트 라우팅 |
| Pinia | 2.1 | 상태 관리 |
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
│       │   ├── campaign/             # CampaignHeader (상태별 버튼, 인라인 편집)
│       │   ├── canvas/               # FlowCanvas
│       │   ├── config-panels/        # 노드별 설정 폼
│       │   │   ├── PushConfigForm    # 푸시 (미리보기, 테스트 발송)
│       │   │   ├── SmsConfigForm     # 문자 (SMS/LMS/MMS, 바이트 카운터)
│       │   │   ├── KakaoConfigForm   # 알림톡 (템플릿 선택 모달)
│       │   │   ├── BranchConfigForm  # 분기 (코호트 규칙/이벤트 조건)
│       │   │   ├── RewardConfigForm  # 리워드 (쿠폰/포인트 선택)
│       │   │   └── ...
│       │   ├── nodes/                # 커스텀 노드 컴포넌트
│       │   └── sidebar/              # 노드 팔레트 (store 연동)
│       ├── composables/              # useFlowBuilder, useAutoLayout, useDragAndDrop
│       ├── stores/                   # Pinia (campaign, settings)
│       ├── types/                    # TypeScript 타입
│       ├── utils/                    # 노드 기본값
│       └── views/
│           ├── CampaignListView      # 캠페인 목록
│           ├── CampaignBuilderView   # 캠페인 빌더 (유효성 검증, 변경 추적)
│           ├── CampaignOpsView       # 운영 현황 (상태 관리, 폐기)
│           ├── CampaignMonitoringView # 캠페인 모니터링
│           ├── CampaignAnalyticsView # 캠페인 성과 분석 (단일/다중 비교)
│           ├── TemplatesView         # 템플릿 관리
│           └── SettingsView          # 설정 관리 (7탭 CRUD)
```

## 페이지 구성

| 경로 | 페이지 | 설명 |
|------|--------|------|
| `/` | 캠페인 운영 현황 | 상태 요약, 시작/일시정지/중지/폐기 관리 |
| `/campaigns` | 캠페인 목록 | 캠페인 카드 목록, 생성 |
| `/campaigns/:id/builder` | 캠페인 빌더 | 플로우 에디터, 노드 설정, 상태별 액션 |
| `/monitoring` | 캠페인 모니터링 | 실시간 발송 현황 모니터링 |
| `/analytics` | 캠페인 성과 분석 | 단일/다중 캠페인 매출 지표, 회원별 상세 분석 |
| `/templates` | 템플릿 관리 | 메시지 템플릿 목록 및 관리 |
| `/settings` | 설정 관리 | 이벤트/속성/푸시앱/변수/채널/템플릿/리워드 CRUD |

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
