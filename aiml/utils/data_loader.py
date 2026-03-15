import pandas as pd
import os

def load_dataset():

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    dataset_path = os.path.join(base_dir, "dataset", "iot_telemetry.csv")

    df = pd.read_csv(dataset_path)

    return df