package com.driftpulse.backend.repository;

import com.driftpulse.backend.model.DeviceBaseline;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceBaselineRepository extends JpaRepository<DeviceBaseline, String> {
}
