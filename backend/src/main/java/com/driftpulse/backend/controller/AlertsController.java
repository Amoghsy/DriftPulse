package com.driftpulse.backend.controller;

import com.driftpulse.backend.dto.AlertResponse;
import com.driftpulse.backend.service.AnalysisService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertsController {

    private final AnalysisService analysisService;

    public AlertsController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping
    public List<AlertResponse> getAlerts() {
        return analysisService.getAlertsFromDb();
    }
}
