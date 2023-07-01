const express = require('express');
const adminController = require('../controllers/admin.controller.js');
const router = express.Router();

router.get('/all', adminController.getPlaces);
router.delete('/deleteByUser/:id', adminController.deleteUserPlaces);
router.delete('/delete/:id', adminController.deletePlace);
router.get('/bannedUsers', adminController.showBannedUsers);
router.get('/noBannedUsers', adminController.showNonBannedUsers);
router.post('/ban/:id', adminController.banUser);
router.post('/unban/:id', adminController.unBanUser);
module.exports = router;
