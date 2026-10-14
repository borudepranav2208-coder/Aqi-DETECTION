from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import os

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

# =========================================================
# FLASK APP
# =========================================================

app = Flask(__name__)


# =========================================================
# LOAD DATASET
# =========================================================

DATA_PATH = os.path.join("data", "aqi.csv")

try:
    df = pd.read_csv(DATA_PATH)

    df.columns = [
        str(col).strip()
        for col in df.columns
    ]

except Exception as e:
    print("ERROR LOADING DATASET:", e)
    df = pd.DataFrame()


print("\n================================")
print("       AQI INSIGHT HUB")
print("================================")
print("Dataset:", DATA_PATH)
print("Columns:", list(df.columns))
print("Rows:", len(df))


# =========================================================
# FIND AQI COLUMN
# =========================================================

def find_aqi_column():

    possible = [
        "AQI",
        "aqi",
        "aqi_value",
        "Air Quality Index",
        "Air_Quality_Index",
        "air_quality_index"
    ]

    for col in possible:

        if col in df.columns:
            return col

    for col in df.columns:

        name = str(col).lower().replace("_", " ")

        if "aqi" in name:
            return col

    return None


AQI_COLUMN = find_aqi_column()

print("AQI COLUMN:", AQI_COLUMN)


# =========================================================
# FIND COLUMN
# =========================================================

def find_column(keywords):

    for col in df.columns:

        name = str(col).lower().replace("_", " ")

        for keyword in keywords:

            if keyword.lower() in name:
                return col

    return None


STATE_COLUMN = find_column([
    "state",
    "states"
])

AREA_COLUMN = find_column([
    "area",
    "city",
    "location",
    "station",
    "place"
])

POLLUTANT_COLUMN = find_column([
    "prominent_pollutants",
    "pollutant"
])

MONITORING_COLUMN = find_column([
    "number_of_monitoring_stations",
    "monitoring stations",
    "monitoring"
])


# =========================================================
# AQI CATEGORY
# =========================================================

def aqi_category(value):

    value = float(value)

    if value <= 50:
        return "Good"

    elif value <= 100:
        return "Satisfactory"

    elif value <= 200:
        return "Moderate"

    elif value <= 300:
        return "Poor"

    elif value <= 400:
        return "Very Poor"

    else:
        return "Severe"


# =========================================================
# HEALTH ADVICE
# =========================================================

def health_advice(category):

    advice = {

        "Good":
            "Air quality is good. Enjoy normal outdoor activities.",

        "Satisfactory":
            "Air quality is acceptable. Sensitive people should take care.",

        "Moderate":
            "Sensitive people may experience discomfort. Reduce prolonged outdoor activity.",

        "Poor":
            "Avoid prolonged outdoor activity. Sensitive people should stay indoors.",

        "Very Poor":
            "Avoid outdoor activities as much as possible.",

        "Severe":
            "Serious health effects are possible. Avoid outdoor exposure."
    }

    return advice.get(
        category,
        "No advice available."
    )


# =========================================================
# NUMERIC COLUMNS
# =========================================================

def get_numeric_columns():

    if df.empty:
        return []

    return list(
        df.select_dtypes(
            include=np.number
        ).columns
    )


# =========================================================
# MODEL FEATURES
# =========================================================

def get_prediction_features():

    features = []

    if STATE_COLUMN:
        features.append(STATE_COLUMN)

    if AREA_COLUMN:
        features.append(AREA_COLUMN)

    if MONITORING_COLUMN:
        features.append(MONITORING_COLUMN)

    if POLLUTANT_COLUMN:
        features.append(POLLUTANT_COLUMN)

    return features


# =========================================================
# PREPARE MODEL DATA
# =========================================================

def get_model_dataframe():

    if df.empty or AQI_COLUMN is None:
        return pd.DataFrame()

    features = get_prediction_features()

    columns = features + [AQI_COLUMN]

    model_df = df[columns].copy()

    # Numeric conversion
    if MONITORING_COLUMN:

        model_df[MONITORING_COLUMN] = pd.to_numeric(
            model_df[MONITORING_COLUMN],
            errors="coerce"
        )

    model_df[AQI_COLUMN] = pd.to_numeric(
        model_df[AQI_COLUMN],
        errors="coerce"
    )

    # Clean categorical columns
    for col in [
        STATE_COLUMN,
        AREA_COLUMN,
        POLLUTANT_COLUMN
    ]:

        if col and col in model_df.columns:

            model_df[col] = (
                model_df[col]
                .fillna("Unknown")
                .astype(str)
            )

    model_df = model_df.dropna(
        subset=[AQI_COLUMN]
    )

    return model_df


# =========================================================
# TRAIN RANDOM FOREST
# =========================================================

def train_random_forest():

    model_df = get_model_dataframe()

    if model_df.empty:
        return None, [], None, None, None

    features = get_prediction_features()

    if len(features) == 0:
        return None, [], None, None, None

    X = model_df[features].copy()

    y = model_df[AQI_COLUMN].astype(float)

    categorical_features = []

    numeric_features = []

    for col in features:

        if col in [
            STATE_COLUMN,
            AREA_COLUMN,
            POLLUTANT_COLUMN
        ]:

            categorical_features.append(col)

        else:

            numeric_features.append(col)

    transformers = []

    if categorical_features:

        transformers.append(
            (
                "categorical",
                OrdinalEncoder(
                    handle_unknown="use_encoded_value",
                    unknown_value=-1
                ),
                categorical_features
            )
        )

    if numeric_features:

        transformers.append(
            (
                "numeric",
                "passthrough",
                numeric_features
            )
        )

    preprocessor = ColumnTransformer(
        transformers=transformers
    )

    model = RandomForestRegressor(
        n_estimators=80,
        random_state=42,
        n_jobs=-1,
        max_depth=18
    )

    pipeline = Pipeline([
        (
            "preprocessor",
            preprocessor
        ),
        (
            "model",
            model
        )
    ])

    # -----------------------------------------------------
    # Use a manageable sample for faster browser prediction
    # -----------------------------------------------------

    if len(model_df) > 60000:

        sample_df = model_df.sample(
            n=60000,
            random_state=42
        )

        X = sample_df[features]
        y = sample_df[AQI_COLUMN].astype(float)

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=42
    )

    pipeline.fit(
        X_train,
        y_train
    )

    predictions = pipeline.predict(
        X_test
    )

    mae = mean_absolute_error(
        y_test,
        predictions
    )

    rmse = np.sqrt(
        mean_squared_error(
            y_test,
            predictions
        )
    )

    r2 = r2_score(
        y_test,
        predictions
    )

    return (
        pipeline,
        features,
        mae,
        rmse,
        r2
    )


# =========================================================
# HOME
# =========================================================

@app.route("/")
def home():

    return render_template(
        "index.html"
    )


# =========================================================
# DASHBOARD
# =========================================================

@app.route("/api/dashboard")
def dashboard():

    try:

        total_records = len(df)

        # -----------------------------------------------
        # STATES
        # -----------------------------------------------

        total_states = 0

        if STATE_COLUMN:

            total_states = int(
                df[STATE_COLUMN]
                .dropna()
                .astype(str)
                .nunique()
            )

        # -----------------------------------------------
        # AREAS
        # -----------------------------------------------

        total_areas = 0

        if AREA_COLUMN:

            total_areas = int(
                df[AREA_COLUMN]
                .dropna()
                .astype(str)
                .nunique()
            )

        # -----------------------------------------------
        # AVERAGE AQI
        # -----------------------------------------------

        average_aqi = 0

        category_counts = {}

        if AQI_COLUMN:

            aqi_values = pd.to_numeric(
                df[AQI_COLUMN],
                errors="coerce"
            )

            average_aqi = float(
                aqi_values.mean()
            )

            categories = (
                aqi_values
                .dropna()
                .apply(aqi_category)
            )

            category_counts = (
                categories
                .value_counts()
                .to_dict()
            )

        # -----------------------------------------------
        # POLLUTANTS
        # -----------------------------------------------

        pollutant_counts = {}

        if POLLUTANT_COLUMN:

            pollutant_counts = (
                df[POLLUTANT_COLUMN]
                .fillna("Unknown")
                .astype(str)
                .value_counts()
                .head(15)
                .to_dict()
            )

        # -----------------------------------------------
        # STATE COUNTS
        # -----------------------------------------------

        state_counts = {}

        if STATE_COLUMN:

            state_counts = (
                df[STATE_COLUMN]
                .fillna("Unknown")
                .astype(str)
                .value_counts()
                .head(15)
                .to_dict()
            )

        # -----------------------------------------------
        # YEARLY AQI
        # -----------------------------------------------

        yearly = {}

        if "date" in df.columns and AQI_COLUMN:

            temp = df.copy()

            temp["date"] = pd.to_datetime(
                temp["date"],
                errors="coerce",
                dayfirst=True
            )

            temp["year"] = (
                temp["date"]
                .dt.year
            )

            temp[AQI_COLUMN] = pd.to_numeric(
                temp[AQI_COLUMN],
                errors="coerce"
            )

            yearly = (
                temp.dropna(
                    subset=["year", AQI_COLUMN]
                )
                .groupby("year")[AQI_COLUMN]
                .mean()
                .round(2)
                .to_dict()
            )

            yearly = {
                str(int(k)): float(v)
                for k, v in yearly.items()
            }

        # -----------------------------------------------
        # POLLUTANT DETAILS
        # -----------------------------------------------

        pollutant_details = []

        if POLLUTANT_COLUMN and AQI_COLUMN:

            temp = df.copy()

            temp[AQI_COLUMN] = pd.to_numeric(
                temp[AQI_COLUMN],
                errors="coerce"
            )

            grouped = (
                temp.groupby(
                    POLLUTANT_COLUMN
                )[AQI_COLUMN]
                .agg([
                    "count",
                    "mean",
                    "max"
                ])
                .sort_values(
                    "count",
                    ascending=False
                )
                .head(15)
            )

            for name, row in grouped.iterrows():

                pollutant_details.append({

                    "name": str(name),

                    "count": int(
                        row["count"]
                    ),

                    "average_aqi": round(
                        float(row["mean"]),
                        2
                    ),

                    "maximum_aqi": round(
                        float(row["max"]),
                        2
                    )
                })

        # -----------------------------------------------
        # TOP AREAS
        # -----------------------------------------------

        top_areas = []

        if AREA_COLUMN and AQI_COLUMN:

            temp = df.copy()

            temp[AQI_COLUMN] = pd.to_numeric(
                temp[AQI_COLUMN],
                errors="coerce"
            )

            grouped = (
                temp.groupby(
                    AREA_COLUMN
                )[AQI_COLUMN]
                .mean()
                .sort_values(
                    ascending=False
                )
                .head(10)
            )

            for name, value in grouped.items():

                top_areas.append({

                    "name": str(name),

                    "aqi": round(
                        float(value),
                        2
                    )
                })

        return jsonify({

            "success": True,

            "total_records":
                total_records,

            "total_states":
                total_states,

            "total_areas":
                total_areas,

            "average_aqi":
                round(
                    average_aqi,
                    2
                ),

            "category_counts":
                category_counts,

            "status_counts":
                category_counts,

            "pollutant_counts":
                pollutant_counts,

            "pollutant_details":
                pollutant_details,

            "state_counts":
                state_counts,

            "yearly":
                yearly,

            "top_areas":
                top_areas
        })

    except Exception as e:

        print(
            "Dashboard Error:",
            e
        )

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500


# =========================================================
# DATASET API
# =========================================================

@app.route("/api/data")
def data_api():

    try:

        search = request.args.get(
            "search",
            ""
        ).strip()

        result = df.copy()

        if search:

            mask = (
                result
                .astype(str)
                .apply(
                    lambda row:
                    row.str.contains(
                        search,
                        case=False,
                        na=False
                    ).any(),
                    axis=1
                )
            )

            result = result[mask]

        result = result.head(100)

        result = result.replace(
            [np.inf, -np.inf],
            np.nan
        )

        result = result.where(
            pd.notnull(result),
            None
        )

        rows = result.to_dict(
            orient="records"
        )

        return jsonify({

            "success": True,

            "columns":
                list(df.columns),

            "rows":
                rows,

            "total":
                len(result)
        })

    except Exception as e:

        return jsonify({

            "success": False,

            "error":
                str(e)

        }), 500


# =========================================================
# EXPLORER INFO
# =========================================================

@app.route("/api/explorer-info")
def explorer_info():

    numeric = get_numeric_columns()

    text_columns = [
        col
        for col in df.columns
        if col not in numeric
    ]

    column_info = []

    for col in df.columns:

        column_info.append({

            "name":
                col,

            "type":
                str(df[col].dtype),

            "missing":
                int(df[col].isna().sum()),

            "unique":
                int(df[col].nunique())
        })

    return jsonify({

        "rows":
            len(df),

        "columns":
            len(df.columns),

        "numeric_columns":
            len(numeric),

        "text_columns":
            len(text_columns),

        "numeric_names":
            numeric,

        "text_names":
            text_columns,

        "columns_info":
            column_info
    })


# =========================================================
# DATA QUALITY
# =========================================================

@app.route("/api/quality")
def quality():

    rows = len(df)

    columns = len(df.columns)

    missing_values = int(
        df.isnull()
        .sum()
        .sum()
    )

    duplicate_rows = int(
        df.duplicated()
        .sum()
    )

    aqi_outliers = 0

    if AQI_COLUMN:

        values = pd.to_numeric(
            df[AQI_COLUMN],
            errors="coerce"
        ).dropna()

        if len(values) > 0:

            q1 = values.quantile(
                0.25
            )

            q3 = values.quantile(
                0.75
            )

            iqr = q3 - q1

            lower = q1 - 1.5 * iqr

            upper = q3 + 1.5 * iqr

            aqi_outliers = int(
                (
                    (values < lower) |
                    (values > upper)
                ).sum()
            )

    total_cells = rows * columns

    missing_ratio = (
        missing_values / total_cells
        if total_cells > 0
        else 0
    )

    duplicate_ratio = (
        duplicate_rows / rows
        if rows > 0
        else 0
    )

    score = 100

    score -= missing_ratio * 50

    score -= duplicate_ratio * 30

    score = max(
        0,
        min(
            100,
            round(score)
        )
    )

    if score >= 80:
        status = "Excellent"

    elif score >= 60:
        status = "Good"

    elif score >= 40:
        status = "Average"

    else:
        status = "Needs Cleaning"

    return jsonify({

        "score":
            score,

        "status":
            status,

        "missing_values":
            missing_values,

        "duplicate_rows":
            duplicate_rows,

        "aqi_outliers":
            aqi_outliers,

        "rows":
            rows,

        "columns":
            columns
    })


# =========================================================
# MODEL API
# =========================================================

@app.route("/api/model")
def model_api():

    try:

        model, features, mae, rmse, r2 = (
            train_random_forest()
        )

        if model is None:

            return jsonify({

                "success": False,

                "message":
                    "Model could not be trained."
            })

        return jsonify({

            "success": True,

            "features":
                features,

            "mae":
                round(
                    float(mae),
                    3
                ),

            "rmse":
                round(
                    float(rmse),
                    3
                ),

            "r2":
                round(
                    float(r2),
                    3
                )
        })

    except Exception as e:

        print(
            "Model Error:",
            e
        )

        return jsonify({

            "success": False,

            "error":
                str(e)
        }), 500


# =========================================================
# MODEL OPTIONS
# =========================================================

@app.route("/api/model-options")
def model_options():

    states = []

    areas = []

    pollutants = []

    if STATE_COLUMN:

        states = sorted(
            df[STATE_COLUMN]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

    if AREA_COLUMN:

        areas = sorted(
            df[AREA_COLUMN]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

    if POLLUTANT_COLUMN:

        pollutants = sorted(
            df[POLLUTANT_COLUMN]
            .dropna()
            .astype(str)
            .unique()
            .tolist()
        )

    return jsonify({

        "states":
            states,

        "areas":
            areas,

        "pollutants":
            pollutants,

        "monitoring_min":
            int(
                df[MONITORING_COLUMN]
                .min()
            )
            if MONITORING_COLUMN
            else 1,

        "monitoring_max":
            int(
                df[MONITORING_COLUMN]
                .max()
            )
            if MONITORING_COLUMN
            else 10
    })


# =========================================================
# PREDICT AQI
# =========================================================

@app.route(
    "/api/predict",
    methods=["POST"]
)
def predict():

    try:

        data = request.get_json()

        if not data:

            return jsonify({

                "success": False,

                "error":
                    "No input data received."
            }), 400

        model, features, mae, rmse, r2 = (
            train_random_forest()
        )

        if model is None:

            return jsonify({

                "success": False,

                "error":
                    "Model could not be trained."
            }), 400

        input_data = {}

        for feature in features:

            if feature not in data:

                return jsonify({

                    "success": False,

                    "error":
                        f"Missing input: {feature}"
                }), 400

            value = data[feature]

            if feature == MONITORING_COLUMN:

                try:

                    value = float(value)

                except:

                    return jsonify({

                        "success": False,

                        "error":
                            "Monitoring stations must be a number."
                    }), 400

            else:

                value = str(value)

            input_data[feature] = [
                value
            ]

        input_df = pd.DataFrame(
            input_data
        )

        prediction = float(
            model.predict(
                input_df
            )[0]
        )

        # Keep prediction in sensible AQI range
        prediction = max(
            0,
            prediction
        )

        category = aqi_category(
            prediction
        )

        advice = health_advice(
            category
        )

        return jsonify({

            "success": True,

            "predicted_aqi":
                round(
                    prediction,
                    2
                ),

            "category":
                category,

            "advice":
                advice,

            "mae":
                round(
                    float(mae),
                    3
                ),

            "rmse":
                round(
                    float(rmse),
                    3
                ),

            "r2":
                round(
                    float(r2),
                    3
                )
        })

    except Exception as e:

        print(
            "Prediction Error:",
            e
        )

        return jsonify({

            "success": False,

            "error":
                str(e)
        }), 500


# =========================================================
# STATUS
# =========================================================

@app.route("/api/status")
def status():

    return jsonify({

        "status":
            "running",

        "dataset":
            DATA_PATH,

        "records":
            len(df),

        "aqi_column":
            AQI_COLUMN,

        "state_column":
            STATE_COLUMN,

        "area_column":
            AREA_COLUMN,

        "pollutant_column":
            POLLUTANT_COLUMN,

        "monitoring_column":
            MONITORING_COLUMN
    })


# =========================================================
# RUN APPLICATION
# =========================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )