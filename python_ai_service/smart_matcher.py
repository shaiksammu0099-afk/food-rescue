"""
Food Rescue AI Service - Smart Matching & Logistics Optimization
Domain: Intelligent routing and matching of surplus food donations with recipient NGOs/shelters
and active volunteer couriers based on distance (Haversine formula), capacity, dietary needs, and urgency.
"""

import math

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    R = 6371.0 # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)


def match_donation_with_recipients(donation: dict, shelters: list, volunteers: list = None) -> dict:
    """
    Ranks shelters and assigns best candidate volunteers based on a multi-criteria scoring function:
    - Distance proximity (40%)
    - Capacity fit (25%)
    - Dietary preference alignment (20%)
    - Urgency / speed match (15%)
    """
    don_lat = float(donation.get('latitude', 40.7128))
    don_lon = float(donation.get('longitude', -74.0060))
    servings = int(donation.get('estimated_servings', 50))
    dietary = donation.get('dietary_type', 'ANY')
    priority = donation.get('rescue_priority', 'NORMAL')

    priority_weight_multiplier = {
        'CRITICAL': 1.4,
        'HIGH': 1.2,
        'MEDIUM': 1.0,
        'NORMAL': 0.9
    }.get(priority, 1.0)

    ranked_shelters = []

    for shelter in shelters:
        sh_lat = float(shelter.get('latitude', don_lat))
        sh_lon = float(shelter.get('longitude', don_lon))
        distance_km = haversine_distance(don_lat, don_lon, sh_lat, sh_lon)

        # Distance score: Max score within 5km, diminishes towards 30km
        distance_score = max(0.0, 100.0 - (distance_km * 3.3))

        # Capacity score: Ideal if shelter capacity is between 0.8x and 3x of donation servings
        shelter_cap = int(shelter.get('daily_capacity_servings', 100))
        if shelter_cap >= servings:
            capacity_score = 100.0 if shelter_cap <= servings * 2.5 else 85.0
        else:
            capacity_score = max(20.0, (shelter_cap / max(1, servings)) * 80.0)

        # Dietary preference score
        shelter_pref = shelter.get('accepted_dietary_type', 'ANY')
        if shelter_pref in ['ANY', dietary] or dietary == 'VEGAN':
            dietary_score = 100.0
        elif shelter_pref == 'VEGETARIAN' and dietary == 'NON_VEGETARIAN':
            dietary_score = 0.0 # Incompatible
        else:
            dietary_score = 75.0

        # Composite score
        raw_composite = (
            (distance_score * 0.40) +
            (capacity_score * 0.25) +
            (dietary_score * 0.20) +
            (min(100.0, 70.0 * priority_weight_multiplier) * 0.15)
        )

        final_match_pct = round(min(99.0, max(5.0, raw_composite)), 1)

        ranked_shelters.append({
            'shelter_id': shelter.get('id'),
            'shelter_name': shelter.get('organization_name') or shelter.get('name'),
            'distance_km': distance_km,
            'match_score': final_match_pct,
            'capacity_servings': shelter_cap,
            'dietary_compatible': dietary_score > 0,
            'estimated_transit_mins': round(distance_km * 4.5, 0), # Urban transit approx
            'phone': shelter.get('phone', 'N/A'),
            'address': shelter.get('address', 'N/A')
        })

    # Sort shelters by match score descending
    ranked_shelters.sort(key=lambda s: s['match_score'], reverse=True)

    # Rank volunteers if provided
    ranked_volunteers = []
    if volunteers:
        for vol in volunteers:
            vol_lat = float(vol.get('latitude', don_lat))
            vol_lon = float(vol.get('longitude', don_lon))
            vol_dist_to_donor = haversine_distance(vol_lat, vol_lon, don_lat, don_lon)
            
            # Volunteers closer to donor are prioritized
            vol_score = max(10.0, round(100.0 - (vol_dist_to_donor * 5.0), 1))
            
            ranked_volunteers.append({
                'volunteer_id': vol.get('id'),
                'volunteer_name': vol.get('name'),
                'distance_to_donor_km': vol_dist_to_donor,
                'readiness_score': vol_score,
                'vehicle_type': vol.get('vehicle_type', 'Bicycle / Cargo Bike'),
                'phone': vol.get('phone', 'N/A')
            })
        ranked_volunteers.sort(key=lambda v: v['readiness_score'], reverse=True)

    return {
        'donation_id': donation.get('id'),
        'total_shelters_evaluated': len(shelters),
        'recommended_shelter': ranked_shelters[0] if ranked_shelters else None,
        'alternate_shelters': ranked_shelters[1:4] if len(ranked_shelters) > 1 else [],
        'recommended_volunteer': ranked_volunteers[0] if ranked_volunteers else None,
        'alternate_volunteers': ranked_volunteers[1:3] if len(ranked_volunteers) > 1 else []
    }
