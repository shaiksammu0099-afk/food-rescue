/**
 * Rescue Dispatch, Claims & Quality Check Controller
 */

const { query, isMySQLConnected, mockDb } = require('../config/db');
const { calculateImpact } = require('../services/pythonBridge');

exports.getClaims = async (req, res, next) => {
  try {
    const { status, shelter_id, volunteer_id } = req.query;

    if (isMySQLConnected()) {
      let sql = `
        SELECT rc.*, fl.title AS listing_title, fl.food_type, fl.quantity_kg, fl.pickup_address,
               u_shelter.organization_name AS shelter_name, u_vol.name AS volunteer_name
        FROM rescue_claims rc
        JOIN food_listings fl ON rc.listing_id = fl.id
        JOIN users u_shelter ON rc.shelter_id = u_shelter.id
        LEFT JOIN users u_vol ON rc.volunteer_id = u_vol.id
        WHERE 1=1
      `;
      const params = [];
      if (status) { sql += ' AND rc.status = ?'; params.push(status.toUpperCase()); }
      if (shelter_id) { sql += ' AND rc.shelter_id = ?'; params.push(shelter_id); }
      if (volunteer_id) { sql += ' AND rc.volunteer_id = ?'; params.push(volunteer_id); }

      const rows = await query(sql, params);
      return res.json({ success: true, count: rows.length, data: rows });
    }

    let claims = [...mockDb.claims];
    if (status) claims = claims.filter(c => c.status.toUpperCase() === status.toUpperCase());
    if (shelter_id) claims = claims.filter(c => Number(c.shelter_id) === Number(shelter_id));
    if (volunteer_id) claims = claims.filter(c => Number(c.volunteer_id) === Number(volunteer_id));

    res.json({ success: true, count: claims.length, data: claims });
  } catch (err) {
    next(err);
  }
};

exports.claimDonation = async (req, res, next) => {
  try {
    const { listing_id, shelter_id, volunteer_id, notes } = req.body;
    const finalShelterId = shelter_id || req.user?.id || 5;

    const listing = mockDb.listings.find(l => l.id === parseInt(listing_id, 10));
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    const shelter = mockDb.users.find(u => u.id === parseInt(finalShelterId, 10)) || { organization_name: 'Community Food Shelter' };
    const volunteer = volunteer_id ? mockDb.users.find(u => u.id === parseInt(volunteer_id, 10)) : mockDb.users.find(u => u.role === 'VOLUNTEER');

    const newClaim = {
      id: Date.now(),
      listing_id: parseInt(listing_id, 10),
      listing_title: listing.title,
      shelter_id: parseInt(finalShelterId, 10),
      shelter_name: shelter.organization_name,
      volunteer_id: volunteer ? volunteer.id : null,
      volunteer_name: volunteer ? volunteer.name : 'Pending Volunteer Assignment',
      status: volunteer ? 'ASSIGNED' : 'REQUESTED',
      estimated_distance_km: 2.8,
      delivery_notes: notes || 'Urgent pickup requested via portal',
      requested_at: new Date().toISOString(),
      assigned_at: volunteer ? new Date().toISOString() : null,
      picked_up_at: null,
      delivered_at: null
    };

    if (isMySQLConnected()) {
      await query(`
        INSERT INTO rescue_claims (id, listing_id, shelter_id, volunteer_id, status, delivery_notes, assigned_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [newClaim.id, newClaim.listing_id, newClaim.shelter_id, newClaim.volunteer_id, newClaim.status, newClaim.delivery_notes, newClaim.assigned_at]);

      await query('UPDATE food_listings SET status = "CLAIMED" WHERE id = ?', [listing_id]);
    } else {
      mockDb.claims.unshift(newClaim);
      listing.status = 'CLAIMED';
    }

    res.status(201).json({
      success: true,
      message: 'Donation claimed successfully. Rescue logistics workflow initiated!',
      data: newClaim
    });
  } catch (err) {
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const claimId = parseInt(req.params.id, 10);
    const { status, temperature_celsius, hygiene_rating, notes } = req.body;

    const claim = mockDb.claims.find(c => c.id === claimId);
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    claim.status = status;
    const listing = mockDb.listings.find(l => l.id === claim.listing_id);

    if (status === 'IN_TRANSIT') {
      claim.picked_up_at = new Date().toISOString();
      if (listing) listing.status = 'PICKED_UP';
    } else if (status === 'DELIVERED') {
      claim.delivered_at = new Date().toISOString();
      if (listing) listing.status = 'DELIVERED';

      // Automatically compute and log impact metrics upon delivery
      if (listing) {
        const impact = await calculateImpact(listing.quantity_kg, listing.food_type);
        mockDb.impact.unshift({
          id: Date.now(),
          listing_id: listing.id,
          kg_rescued: listing.quantity_kg,
          meals_provided: impact.meals_provided,
          co2_saved_kg: impact.co2_saved_kg,
          water_saved_liters: impact.water_saved_liters,
          financial_value_saved: impact.financial_value_usd,
          recorded_at: new Date().toISOString()
        });
      }
    }

    // Optional quality check log
    if (temperature_celsius) {
      mockDb.qualityChecks.unshift({
        id: Date.now(),
        listing_id: claim.listing_id,
        inspector_id: req.user?.id || claim.volunteer_id || 7,
        stage: status === 'DELIVERED' ? 'SHELTER_DELIVERY' : 'VOLUNTEER_PICKUP',
        temperature_celsius: parseFloat(temperature_celsius),
        smell_and_appearance_ok: true,
        packaging_intact: true,
        hygiene_rating: parseInt(hygiene_rating, 10) || 5,
        notes: notes || 'Quality and temperature verified',
        checked_at: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Rescue #${claimId} status updated to ${status}`,
      claim
    });
  } catch (err) {
    next(err);
  }
};
