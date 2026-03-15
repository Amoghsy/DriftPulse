package com.driftpulse.backend.dto;

public record AnalyzeTriggerResponse(
        String status,
        int devicesProcessed,
        String rawOutput
) {
}
