package com.driftpulse.backend.dto;

public record DashboardSummaryResponse(
        int totalDevices,
        int highRiskDevices,
        double avgTrustScore,
        int activeAlerts
) {
}
