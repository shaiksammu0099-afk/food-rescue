/**
 * AI Integration & Predictive Endpoints Controller
 */

const { predictShelfLife, smartMatch, calculateImpact } = require('../services/pythonBridge');
const { mockDb } = require('../config/db');

exports.predictShelfLife = async (req, res, next) => {
  try {
    const result = await predictShelfLife(req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.smartMatch = async (req, res, next) => {
  try {
    let { donation, shelters, volunteers } = req.body;

    if (!donation && req.body.donation_id) {
      donation = mockDb.listings.find(l => l.id === parseInt(req.body.donation_id, 10));
    }
    if (!shelters || shelters.length === 0) {
      shelters = mockDb.users.filter(u => u.role === 'SHELTER');
    }
    if (!volunteers || volunteers.length === 0) {
      volunteers = mockDb.users.filter(u => u.role === 'VOLUNTEER');
    }

    const result = await smartMatch(donation || {}, shelters, volunteers);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

exports.calculateImpact = async (req, res, next) => {
  try {
    const { quantity_kg, food_type } = req.body;
    const result = await calculateImpact(quantity_kg, food_type);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
