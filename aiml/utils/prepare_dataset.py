import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# load IoT23 processed dataset
df = pd.read_csv("dataset/iot23_preprocessed.csv")

# create timestamp column
start_time = datetime.now()
df["timestamp"] = [start_time + timedelta(seconds=i) for i in range(len(df))]

# simulated IoT devices
devices = [
    "CAMERA-01",
    "CAMERA-02",
    "SENSOR-01",
    "SENSOR-02",
    "GATEWAY-01",
    "ROUTER-01",
    "LOCK-01",
    "LIGHT-01"
]

df["device_id"] = np.random.choice(devices, len(df))

# device → IP mapping
device_ip_map = {
    "CAMERA-01": "10.0.0.10",
    "CAMERA-02": "10.0.0.11",
    "SENSOR-01": "10.0.0.20",
    "SENSOR-02": "10.0.0.21",
    "GATEWAY-01": "10.0.0.1",
    "ROUTER-01": "10.0.0.2",
    "LOCK-01": "10.0.0.30",
    "LIGHT-01": "10.0.0.40"
}

df["src_ip"] = df["device_id"].map(device_ip_map)

# destination IPs
external_ips = [
    "8.8.8.8",
    "1.1.1.1",
    "185.22.1.5",
    "10.0.0.1"
]

df["dst_ip"] = np.random.choice(external_ips, len(df))

# protocol mapping
def get_protocol(row):

    if row["proto_tcp"] == 1:
        return "TCP"
    elif row["proto_udp"] == 1:
        return "UDP"
    elif row["proto_icmp"] == 1:
        return "ICMP"
    else:
        return "UNKNOWN"

df["protocol"] = df.apply(get_protocol, axis=1)

# compute bytes
df["bytes"] = df["orig_bytes"] + df["resp_bytes"]

# compute packets
df["packets"] = df["orig_pkts"] + df["resp_pkts"]

telemetry = df[
    [
        "timestamp",
        "device_id",
        "src_ip",
        "dst_ip",
        "protocol",
        "bytes",
        "packets",
        "duration"
    ]
]

telemetry.to_csv("dataset/iot_telemetry.csv", index=False)

print("\nDevice IP Mapping:")
print(telemetry[["device_id", "src_ip"]].drop_duplicates())

print("\nTelemetry dataset created successfully!")