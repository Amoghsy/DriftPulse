package com.driftpulse.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "device_baseline")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceBaseline {

    @Id
    private String deviceId;

    private double baselineTrustScore;

    private double baselineDriftScore;

    private double baselineAnomalyScore;

    private LocalDateTime updatedAt;
}
