import pandas as pd


def _most_frequent_ip(series):
    cleaned = series.dropna().astype(str).str.strip()
    if cleaned.empty:
        return "N/A"
    mode = cleaned.mode()
    if mode.empty:
        return cleaned.iloc[0]
    return mode.iloc[0]

def generate_features(df):

    features = df.groupby("device_id").agg({

        "bytes": "sum",
        "packets": "sum",
        "dst_ip": "nunique",
        "duration": "mean",
        "device_id": "count",
        "src_ip": _most_frequent_ip

    }).rename(columns={
        "bytes": "total_bytes",
        "packets": "total_packets",
        "dst_ip": "unique_dst_ips",
        "duration": "avg_duration",
        "device_id": "log_count",
        "src_ip": "primary_ip"
    }).reset_index()

    features["avg_packet_size"] = features["total_bytes"] / (features["total_packets"] + 1)

    return features