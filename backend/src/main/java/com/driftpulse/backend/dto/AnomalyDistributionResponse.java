package com.driftpulse.backend.dto;

import java.util.List;
import java.util.Map;

public record AnomalyDistributionResponse(
        List<Map<String, Object>> distribution
) {
}
