package com.driftpulse.backend.dto;

public record DeviceResponse(
        String deviceId,
        double trustScore,
        double driftScore,
        double anomalyScore,
        String policyStatus,
        String riskLevel,
        String ip,
        long logCount,
        double totalBytes,
        String lastSeen
) {
}
