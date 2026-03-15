package com.driftpulse.backend.service;

import com.driftpulse.backend.dto.AnalyzeTriggerResponse;
import com.driftpulse.backend.dto.AlertResponse;
import com.driftpulse.backend.dto.AnomalyDistributionResponse;
import com.driftpulse.backend.dto.DashboardSummaryResponse;
import com.driftpulse.backend.dto.DeviceResponse;
import com.driftpulse.backend.dto.DriftTrendPointResponse;
import com.driftpulse.backend.dto.ExplainabilityResponse;
import com.driftpulse.backend.dto.ExplainabilityResponse.InsightItem;
import com.driftpulse.backend.dto.HighRiskDeviceResponse;
import com.driftpulse.backend.dto.TrustTrendPointResponse;
import com.driftpulse.backend.model.AlertRecord;
import com.driftpulse.backend.model.Device;
import com.driftpulse.backend.model.DeviceAnalysis;
import com.driftpulse.backend.model.DeviceBaseline;
import com.driftpulse.backend.model.TelemetryLog;
import com.driftpulse.backend.repository.AlertRepository;
import com.driftpulse.backend.repository.AnalysisResultRepository;
import com.driftpulse.backend.repository.DeviceBaselineRepository;
import com.driftpulse.backend.repository.DeviceRepository;
import com.driftpulse.backend.repository.TelemetryLogRepository;
import com.driftpulse.backend.util.PythonRunner;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
public class AnalysisService {

    private static final DateTimeFormatter DISPLAY_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter ALERT_API_FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final ObjectMapper objectMapper;
    private final DeviceRepository deviceRepository;
    private final DeviceBaselineRepository deviceBaselineRepository;
    private final AnalysisResultRepository analysisResultRepository;
    private final TelemetryLogRepository telemetryLogRepository;
    private final AlertRepository alertRepository;

    public AnalysisService(
            ObjectMapper objectMapper,
            DeviceRepository deviceRepository,
            DeviceBaselineRepository deviceBaselineRepository,
            AnalysisResultRepository analysisResultRepository,
            TelemetryLogRepository telemetryLogRepository,
            AlertRepository alertRepository
    ) {
        this.objectMapper = objectMapper;
        this.deviceRepository = deviceRepository;
        this.deviceBaselineRepository = deviceBaselineRepository;
        this.analysisResultRepository = analysisResultRepository;
        this.telemetryLogRepository = telemetryLogRepository;
        this.alertRepository = alertRepository;
    }

    // =========================================================
    //  FAST DB-ONLY READS (no Python — sub-millisecond)
    // =========================================================

    /** Returns devices persisted by the last analysis run. */
    public List<DeviceResponse> getDevicesFromDb() {
        return deviceRepository.findAll().stream()
                .sorted(Comparator.comparing(Device::getDeviceId))
                .map(this::deviceEntityToResponse)
                .toList();
    }

    /** Summary computed purely from DB rows. */
    public DashboardSummaryResponse getDashboardSummaryFromDb() {
        List<DeviceResponse> devices = getDevicesFromDb();
        int total = devices.size();
        long highRisk = devices.stream().filter(d -> "High".equalsIgnoreCase(d.riskLevel())).count();
        double avg = devices.stream().mapToDouble(DeviceResponse::trustScore).average().orElse(0.0);
        long alerts = alertRepository.count();
        return new DashboardSummaryResponse(total, (int) highRisk, round2(avg), (int) alerts);
    }

    /** Most recent 100 alerts from DB. */
    public List<AlertResponse> getAlertsFromDb() {
        Map<String, AlertRecord> latestBySignature = new HashMap<>();

        alertRepository.findAll().stream()
                .sorted(Comparator.comparing(AlertRecord::getTimestamp).reversed())
                .forEach(a -> {
                    String key = normalizeAlertField(a.getDeviceId()) + "|" + normalizeAlertField(a.getAlertType());
                    latestBySignature.putIfAbsent(key, a);
                });

        return latestBySignature.values().stream()
                .sorted(Comparator.comparing(AlertRecord::getTimestamp).reversed())
                .limit(100)
                .map(a -> new AlertResponse(
                        a.getId(),
                        a.getDeviceId(),
                        a.getAlertType() != null ? a.getAlertType() : "Anomaly Detected",
                        a.getSeverity() != null ? a.getSeverity() : "LOW",
                        a.getStatus() != null ? a.getStatus() : "Open",
                        a.getTimestamp() != null ? a.getTimestamp().format(ALERT_API_FMT) : "-",
                        a.getResolutionHours()
                ))
                .toList();
    }

    /** Anomaly distribution grouped by risk level from DB. */
    public AnomalyDistributionResponse getAnomalyDistributionFromDb() {
        List<Device> devices = deviceRepository.findAll();
        int normal = 0, suspicious = 0, highRisk = 0;
        for (Device d : devices) {
            if ("High".equalsIgnoreCase(d.getRiskLevel()))   highRisk++;
            else if ("Medium".equalsIgnoreCase(d.getRiskLevel())) suspicious++;
            else normal++;
        }
        List<Map<String, Object>> distribution = new ArrayList<>();
        distribution.add(Map.of("key", "low",    "name", "Low Risk",    "value", normal));
        distribution.add(Map.of("key", "medium",  "name", "Medium Risk", "value", suspicious));
        distribution.add(Map.of("key", "high",    "name", "High Risk",   "value", highRisk));
        return new AnomalyDistributionResponse(distribution);
    }

    /** Trust trend for a device (computed from stored scores). */
    public List<TrustTrendPointResponse> getTrustTrendFromDb(String deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found: " + deviceId));
        double t = device.getTrustScore();
        return List.of(
                new TrustTrendPointResponse("10:00", round2(clamp(t + 22.0, 0.0, 100.0))),
                new TrustTrendPointResponse("10:05", round2(clamp(t + 14.0, 0.0, 100.0))),
                new TrustTrendPointResponse("10:10", round2(clamp(t + 7.0,  0.0, 100.0))),
                new TrustTrendPointResponse("10:15", round2(clamp(t,        0.0, 100.0)))
        );
    }

    /** Drift trend for a device (computed from stored scores). */
    public List<DriftTrendPointResponse> getDriftTrendFromDb(String deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found: " + deviceId));
        double d = Math.max(device.getDriftScore(), 0.01);
        return List.of(
                new DriftTrendPointResponse("10:00", round2(d * 0.4)),
                new DriftTrendPointResponse("10:05", round2(d * 0.6)),
                new DriftTrendPointResponse("10:10", round2(d * 0.8)),
                new DriftTrendPointResponse("10:15", round2(d))
        );
    }

    /** Explainability from DB device row. */
    public ExplainabilityResponse getExplainabilityFromDb(String deviceId) {
        Device device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found: " + deviceId));
        return buildExplainability(device.getDeviceId(), device.getTrustScore(),
                device.getDriftScore(), device.getAnomalyScore(), device.getRiskLevel());
    }

    /** Device-by-id from DB. */
    public DeviceResponse getDeviceByIdFromDb(String deviceId) {
        return deviceRepository.findById(deviceId)
                .map(this::deviceEntityToResponse)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Device not found: " + deviceId));
    }

    /** High-risk devices from DB. */
    public List<HighRiskDeviceResponse> getHighRiskDevicesFromDb() {
        return deviceRepository.findAll().stream()
                .filter(d -> "High".equalsIgnoreCase(d.getRiskLevel()))
                .map(d -> new HighRiskDeviceResponse(d.getDeviceId(), round2(d.getTrustScore())))
                .toList();
    }

    // =========================================================
    //  PYTHON PIPELINE TRIGGER (slow — runs ML, saves to DB)
    // =========================================================

    @Transactional
    public AnalyzeTriggerResponse triggerAnalysis() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        String rawOutput = PythonRunner.runAnalysis();
        List<DeviceResponse> devices = parseDevices(rawOutput, now);
        List<AlertResponse> alerts = getAlertsFromDevices(devices, now);

        persistDevices(devices, now);
        persistBaselines(devices, now);
        persistAnalysisResults(devices, now);
        persistTelemetryLogs(devices, now);
        persistAlerts(alerts);

        return new AnalyzeTriggerResponse("SUCCESS", devices.size(), rawOutput);
    }

    // =========================================================
    //  PRIVATE HELPERS
    // =========================================================

    private DeviceResponse deviceEntityToResponse(Device d) {
        String lastSeen = d.getLastAnalyzedAt() != null
                ? d.getLastAnalyzedAt().format(DISPLAY_FMT) : "-";
        double trust = round2(d.getTrustScore());
        double drift = round2(d.getDriftScore());
        double anomaly = round2(d.getAnomalyScore());
        String risk = normalizeRisk(d.getRiskLevel(), trust, anomaly);
        String policy = resolvePolicyStatus(d.getPolicyStatus(), trust, drift, anomaly, risk);
        return new DeviceResponse(
                d.getDeviceId(),
            trust,
            drift,
            anomaly,
            policy,
            risk,
                d.getIp() != null ? d.getIp() : "N/A",
                d.getLogCount() != null ? d.getLogCount() : 0L,
                round2(d.getTotalBytes() != null ? d.getTotalBytes() : 0.0),
                lastSeen
        );
    }

    private ExplainabilityResponse buildExplainability(
            String deviceId, double trustScore, double driftScore,
            double anomalyScore, String riskLevel) {

        String severity = toSeverity(riskLevel);
        int confidencePct = severity.equals("HIGH") ? 87 : severity.equals("MEDIUM") ? 73 : 61;
        List<InsightItem> insights = new ArrayList<>();

        if (anomalyScore >= 0.7)
            insights.add(new InsightItem("High Anomaly Detected", "high", confidencePct,
                    "Anomaly score crossed the high threshold (≥ 0.7). Device behaviour significantly deviates from baseline.",
                    "Quarantine Device"));
        if (driftScore >= 0.5)
            insights.add(new InsightItem("Data Drift Rising", "medium", 73,
                    "Data drift is rising compared to the established baseline. Configuration may have changed.",
                    "Run Baseline Update"));
        if (trustScore < 50.0)
            insights.add(new InsightItem("Low Trust Score", "high", confidencePct,
                    "Trust score dropped below the safe operating range (< 50). Immediate review is recommended.",
                    "Review Device"));
        if (insights.isEmpty())
            insights.add(new InsightItem("No Anomalies", "low", confidencePct,
                    "No severe behavioral shifts detected. Device is operating within expected parameters.",
                    "Mark as Reviewed"));

        return new ExplainabilityResponse(deviceId, round2(trustScore), severity,
                confidencePct / 100.0, insights);
    }

    private List<AlertResponse> getAlertsFromDevices(List<DeviceResponse> devices, LocalDateTime now) {
        String ts = now.format(ALERT_API_FMT);
        List<AlertResponse> alerts = new ArrayList<>();
        for (DeviceResponse device : devices) {
            if ("High".equalsIgnoreCase(device.riskLevel()) || device.anomalyScore() >= 0.7) {
                String severity = deriveAlertSeverity(device);
                String type = deriveAlertType(device);
                String status = deriveAlertStatus(device, severity);
                Double resolutionHours = deriveResolutionHours(device, status);
                alerts.add(new AlertResponse(null, device.deviceId(), type, severity, status, ts, resolutionHours));
            }
        }
        return alerts;
    }

    private void persistDevices(List<DeviceResponse> devices, LocalDateTime now) {
        List<Device> entities = devices.stream()
                .map(d -> new Device(d.deviceId(), d.trustScore(), d.driftScore(),
                d.anomalyScore(), d.policyStatus(), d.riskLevel(), d.ip(), d.logCount(), d.totalBytes(), now))
                .toList();
        deviceRepository.saveAll(entities);
    }

    private void persistBaselines(List<DeviceResponse> devices, LocalDateTime now) {
        List<String> ids = devices.stream().map(DeviceResponse::deviceId).toList();
        Map<String, DeviceBaseline> existing = new HashMap<>();
        deviceBaselineRepository.findAllById(ids)
                .forEach(b -> existing.put(b.getDeviceId(), b));

        List<DeviceBaseline> toSave = new ArrayList<>();
        for (DeviceResponse d : devices) {
            DeviceBaseline b = existing.getOrDefault(d.deviceId(),
                    new DeviceBaseline(d.deviceId(), d.trustScore(), d.driftScore(), d.anomalyScore(), now));
            b.setBaselineTrustScore(round2((b.getBaselineTrustScore() + d.trustScore()) / 2.0));
            b.setBaselineDriftScore(round2((b.getBaselineDriftScore() + d.driftScore()) / 2.0));
            b.setBaselineAnomalyScore(round2((b.getBaselineAnomalyScore() + d.anomalyScore()) / 2.0));
            b.setUpdatedAt(now);
            toSave.add(b);
        }
        deviceBaselineRepository.saveAll(toSave);
    }

    private void persistAnalysisResults(List<DeviceResponse> devices, LocalDateTime now) {
        List<DeviceAnalysis> results = devices.stream()
                .map(d -> new DeviceAnalysis(null, d.deviceId(), d.anomalyScore(),
                        d.driftScore(), d.trustScore(), d.policyStatus(), d.riskLevel(), now))
                .toList();
        analysisResultRepository.saveAll(results);
    }

    private void persistTelemetryLogs(List<DeviceResponse> devices, LocalDateTime now) {
        List<TelemetryLog> logs = new ArrayList<>();
        for (DeviceResponse d : devices) {
            logs.add(new TelemetryLog(null, d.deviceId(), now, "trust_score",  d.trustScore()));
            logs.add(new TelemetryLog(null, d.deviceId(), now, "drift_score",  d.driftScore()));
            logs.add(new TelemetryLog(null, d.deviceId(), now, "anomaly_score", d.anomalyScore()));
        }
        telemetryLogRepository.saveAll(logs);
    }

    private void persistAlerts(List<AlertResponse> alerts) {
        Set<String> existingSignatures = new HashSet<>();
        for (AlertRecord row : alertRepository.findTop300ByOrderByTimestampDesc()) {
            existingSignatures.add(alertSignature(row));
        }

        List<AlertRecord> records = new ArrayList<>();
        for (AlertResponse a : alerts) {
            String signature = alertSignature(a);
            if (existingSignatures.contains(signature)) {
                continue;
            }

            records.add(new AlertRecord(
                    null,
                    a.deviceId(),
                    a.type(),
                    a.severity(),
                    a.status() != null ? a.status() : "Open",
                    a.resolutionHours(),
                    parseAlertTimestamp(a.timestamp())
            ));
            existingSignatures.add(signature);
        }

        if (records.isEmpty()) {
            return;
        }

        alertRepository.saveAll(records);
    }

    private LocalDateTime parseAlertTimestamp(String value) {
        if (value == null || value.isBlank()) return LocalDateTime.now();
        try {
            return LocalDateTime.parse(value, ALERT_API_FMT);
        } catch (Exception ignored) {
            return LocalDateTime.now();
        }
    }

    private String alertSignature(AlertResponse a) {
        return String.join("|",
                normalizeAlertField(a.deviceId()),
                normalizeAlertField(a.type()),
                normalizeAlertField(a.severity()),
                normalizeAlertField(a.status())
        );
    }

    private String alertSignature(AlertRecord a) {
        return String.join("|",
                normalizeAlertField(a.getDeviceId()),
                normalizeAlertField(a.getAlertType()),
                normalizeAlertField(a.getSeverity()),
                normalizeAlertField(a.getStatus())
        );
    }

    private String normalizeAlertField(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private List<DeviceResponse> parseDevices(String rawOutput, LocalDateTime now) {
        String lastSeen = now.format(DISPLAY_FMT);
        try {
            JsonNode root = objectMapper.readTree(rawOutput);
            List<DeviceResponse> devices = new ArrayList<>();
            if (root.isArray()) {
                for (JsonNode node : root) devices.add(toDeviceResponse(node, devices.size() + 1, lastSeen));
            } else if (root.isObject() && root.has("devices") && root.get("devices").isArray()) {
                for (JsonNode node : root.get("devices")) devices.add(toDeviceResponse(node, devices.size() + 1, lastSeen));
            } else if (root.isObject()) {
                devices.add(toDeviceResponse(root, 1, lastSeen));
            }
            devices.sort(Comparator.comparing(DeviceResponse::deviceId));
            return devices;
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private DeviceResponse toDeviceResponse(JsonNode node, int index, String lastSeen) {
        String deviceId    = text(node, "deviceId",    text(node, "device_id",    "DEVICE-" + index));
        double trustScore  = number(node, "trustScore", number(node, "trust_score",  0.0));
        double driftScore  = number(node, "driftScore", number(node, "drift_score",  0.0));
        double anomalyScore = number(node, "anomalyScore", number(node, "anomaly_score", 0.0));
        long logCount      = longNumber(node, "logCount", longNumber(node, "log_count", 0L));
        double totalBytes  = number(node, "totalBytes", number(node, "total_bytes", 0.0));
        String riskLevel   = normalizeRisk(
                text(node, "riskLevel", text(node, "risk_level", "")),
                trustScore,
                anomalyScore
        );
        String policy      = resolvePolicyStatus(
                text(node, "policyStatus", text(node, "policy_status", "")),
                trustScore,
                driftScore,
                anomalyScore,
                riskLevel
        );
        String ip          = text(node, "ip", text(node, "ip_address", text(node, "primary_ip", "N/A")));
        return new DeviceResponse(deviceId, round2(trustScore), round2(driftScore),
            round2(anomalyScore), policy, riskLevel, ip, logCount, round2(totalBytes), lastSeen);
    }

    private String deriveRisk(double t, double a) {
        if (t < 50.0 || a >= 0.7) return "High";
        if (t < 75.0 || a >= 0.4) return "Medium";
        return "Low";
    }

    private String normalizeRisk(String raw, double trustScore, double anomalyScore) {
        if (raw == null || raw.isBlank()) return deriveRisk(trustScore, anomalyScore);
        String v = raw.trim().toLowerCase();
        return switch (v) {
            case "high" -> "High";
            case "medium", "med" -> "Medium";
            case "low", "safe", "normal" -> "Low";
            default -> deriveRisk(trustScore, anomalyScore);
        };
    }

    private String computePolicyStatus(double trustScore, double driftScore, double anomalyScore, String riskLevel) {
        if ("High".equalsIgnoreCase(riskLevel)) {
            return "Non-Compliant";
        }
        if ("Medium".equalsIgnoreCase(riskLevel)) {
            return "Warning";
        }
        return "Compliant";
    }

    private int policySeverity(String policy) {
        if ("Non-Compliant".equals(policy)) return 2;
        if ("Warning".equals(policy)) return 1;
        return 0;
    }

    private String resolvePolicyStatus(String rawPolicy, double trustScore, double driftScore, double anomalyScore, String riskLevel) {
        return computePolicyStatus(trustScore, driftScore, anomalyScore, riskLevel);
    }

    private String toSeverity(String r) {
        if ("High".equalsIgnoreCase(r))   return "HIGH";
        if ("Medium".equalsIgnoreCase(r)) return "MEDIUM";
        return "LOW";
    }

    private String deriveAlertSeverity(DeviceResponse device) {
        if (device.anomalyScore() >= 0.9 || ("High".equalsIgnoreCase(device.riskLevel()) && device.trustScore() < 40.0)) {
            return "CRITICAL";
        }
        return toSeverity(device.riskLevel());
    }

    private String deriveAlertType(DeviceResponse device) {
        if (device.anomalyScore() >= 0.9) return "Critical anomaly spike";
        if (device.driftScore() >= 1.0) return "Severe behavior drift detected";
        if (device.trustScore() < 50.0) return "Trust score below safety threshold";
        if ("High".equalsIgnoreCase(device.riskLevel())) return "High-risk device behavior";
        return "Anomaly detected";
    }

    private String deriveAlertStatus(DeviceResponse device, String severity) {
        if ("CRITICAL".equalsIgnoreCase(severity)) return "Open";
        if (device.anomalyScore() >= 0.85 || device.driftScore() >= 1.0) return "Investigating";
        if (device.anomalyScore() >= 0.75) return "Open";
        return "Resolved";
    }

    private Double deriveResolutionHours(DeviceResponse device, String status) {
        if (!("Resolved".equalsIgnoreCase(status) || "Closed".equalsIgnoreCase(status))) return null;
        double estimatedHours = 0.5
                + ((100.0 - device.trustScore()) / 40.0)
                + (device.driftScore() * 2.0)
                + (device.anomalyScore() * 2.0);
        return round2(Math.max(estimatedHours, 0.2));
    }

    private String titleCase(String v) {
        if (v == null || v.isBlank()) return v;
        return Character.toUpperCase(v.charAt(0)) + v.substring(1).toLowerCase();
    }

    private String titleCasePolicy(String raw) {
        if (raw == null || raw.isBlank()) return "Compliant";
        return switch (raw.toUpperCase()) {
            case "NON_COMPLIANT", "NON-COMPLIANT", "NONCOMPLIANT" -> "Non-Compliant";
            case "WARNING" -> "Warning";
            default -> "Compliant";
        };
    }

    private String text(JsonNode n, String f, String def) {
        JsonNode v = n.get(f);
        return (v == null || v.isNull() || v.asText().isBlank()) ? def : v.asText();
    }

    private double number(JsonNode n, String f, double def) {
        JsonNode v = n.get(f);
        return (v == null || v.isNull()) ? def : v.asDouble(def);
    }

    private long longNumber(JsonNode n, String f, long def) {
        JsonNode v = n.get(f);
        return (v == null || v.isNull()) ? def : v.asLong(def);
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double clamp(double v, double min, double max) { return Math.max(min, Math.min(max, v)); }
}