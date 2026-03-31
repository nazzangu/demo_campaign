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
