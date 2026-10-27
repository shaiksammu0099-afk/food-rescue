/**
 * Food Donations & Listings Controller
 */

const { query, isMySQLConnected, mockDb } = require('../config/db');
const { predictShelfLife } = require('../services/pythonBridge');

exports.getCategories = async (req, res, next) => {
  try {
    if (isMySQLConnected()) {
      const rows = await query('SELECT * FROM food_categories');
      return res.json({ success: true, data: rows });
    }
    res.json({ success: true, data: mockDb.categories });
  } catch (err) {
    next(err);
  }
};

exports.getListings = async (req, res, next) => {
  try {
    const { status, food_type, priority, donor_id } = req.query;

    if (isMySQLConnected()) {
      let sql = `
        SELECT fl.*, fc.name AS category_name, u.name AS donor_name, u.phone AS donor_phone
        FROM food_listings fl
        JOIN food_categories fc ON fl.category_id = fc.id
        JOIN users u ON fl.donor_id = u.id
        WHERE 1=1
      `;
      const params = [];
      if (status) {
        sql += ' AND fl.status = ?';
        params.push(status.toUpperCase());
      }
      if (food_type) {
        sql += ' AND fl.food_type = ?';
        params.push(food_type.toUpperCase());
      }
      if (priority) {
        sql += ' AND fl.rescue_priority = ?';
        params.push(priority.toUpperCase());
      }
      if (donor_id) {
        sql += ' AND fl.donor_id = ?';
        params.push(donor_id);
      }
      sql += ' ORDER BY fl.created_at DESC';

      const rows = await query(sql, params);
      return res.json({ success: true, count: rows.length, data: rows });
    }

    let items = [...mockDb.listings];
    if (status) items = items.filter(i => i.status.toUpperCase() === status.toUpperCase());
    if (food_type) items = items.filter(i => i.food_type.toUpperCase() === food_type.toUpperCase());
    if (priority) items = items.filter(i => i.rescue_priority.toUpperCase() === priority.toUpperCase());
    if (donor_id) items = items.filter(i => Number(i.donor_id) === Number(donor_id));

    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    next(err);
  }
};

exports.getListingById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isMySQLConnected()) {
      const rows = await query(`
        SELECT fl.*, fc.name AS category_name, u.name AS donor_name, u.organization_name AS donor_org, u.phone AS donor_phone
        FROM food_listings fl
        JOIN food_categories fc ON fl.category_id = fc.id
        JOIN users u ON fl.donor_id = u.id
        WHERE fl.id = ?
      `, [id]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Donation listing not found' });
      }
      return res.json({ success: true, data: rows[0] });
    }

    const item = mockDb.listings.find(l => l.id === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Donation listing not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
};

exports.createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      food_type,
      category_id,
      dietary_type,
      quantity_kg,
      estimated_servings,
      storage_condition,
      packaging_type,
      hours_since_prepared,
      pickup_address,
      pickup_city,
      pickup_instructions
    } = req.body;

    const donorId = req.user?.id || 2; // Default to donor if demo mode
    const donorUser = mockDb.users.find(u => u.id === donorId) || { name: 'Verified Donor Org', latitude: 40.7258, longitude: -73.9980 };

    // AI Prediction via Python Bridge or Algorithm
    const aiPrediction = await predictShelfLife({
      food_type: food_type || 'COOKED_MEALS',
      storage_condition: storage_condition || 'AMBIENT',
      ambient_temp_celsius: storage_condition === 'REFRIGERATED' ? 4 : (storage_condition === 'FROZEN' ? -18 : 22),
      packaging_type: packaging_type || 'SEALED_CONTAINERS',
      hours_since_prepared: hours_since_prepared || 1.0,
      initial_freshness_rating: 9.5
    });

    const safeHours = aiPrediction.predicted_safe_hours || 6;
    const expiresAt = new Date(Date.now() + safeHours * 3600000).toISOString();
    const pickupWindowEnd = new Date(Date.now() + Math.min(safeHours, 4) * 3600000).toISOString();

    const newListing = {
      id: Date.now(),
      donor_id: donorId,
      donor_name: donorUser.organization_name || donorUser.name,
      category_id: category_id || 1,
      category_name: food_type || 'Cooked Meals',
      title: title || 'Surplus Food Batch',
      description: description || 'Fresh surplus food available for community rescue',
      food_type: food_type || 'COOKED_MEALS',
      dietary_type: dietary_type || 'VEGETARIAN',
      quantity_kg: parseFloat(quantity_kg) || 15.0,
      estimated_servings: parseInt(estimated_servings, 10) || Math.round((parseFloat(quantity_kg) || 15) / 0.4),
      storage_condition: storage_condition || 'AMBIENT',
      packaging_type: packaging_type || 'SEALED_CONTAINERS',
      predicted_safe_hours: aiPrediction.predicted_safe_hours,
      freshness_score: aiPrediction.freshness_score,
      rescue_priority: aiPrediction.rescue_priority || 'NORMAL',
      pickup_address: pickup_address || donorUser.address || '450 Luxury Avenue',
      pickup_city: pickup_city || 'Metropolis',
      pickup_latitude: donorUser.latitude || 40.7258,
      pickup_longitude: donorUser.longitude || -73.9980,
      pickup_window_start: new Date().toISOString(),
      pickup_window_end: pickupWindowEnd,
      expires_at: expiresAt,
      pickup_instructions: pickup_instructions || 'Please collect at reception dock',
      status: 'AVAILABLE',
      ai_metadata: aiPrediction,
      created_at: new Date().toISOString()
    };

    if (isMySQLConnected()) {
      await query(`
        INSERT INTO food_listings (
          id, donor_id, category_id, title, description, food_type, dietary_type,
          quantity_kg, estimated_servings, storage_condition, packaging_type,
          predicted_safe_hours, freshness_score, rescue_priority,
          pickup_address, pickup_city, pickup_latitude, pickup_longitude,
          pickup_window_start, pickup_window_end, expires_at, pickup_instructions, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')
      `, [
        newListing.id, newListing.donor_id, newListing.category_id, newListing.title, newListing.description,
        newListing.food_type, newListing.dietary_type, newListing.quantity_kg, newListing.estimated_servings,
        newListing.storage_condition, newListing.packaging_type, newListing.predicted_safe_hours,
        newListing.freshness_score, newListing.rescue_priority, newListing.pickup_address,
        newListing.pickup_city, newListing.pickup_latitude, newListing.pickup_longitude,
        newListing.pickup_window_start, newListing.pickup_window_end, newListing.expires_at,
        newListing.pickup_instructions
      ]);
    } else {
      mockDb.listings.unshift(newListing);
    }

    res.status(201).json({
      success: true,
      message: 'Donation listing posted successfully with AI shelf-life assessment',
      data: newListing
    });
  } catch (err) {
    next(err);
  }
};

exports.updateListingStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isMySQLConnected()) {
      await query('UPDATE food_listings SET status = ? WHERE id = ?', [status, id]);
    } else {
      const item = mockDb.listings.find(l => l.id === id);
      if (item) item.status = status;
    }

    res.json({ success: true, message: `Listing ${id} status updated to ${status}` });
  } catch (err) {
    next(err);
  }
};
