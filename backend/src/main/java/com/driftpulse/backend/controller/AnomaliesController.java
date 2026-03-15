package com.driftpulse.backend.controller;

import com.driftpulse.backend.dto.AnomalyDistributionResponse;
import com.driftpulse.backend.service.AnalysisService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/anomalies")
public class AnomaliesController {

    private final AnalysisService analysisService;

    public AnomaliesController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping("/distribution")
    public AnomalyDistributionResponse getDistribution() {
        return analysisService.getAnomalyDistributionFromDb();
    }
}
