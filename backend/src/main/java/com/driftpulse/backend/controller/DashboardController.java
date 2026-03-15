package com.driftpulse.backend.controller;

import com.driftpulse.backend.dto.DashboardSummaryResponse;
import com.driftpulse.backend.service.AnalysisService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final AnalysisService analysisService;

    public DashboardController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary() {
        return analysisService.getDashboardSummaryFromDb();
    }
}
