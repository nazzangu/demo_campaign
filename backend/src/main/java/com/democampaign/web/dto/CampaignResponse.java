package com.democampaign.web.dto;

import com.democampaign.domain.campaign.Campaign;
import com.democampaign.domain.campaign.CampaignStatus;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public record CampaignResponse(
    Long id,
    String campaignKey,
    String name,
    String description,
    CampaignStatus status,
    List<String> tags,
    String flowGraph,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    LocalDateTime activatedAt
) {
    public static CampaignResponse from(Campaign campaign) {
        List<String> tagList = campaign.getTags() != null && !campaign.getTags().isEmpty()
            ? Arrays.asList(campaign.getTags().split(","))
            : List.of();

        return new CampaignResponse(
            campaign.getId(),
            campaign.getCampaignKey(),
            campaign.getName(),
            campaign.getDescription(),
            campaign.getStatus(),
            tagList,
            campaign.getFlowGraph(),
            campaign.getCreatedAt(),
            campaign.getUpdatedAt(),
            campaign.getActivatedAt()
        );
    }
}
