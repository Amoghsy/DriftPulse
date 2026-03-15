package com.driftpulse.backend.controller;

import com.driftpulse.backend.dto.AnalyzeTriggerResponse;
import com.driftpulse.backend.service.AnalysisService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class AnalyzeController {

    private final AnalysisService analysisService;

    public AnalyzeController(AnalysisService analysisService) {
        this.analysisService = analysisService;
    }

    /**
     * Runs the Python ML pipeline, persists results to the database,
     * and returns a summary. This is the ONLY endpoint that executes Python.
     */
    @PostMapping("/analyze")
    public AnalyzeTriggerResponse runAnalysis() throws Exception {
        return analysisService.triggerAnalysis();
    }
}
