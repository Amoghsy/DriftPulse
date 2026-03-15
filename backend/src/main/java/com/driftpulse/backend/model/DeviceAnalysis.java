package com.driftpulse.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "analysis_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeviceAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceId;

    private double anomalyScore;

    private double driftScore;

    private double trustScore;

    private String policyStatus;

    private String riskLevel;

    private LocalDateTime analyzedAt;
}