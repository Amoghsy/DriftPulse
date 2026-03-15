package com.driftpulse.backend.dto;

import java.util.List;

public record ExplainabilityResponse(
        String deviceId,
        double trustScore,
        String severity,
        double confidence,
        List<InsightItem> insights
) {
    public record InsightItem(
            String title,
            String severity,
            int confidence,
            String message,
            String action
    ) {}
}
