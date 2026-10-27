/**
 * Python AI Bridge Service
 * Communicates with the Python AI Microservice (Flask/FastAPI on port 5001).
 * Features automatic algorithmic fallback in JS if the Python service is offline.
 */

const PYTHON_URL = process.env.PYTHON_AI_URL || 'http://localhost:5001';

/**
 * Predict food shelf life & rescue priority
 */
async function predictShelfLife(payload) {
  try {
    const response = await fetch(`${PYTHON_URL}/api/ai/predict-shelf-life`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      const data = await response.json();
      return { ...data.data, source: 'PYTHON_AI_MICROSERVICE' };
    }
  } catch (err) {
    // Python service is not running or timed out; use built-in JS Arrhenius fallback
  }

  // JS Algorithmic Fallback
  return fallbackShelfLifeCalculation(payload);
}

/**
 * Smart Match Shelters & Volunteers
 */
async function smartMatch(donation, shelters, volunteers) {
  try {
    const response = await fetch(`${PYTHON_URL}/api/ai/smart-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donation, shelters, volunteers }),
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      const data = await response.json();
      return { ...data.data, source: 'PYTHON_AI_MICROSERVICE' };
    }
  } catch (err) {
    // Fallback
  }

  return fallbackSmartMatch(donation, shelters, volunteers);
}

/**
 * Calculate Environmental & Carbon Footprint Impact
 */
async function calculateImpact(quantityKg, foodType) {
  try {
    const response = await fetch(`${PYTHON_URL}/api/ai/calculate-impact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity_kg: quantityKg, food_type: foodType }),
      signal: AbortSignal.timeout(2000)
    });
    if (response.ok) {
      const data = await response.json();
      return { ...data.data, source: 'PYTHON_AI_MICROSERVICE' };
    }
  } catch (err) {
    // Fallback
  }

  return fallbackImpactCalculation(quantityKg, foodType);
}

// -------------------------------------------------------------
// Pure JavaScript Algorithmic Implementation (Mirrors Python AI)
// -------------------------------------------------------------
function fallbackShelfLifeCalculation({ food_type = 'COOKED_MEALS', storage_condition = 'AMBIENT', ambient_temp_celsius = 22, hours_since_prepared = 1, packaging_type = 'SEALED_CONTAINERS' }) {
  const baseHoursMap = { COOKED_MEALS: 24, BAKERY: 48, RAW_PRODUCE: 96, DAIRY: 36, PACKAGED_GOODS: 720 };
  const baseHours = baseHoursMap[food_type] || 24;

  let temp = Number(ambient_temp_celsius);
  if (storage_condition === 'FROZEN') temp = -18;
  else if (storage_condition === 'REFRIGERATED') temp = 4;
  else if (storage_condition === 'HOT_HOLDING') temp = 65;

  let decayFactor = 1.0;
  if (temp > 5 && temp < 60 && (food_type === 'COOKED_MEALS' || food_type === 'DAIRY')) {
    decayFactor = 2.5; // Microbial danger zone
  }

  const pkgFactor = packaging_type === 'SEALED_CONTAINERS' ? 1.2 : 0.9;
  const effectiveTotal = Math.max(2, (baseHours / decayFactor) * pkgFactor);
  const remaining = Math.max(0.2, effectiveTotal - Number(hours_since_prepared));
  const freshnessScore = Math.max(0.5, Math.min(10.0, (remaining / effectiveTotal) * 10));

  let priority = 'NORMAL';
  if (remaining <= 2.5) priority = 'CRITICAL';
  else if (remaining <= 6) priority = 'HIGH';
  else if (remaining <= 18) priority = 'MEDIUM';

  return {
    food_type,
    storage_condition,
    effective_temp_celsius: temp,
    predicted_safe_hours: Number(remaining.toFixed(1)),
    freshness_score: Number(freshnessScore.toFixed(1)),
    spoilage_risk: priority,
    rescue_priority: priority,
    recommended_action: remaining < 3 ? 'Urgent dispatch required: allocate to nearest food shelter.' : 'Standard logistics schedule.',
    source: 'JS_EMBEDDED_HEURISTIC_ENGINE'
  };
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

function fallbackSmartMatch(donation, shelters = [], volunteers = []) {
  const donLat = donation.latitude || 40.7258;
  const donLon = donation.longitude || -73.9980;

  const rankedShelters = shelters.map(s => {
    const dist = haversineDistance(donLat, donLon, s.latitude, s.longitude);
    const score = Math.max(10, Math.min(99, 100 - (dist * 4)));
    return {
      shelter_id: s.id,
      shelter_name: s.organization_name || s.name,
      distance_km: dist,
      match_score: Number(score.toFixed(1)),
      capacity_servings: s.daily_capacity_servings || 100,
      phone: s.phone,
      address: s.address
    };
  }).sort((a, b) => b.match_score - a.match_score);

  const rankedVolunteers = volunteers.map(v => {
    const dist = haversineDistance(donLat, donLon, v.latitude, v.longitude);
    const score = Math.max(10, Math.min(99, 100 - (dist * 5)));
    return {
      volunteer_id: v.id,
      volunteer_name: v.name,
      distance_to_donor_km: dist,
      readiness_score: Number(score.toFixed(1)),
      phone: v.phone
    };
  }).sort((a, b) => b.readiness_score - a.readiness_score);

  return {
    donation_id: donation.id,
    recommended_shelter: rankedShelters[0] || null,
    alternate_shelters: rankedShelters.slice(1, 4),
    recommended_volunteer: rankedVolunteers[0] || null,
    alternate_volunteers: rankedVolunteers.slice(1, 3),
    source: 'JS_EMBEDDED_HEURISTIC_ENGINE'
  };
}

function fallbackImpactCalculation(quantityKg, foodType = 'COOKED_MEALS') {
  const qty = Number(quantityKg) || 10;
  const co2Factors = { COOKED_MEALS: 3.25, BAKERY: 1.85, RAW_PRODUCE: 1.20, DAIRY: 4.50, PACKAGED_GOODS: 2.10 };
  const waterFactors = { COOKED_MEALS: 1600, BAKERY: 900, RAW_PRODUCE: 550, DAIRY: 2400, PACKAGED_GOODS: 1100 };

  const co2 = Number((qty * (co2Factors[foodType] || 2.5)).toFixed(2));
  const water = Number((qty * (waterFactors[foodType] || 1200)).toFixed(2));
  const meals = Math.round(qty / 0.4);
  const val = Number((qty * 6.5).toFixed(2));

  return {
    quantity_kg: qty,
    food_type: foodType,
    meals_provided: meals,
    co2_saved_kg: co2,
    water_saved_liters: water,
    financial_value_usd: val,
    equivalents: {
      passenger_car_km_prevented: Number((co2 / 0.2).toFixed(1)),
      showers_water_saved: Math.round(water / 65),
      trees_planted_year_equivalent: Number((co2 / 22).toFixed(2))
    },
    source: 'JS_EMBEDDED_HEURISTIC_ENGINE'
  };
}

module.exports = {
  predictShelfLife,
  smartMatch,
  calculateImpact
};
