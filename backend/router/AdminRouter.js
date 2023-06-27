const express = require('express');
const adminController = require('../controllers/AdminController.js');
const router = express.Router();

router.get('/all', adminController.getPlaces);

module.exports = router;
