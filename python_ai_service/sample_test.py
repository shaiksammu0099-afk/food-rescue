"""
Food Rescue AI Service - Standalone Test & Demo Runner
Runs test evaluations for shelf life prediction, smart matching, and environmental impact.
"""

from shelf_life_model import calculate_shelf_life
from smart_matcher import match_donation_with_recipients
from impact_calculator import calculate_impact
import json

def run_tests():
    print("=" * 70)
    print("       FOOD RESCUE PLATFORM - AI MODULE DEMONSTRATION")
    print("=" * 70)

    # 1. Test Shelf Life Prediction
    print("\n--- 1. Perishable Shelf Life & Freshness Prediction ---")
    test_cases = [
        {
            'name': 'Buffet Roast Chicken (Refrigerated 4°C, 2h old)',
            'params': {'food_type': 'COOKED_MEALS', 'storage_condition': 'REFRIGERATED', 'ambient_temp_celsius': 4.0, 'packaging_type': 'SEALED_CONTAINERS', 'hours_since_prepared': 2.0}
        },
        {
            'name': 'Buffet Roast Chicken (Left in Ambient Room Temp 28°C, 3h old)',
            'params': {'food_type': 'COOKED_MEALS', 'storage_condition': 'AMBIENT', 'ambient_temp_celsius': 28.0, 'packaging_type': 'LOOSE_WRAPPED', 'hours_since_prepared': 3.0}
        },
        {
            'name': 'Fresh Sourdough Bread (Room Temp 20°C, 6h old)',
            'params': {'food_type': 'BAKERY', 'storage_condition': 'AMBIENT', 'ambient_temp_celsius': 20.0, 'packaging_type': 'BOXES', 'hours_since_prepared': 6.0}
        }
    ]

    for tc in test_cases:
        res = calculate_shelf_life(**tc['params'])
        print(f"\nScenario: {tc['name']}")
        print(f" -> Safe Remaining Hours: {res['predicted_safe_hours']} hrs")
        print(f" -> Freshness Score:      {res['freshness_score']}/10.0")
        print(f" -> Rescue Priority:      {res['rescue_priority']}")
        print(f" -> Recommended Action:   {res['recommended_action']}")

    # 2. Test Smart Matcher
    print("\n\n--- 2. Smart NGO & Volunteer Logistics Matching ---")
    donation = {
        'id': 101,
        'title': '25kg Vegetable Biryani & Gravy',
        'latitude': 40.7258,
        'longitude': -73.9980,
        'estimated_servings': 70,
        'dietary_type': 'VEGETARIAN',
        'rescue_priority': 'HIGH'
    }

    shelters = [
        {'id': 1, 'organization_name': 'Hope Community Food Pantry', 'latitude': 40.7180, 'longitude': -74.0110, 'daily_capacity_servings': 120, 'accepted_dietary_type': 'ANY', 'phone': '555-0154', 'address': '312 Shelter Blvd'},
        {'id': 2, 'organization_name': 'Haven Family Shelter', 'latitude': 40.7290, 'longitude': -74.0040, 'daily_capacity_servings': 80, 'accepted_dietary_type': 'VEGETARIAN', 'phone': '555-0165', 'address': '710 Compassion St'},
        {'id': 3, 'organization_name': 'Uptown Youth Kitchen', 'latitude': 40.7950, 'longitude': -73.9500, 'daily_capacity_servings': 200, 'accepted_dietary_type': 'ANY', 'phone': '555-0199', 'address': '890 Uptown Ave'}
    ]

    volunteers = [
        {'id': 1, 'name': 'Alex Rivera (Cargo Bike)', 'latitude': 40.7240, 'longitude': -73.9990, 'phone': '555-0176'},
        {'id': 2, 'name': 'Samantha Green (Eco Van)', 'latitude': 40.7300, 'longitude': -73.9950, 'phone': '555-0187'}
    ]

    match_res = match_donation_with_recipients(donation, shelters, volunteers)
    print(f"Top Recommended Shelter: {match_res['recommended_shelter']['shelter_name']}")
    print(f" -> Match Score: {match_res['recommended_shelter']['match_score']}% | Distance: {match_res['recommended_shelter']['distance_km']} km")
    print(f"Top Recommended Volunteer: {match_res['recommended_volunteer']['volunteer_name']}")
    print(f" -> Readiness Score: {match_res['recommended_volunteer']['readiness_score']}% | Distance to donor: {match_res['recommended_volunteer']['distance_to_donor_km']} km")

    # 3. Test Environmental Impact
    print("\n\n--- 3. Environmental & Humanitarian Impact Estimation ---")
    impact = calculate_impact(quantity_kg=50.0, food_type='COOKED_MEALS')
    print(f"Rescued: {impact['quantity_kg']} kg ({impact['food_type']})")
    print(f" -> Meals Provided:      {impact['meals_provided']} meals")
    print(f" -> CO2 Emissions Saved: {impact['co2_saved_kg']} kg CO2e")
    print(f" -> Water Conserved:     {impact['water_saved_liters']:,} liters")
    print(f" -> Economic Value:      ${impact['financial_value_usd']}")
    print(f" -> Equivalent To:       {impact['equivalents']['passenger_car_km_prevented']} km car driving avoided")

    print("\n" + "=" * 70)
    print("AI Model test suite executed successfully!")
    print("=" * 70)

if __name__ == '__main__':
    run_tests()
