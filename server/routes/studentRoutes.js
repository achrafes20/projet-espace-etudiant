const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.post('/validate', studentController.validateStudent);
router.post('/request', studentController.createRequest);
router.post('/complaint', studentController.createComplaint);

module.exports = router;
