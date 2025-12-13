const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

router.post('/validate', studentController.validateStudent);
router.post('/check-field', studentController.checkField);
router.post('/request', studentController.createRequest);
router.post('/complaint', studentController.createComplaint);
router.post('/status', studentController.getRequestStatus);

module.exports = router;
