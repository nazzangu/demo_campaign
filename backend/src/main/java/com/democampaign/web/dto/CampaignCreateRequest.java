package com.democampaign.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CampaignCreateRequest(
    @NotBlank String name,
    String description,
    List<String> tags
) {}
