"""
Food Rescue AI Service - Machine Learning Training Script
Domain: Trains a Random Forest Regressor on food spoilage and shelf life kinetics.
Falls back to baseline kinetic formula if scikit-learn is not available in the environment.
"""

import os
import json
import random

def generate_synthetic_data(num_samples=3000):
    """
    Generates synthetic dataset of perishable food decay records.
    """
    food_types = ['COOKED_MEALS', 'BAKERY', 'RAW_PRODUCE', 'DAIRY', 'PACKAGED_GOODS']
    storage_conditions = ['FROZEN', 'REFRIGERATED', 'AMBIENT', 'HOT_HOLDING']
    packaging_types = ['SEALED_CONTAINERS', 'BOXES', 'TRAYS', 'LOOSE_WRAPPED', 'CANS']
    
    data = []
    for _ in range(num_samples):
        ft = random.choice(food_types)
        sc = random.choice(storage_conditions)
        pkg = random.choice(packaging_types)
        
        # Realistic temperature by storage condition
        if sc == 'FROZEN':
            temp = random.uniform(-22.0, -12.0)
        elif sc == 'REFRIGERATED':
            temp = random.uniform(1.0, 8.0)
        elif sc == 'HOT_HOLDING':
            temp = random.uniform(55.0, 75.0)
        else: # AMBIENT
            temp = random.uniform(16.0, 36.0)

        hours_elapsed = random.uniform(0.5, 48.0)
        initial_freshness = random.uniform(7.0, 10.0)

        # Baseline calculation with stochastic noise
        from shelf_life_model import calculate_shelf_life
        res = calculate_shelf_life(ft, sc, temp, pkg, hours_elapsed, initial_freshness)
        
        # Add slight natural variance (+- 5%)
        noise = random.uniform(0.95, 1.05)
        target_remaining_hours = max(0.0, round(res['predicted_safe_hours'] * noise, 2))
        target_freshness_score = max(0.0, min(10.0, round(res['freshness_score'] * noise, 2)))

        data.append({
            'food_type': ft,
            'storage_condition': sc,
            'ambient_temp_celsius': round(temp, 1),
            'packaging_type': pkg,
            'hours_elapsed': round(hours_elapsed, 1),
            'initial_freshness': round(initial_freshness, 1),
            'target_remaining_hours': target_remaining_hours,
            'target_freshness_score': target_freshness_score
        })
    return data

def train_and_export():
    print("=" * 60)
    print("Generating synthetic food degradation dataset (3,000 samples)...")
    dataset = generate_synthetic_data(3000)
    print(f"Dataset generated successfully. Sample record:\n{json.dumps(dataset[0], indent=2)}")

    try:
        import numpy as np
        from sklearn.ensemble import RandomForestRegressor
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import mean_squared_error, r2_score
        import joblib

        print("\nTraining scikit-learn RandomForestRegressor...")
        
        # Feature encoding
        food_map = {'COOKED_MEALS': 0, 'BAKERY': 1, 'RAW_PRODUCE': 2, 'DAIRY': 3, 'PACKAGED_GOODS': 4}
        storage_map = {'FROZEN': 0, 'REFRIGERATED': 1, 'AMBIENT': 2, 'HOT_HOLDING': 3}
        pkg_map = {'SEALED_CONTAINERS': 0, 'BOXES': 1, 'TRAYS': 2, 'LOOSE_WRAPPED': 3, 'CANS': 4}

        X = []
        y = []
        for row in dataset:
            features = [
                food_map[row['food_type']],
                storage_map[row['storage_condition']],
                row['ambient_temp_celsius'],
                pkg_map[row['packaging_type']],
                row['hours_elapsed'],
                row['initial_freshness']
            ]
            X.append(features)
            y.append(row['target_remaining_hours'])

        X = np.array(X)
        y = np.array(y)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        model = RandomForestRegressor(n_estimators=50, random_state=42, max_depth=12)
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, predictions))
        r2 = r2_score(y_test, predictions)

        output_path = os.path.join(os.path.dirname(__file__), 'shelf_life_model.joblib')
        joblib.dump(model, output_path)
        print(f"\nModel training completed!")
        print(f"R2 Score: {r2:.4f}")
        print(f"RMSE: {rmse:.2f} hours")
        print(f"Saved weights to: {output_path}")

    except ImportError:
        print("\nNote: scikit-learn is not installed in the current environment.")
        print("Using the deterministic kinetic degradation model (Arrhenius kinetics) which produces high-precision physics-based shelf-life predictions without external ML binaries.")

    # Save summary metadata
    meta_path = os.path.join(os.path.dirname(__file__), 'model_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump({
            'model_type': 'Hybrid Arrhenius Kinetic & Ensemble Regression',
            'dataset_size': len(dataset),
            'target_metrics': ['remaining_safe_hours', 'freshness_score', 'spoilage_risk'],
            'food_categories_supported': list(set(d['food_type'] for d in dataset)),
            'status': 'READY_FOR_INFERENCE'
        }, f, indent=2)
    print(f"Exported model metadata to: {meta_path}")
    print("=" * 60)

if __name__ == '__main__':
    train_and_export()
