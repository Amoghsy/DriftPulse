package com.driftpulse.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "devices")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Device {

    @Id
    private String deviceId;

    private double trustScore;

    private double driftScore;

    private double anomalyScore;

    private String policyStatus;

    private String riskLevel;

    private String ip;

    private Long logCount;

    private Double totalBytes;

    private LocalDateTime lastAnalyzedAt;
}
