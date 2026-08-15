import pandas as pd
import numpy as np
import os
import glob
from datetime import datetime, timedelta

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dataset_dir = os.path.join(base_dir, "dataset")

# Find all dataset*.csv files
dataset_files = glob.glob(os.path.join(dataset_dir, "dataset*.csv"))
if not dataset_files:
    raise FileNotFoundError("No dataset*.csv files found in aiml/dataset/")

print(f"Found {len(dataset_files)} dataset files to process.")

chunks = []
for filepath in sorted(dataset_files):
    print(f"Preprocessing {os.path.basename(filepath)}...")
    try:
        # Sample the first 100,000 rows to keep memory usage safe and process quickly
        df_chunk = pd.read_csv(filepath, nrows=100000)
    except Exception as e:
        print(f"Error reading {filepath}: {e}")
        continue
        
    if df_chunk.empty:
        continue
        
    # Standardize columns to expected raw types
    # Map proto to one-hot columns
    df_chunk["proto_tcp"] = (df_chunk["proto"].astype(str).str.lower() == "tcp").astype(int)
    df_chunk["proto_udp"] = (df_chunk["proto"].astype(str).str.lower() == "udp").astype(int)
    df_chunk["proto_icmp"] = (df_chunk["proto"].astype(str).str.lower() == "icmp").astype(int)
    
    # Cast to numeric, replacing '-' with 0
    for col in ["orig_bytes", "resp_bytes", "orig_pkts", "resp_pkts", "duration"]:
        if col in df_chunk.columns:
            df_chunk[col] = pd.to_numeric(df_chunk[col], errors="coerce").fillna(0)
        else:
            df_chunk[col] = 0.0
            
    # Extract destination IP
    if "id.resp_h" in df_chunk.columns:
        df_chunk["dst_ip_raw"] = df_chunk["id.resp_h"]
    else:
        df_chunk["dst_ip_raw"] = "10.0.0.1"
        
    # Keep only what is needed for simulation step
    df_chunk = df_chunk[["proto_tcp", "proto_udp", "proto_icmp", "orig_bytes", "resp_bytes", "orig_pkts", "resp_pkts", "duration", "dst_ip_raw"]]
    chunks.append(df_chunk)

if not chunks:
    raise ValueError("No data could be loaded from the dataset files.")

df = pd.concat(chunks, ignore_index=True)
print(f"Combined dataset size: {len(df)} rows.")

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

# destination IP mapping
df["dst_ip"] = df["dst_ip_raw"]

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

output_path = os.path.join(dataset_dir, "iot_telemetry.csv")
telemetry.to_csv(output_path, index=False)

print("\nDevice IP Mapping:")
print(telemetry[["device_id", "src_ip"]].drop_duplicates())

print("\nTelemetry dataset created successfully at:", output_path)