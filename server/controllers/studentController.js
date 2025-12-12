const db = require('../config/db');

// Generate reference number: TAG-YEAR-NUMBER (e.g., AS-2025-001)
const generateReference = async (docType) => {
    const map = {
        'school-certificate': 'AS',
        'success-certificate': 'AR',
        'transcript': 'RN',
        'internship': 'CS'
    };
    const prefix = map[docType] || 'REQ';
    const year = new Date().getFullYear();

    // Get count of requests for this year to increment
    const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM requests WHERE reference LIKE ?',
        [`${prefix}-${year}-%`]
    );

    const count = rows[0].count + 1;
    const number = String(count).padStart(3, '0');

    return `${prefix}-${year}-${number}`;
};

exports.validateStudent = async (req, res) => {
    const { email, apogee_number, cin } = req.body;

    try {
        const [students] = await db.query(
            'SELECT * FROM students WHERE email = ? AND apogee_number = ? AND cin = ?',
            [email, apogee_number, cin]
        );

        if (students.length > 0) {
            res.json({ valid: true, student: students[0] });
        } else {
            res.status(401).json({ valid: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createRequest = async (req, res) => {
    const { student_id, document_type, specific_details } = req.body;

    try {
        const reference = await generateReference(document_type);

        await db.query(
            'INSERT INTO requests (reference, student_id, document_type, status, specific_details) VALUES (?, ?, ?, ?, ?)',
            [reference, student_id, document_type, 'En attente', JSON.stringify(specific_details)]
        );

        // TODO: Send confirmation email

        res.status(201).json({ success: true, reference, message: 'Request submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createComplaint = async (req, res) => {
    const { request_reference, email, reason, description } = req.body;

    try {
        // Verify request exists and matches email
        const [requests] = await db.query(
            `SELECT r.id, r.student_id 
       FROM requests r 
       JOIN students s ON r.student_id = s.id 
       WHERE r.reference = ? AND s.email = ?`,
            [request_reference, email]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Request verification failed. Check reference and email.' });
        }

        const request = requests[0];
        const complaint_number = `CMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`; // Simple generation

        await db.query(
            'INSERT INTO complaints (complaint_number, request_id, student_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [complaint_number, request.id, request.student_id, reason, description, 'En attente']
        );

        res.status(201).json({ success: true, complaint_number, message: 'Complaint submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
