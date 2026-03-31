# Database Schema

## Overview

| 항목 | 내용 |
|------|------|
| DBMS | H2 (개발), PostgreSQL (운영 전환 가능) |
| JDBC URL | `jdbc:h2:file:./data/campaigndb;AUTO_SERVER=TRUE` |
| 스키마 관리 | Flyway (`V1__create_campaign.sql`) |
| JPA DDL 전략 | `validate` (Flyway에서 DDL 관리) |
| H2 콘솔 | `http://localhost:8080/h2-console` |

---

## 테이블 목록

| 테이블명 | 설명 |
|----------|------|
| `campaign` | 캠페인 마스터 (이름, 상태, 플로우 그래프 등) |
| `campaign_flow_history` | 캠페인 플로우 버전 이력 |

---

## 1. campaign

캠페인의 기본 정보와 상태, 플로우 그래프 JSON을 저장합니다.

### 스키마

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | - | 캠페인 고유 ID |
| `campaign_key` | VARCHAR(50) | NOT NULL, UNIQUE | - | 캠페인 키 (외부 식별자) |
| `name` | VARCHAR(255) | NOT NULL | - | 캠페인 이름 |
| `description` | VARCHAR(1000) | - | NULL | 캠페인 설명 |
| `status` | VARCHAR(20) | NOT NULL | `'DRAFT'` | 캠페인 상태 |
| `tags` | VARCHAR(1000) | - | NULL | 태그 (쉼표 구분) |
| `flow_graph` | CLOB | - | NULL | 플로우 그래프 JSON |
| `created_at` | TIMESTAMP | NOT NULL | `CURRENT_TIMESTAMP` | 생성 일시 |
| `updated_at` | TIMESTAMP | NOT NULL | `CURRENT_TIMESTAMP` | 수정 일시 |
| `activated_at` | TIMESTAMP | - | NULL | 캠페인 시작(활성화) 일시 |
| `created_by` | VARCHAR(100) | - | NULL | 생성자 |
| `updated_by` | VARCHAR(100) | - | NULL | 수정자 |

### 인덱스

| 인덱스명 | 컬럼 | 설명 |
|----------|------|------|
| PK (id) | `id` | 기본키 |
| UQ (campaign_key) | `campaign_key` | 캠페인 키 유니크 |
| `idx_campaign_status` | `status` | 상태별 조회 |

### status 값 (Enum: CampaignStatus)

| 값 | 설명 | 전이 가능 상태 |
|----|------|----------------|
| `DRAFT` | 초안 | ACTIVE, ARCHIVED |
| `ACTIVE` | 운영 중 | PAUSED, COMPLETED |
| `PAUSED` | 일시정지 | ACTIVE, COMPLETED |
| `COMPLETED` | 완료 | (조회 전용) |
| `ARCHIVED` | 폐기 | (조회 전용) |

### JPA Entity

```java
@Entity
@Table(name = "campaign")
public class Campaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_key", nullable = false, unique = true)
    private String campaignKey;

    @Column(nullable = false)
    private String name;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CampaignStatus status = CampaignStatus.DRAFT;

    private String tags;

    @Lob
    @Column(name = "flow_graph")
    private String flowGraph;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "updated_by")
    private String updatedBy;
}
```

---

## 2. campaign_flow_history

캠페인 플로우 그래프의 버전별 이력을 저장합니다. 저장할 때마다 version이 증가합니다.

### 스키마

| 컬럼명 | 타입 | 제약조건 | 기본값 | 설명 |
|--------|------|----------|--------|------|
| `id` | BIGINT | PK, AUTO_INCREMENT | - | 이력 고유 ID |
| `campaign_id` | BIGINT | NOT NULL, FK | - | 캠페인 ID (campaign.id) |
| `flow_graph` | CLOB | NOT NULL | - | 플로우 그래프 JSON 스냅샷 |
| `version` | INT | NOT NULL | - | 버전 번호 |
| `saved_at` | TIMESTAMP | NOT NULL | `CURRENT_TIMESTAMP` | 저장 일시 |
| `saved_by` | VARCHAR(100) | - | NULL | 저장자 |

### 인덱스

| 인덱스명 | 컬럼 | 설명 |
|----------|------|------|
| PK (id) | `id` | 기본키 |
| `idx_flow_history_campaign` | `campaign_id, version` | 캠페인별 버전 조회 |

### 외래키

| 제약조건명 | 참조 | 설명 |
|-----------|------|------|
| `fk_flow_history_campaign` | `campaign_id` → `campaign(id)` | 캠페인 참조 |

### JPA Entity

```java
@Entity
@Table(name = "campaign_flow_history")
public class CampaignFlowHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "campaign_id", nullable = false)
    private Long campaignId;

    @Lob
    @Column(name = "flow_graph", nullable = false)
    private String flowGraph;

    @Column(nullable = false)
    private Integer version;

    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt;

    @Column(name = "saved_by")
    private String savedBy;
}
```

---

## DDL (Flyway V1__create_campaign.sql)

```sql
CREATE TABLE campaign (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_key    VARCHAR(50)  NOT NULL UNIQUE,
    name            VARCHAR(255) NOT NULL,
    description     VARCHAR(1000),
    status          VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    tags            VARCHAR(1000),
    flow_graph      CLOB,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    activated_at    TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

CREATE TABLE campaign_flow_history (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    campaign_id     BIGINT       NOT NULL,
    flow_graph      CLOB         NOT NULL,
    version         INT          NOT NULL,
    saved_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    saved_by        VARCHAR(100),
    CONSTRAINT fk_flow_history_campaign FOREIGN KEY (campaign_id) REFERENCES campaign(id)
);

CREATE INDEX idx_campaign_status ON campaign(status);
CREATE INDEX idx_flow_history_campaign ON campaign_flow_history(campaign_id, version);
```

---

## ER Diagram

```
┌─────────────────────────┐       ┌──────────────────────────────┐
│       campaign          │       │   campaign_flow_history       │
├─────────────────────────┤       ├──────────────────────────────┤
│ PK id            BIGINT │──┐    │ PK id              BIGINT    │
│    campaign_key  VCR(50)│  │    │ FK campaign_id     BIGINT    │──┐
│    name          VCR255 │  └───<│    flow_graph      CLOB      │  │
│    description   VCR1K  │       │    version         INT       │  │
│    status        VCR(20)│       │    saved_at        TIMESTAMP │  │
│    tags          VCR1K  │       │    saved_by        VCR(100)  │  │
│    flow_graph    CLOB   │       └──────────────────────────────┘  │
│    created_at    TS     │                                         │
│    updated_at    TS     │          1 : N (campaign → history)     │
│    activated_at  TS     │─────────────────────────────────────────┘
│    created_by    VCR100 │
│    updated_by    VCR100 │
└─────────────────────────┘
```

---

## Repository 주요 메서드

### CampaignRepository

```java
public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    Optional<Campaign> findByCampaignKey(String campaignKey);
    List<Campaign> findByStatusOrderByUpdatedAtDesc(CampaignStatus status);
    List<Campaign> findAllByOrderByUpdatedAtDesc();
}
```

### CampaignFlowHistoryRepository

```java
public interface CampaignFlowHistoryRepository extends JpaRepository<CampaignFlowHistory, Long> {
    List<CampaignFlowHistory> findByCampaignIdOrderByVersionDesc(Long campaignId);

    @Query("SELECT MAX(h.version) FROM CampaignFlowHistory h WHERE h.campaignId = :campaignId")
    Optional<Integer> findMaxVersionByCampaignId(@Param("campaignId") Long campaignId);

    Optional<CampaignFlowHistory> findByCampaignIdAndVersion(Long campaignId, Integer version);
}
```
