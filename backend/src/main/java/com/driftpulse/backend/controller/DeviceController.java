package com.driftpulse.backend.controller;

import com.driftpulse.backend.dto.DeviceResponse;
import com.driftpulse.backend.dto.DriftTrendPointResponse;
import com.driftpulse.backend.dto.ExplainabilityResponse;
import com.driftpulse.backend.dto.HighRiskDeviceResponse;
import com.driftpulse.backend.dto.TrustTrendPointResponse;
import com.driftpulse.backend.service.AnalysisService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final AnalysisService analysisService;

    public DeviceController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping
    public List<DeviceResponse> getDevices() {
        return analysisService.getDevicesFromDb();
    }

    @GetMapping("/{deviceId}")
    public DeviceResponse getDeviceById(@PathVariable String deviceId) {
        return analysisService.getDeviceByIdFromDb(deviceId);
    }

    @GetMapping("/{deviceId}/trust-trend")
    public List<TrustTrendPointResponse> getTrustTrend(@PathVariable String deviceId) {
        return analysisService.getTrustTrendFromDb(deviceId);
    }

    @GetMapping("/{deviceId}/drift")
    public List<DriftTrendPointResponse> getDriftTrend(@PathVariable String deviceId) {
        return analysisService.getDriftTrendFromDb(deviceId);
    }

    @GetMapping("/{deviceId}/explainability")
    public ExplainabilityResponse getExplainability(@PathVariable String deviceId) {
        return analysisService.getExplainabilityFromDb(deviceId);
    }

    @GetMapping("/high-risk")
    public List<HighRiskDeviceResponse> getHighRiskDevices() {
        return analysisService.getHighRiskDevicesFromDb();
    }
}