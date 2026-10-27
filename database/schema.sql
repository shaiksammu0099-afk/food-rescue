-- =====================================================================
-- FOOD RESCUE PLATFORM - DATABASE SCHEMA
-- Domain: Surplus Food Rescue, Cold Chain Logistics, NGO Distribution & Impact Tracking
-- Engine: MySQL 8.0+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS food_rescue_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE food_rescue_db;

-- Drop tables if existing (in reverse dependency order)
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS impact_metrics;
DROP TABLE IF EXISTS food_quality_checks;
DROP TABLE IF EXISTS rescue_claims;
DROP TABLE IF EXISTS food_items;
DROP TABLE IF EXISTS food_listings;
DROP TABLE IF EXISTS food_categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USERS TABLE
-- Roles: DONOR (restaurant, supermarket, bakery, caterer),
--        VOLUNTEER (rider, driver, rescuer),
--        SHELTER (food bank, NGO, orphanage, community kitchen),
--        ADMIN (platform manager)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('DONOR', 'VOLUNTEER', 'SHELTER', 'ADMIN') NOT NULL DEFAULT 'DONOR',
    organization_name VARCHAR(200) NULL,
    organization_type ENUM('RESTAURANT', 'SUPERMARKET', 'BAKERY', 'HOTEL', 'NGO', 'SHELTER', 'COMMUNITY_KITCHEN', 'INDIVIDUAL') DEFAULT 'RESTAURANT',
    phone VARCHAR(30) NOT NULL,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL DEFAULT 12.9715987,
    longitude DECIMAL(10, 7) NOT NULL DEFAULT 77.5945627,
    is_verified BOOLEAN DEFAULT FALSE,
    fssai_license_no VARCHAR(50) NULL, -- Food safety license identifier
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_city (city),
    INDEX idx_user_lat_long (latitude, longitude)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. FOOD CATEGORIES TABLE
-- Includes average perishability baseline & CO2 emission factors per kg
-- ---------------------------------------------------------------------
CREATE TABLE food_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NULL,
    default_shelf_life_hours INT NOT NULL DEFAULT 24,
    recommended_temp_celsius DECIMAL(4, 1) DEFAULT 4.0,
    co2_factor_per_kg DECIMAL(5, 2) DEFAULT 2.50, -- kg of CO2 equivalent saved per kg rescued
    water_factor_per_liter DECIMAL(6, 2) DEFAULT 1000.00 -- liters of water footprint saved per kg rescued
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. FOOD LISTINGS TABLE
-- Donations posted by Donors
-- ---------------------------------------------------------------------
CREATE TABLE food_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    food_type ENUM('COOKED_MEALS', 'BAKERY', 'RAW_PRODUCE', 'DAIRY', 'PACKAGED_GOODS', 'BEVERAGES') NOT NULL,
    dietary_type ENUM('VEGETARIAN', 'VEGAN', 'NON_VEGETARIAN', 'HALAL', 'KOSHER', 'ANY') DEFAULT 'VEGETARIAN',
    quantity_kg DECIMAL(8, 2) NOT NULL,
    estimated_servings INT NOT NULL,
    
    -- Quality & Cold-Chain attributes
    storage_condition ENUM('AMBIENT', 'REFRIGERATED', 'FROZEN', 'HOT_HOLDING') DEFAULT 'AMBIENT',
    packaging_type ENUM('SEALED_CONTAINERS', 'BOXES', 'TRAYS', 'LOOSE_WRAPPED', 'CANS') DEFAULT 'SEALED_CONTAINERS',
    cooked_or_prepared_at DATETIME NULL,
    expires_at DATETIME NOT NULL,
    
    -- AI Predicted Shelf Life & Quality Score
    predicted_safe_hours DECIMAL(5, 1) NULL,
    freshness_score DECIMAL(4, 2) DEFAULT 10.00, -- Score 0.0 to 10.0
    rescue_priority ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'NORMAL') DEFAULT 'NORMAL',
    
    -- Logistics & Location
    pickup_address VARCHAR(255) NOT NULL,
    pickup_city VARCHAR(100) NOT NULL,
    pickup_latitude DECIMAL(10, 7) NOT NULL,
    pickup_longitude DECIMAL(10, 7) NOT NULL,
    pickup_window_start DATETIME NOT NULL,
    pickup_window_end DATETIME NOT NULL,
    pickup_instructions TEXT,
    
    -- Lifecycle Status
    status ENUM('AVAILABLE', 'MATCHED', 'CLAIMED', 'PICKED_UP', 'DELIVERED', 'EXPIRED', 'CANCELLED') DEFAULT 'AVAILABLE',
    image_url VARCHAR(500) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (donor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES food_categories(id),
    INDEX idx_listing_status (status),
    INDEX idx_listing_expiry (expires_at),
    INDEX idx_listing_priority (rescue_priority),
    INDEX idx_listing_coords (pickup_latitude, pickup_longitude)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. RESCUE CLAIMS & DISPATCH TABLE
-- Connects food listings to Shelters (recipient) & Volunteers (courier)
-- ---------------------------------------------------------------------
CREATE TABLE rescue_claims (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    shelter_id INT NOT NULL,
    volunteer_id INT NULL,
    status ENUM('REQUESTED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'REJECTED', 'CANCELLED') DEFAULT 'REQUESTED',
    
    -- Dispatch tracking timestamps
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP NULL,
    picked_up_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    estimated_distance_km DECIMAL(6, 2) NULL,
    delivery_notes TEXT NULL,
    recipient_signature_url VARCHAR(500) NULL,
    
    FOREIGN KEY (listing_id) REFERENCES food_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (shelter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (volunteer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_claim_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. FOOD QUALITY & SAFETY LOGS TABLE
-- Food safety logs recorded during pickup & delivery for compliance
-- ---------------------------------------------------------------------
CREATE TABLE food_quality_checks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL,
    inspector_id INT NOT NULL, -- Volunteer or Donor who inspected
    stage ENUM('DONOR_DISPATCH', 'VOLUNTEER_PICKUP', 'SHELTER_DELIVERY') NOT NULL,
    temperature_celsius DECIMAL(4, 1) NOT NULL,
    smell_and_appearance_ok BOOLEAN DEFAULT TRUE,
    packaging_intact BOOLEAN DEFAULT TRUE,
    hygiene_rating INT CHECK (hygiene_rating BETWEEN 1 AND 5),
    notes TEXT,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (listing_id) REFERENCES food_listings(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. IMPACT METRICS TABLE
-- Tracks environmental and humanitarian impact of rescued food
-- ---------------------------------------------------------------------
CREATE TABLE impact_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    listing_id INT NOT NULL UNIQUE,
    kg_rescued DECIMAL(8, 2) NOT NULL,
    meals_provided INT NOT NULL,
    co2_saved_kg DECIMAL(8, 2) NOT NULL,
    water_saved_liters DECIMAL(10, 2) NOT NULL,
    financial_value_saved DECIMAL(10, 2) DEFAULT 0.00,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (listing_id) REFERENCES food_listings(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. AUDIT LOGS TABLE
-- Traceability for food health safety and chain of custody
-- ---------------------------------------------------------------------
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- VIEWS: PLATFORM SUMMARY VIEW
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW v_active_rescue_board AS
SELECT 
    fl.id AS listing_id,
    fl.title,
    fl.food_type,
    fl.dietary_type,
    fl.quantity_kg,
    fl.estimated_servings,
    fl.rescue_priority,
    fl.status AS listing_status,
    fl.expires_at,
    TIMESTAMPDIFF(MINUTE, NOW(), fl.expires_at) AS minutes_until_expiry,
    fl.pickup_address,
    fl.pickup_city,
    u_donor.name AS donor_name,
    u_donor.organization_name AS donor_org,
    u_donor.phone AS donor_phone,
    rc.id AS claim_id,
    rc.status AS claim_status,
    u_shelter.organization_name AS recipient_shelter,
    u_vol.name AS volunteer_courier
FROM food_listings fl
JOIN users u_donor ON fl.donor_id = u_donor.id
LEFT JOIN rescue_claims rc ON fl.id = rc.listing_id AND rc.status NOT IN ('CANCELLED', 'REJECTED')
LEFT JOIN users u_shelter ON rc.shelter_id = u_shelter.id
LEFT JOIN users u_vol ON rc.volunteer_id = u_vol.id;
