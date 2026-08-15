# models/

This directory stores serialised model artefacts.

## model.pkl

Generated automatically the first time the pipeline runs (or when `--retrain` is passed):

```bash
python pipeline/analyze_device.py DEV_001 --retrain
```

The file is created by `services/anomaly_model.py → train_and_save()` and contains:

| Key        | Type               | Description                        |
|------------|--------------------|------------------------------------|
| `model`    | `IsolationForest`  | Fitted sklearn estimator           |
| `scaler`   | `StandardScaler`   | Fitted feature scaler              |
| `is_fitted`| `bool`             | Whether the model has been trained |

> **Note:** `model.pkl` is intentionally excluded from version control.  
> Add it to `.gitignore` and store artefacts in a model registry for production use.
