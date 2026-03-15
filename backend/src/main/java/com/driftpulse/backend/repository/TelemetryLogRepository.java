package com.driftpulse.backend.repository;

import com.driftpulse.backend.model.TelemetryLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelemetryLogRepository extends JpaRepository<TelemetryLog, Long> {
}
