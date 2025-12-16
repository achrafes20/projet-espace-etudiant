const path = require('path');
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const documentService = require('../services/documentService');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const parseDetails = (raw) => {
    if (!raw) return {};
    try {
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
        return {};
    }
};

const resolveUploadPublicPath = (filePath) => filePath ? `/uploads/${path.basename(filePath)}` : null;

const buildRequestFilters = ({ status, type, search, dateFrom, dateTo, includePending = true }) => {
    const params = [];
    const clauses = ['1=1'];

    if (!includePending) {
        clauses.push('r.status != "En attente"');
    }

    if (status && status !== 'all') {
        clauses.push('r.status = ?');
        params.push(status);
    }

    if (type && type !== 'all') {
        clauses.push('r.document_type = ?');
        params.push(type);
    }

    if (search) {
        clauses.push('(r.reference LIKE ? OR s.last_name LIKE ? OR s.apogee_number LIKE ? OR s.first_name LIKE ?)');
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (dateFrom) {
        clauses.push('DATE(r.submission_date) >= ?');
        params.push(dateFrom);
    }

    if (dateTo) {
        clauses.push('DATE(r.submission_date) <= ?');
        params.push(dateTo);
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    return { where, params };
};

const buildRequestQuery = ({ status, type, search, dateFrom, dateTo, includePending = true }) => {
    const base = `
    SELECT r.*, s.first_name, s.last_name, s.apogee_number, s.email, s.cin, s.cne, s.transcript_data, s.level, s.major, s.birth_date, s.birth_place
    FROM requests r 
    JOIN students s ON r.student_id = s.id 
  `;
    const { where, params } = buildRequestFilters({ status, type, search, dateFrom, dateTo, includePending });
    const query = `${base} ${where} ORDER BY r.submission_date DESC`;

    return { query, params };
};

const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString('fr-FR');
};

const documentTypeLabel = (type) => {
    const labels = {
        'school-certificate': 'Attestation de scolarité',
        'success-certificate': 'Attestation de réussite',
        transcript: 'Relevé de notes',
        internship: 'Convention de stage'
    };
    return labels[type] || type;
};

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

        await db.query('UPDATE administrators SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [admin.id]);

        res.json({ token, admin: { id: admin.id, first_name: admin.first_name, last_name: admin.last_name, email: admin.email } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getDashboardStats = async (req, res) => {
    const { status, type, dateFrom, dateTo } = req.query;
    const filters = buildRequestFilters({ status, type, dateFrom, dateTo, includePending: true });

    const withExtra = (extraClause) => {
        const where = filters.where
            ? `${filters.where} AND ${extraClause}`
            : `WHERE ${extraClause}`;
        return { where, params: [...filters.params] };
    };

    try {
        const pendingQuery = withExtra('r.status = "En attente"');
        const [pending] = await db.query(
            `SELECT COUNT(*) as count FROM requests r ${pendingQuery.where}`,
            pendingQuery.params
        );

        const acceptedQuery = withExtra('r.status LIKE "Accept%"');
        const [accepted] = await db.query(
            `SELECT COUNT(*) as count FROM requests r ${acceptedQuery.where}`,
            acceptedQuery.params
        );

        const rejectedQuery = withExtra('r.status LIKE "Refus%"');
        const [rejected] = await db.query(
            `SELECT COUNT(*) as count FROM requests r ${rejectedQuery.where}`,
            rejectedQuery.params
        );

        const [total] = await db.query(
            `SELECT COUNT(*) as count FROM requests r ${filters.where}`,
            filters.params
        );
        
        const [byType] = await db.query(
            `SELECT document_type, COUNT(*) as count FROM requests r ${filters.where} GROUP BY document_type`,
            filters.params
        );
        
        const [byStatusType] = await db.query(
            `SELECT document_type, status, COUNT(*) as count FROM requests r ${filters.where} GROUP BY document_type, status`,
            filters.params
        );
        
        const recentFilters = withExtra('r.submission_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)');
        const [recent] = await db.query(
            `SELECT COUNT(*) as count FROM requests r ${recentFilters.where}`,
            recentFilters.params
        );
        
        const [pendingComplaints] = await db.query(
            `SELECT COUNT(*) as count FROM complaints WHERE status = "En attente"`
        );
        
        const totalProcessed = accepted[0].count + rejected[0].count;
        const processingRate = total[0].count > 0 ? ((totalProcessed / total[0].count) * 100).toFixed(1) : 0;

        res.json({
            pending: pending[0].count,
            accepted: accepted[0].count,
            rejected: rejected[0].count,
            total: total[0].count,
            byType: byType.reduce((acc, item) => {
                acc[item.document_type] = item.count;
                return acc;
            }, {}),
            byStatusType: byStatusType,
            recent: recent[0].count,
            pendingComplaints: pendingComplaints[0].count,
            processingRate: parseFloat(processingRate)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRequests = async (req, res) => {
    const { status, type, search } = req.query;

    const { query, params } = buildRequestQuery({ status, type, search });

    try {
        const [requests] = await db.query(query, params);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    const { status, type, search, dateFrom, dateTo } = req.query;

    const { query, params } = buildRequestQuery({
        status,
        type,
        search,
        dateFrom,
        dateTo,
        includePending: false
    });

    try {
        const [requests] = await db.query(query, params);
        res.json(requests);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const exportHistoryToExcel = async (requests, res) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Historique');

    worksheet.columns = [
        { header: '#', key: 'index', width: 6 },
        { header: 'Référence', key: 'reference', width: 18 },
        { header: 'Etudiant', key: 'student', width: 25 },
        { header: 'Apogée', key: 'apogee', width: 12 },
        { header: 'Email', key: 'email', width: 28 },
        { header: 'Type', key: 'type', width: 20 },
        { header: 'Statut', key: 'status', width: 12 },
        { header: 'Soumission', key: 'submission', width: 16 },
        { header: 'Traitement', key: 'processing', width: 16 },
        { header: 'Remarque', key: 'remark', width: 30 }
    ];

    requests.forEach((req, index) => {
        worksheet.addRow({
            index: index + 1,
            reference: req.reference,
            student: `${req.first_name || ''} ${req.last_name || ''}`.trim(),
            apogee: req.apogee_number || '',
            email: req.email || '',
            type: documentTypeLabel(req.document_type),
            status: req.status,
            submission: formatDate(req.submission_date),
            processing: formatDate(req.processing_date),
            remark: req.refusal_reason || (req.status === 'Accepté' ? 'Document envoyé' : '')
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="historique-${new Date().toISOString().split('T')[0]}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
};

const exportHistoryToPdf = (requests, res) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="historique-${new Date().toISOString().split('T')[0]}.pdf"`);

    doc.pipe(res);

    doc.fontSize(18).text('Historique des demandes', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10);

    requests.forEach((req, idx) => {
        doc.fillColor('#000').font('Helvetica-Bold').text(`${idx + 1}. ${req.reference} - ${documentTypeLabel(req.document_type)}`, { continued: false });
        doc.font('Helvetica').text(`Etudiant: ${req.first_name || ''} ${req.last_name || ''} (${req.apogee_number || 'N/A'})`);
        doc.text(`Statut: ${req.status} | Soumission: ${formatDate(req.submission_date)} | Traitement: ${formatDate(req.processing_date) || 'N/A'}`);
        if (req.refusal_reason || req.status === 'RefusÃÂ¸') {
            doc.text(`Motif: ${req.refusal_reason || 'Non précisé'}`);
        }
        doc.moveDown(0.75);

        if ((idx + 1) % 4 === 0) {
            doc.addPage();
        }
    });

    doc.end();
};

exports.exportHistory = async (req, res) => {
    const { status, type, search, dateFrom, dateTo, format } = req.query;

    if (!['excel', 'pdf'].includes(format)) {
        return res.status(400).json({ error: 'Format must be excel or pdf' });
    }

    const { query, params } = buildRequestQuery({
        status,
        type,
        search,
        dateFrom,
        dateTo,
        includePending: false
    });

    try {
        const [requests] = await db.query(query, params);

        if (format === 'excel') {
            await exportHistoryToExcel(requests, res);
        } else {
            exportHistoryToPdf(requests, res);
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRequestById = async (req, res) => {
    const { id } = req.params;

    const detailQuery = `
        SELECT r.*, s.first_name, s.last_name, s.apogee_number, s.email, s.cin, s.cne, s.transcript_data, s.level, s.major, s.birth_date, s.birth_place
        FROM requests r 
        JOIN students s ON r.student_id = s.id 
        WHERE r.id = ?
        LIMIT 1
    `;

    try {
        const [rows] = await db.query(detailQuery, [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateDraft = async (req, res) => {
    const { id } = req.params;
    const { template_overrides } = req.body;

    try {
        const [rows] = await db.query(`
            SELECT r.*, s.first_name, s.last_name, s.email, s.cin, s.cne, s.apogee_number,
                   s.level, s.major, s.birth_date, s.birth_place, s.transcript_data
            FROM requests r 
            JOIN students s ON r.student_id = s.id 
            WHERE r.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });

        const request = rows[0];
        const mergedDetails = { ...parseDetails(request.specific_details), ...parseDetails(template_overrides) };

        const generated = await documentService.generateDocument({
            docType: request.document_type,
            student: request,
            details: mergedDetails,
            reference: request.reference,
            variant: 'draft'
        });

        await db.query(
            'UPDATE requests SET specific_details = ?, generated_document_path = ?, template_data = ? WHERE id = ?',
            [JSON.stringify(mergedDetails), generated.publicPath, JSON.stringify(generated.details), id]
        );

        res.json({ success: true, generated_document_path: generated.publicPath, details: generated.details });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, refusal_reason, admin_id, template_overrides } = req.body;
    const uploadedPath = resolveUploadPublicPath(req.file ? req.file.path : null);

    try {
        const [rows] = await db.query(`
            SELECT r.*, s.first_name, s.last_name, s.email, s.cin, s.cne, s.apogee_number,
                   s.level, s.major, s.birth_date, s.birth_place, s.transcript_data
            FROM requests r 
            JOIN students s ON r.student_id = s.id 
            WHERE r.id = ?
        `, [id]);

        if (rows.length === 0) return res.status(404).json({ message: 'Demande introuvable' });

        const request = rows[0];
        const mergedDetails = { ...parseDetails(request.specific_details), ...parseDetails(template_overrides) };

        let finalDocumentPath = request.document_path;
        let generatedDocumentPath = request.generated_document_path;
        let templateData = mergedDetails;

        if (status === 'Accepté') {
            if (uploadedPath) {
                finalDocumentPath = uploadedPath;
            } else {
                const generated = await documentService.generateDocument({
                    docType: request.document_type,
                    student: request,
                    details: mergedDetails,
                    reference: request.reference,
                    variant: 'final'
                });
                finalDocumentPath = generated.publicPath;
                generatedDocumentPath = generated.publicPath;
                templateData = generated.details;
            }
        } else if (template_overrides) {
            // Keep draft refreshed even if rejecting after edits
            const generated = await documentService.generateDocument({
                docType: request.document_type,
                student: request,
                details: mergedDetails,
                reference: request.reference,
                variant: 'draft'
            });
            generatedDocumentPath = generated.publicPath;
            templateData = generated.details;
        }

        let query = 'UPDATE requests SET status = ?, processing_date = CURRENT_TIMESTAMP, processed_by_admin_id = ?, specific_details = ?, generated_document_path = ?, template_data = ?';
        const params = [status, admin_id, JSON.stringify(mergedDetails), generatedDocumentPath, JSON.stringify(templateData)];

        if (status === 'Refusé') {
            query += ', refusal_reason = ?';
            params.push(refusal_reason);
        }
        if (status === 'Accepté') {
            query += ', document_path = ?';
            params.push(finalDocumentPath);
        }

        query += ' WHERE id = ?';
        params.push(id);

        await db.query(query, params);

        const { email, first_name, reference, document_type } = request;
        await emailService.sendRequestUpdate(email, first_name, reference, document_type, status, refusal_reason, finalDocumentPath);

        res.json({ success: true, message: 'Request updated', document_path: finalDocumentPath, generated_document_path: generatedDocumentPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getComplaints = async (req, res) => {
    const { status, type, search, dateFrom, dateTo } = req.query;
    let query = `
      SELECT c.*, 
             r.id as request_id,
             r.reference as request_reference, 
             r.document_type,
             r.status as request_status,
             r.generated_document_path,
             r.document_path,
             r.specific_details,
             s.first_name, 
             s.last_name, 
             s.email,
             s.apogee_number,
             s.cin,
             s.cne,
             s.transcript_data,
             s.level,
             s.major,
             s.birth_date,
             s.birth_place
      FROM complaints c
      JOIN requests r ON c.request_id = r.id
      JOIN students s ON c.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
        query += ' AND c.status = ?';
        params.push(status);
    }
    if (type && type !== 'all') {
        query += ' AND r.document_type = ?';
        params.push(type);
    }
    if (search) {
        query += ' AND (c.complaint_number LIKE ? OR r.reference LIKE ? OR s.last_name LIKE ? OR s.apogee_number LIKE ?)';
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (dateFrom) {
        query += ' AND DATE(c.submission_date) >= ?';
        params.push(dateFrom);
    }
    if (dateTo) {
        query += ' AND DATE(c.submission_date) <= ?';
        params.push(dateTo);
    }

    query += ' ORDER BY c.submission_date DESC';

    try {
        const [complaints] = await db.query(query, params);
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.respondToComplaint = async (req, res) => {
    const { id } = req.params;
    const { response, admin_id, regenerate_document, template_overrides } = req.body;
    const uploadedPath = resolveUploadPublicPath(req.file ? req.file.path : null);

    try {
        let documentPath = null;
        
        // Si on doit régénérer le document ou si un document est uploadé
        if (regenerate_document === 'true' || uploadedPath) {
            // Récupérer la demande associée
            const [complaintRows] = await db.query(`
                SELECT c.*, r.id as request_id, r.document_type, r.reference, r.specific_details
                FROM complaints c
                JOIN requests r ON c.request_id = r.id
                WHERE c.id = ?
            `, [id]);

            if (complaintRows.length > 0) {
                const complaint = complaintRows[0];
                const requestId = complaint.request_id;
                
                // Récupérer les informations complÃ¨tes de la demande et de l'étudiant
                const [requestRows] = await db.query(`
                    SELECT r.*, s.first_name, s.last_name, s.email, s.cin, s.cne, s.apogee_number, s.transcript_data, s.level, s.major, s.birth_date, s.birth_place
                    FROM requests r 
                    JOIN students s ON r.student_id = s.id 
                    WHERE r.id = ?
                `, [requestId]);

                if (requestRows.length > 0) {
                    const request = requestRows[0];
                    
                    // Fusionner les détails avec les overrides si fournis
                    const mergedDetails = template_overrides 
                        ? { ...parseDetails(request.specific_details), ...parseDetails(template_overrides) }
                        : parseDetails(request.specific_details);

                    // Si un document est uploadé, l'utiliser
                    if (uploadedPath) {
                        documentPath = uploadedPath;
                    } else {
                        // Sinon, régénérer le document
                        const generated = await documentService.generateDocument({
                            docType: request.document_type,
                            student: request,
                            details: mergedDetails,
                            reference: request.reference,
                            variant: 'final'
                        });
                        documentPath = generated.publicPath;
                        
                        // Mettre Ã  jour la demande avec le nouveau document
                        await db.query(
                            'UPDATE requests SET generated_document_path = ?, document_path = ?, specific_details = ?, template_data = ? WHERE id = ?',
                            [generated.publicPath, generated.publicPath, JSON.stringify(mergedDetails), JSON.stringify(generated.details), requestId]
                        );
                    }
                }
            }
        }

        await db.query(
            'UPDATE complaints SET response = ?, status = "Traitée", processing_date = CURRENT_TIMESTAMP, processed_by_admin_id = ? WHERE id = ?',
            [response, admin_id, id]
        );

        const [rows] = await db.query(`
            SELECT s.email, s.first_name, c.complaint_number 
            FROM complaints c 
            JOIN students s ON c.student_id = s.id 
            WHERE c.id = ?
        `, [id]);

        if (rows.length > 0) {
            const { email, first_name, complaint_number } = rows[0];
            await emailService.sendComplaintResponse(email, first_name, complaint_number, response, documentPath);
        }

        res.json({ success: true, message: 'Complaint responded successfully', document_path: documentPath });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


