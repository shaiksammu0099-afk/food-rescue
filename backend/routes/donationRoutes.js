const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');

router.get('/categories', donationController.getCategories);
router.get('/', donationController.getListings);
router.get('/:id', donationController.getListingById);
router.post('/', donationController.createListing);
router.patch('/:id/status', donationController.updateListingStatus);

module.exports = router;
