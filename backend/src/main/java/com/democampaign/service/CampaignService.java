package com.democampaign.service;

import com.democampaign.domain.campaign.*;
import com.democampaign.web.dto.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final CampaignFlowHistoryRepository flowHistoryRepository;

    public CampaignService(CampaignRepository campaignRepository,
                           CampaignFlowHistoryRepository flowHistoryRepository) {
        this.campaignRepository = campaignRepository;
        this.flowHistoryRepository = flowHistoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CampaignResponse> getAllCampaigns() {
        return campaignRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(CampaignResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CampaignResponse getCampaign(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));
        return CampaignResponse.from(campaign);
    }

    public CampaignResponse createCampaign(CampaignCreateRequest request) {
        Campaign campaign = new Campaign();
        campaign.setCampaignKey(generateKey());
        campaign.setName(request.name());
        campaign.setDescription(request.description());
        campaign.setStatus(CampaignStatus.DRAFT);
        if (request.tags() != null) {
            campaign.setTags(String.join(",", request.tags()));
        }

        // Initialize with default flow graph (entry condition node)
        campaign.setFlowGraph(defaultFlowGraph());

        Campaign saved = campaignRepository.save(campaign);
        return CampaignResponse.from(saved);
    }

    public CampaignResponse updateCampaign(Long id, CampaignUpdateRequest request) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));

        if (request.name() != null) campaign.setName(request.name());
        if (request.description() != null) campaign.setDescription(request.description());
        if (request.tags() != null) campaign.setTags(String.join(",", request.tags()));

        Campaign saved = campaignRepository.save(campaign);
        return CampaignResponse.from(saved);
    }

    public void deleteCampaign(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));
        campaign.setStatus(CampaignStatus.ARCHIVED);
        campaignRepository.save(campaign);
    }

    public CampaignResponse saveFlow(Long id, FlowSaveRequest request) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));

        campaign.setFlowGraph(request.flowGraph());
        Campaign saved = campaignRepository.save(campaign);

        // Save flow history
        int nextVersion = flowHistoryRepository.findMaxVersionByCampaignId(id) + 1;
        CampaignFlowHistory history = new CampaignFlowHistory();
        history.setCampaignId(id);
        history.setFlowGraph(request.flowGraph());
        history.setVersion(nextVersion);
        flowHistoryRepository.save(history);

        return CampaignResponse.from(saved);
    }

    public CampaignResponse activate(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));

        if (campaign.getStatus() != CampaignStatus.DRAFT && campaign.getStatus() != CampaignStatus.PAUSED) {
            throw new IllegalStateException("Campaign can only be activated from DRAFT or PAUSED status");
        }

        campaign.setStatus(CampaignStatus.ACTIVE);
        if (campaign.getActivatedAt() == null) {
            campaign.setActivatedAt(LocalDateTime.now());
        }
        Campaign saved = campaignRepository.save(campaign);
        return CampaignResponse.from(saved);
    }

    public CampaignResponse pause(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));

        if (campaign.getStatus() != CampaignStatus.ACTIVE) {
            throw new IllegalStateException("Campaign can only be paused from ACTIVE status");
        }

        campaign.setStatus(CampaignStatus.PAUSED);
        Campaign saved = campaignRepository.save(campaign);
        return CampaignResponse.from(saved);
    }

    public CampaignResponse stop(Long id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Campaign not found: " + id));

        if (campaign.getStatus() != CampaignStatus.ACTIVE && campaign.getStatus() != CampaignStatus.PAUSED) {
            throw new IllegalStateException("Campaign can only be stopped from ACTIVE or PAUSED status");
        }

        campaign.setStatus(CampaignStatus.COMPLETED);
        Campaign saved = campaignRepository.save(campaign);
        return CampaignResponse.from(saved);
    }

    private String generateKey() {
        return "CMP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String defaultFlowGraph() {
        return """
        {
            "nodes": [
                {
                    "id": "entry-1",
                    "type": "ENTRY_CONDITION",
                    "position": { "x": 400, "y": 50 },
                    "data": {
                        "label": "진입 조건",
                        "config": {
                            "audienceType": "ALL_USERS",
                            "events": [],
                            "period": { "start": null, "end": null },
                            "endCondition": "NONE"
                        }
                    }
                }
            ],
            "edges": []
        }
        """;
    }
}
