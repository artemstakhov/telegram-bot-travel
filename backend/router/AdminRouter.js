const express = require('express');
const adminController = require('../controllers/AdminController.js');
const router = express.Router();

router.get('/all', adminController.getPlaces);
router.delete('/deleteByUser/:id', adminController.deleteUserPlaces);
router.delete('/delete/:id', adminController.deletePlace);
router.get('/bannedUsers', adminController.showBannedUsers);
router.get('/noBannedUsers', adminController.showNoBannedUsers);

module.exports = router;
