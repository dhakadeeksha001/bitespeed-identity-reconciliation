const express = require('express');
const router = express.Router();
const identifyController = require('../controllers/identifyController');

router.post('/', identifyController.identifyUser);

module.exports = router;