package com.democampaign.domain.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface CampaignFlowHistoryRepository extends JpaRepository<CampaignFlowHistory, Long> {
    List<CampaignFlowHistory> findByCampaignIdOrderByVersionDesc(Long campaignId);

    @Query("SELECT COALESCE(MAX(h.version), 0) FROM CampaignFlowHistory h WHERE h.campaignId = :campaignId")
    int findMaxVersionByCampaignId(Long campaignId);

    Optional<CampaignFlowHistory> findByCampaignIdAndVersion(Long campaignId, Integer version);
}
