const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/impact', analyticsController.getImpactOverview);

module.exports = router;
