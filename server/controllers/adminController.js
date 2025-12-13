const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');

// ... (keep login, getDashboardStats, getRequests as is, they are fine)

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [admins] = await db.query('SELECT * FROM administrators WHERE email = ? AND active = TRUE', [email]);

        if (admins.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const admin = admins[0];
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

        // Update last login
        await db.query('UPDATE administrators SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

        res.json({ token, admin: { id: admin.id, first_name: admin.first_name, last_name: admin.last_name, email: admin.email } });
    } catch (error) {
        res.status(500).json({ error: error });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const [pending] = await db.query('SELECT COUNT(*) as count FROM requests WHERE status = "En attente"');
        const [accepted] = await db.query('SELECT COUNT(*) as count FROM requests WHERE status = "Accepté"');
        const [rejected] = await db.query('SELECT COUNT(*) as count FROM requests WHERE status = "Refusé"');
        const [total] = await db.query('SELECT COUNT(*) as count FROM requests');

        res.json({
            pending: pending[0].count,
            accepted: accepted[0].count,
            rejected: rejected[0].count,
            total: total[0].count
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRequests = async (req, res) => {
    const { status, type, search } = req.query;

    let query = `
    SELECT r.*, s.first_name, s.last_name, s.apogee_number, s.email 
    FROM requests r 
    JOIN students s ON r.student_id = s.id 
    WHERE 1=1
  `;
    const params = [];

    if (status && status !== 'all') {
        query += ' AND r.status = ?';
        params.push(status);
    }

    if (type && type !== 'all') {
        query += ' AND r.document_type = ?';
        params.push(type);
    }

    if (search) {
        query += ' AND (r.reference LIKE ? OR s.last_name LIKE ? OR s.apogee_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY r.submission_date DESC';

    try {
        const [requests] = await db.query(query, params);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, refusal_reason, admin_id } = req.body;
    const document_path = req.file ? req.file.path : null;

    try {
        let query = 'UPDATE requests SET status = ?, processing_date = CURRENT_TIMESTAMP, processed_by_admin_id = ?';
        const params = [status, admin_id];

        if (status === 'Refusé') {
            query += ', refusal_reason = ?';
            params.push(refusal_reason);
        } else if (status === 'Accepté' && document_path) {
            query += ', document_path = ?';
            params.push(document_path);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);

        // Logging action
        await db.query(
            'INSERT INTO action_history (admin_id, action_type, entity_type, entity_id, details) VALUES (?, ?, ?, ?, ?)',
            [admin_id, status === 'Accepté' ? 'APPROVE_REQUEST' : 'REJECT_REQUEST', 'REQUEST', id, JSON.stringify({ status, reason: refusal_reason })]
        );

        // Fetch student email and reference
        const [rows] = await db.query(`
            SELECT s.email, s.first_name, r.reference, r.document_type 
            FROM requests r 
            JOIN students s ON r.student_id = s.id 
            WHERE r.id = ?
        `, [id]);

        if (rows.length > 0) {
            const { email, first_name, reference, document_type } = rows[0];
            await emailService.sendRequestUpdate(email, first_name, reference, document_type, status, refusal_reason, document_path);
        }

        res.json({ success: true, message: 'Request updated' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getComplaints = async (req, res) => {
    try {
        const [complaints] = await db.query(`
      SELECT c.*, r.reference as request_reference, s.first_name, s.last_name, s.email 
      FROM complaints c
      JOIN requests r ON c.request_id = r.id
      JOIN students s ON c.student_id = s.id
      ORDER BY c.submission_date DESC
    `);
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.respondToComplaint = async (req, res) => {
    const { id } = req.params;
    const { response, admin_id } = req.body;

    try {
        await db.query(
            'UPDATE complaints SET response = ?, status = "Traitée", processing_date = CURRENT_TIMESTAMP, processed_by_admin_id = ? WHERE id = ?',
            [response, admin_id, id]
        );

        // Fetch complaint details for email
        const [rows] = await db.query(`
            SELECT s.email, s.first_name, c.complaint_number 
            FROM complaints c 
            JOIN students s ON c.student_id = s.id 
            WHERE c.id = ?
        `, [id]);

        if (rows.length > 0) {
            const { email, first_name, complaint_number } = rows[0];
            await emailService.sendComplaintResponse(email, first_name, complaint_number, response);
        }

        res.json({ success: true, message: 'Complaint responded successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
