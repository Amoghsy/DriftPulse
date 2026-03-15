def calculate_drift(current_value, baseline_value):

    if baseline_value == 0:
        return 0

    drift = abs(current_value - baseline_value) / baseline_value

    # normalize drift
    if drift > 1:
        drift = 1

    return round(drift,3)