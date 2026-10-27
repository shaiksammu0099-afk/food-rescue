const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/predict-shelf-life', aiController.predictShelfLife);
router.post('/smart-match', aiController.smartMatch);
router.post('/calculate-impact', aiController.calculateImpact);

module.exports = router;
