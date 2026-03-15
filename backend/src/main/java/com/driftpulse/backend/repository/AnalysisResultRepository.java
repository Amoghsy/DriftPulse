package com.driftpulse.backend.repository;

import com.driftpulse.backend.model.DeviceAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnalysisResultRepository extends JpaRepository<DeviceAnalysis, Long> {
}
