# Demo Campaign Builder

CRM 캠페인 플로우를 시각적으로 설계하고 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

### 캠페인 빌더
- 드래그 앤 드롭 기반 플로우 에디터 (Vue Flow)
- 노드 간 연결, 삭제, 자동 정렬
- 저장 시 유효성 검증 (미연결/미설정 노드 감지)

### 지원 노드
| 구분 | 노드 | 설명 |
|------|------|------|
| 진입 | 진입 조건 | 캠페인 대상자 및 기간 설정 |
| 채널 | 푸시 메시지 | 앱 선택, 메시지 작성, 휴대폰 미리보기, 테스트 발송 |
| 채널 | 알림톡 메시지 | 카카오톡 채널, 템플릿 선택 모달, 미리보기 |
| 채널 | 문자메시지 | SMS/LMS/MMS 유형, 바이트 카운터, 발송 제한, 수신 동의 |
| 채널 | 브랜드 메시지, 웹훅 | 기본 메시지 설정 |
| 분기 | 사용자 기반 분기 | 코호트 규칙 빌더 (이벤트/기간/집계/속성 필터) |
| 분기 | 이벤트 기반 분기 | 이벤트 조건 + 대기 시간 설정 |
| 기타 | 대기 시간 | 분/시간/일 단위 대기 |
| 결과 | 발송 성공/실패 | 채널 노드에 자동 연결 |

### 설정 관리
- 이벤트, 속성, 푸시 앱, 개인화 변수, 채널, 메시지 템플릿 CRUD
- 변경사항 저장/취소/초기화
- 캠페인 빌더에 실시간 반영

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
├── backend/                      # Spring Boot API 서버
│   ├── src/main/java/com/democampaign/
│   │   ├── DemoCampaignApplication.java
│   │   ├── config/               # WebConfig (CORS)
│   │   ├── domain/campaign/      # Entity, Repository, Enum
│   │   ├── service/              # CampaignService
│   │   └── web/                  # Controller, DTO
│   └── src/main/resources/
│       ├── application.yml
│       └── db/migration/         # Flyway SQL
│
├── frontend/                     # Vue 3 SPA
│   └── src/
│       ├── api/                  # Axios 클라이언트
│       ├── components/
│       │   ├── campaign/         # 헤더
│       │   ├── canvas/           # FlowCanvas
│       │   ├── config-panels/    # 노드별 설정 폼
│       │   ├── nodes/            # 커스텀 노드 컴포넌트
│       │   └── sidebar/          # 노드 팔레트
│       ├── composables/          # useFlowBuilder, useAutoLayout, useDragAndDrop
│       ├── stores/               # Pinia (campaign, settings)
│       ├── types/                # TypeScript 타입
│       ├── utils/                # 노드 기본값
│       └── views/                # 페이지 (목록, 빌더, 설정)
```

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
./gradlew bootRun
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
| PATCH | `/api/campaigns/:id` | 캠페인 수정 |
| DELETE | `/api/campaigns/:id` | 캠페인 삭제 |
| PUT | `/api/campaigns/:id/flow` | 플로우 저장 |
| POST | `/api/campaigns/:id/activate` | 캠페인 시작 |
| POST | `/api/campaigns/:id/pause` | 캠페인 일시정지 |
| POST | `/api/campaigns/:id/stop` | 캠페인 중지 |
