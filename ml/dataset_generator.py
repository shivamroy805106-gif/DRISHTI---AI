"""
DRISHTI-AI — Synthetic Disaster Risk Dataset Generator
Generates realistic training data for the risk scoring ML model.
All data is synthetic/simulated for demonstration purposes.
"""

import numpy as np
import pandas as pd
import random

np.random.seed(42)
random.seed(42)

N = 5000  # number of synthetic samples

def generate_dataset():
    data = []
    for _ in range(N):
        # Feature generation with realistic correlations
        rainfall = np.random.beta(2, 3) * 100          # 0–100 (mm/hr normalized)
        river_level = np.clip(rainfall * 0.7 + np.random.normal(0, 10), 0, 100)
        population_density = np.random.exponential(40)  # people per sq km (scaled)
        population_density = np.clip(population_density, 1, 100)
        affected_population = np.clip(
            population_density * np.random.uniform(0.5, 2.0) + np.random.normal(0, 10),
            0, 100
        )
        historical_disaster_freq = np.random.beta(1.5, 3) * 100
        infrastructure_vulnerability = np.random.beta(2, 2) * 100
        weather_severity = np.clip(rainfall * 0.6 + np.random.normal(0, 15), 0, 100)
        distance_to_hospital = np.random.exponential(30)
        distance_to_hospital = np.clip(distance_to_hospital, 1, 100)  # km normalized
        road_accessibility = np.clip(100 - distance_to_hospital * 0.5 + np.random.normal(0, 15), 0, 100)

        # Compute a realistic risk score (0–100)
        risk_score = (
            0.25 * rainfall +
            0.20 * river_level +
            0.15 * population_density +
            0.10 * affected_population +
            0.10 * historical_disaster_freq +
            0.10 * infrastructure_vulnerability +
            0.05 * weather_severity +
            0.03 * distance_to_hospital +
            0.02 * (100 - road_accessibility)
        )
        risk_score = np.clip(risk_score + np.random.normal(0, 3), 0, 100)

        # Risk category based on score
        if risk_score < 26:
            category = 0   # LOW
        elif risk_score < 51:
            category = 1   # MEDIUM
        elif risk_score < 76:
            category = 2   # HIGH
        else:
            category = 3   # CRITICAL

        data.append({
            "rainfall": round(rainfall, 2),
            "river_level": round(river_level, 2),
            "population_density": round(population_density, 2),
            "affected_population": round(affected_population, 2),
            "historical_disaster_freq": round(historical_disaster_freq, 2),
            "infrastructure_vulnerability": round(infrastructure_vulnerability, 2),
            "weather_severity": round(weather_severity, 2),
            "distance_to_hospital": round(distance_to_hospital, 2),
            "road_accessibility": round(road_accessibility, 2),
            "risk_score": round(risk_score, 2),
            "risk_category": category,
        })

    df = pd.DataFrame(data)
    df.to_csv("dataset.csv", index=False)
    print(f"Generated {N} synthetic samples → dataset.csv")
    return df

if __name__ == "__main__":
    df = generate_dataset()
    print(df.describe())
    print(f"\nCategory distribution:\n{df['risk_category'].value_counts().sort_index()}")
