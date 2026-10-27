-- =====================================================================
-- FOOD RESCUE PLATFORM - SEED DATA
-- Populate realistic initial data for development and demonstration
-- =====================================================================

USE food_rescue_db;

-- 1. Insert Food Categories
INSERT INTO food_categories (id, name, code, description, default_shelf_life_hours, recommended_temp_celsius, co2_factor_per_kg, water_factor_per_liter) VALUES
(1, 'Cooked Meals & Curries', 'COOKED_MEALS', 'Prepared banquet, buffet and restaurant meals requiring warm or rapid cold chain', 6, 4.0, 3.20, 1500.00),
(2, 'Bakery & Pastries', 'BAKERY', 'Surplus bread, croissants, baguettes, muffins from artisan bakeries', 24, 20.0, 1.80, 800.00),
(3, 'Fresh Fruits & Vegetables', 'PRODUCE', 'Ugly or surplus fruits, greens and root vegetables from markets', 72, 8.0, 1.20, 600.00),
(4, 'Dairy & Cold Beverages', 'DAIRY', 'Milk, yogurt, cheeses near sell-by date', 18, 3.0, 4.50, 2200.00),
(5, 'Packaged & Dry Staples', 'PACKAGED', 'Rice, pulses, canned beans, cereals with intact packaging', 720, 22.0, 2.10, 950.00);

-- 2. Insert Users (Donors, Volunteers, Shelters, Admins)
-- Passwords are representative bcrypt hashes for 'password123'
INSERT INTO users (id, name, email, password_hash, role, organization_name, organization_type, phone, address, city, postal_code, latitude, longitude, is_verified) VALUES
(1, 'Platform Admin', 'admin@foodrescue.org', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'ADMIN', 'Food Rescue HQ', 'INDIVIDUAL', '+1 555-0100', '100 Green Planet Way', 'Metropolis', '10001', 40.7128000, -74.0060000, TRUE),

-- Donors
(2, 'Chef Marcus Vance', 'marcus@grandhotel.com', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'DONOR', 'Grand Vista Hotel & Banquet', 'HOTEL', '+1 555-0121', '450 Luxury Avenue', 'Metropolis', '10002', 40.7258000, -73.9980000, TRUE),
(3, 'Elena Rostova', 'elena@artisanbakery.com', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'DONOR', 'Crust & Crumb Artisan Bakery', 'BAKERY', '+1 555-0132', '88 Sourdough Street', 'Metropolis', '10003', 40.7350000, -74.0010000, TRUE),
(4, 'David Sterling', 'manager@harvestmarket.com', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'DONOR', 'Harvest Fresh Supermarket', 'SUPERMARKET', '+1 555-0143', '1240 Market Plaza', 'Metropolis', '10004', 40.7410000, -73.9890000, TRUE),

-- Shelters & NGOs
(5, 'Sister Mary Catherine', 'director@hopekitchen.org', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'SHELTER', 'Hope Community Food Pantry', 'COMMUNITY_KITCHEN', '+1 555-0154', '312 Shelter Blvd', 'Metropolis', '10005', 40.7180000, -74.0110000, TRUE),
(6, 'Tariq Al-Mansoor', 'contact@havenrefuge.org', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'SHELTER', 'Haven Family Shelter', 'SHELTER', '+1 555-0165', '710 Compassion St', 'Metropolis', '10006', 40.7290000, -74.0040000, TRUE),

-- Volunteers
(7, 'Alex Rivera', 'alex.rider@rescuevolunteers.org', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'VOLUNTEER', 'Independent Courier', 'INDIVIDUAL', '+1 555-0176', '12 Rider Way', 'Metropolis', '10007', 40.7220000, -74.0020000, TRUE),
(8, 'Samantha Green', 'sam.green@ecoriders.org', '$2b$10$wEkgz1zLq5T6Z2B9s9K9YeE8Jg7N6n5K2K5J6L7M8N9O0P1Q2R3S4', 'VOLUNTEER', 'Cargo Bike Rescue Team', 'INDIVIDUAL', '+1 555-0187', '94 Velocity Rd', 'Metropolis', '10008', 40.7300000, -73.9950000, TRUE);

-- 3. Insert Food Listings
INSERT INTO food_listings (
    id, donor_id, category_id, title, description, food_type, dietary_type,
    quantity_kg, estimated_servings, storage_condition, packaging_type,
    cooked_or_prepared_at, expires_at, predicted_safe_hours, freshness_score,
    rescue_priority, pickup_address, pickup_city, pickup_latitude, pickup_longitude,
    pickup_window_start, pickup_window_end, pickup_instructions, status
) VALUES
(
    1, 2, 1, 'Buffet Surplus: Herb Roasted Chicken & Steamed Vegetables',
    'Cooked today at 12:30 PM for corporate luncheon. Kept strictly above 65°C in chafing dishes, then blast chilled.',
    'COOKED_MEALS', 'NON_VEGETARIAN', 24.50, 65, 'REFRIGERATED', 'SEALED_CONTAINERS',
    DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 4 HOUR), 5.5, 9.40,
    'CRITICAL', '450 Luxury Avenue (Loading Bay 2)', 'Metropolis', 40.7258000, -73.9980000,
    NOW(), DATE_ADD(NOW(), INTERVAL 3 HOUR), 'Ring loading dock bell and ask for Sous Chef Carlos', 'AVAILABLE'
),
(
    2, 3, 2, 'Artisan Sourdough Batards & Croissant Assortment',
    'Baked fresh this morning at 5:00 AM. Unsold surplus from our flagship store counter.',
    'BAKERY', 'VEGETARIAN', 18.00, 50, 'AMBIENT', 'BOXES',
    DATE_SUB(NOW(), INTERVAL 8 HOUR), DATE_ADD(NOW(), INTERVAL 20 HOUR), 22.0, 9.80,
    'MEDIUM', '88 Sourdough Street (Side Door)', 'Metropolis', 40.7350000, -74.0010000,
    NOW(), DATE_ADD(NOW(), INTERVAL 5 HOUR), 'Pick up from back alley pickup door, password: RESCUE', 'AVAILABLE'
),
(
    3, 4, 3, 'Organic Spinach, Tomatoes & Crisp Apples',
    'Surplus seasonal produce slightly off-cosmetic standard but 100% wholesome and edible.',
    'RAW_PRODUCE', 'VEGAN', 55.00, 140, 'REFRIGERATED', 'TRAYS',
    DATE_SUB(NOW(), INTERVAL 24 HOUR), DATE_ADD(NOW(), INTERVAL 48 HOUR), 46.0, 8.90,
    'NORMAL', '1240 Market Plaza (Service Bay C)', 'Metropolis', 40.7410000, -73.9890000,
    NOW(), DATE_ADD(NOW(), INTERVAL 8 HOUR), 'Inquire at produce receiving desk', 'AVAILABLE'
),
(
    4, 2, 1, 'Vegetable Biryani with Cucumber Raita',
    'Prepared for evening banquet. Cooled rapidly and placed in sealed gastronorm food containers.',
    'COOKED_MEALS', 'VEGETARIAN', 30.00, 85, 'REFRIGERATED', 'SEALED_CONTAINERS',
    DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_ADD(NOW(), INTERVAL 3 HOUR), 4.2, 9.10,
    'HIGH', '450 Luxury Avenue', 'Metropolis', 40.7258000, -73.9980000,
    DATE_SUB(NOW(), INTERVAL 1 HOUR), DATE_ADD(NOW(), INTERVAL 2 HOUR), 'Collect from kitchen corridor entrance', 'CLAIMED'
),
(
    5, 4, 4, 'Pasteurized Greek Yogurt & Whole Milk Cartons',
    'Refrigerated dairy stock 2 days prior to sell-by date. Kept at 2°C uninterrupted.',
    'DAIRY', 'VEGETARIAN', 40.00, 100, 'REFRIGERATED', 'BOXES',
    DATE_SUB(NOW(), INTERVAL 12 HOUR), DATE_ADD(NOW(), INTERVAL 36 HOUR), 34.0, 9.60,
    'NORMAL', '1240 Market Plaza', 'Metropolis', 40.7410000, -73.9890000,
    DATE_SUB(NOW(), INTERVAL 4 HOUR), NOW(), 'Dairy manager sign-off required', 'DELIVERED'
);

-- 4. Insert Rescue Claims
INSERT INTO rescue_claims (id, listing_id, shelter_id, volunteer_id, status, requested_at, assigned_at, picked_up_at, delivered_at, estimated_distance_km, delivery_notes) VALUES
(
    1, 4, 5, 7, 'IN_TRANSIT',
    DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_SUB(NOW(), INTERVAL 30 MINUTE), DATE_SUB(NOW(), INTERVAL 10 MINUTE), NULL,
    3.4, 'Alex has picked up the container with insulated thermal carrier. ETA 15 mins to Hope Pantry.'
),
(
    2, 5, 6, 8, 'DELIVERED',
    DATE_SUB(NOW(), INTERVAL 4 HOUR), DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR),
    2.1, 'Successfully received by Haven Shelter cold storage unit. Handover complete.'
);

-- 5. Insert Quality Check Logs
INSERT INTO food_quality_checks (listing_id, inspector_id, stage, temperature_celsius, smell_and_appearance_ok, packaging_intact, hygiene_rating, notes) VALUES
(4, 7, 'VOLUNTEER_PICKUP', 3.8, TRUE, TRUE, 5, 'Temperature verified with infrared probe (3.8°C). Containers completely sealed with tamper tapes.'),
(5, 8, 'SHELTER_DELIVERY', 3.2, TRUE, TRUE, 5, 'All cartons inspected, cold chain maintained with dry ice packs.');

-- 6. Insert Impact Metrics (Completed rescues)
INSERT INTO impact_metrics (listing_id, kg_rescued, meals_provided, co2_saved_kg, water_saved_liters, financial_value_saved) VALUES
(5, 40.00, 100, 180.00, 88000.00, 240.00);
