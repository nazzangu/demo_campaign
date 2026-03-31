package com.democampaign.web;

import com.democampaign.service.CampaignService;
import com.democampaign.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService campaignService;

    public CampaignController(CampaignService campaignService) {
        this.campaignService = campaignService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CampaignResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.getAllCampaigns()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CampaignResponse>> create(@Valid @RequestBody CampaignCreateRequest request) {
        CampaignResponse response = campaignService.createCampaign(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.getCampaign(id)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<CampaignResponse>> update(
            @PathVariable Long id,
            @RequestBody CampaignUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.updateCampaign(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        campaignService.deleteCampaign(id);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PutMapping("/{id}/flow")
    public ResponseEntity<ApiResponse<CampaignResponse>> saveFlow(
            @PathVariable Long id,
            @Valid @RequestBody FlowSaveRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.saveFlow(id, request)));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<ApiResponse<CampaignResponse>> activate(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.activate(id)));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<ApiResponse<CampaignResponse>> pause(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.pause(id)));
    }

    @PostMapping("/{id}/stop")
    public ResponseEntity<ApiResponse<CampaignResponse>> stop(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(campaignService.stop(id)));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(e.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadState(IllegalStateException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
    }
}
