package com.driftpulse.backend.dto;

public record HighRiskDeviceResponse(
        String deviceId,
        double trustScore
) {
}
