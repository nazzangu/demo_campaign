package com.democampaign.domain.campaign;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CampaignRepository extends JpaRepository<Campaign, Long> {
    Optional<Campaign> findByCampaignKey(String campaignKey);
    List<Campaign> findByStatusOrderByUpdatedAtDesc(CampaignStatus status);
    List<Campaign> findAllByOrderByUpdatedAtDesc();
}
