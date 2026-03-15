package com.driftpulse.backend.dto;

public record DriftTrendPointResponse(
        String time,
        double drift
) {
}
