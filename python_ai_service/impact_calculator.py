"""
Food Rescue AI Service - Environmental & Humanitarian Impact Engine
Domain: Calculates GHG emissions avoided (CO2 equivalent), water footprint saved,
meals served, and economic food waste diversion value based on UN FAO benchmarks.
"""

# GHG emissions factor (kg CO2e per kg food saved) by category
# Sourced from FAO & WRAP food waste carbon metrics
CO2_FACTORS = {
    'COOKED_MEALS': 3.25,
    'BAKERY': 1.85,
    'RAW_PRODUCE': 1.20,
    'DAIRY': 4.50,
    'PACKAGED_GOODS': 2.10
}

# Embedded water footprint in liters per kg of food
WATER_FACTORS = {
    'COOKED_MEALS': 1600.0,
    'BAKERY': 900.0,
    'RAW_PRODUCE': 550.0,
    'DAIRY': 2400.0,
    'PACKAGED_GOODS': 1100.0
}

# Average financial retail/wholesale value per kg ($ USD)
FINANCIAL_VALUE_PER_KG = {
    'COOKED_MEALS': 7.50,
    'BAKERY': 5.00,
    'RAW_PRODUCE': 3.50,
    'DAIRY': 6.00,
    'PACKAGED_GOODS': 4.00
}

AVERAGE_PORTION_KG = 0.40 # 400 grams per nutritional meal portion


def calculate_impact(quantity_kg: float, food_type: str = 'COOKED_MEALS') -> dict:
    """
    Computes environmental and community impact for rescued food.
    """
    qty = max(0.0, float(quantity_kg))
    category = food_type.upper() if food_type else 'COOKED_MEALS'

    co2_factor = CO2_FACTORS.get(category, 2.5)
    water_factor = WATER_FACTORS.get(category, 1200.0)
    value_factor = FINANCIAL_VALUE_PER_KG.get(category, 5.0)

    co2_saved = round(qty * co2_factor, 2)
    water_saved = round(qty * water_factor, 2)
    meals_provided = int(round(qty / AVERAGE_PORTION_KG))
    financial_value = round(qty * value_factor, 2)

    # Tangible real-world equivalencies:
    # 1 km driven in average passenger car = ~0.20 kg CO2
    car_kms_offset = round(co2_saved / 0.20, 1)
    
    # 1 shower = ~65 liters of water
    showers_saved = int(round(water_saved / 65.0))
    
    # 1 tree absorbs ~22 kg CO2 per year
    trees_year_equivalent = round(co2_saved / 22.0, 2)

    return {
        'quantity_kg': qty,
        'food_type': category,
        'meals_provided': meals_provided,
        'co2_saved_kg': co2_saved,
        'water_saved_liters': water_saved,
        'financial_value_usd': financial_value,
        'equivalents': {
            'passenger_car_km_prevented': car_kms_offset,
            'showers_water_saved': showers_saved,
            'trees_planted_year_equivalent': trees_year_equivalent
        }
    }
