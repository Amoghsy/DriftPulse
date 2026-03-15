package com.driftpulse.backend.dto;

public record AlertResponse(
        Long id,
        String deviceId,
        String type,
        String severity,
        String status,
        String timestamp,
        Double resolutionHours
) {
}
