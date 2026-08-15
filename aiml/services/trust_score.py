def compute_trust_score(anomaly_score, drift_score, policy_penalty):

    trust_score = 100 \
        - (40 * anomaly_score) \
        - (30 * drift_score) \
        - (30 * policy_penalty)

    if trust_score < 0:
        trust_score = 0

    if trust_score > 100:
        trust_score = 100

    return float(round(trust_score, 2))


def risk_level(score):

    if score < 60:
        return "High"
    elif score < 75:
        return "Medium"
    else:
        return "Low"

def policy_status( risk):

    if risk == "High":
        return "Non-Compliant"

    if risk == "Medium":
        return "Warning"

    return "Compliant"