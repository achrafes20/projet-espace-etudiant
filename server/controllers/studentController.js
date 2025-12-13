const db = require('../config/db');
const emailService = require('../services/emailService');

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

exports.checkField = async (req, res) => {
    const { field, value } = req.body;
    // Whitelist allowed fields to prevent SQL injection or leaking other info
    const allowedFields = ['email', 'apogee_number', 'cin', 'reference'];

    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: 'Invalid field' });
    }

    try {
        if (field === 'reference') {
            // Check both tables for reference
            const [reqRows] = await db.query('SELECT id FROM requests WHERE reference = ?', [value]);
            if (reqRows.length > 0) return res.json({ exists: true });

            const [compRows] = await db.query('SELECT id FROM complaints WHERE complaint_number = ?', [value]);
            return res.json({ exists: compRows.length > 0 });
        } else {
            const [rows] = await db.query(`SELECT id FROM students WHERE ${field} = ?`, [value]);
            res.json({ exists: rows.length > 0 });
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

        // Fetch student email
        const [studentRows] = await db.query('SELECT email, first_name FROM students WHERE id = ?', [student_id]);

        if (studentRows.length > 0) {
            const student = studentRows[0];
            console.log(`[DEBUG] Found student: ${student.email}. Attempting to send email...`);
            await emailService.sendRequestConfirmation(student.email, student.first_name, reference, document_type);
        } else {
            console.log('[DEBUG] Student not found for ID:', student_id);
        }

        // Return success but NOT the reference (as per requirements to hide it on site)
        res.status(201).json({ success: true, message: 'Request submitted successfully. Please check your email for the reference code.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createComplaint = async (req, res) => {
    const { request_reference, email, reason, description } = req.body;

    try {
        // Verify request exists and matches email
        const [requests] = await db.query(
            `SELECT r.id, r.student_id, s.first_name 
       FROM requests r 
       JOIN students s ON r.student_id = s.id 
       WHERE r.reference = ? AND s.email = ?`,
            [request_reference, email]
        );

        if (requests.length === 0) {
            return res.status(404).json({ message: 'Request verification failed. Check reference and email.' });
        }

        const request = requests[0];
        const complaint_number = `CMP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`;

        await db.query(
            'INSERT INTO complaints (complaint_number, request_id, student_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
            [complaint_number, request.id, request.student_id, reason, description, 'En attente']
        );

        // Send email with complaint number
        await emailService.sendComplaintConfirmation(email, request.first_name, complaint_number, request_reference);

        // Do not return complaint_number to client to force check via email
        res.status(201).json({ success: true, message: 'Complaint submitted successfully. Reference sent via email.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRequestStatus = async (req, res) => {
    const { reference, email } = req.body;

    try {
        // Check requests table first
        const [rows] = await db.query(
            `SELECT r.*, s.first_name, s.last_name 
             FROM requests r 
             JOIN students s ON r.student_id = s.id 
             WHERE r.reference = ? AND s.email = ?`,
            [reference, email]
        );

        if (rows.length > 0) {
            return res.json(rows[0]);
        }

        // Check complaints list
        const [compRows] = await db.query(
            `SELECT c.*, s.first_name, s.last_name, r.document_type as related_doc_type
             FROM complaints c
             JOIN students s ON c.student_id = s.id
             JOIN requests r ON c.request_id = r.id
             WHERE c.complaint_number = ? AND s.email = ?`,
            [reference, email]
        );

        if (compRows.length > 0) {
            const comp = compRows[0];
            // Format to match expected frontend structure somewhat, designating it as a Complaint
            return res.json({
                reference: comp.complaint_number,
                document_type: `Réclamation (${comp.related_doc_type})`,
                status: comp.status,
                submission_date: comp.created_at || new Date(), // ensure created_at exists in DB or fallback
                refusal_reason: comp.admin_response
            });
        }

        res.status(404).json({ message: 'Introuvable. Vérifiez la référence et l\'email.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
