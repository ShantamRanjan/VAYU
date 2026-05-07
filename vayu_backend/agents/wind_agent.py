# wind_agent.py — VAYU Wind Forecast Agent (Block 2)

import requests
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings("ignore")

WIND_PLANTS = {
    "Chitradurga": {"lat": 14.23, "lon": 76.40, "rated_mw": 50},
    "Gadag":       {"lat": 15.42, "lon": 75.62, "rated_mw": 40},
    "Davangere":   {"lat": 14.46, "lon": 75.92, "rated_mw": 35},
}

def fetch_wind_data(lat, lon, days=7):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat, "longitude": lon,
        "hourly": "windspeed_10m,windspeed_100m,winddirection_10m,temperature_2m",
        "forecast_days": days,
        "timezone": "Asia/Kolkata"
    }
    r = requests.get(url, params=params, timeout=20)
    df = pd.DataFrame(r.json()["hourly"])
    df["datetime"] = pd.to_datetime(df["time"])
    df["hour"]     = df["datetime"].dt.hour
    df["month"]    = df["datetime"].dt.month
    return df.drop(columns=["time"])

def power_curve(v, rated_mw):
    if v < 3:   return 0.0
    if v > 25:  return 0.0
    if v >= 12: return float(rated_mw)
    rho = 1.225
    A   = 3.14 * (40**2)
    Cp  = 0.45
    return min(float(rated_mw), 0.5 * rho * A * Cp * (v**3) / 1e6)

def build_features(df, rated_mw, terrain_flag=1):
    df = df.copy()
    df["v3_100m"]      = df["windspeed_100m"] ** 3
    df["shear_ratio"]  = df["windspeed_100m"] / (df["windspeed_10m"] + 0.1)
    df["is_westerly"]  = df["winddirection_10m"].apply(
        lambda d: 1 if 225 <= d <= 315 else 0)
    df["terrain_flag"] = terrain_flag
    df["mw_output"]    = df["windspeed_100m"].apply(
        lambda v: power_curve(v, rated_mw)
    ) + np.random.normal(0, 1.5, len(df))
    df["mw_output"]    = df["mw_output"].clip(0, rated_mw)
    return df

FEATURES = [
    "windspeed_10m", "windspeed_100m", "v3_100m",
    "shear_ratio", "winddirection_10m", "is_westerly",
    "temperature_2m", "hour", "month", "terrain_flag"
]

class WindForecastAgent:
    def __init__(self, plant_name, rated_mw, terrain_flag=1):
        self.plant_name   = plant_name
        self.rated_mw     = rated_mw
        self.terrain_flag = terrain_flag
        self.model        = None
        self.mapie        = None

    def train(self, df):
        import lightgbm as lgb
        from mapie.regression import SplitConformalRegressor
        from sklearn.model_selection import train_test_split
        df = build_features(df, self.rated_mw, self.terrain_flag)
        X  = df[FEATURES]
        y  = df["mw_output"]
        X_train, X_cal, y_train, y_cal = train_test_split(
            X, y, test_size=0.2, random_state=42)
        self.model = lgb.LGBMRegressor(
            n_estimators=300, learning_rate=0.05,
            num_leaves=31, random_state=42)
        self.model.fit(X_train, y_train)
        self.mapie = SplitConformalRegressor(self.model, confidence_level=0.80)
        self.mapie.conformalize(X_cal, y_cal)
        r2 = self.model.score(X_cal, y_cal)
        print(f"  [{self.plant_name}] R2: {round(r2, 3)}")
        return self

    def predict(self, df):
        df  = build_features(df, self.rated_mw, self.terrain_flag)
        X   = df[FEATURES]
        p50 = self.model.predict(X)
        _, intervals = self.mapie.predict_interval(X)
        # intervals shape: (n, 2, 1)
        results = []
        for i in range(len(df)):
            p10 = max(0, float(intervals[i, 0, 0]))
            p90 = min(self.rated_mw, float(intervals[i, 1, 0]))
            results.append({
                "datetime": df["datetime"].iloc[i],
                "plant":    self.plant_name,
                "p10":      round(p10, 2),
                "p50":      round(float(p50[i]), 2),
                "p90":      round(p90, 2),
                "band_mw":  round(p90 - p10, 2),
            })
        return pd.DataFrame(results)
