package com.democampaign.web.dto;

import jakarta.validation.constraints.NotBlank;

public record FlowSaveRequest(
    @NotBlank String flowGraph
) {}
