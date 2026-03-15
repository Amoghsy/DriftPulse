package com.driftpulse.backend.repository;

import com.driftpulse.backend.model.Device;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, String> {
}