/**
 * Environmental & Operations Analytics Controller
 */

const { query, isMySQLConnected, mockDb } = require('../config/db');

exports.getImpactOverview = async (req, res, next) => {
  try {
    let totalKgRescued = 0;
    let totalMeals = 0;
    let totalCo2 = 0;
    let totalWater = 0;
    let totalFinancial = 0;

    if (isMySQLConnected()) {
      const [sumRow] = await query(`
        SELECT 
          COALESCE(SUM(kg_rescued), 0) AS total_kg,
          COALESCE(SUM(meals_provided), 0) AS total_meals,
          COALESCE(SUM(co2_saved_kg), 0) AS total_co2,
          COALESCE(SUM(water_saved_liters), 0) AS total_water,
          COALESCE(SUM(financial_value_saved), 0) AS total_val
        FROM impact_metrics
      `);
      if (sumRow) {
        totalKgRescued = parseFloat(sumRow.total_kg);
        totalMeals = parseInt(sumRow.total_meals, 10);
        totalCo2 = parseFloat(sumRow.total_co2);
        totalWater = parseFloat(sumRow.total_water);
        totalFinancial = parseFloat(sumRow.total_val);
      }
    } else {
      mockDb.impact.forEach(item => {
        totalKgRescued += item.kg_rescued || 0;
        totalMeals += item.meals_provided || 0;
        totalCo2 += item.co2_saved_kg || 0;
        totalWater += item.water_saved_liters || 0;
        totalFinancial += item.financial_value_saved || 0;
      });
    }

    const availableCount = mockDb.listings.filter(l => l.status === 'AVAILABLE').length;
    const inTransitCount = mockDb.claims.filter(c => c.status === 'IN_TRANSIT').length;
    const completedCount = mockDb.claims.filter(c => c.status === 'DELIVERED').length;

    // Distribution by category
    const categoryBreakdown = {};
    mockDb.listings.forEach(l => {
      categoryBreakdown[l.food_type] = (categoryBreakdown[l.food_type] || 0) + l.quantity_kg;
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_kg_rescued: Math.round(totalKgRescued * 10) / 10,
          meals_provided: totalMeals,
          co2_saved_kg: Math.round(totalCo2 * 10) / 10,
          water_saved_liters: Math.round(totalWater),
          financial_value_saved: Math.round(totalFinancial),
          active_donations: availableCount,
          active_rescues_in_transit: inTransitCount,
          successful_deliveries: completedCount
        },
        category_distribution: categoryBreakdown,
        equivalents: {
          car_km_avoided: Math.round(totalCo2 / 0.2),
          household_showers_saved: Math.round(totalWater / 65),
          annual_trees_planted: Math.round((totalCo2 / 22) * 10) / 10
        },
        recent_activity: mockDb.claims.slice(0, 5)
      }
    });
  } catch (err) {
    next(err);
  }
};
