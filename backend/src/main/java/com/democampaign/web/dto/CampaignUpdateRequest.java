package com.democampaign.web.dto;

import java.util.List;

public record CampaignUpdateRequest(
    String name,
    String description,
    List<String> tags
) {}
