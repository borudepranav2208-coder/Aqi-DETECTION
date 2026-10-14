import pandas as pd
import numpy as np


# Load AQI dataset
DATA_PATH = "data/aqi.csv"

df = pd.read_csv(DATA_PATH)


# -----------------------------
# BASIC DATASET INFORMATION
# -----------------------------

print("\n========== AQI DATASET ANALYSIS ==========\n")

print("Total Rows:", len(df))
print("Total Columns:", len(df.columns))

print("\nColumn Names:")
print(df.columns.tolist())


# -----------------------------
# DATA TYPES
# -----------------------------

print("\n========== DATA TYPES ==========\n")

print(df.dtypes)


# -----------------------------
# MISSING VALUES
# -----------------------------

print("\n========== MISSING VALUES ==========\n")

print(df.isnull().sum())


# -----------------------------
# DUPLICATE RECORDS
# -----------------------------

print("\n========== DUPLICATES ==========\n")

print("Duplicate Rows:", df.duplicated().sum())


# -----------------------------
# AQI STATISTICS USING NUMPY
# -----------------------------

aqi = df["aqi_value"].dropna().to_numpy()

print("\n========== AQI STATISTICS ==========\n")

print("Average AQI:", np.mean(aqi))
print("Median AQI:", np.median(aqi))
print("Minimum AQI:", np.min(aqi))
print("Maximum AQI:", np.max(aqi))
print("Standard Deviation:", np.std(aqi))


# -----------------------------
# AQI STATUS DISTRIBUTION
# -----------------------------

print("\n========== AQI STATUS ==========\n")

print(df["air_quality_status"].value_counts())


# -----------------------------
# POLLUTANT DISTRIBUTION
# -----------------------------

print("\n========== PROMINENT POLLUTANTS ==========\n")

print(df["prominent_pollutants"].value_counts())


# -----------------------------
# STATE INFORMATION
# -----------------------------

print("\n========== STATES ==========\n")

print("Total States:", df["state"].nunique())

print("\nState-wise Record Count:")

print(df["state"].value_counts())


# -----------------------------
# AREA INFORMATION
# -----------------------------

print("\n========== AREAS ==========\n")

print("Total Areas:", df["area"].nunique())


# -----------------------------
# HIGHEST AQI RECORDS
# -----------------------------

print("\n========== TOP 10 HIGHEST AQI ==========\n")

top_aqi = df.nlargest(10, "aqi_value")

print(
    top_aqi[
        [
            "date",
            "state",
            "area",
            "aqi_value",
            "air_quality_status"
        ]
    ]
)


# -----------------------------
# LOWEST AQI RECORDS
# -----------------------------

print("\n========== TOP 10 LOWEST AQI ==========\n")

lowest_aqi = df.nsmallest(10, "aqi_value")

print(
    lowest_aqi[
        [
            "date",
            "state",
            "area",
            "aqi_value",
            "air_quality_status"
        ]
    ]
)


print("\n========== ANALYSIS COMPLETE ==========\n")