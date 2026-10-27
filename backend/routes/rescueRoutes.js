const express = require('express');
const router = express.Router();
const rescueController = require('../controllers/rescueController');

router.get('/', rescueController.getClaims);
router.post('/claim', rescueController.claimDonation);
router.patch('/:id/status', rescueController.updateStatus);

module.exports = router;
