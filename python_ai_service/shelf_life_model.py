"""
Food Rescue AI Service - Shelf Life & Deterioration Prediction Engine
Domain: Perishable food kinetic degradation, cold chain temperature compliance,
microbial safety threshold prediction, and rescue priority dispatch scoring.
"""

import math
from datetime import datetime, timedelta

# Baseline reference parameters per food category:
# Baseline shelf life at standard reference storage (refrigerated 4°C or ambient 20°C) in hours
CATEGORY_BASELINES = {
    'COOKED_MEALS': {
        'ideal_temp': 4.0,       # blast chill / fridge
        'hot_hold_min': 63.0,    # hot holding minimum
        'base_shelf_life': 24.0, # at 4°C
        'danger_zone_rate': 2.8, # acceleration factor in microbial danger zone (5°C - 60°C)
        'q10_factor': 2.3        # temperature sensitivity factor
    },
    'BAKERY': {
        'ideal_temp': 20.0,
        'base_shelf_life': 48.0,
        'danger_zone_rate': 1.2,
        'q10_factor': 1.5
    },
    'RAW_PRODUCE': {
        'ideal_temp': 6.0,
        'base_shelf_life': 96.0,
        'danger_zone_rate': 1.4,
        'q10_factor': 1.8
    },
    'DAIRY': {
        'ideal_temp': 3.0,
        'base_shelf_life': 36.0,
        'danger_zone_rate': 3.1,
        'q10_factor': 2.7
    },
    'PACKAGED_GOODS': {
        'ideal_temp': 22.0,
        'base_shelf_life': 720.0,
        'danger_zone_rate': 1.05,
        'q10_factor': 1.1
    }
}

PACKAGING_PROTECTION_MULTIPLIERS = {
    'SEALED_CONTAINERS': 1.20,
    'BOXES': 0.95,
    'TRAYS': 0.90,
    'LOOSE_WRAPPED': 0.70,
    'CANS': 1.50
}

STORAGE_CONDITION_BASE_TEMPS = {
    'FROZEN': -18.0,
    'REFRIGERATED': 4.0,
    'AMBIENT': 24.0,
    'HOT_HOLDING': 65.0
}


def calculate_shelf_life(food_type: str,
                         storage_condition: str,
                         ambient_temp_celsius: float = None,
                         packaging_type: str = 'SEALED_CONTAINERS',
                         hours_since_prepared: float = 0.0,
                         initial_freshness_rating: float = 10.0) -> dict:
    """
    Predicts remaining safe hours and freshness degradation curve for food rescue operations.
    
    Formula based on modified Arrhenius kinetic degradation equation:
    k_T = k_ref * Q10^((T - T_ref) / 10)
    """
    # Normalize inputs
    food_type = food_type.upper() if food_type else 'COOKED_MEALS'
    storage_condition = storage_condition.upper() if storage_condition else 'AMBIENT'
    packaging_type = packaging_type.upper() if packaging_type else 'SEALED_CONTAINERS'
    hours_since_prepared = max(0.0, float(hours_since_prepared))
    initial_freshness_rating = max(1.0, min(10.0, float(initial_freshness_rating)))

    category_info = CATEGORY_BASELINES.get(food_type, CATEGORY_BASELINES['COOKED_MEALS'])
    
    # Determine effective temperature
    if ambient_temp_celsius is None:
        effective_temp = STORAGE_CONDITION_BASE_TEMPS.get(storage_condition, 24.0)
    else:
        effective_temp = float(ambient_temp_celsius)

    ideal_temp = category_info['ideal_temp']
    q10 = category_info['q10_factor']
    base_shelf_life = category_info['base_shelf_life']

    # Temperature stress penalty:
    # Danger zone for prepared food: 5°C to 60°C
    is_danger_zone = 5.0 <= effective_temp <= 60.0 and food_type in ['COOKED_MEALS', 'DAIRY']
    
    if storage_condition == 'FROZEN':
        effective_shelf_life = base_shelf_life * 5.0
    elif storage_condition == 'HOT_HOLDING' and effective_temp >= 63.0:
        # Hot holding safe window is typically up to 4-6 hours before textural/nutritional degradation
        effective_shelf_life = min(6.0, base_shelf_life * 0.5)
    else:
        temp_delta = effective_temp - ideal_temp
        if temp_delta < 0:
            acceleration = 1.0 / (q10 ** (abs(temp_delta) / 15.0))
        else:
            acceleration = q10 ** (temp_delta / 10.0)

        if is_danger_zone:
            acceleration *= category_info['danger_zone_rate']

        effective_shelf_life = base_shelf_life / max(0.2, acceleration)

    # Packaging bonus / penalty
    pkg_multiplier = PACKAGING_PROTECTION_MULTIPLIERS.get(packaging_type, 1.0)
    total_expected_life = effective_shelf_life * pkg_multiplier * (initial_freshness_rating / 10.0)

    # Remaining hours calculation
    remaining_hours = max(0.0, total_expected_life - hours_since_prepared)

    # Freshness score (0.0 to 10.0)
    if total_expected_life > 0:
        fraction_remaining = remaining_hours / total_expected_life
        freshness_score = round(fraction_remaining * initial_freshness_rating, 2)
    else:
        freshness_score = 0.0

    # Risk categorization
    if remaining_hours <= 2.0 or freshness_score < 3.0:
        spoilage_risk = 'CRITICAL'
        rescue_priority = 'CRITICAL'
        recommended_action = 'Emergency rescue! Dispatch courier immediately or route to closest nearby kitchen within 90 minutes.'
    elif remaining_hours <= 6.0 or freshness_score < 5.5:
        spoilage_risk = 'HIGH'
        rescue_priority = 'HIGH'
        recommended_action = 'High priority. Schedule pickup within 2-3 hours with insulated thermal containers.'
    elif remaining_hours <= 18.0 or freshness_score < 7.5:
        spoilage_risk = 'MODERATE'
        rescue_priority = 'MEDIUM'
        recommended_action = 'Standard rescue. Allocate to evening distribution or next-morning breakfast shelter.'
    else:
        spoilage_risk = 'LOW'
        rescue_priority = 'NORMAL'
        recommended_action = 'Stable shelf life. Suitable for regional pantry consolidation or standard routing.'

    return {
        'food_type': food_type,
        'storage_condition': storage_condition,
        'effective_temp_celsius': round(effective_temp, 1),
        'packaging_type': packaging_type,
        'hours_elapsed': round(hours_since_prepared, 1),
        'total_expected_life_hours': round(total_expected_life, 1),
        'predicted_safe_hours': round(remaining_hours, 1),
        'freshness_score': freshness_score,
        'spoilage_risk': spoilage_risk,
        'rescue_priority': rescue_priority,
        'recommended_action': recommended_action,
        'is_safe_for_consumption': remaining_hours > 0.5 and freshness_score >= 3.0
    }
