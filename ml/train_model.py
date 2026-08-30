import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import joblib
import os

def generate_synthetic_data(num_records=1000):
    """Generates realistic historical data to train the initial model."""
    np.random.seed(42)
    services = ['DHL', 'FedEx', 'UPS', 'Aramex', 'Others', 'None']
    
    data = {
        'monthly_volume': np.random.exponential(scale=500, size=num_records),
        'service_using': np.random.choice(services, num_records, p=[0.2, 0.2, 0.1, 0.1, 0.1, 0.3]),
    }
    df = pd.DataFrame(data)
    
    # Logic for synthetic outcomes: Higher volume & using a competitor = higher chance of winning
    probabilities = (df['monthly_volume'] / 2000) + (df['service_using'] != 'None') * 0.2
    probabilities = np.clip(probabilities, 0, 1)
    
    df['outcome_positive'] = np.random.binomial(1, probabilities)
    return df

def train_and_save_model():
    print("Loading data...")
    df = generate_synthetic_data(2000)
    
    X = df[['monthly_volume', 'service_using']]
    y = df['outcome_positive']

    # Create a robust preprocessing pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), ['monthly_volume']),
            ('cat', OneHotEncoder(handle_unknown='ignore'), ['service_using'])
        ])

    # Append classifier to preprocessing pipeline
    clf = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42))
    ])

    print("Training Random Forest model...")
    clf.fit(X, y)
    
    # Save the full pipeline to disk
    model_path = os.path.join(os.path.dirname(__file__), 'lead_scoring_model.pkl')
    joblib.dump(clf, model_path)
    print(f"Pipeline successfully saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()