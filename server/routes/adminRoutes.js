const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const multer = require('multer');
const path = require('path');

// Configure Multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: (req, file, cb) => {
        cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and Word documents are allowed'), false);
        }
    }
});

router.post('/login', adminController.login);
router.get('/dashboard-stats', adminController.getDashboardStats);
router.get('/requests', adminController.getRequests);
router.put('/requests/:id/draft', adminController.updateDraft);
router.put('/requests/:id', upload.single('document'), adminController.updateRequestStatus);
router.get('/complaints', adminController.getComplaints);
router.put('/complaints/:id/respond', adminController.respondToComplaint);

module.exports = router;
