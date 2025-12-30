const db = require('../config/db');
const emailService = require('../services/emailService');
const documentService = require('../services/documentService');

const generateReference = async (docType) => {
    const map = {
        'school-certificate': 'AS',
        'success-certificate': 'AR',
        transcript: 'RN',
        internship: 'CS'
    };
    const prefix = map[docType] || 'REQ';
    const year = new Date().getFullYear();

    const [rows] = await db.query(
        'SELECT COUNT(*) as count FROM requests WHERE reference LIKE ?',
        [`${prefix}-${year}-%`]
    );

    const count = rows[0].count + 1;
    const number = String(count).padStart(3, '0');

    return `${prefix}-${year}-${number}`;
};

exports.validateStudent = async (req, res) => {
    const { email, apogee_number, cin, cne } = req.body;

    try {
        // Essayer d'abord avec CIN si fourni
        if (cin) {
            const [students] = await db.query(
                'SELECT * FROM students WHERE email = ? AND apogee_number = ? AND cin = ?',
                [email, apogee_number, cin]
            );
            if (students.length > 0) {
                return res.json({ valid: true, student: students[0] });
            }
        }
        
        // Si CIN n'a pas fonctionné ou n'est pas fourni, essayer avec CNE
        if (cne) {
            const [students] = await db.query(
                'SELECT * FROM students WHERE email = ? AND apogee_number = ? AND cne = ?',
                [email, apogee_number, cne]
            );
            if (students.length > 0) {
                return res.json({ valid: true, student: students[0] });
            }
        }
        
        res.status(401).json({ valid: false, message: 'Invalid credentials' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.checkField = async (req, res) => {
    const { field, value } = req.body;
    const allowedFields = ['email', 'apogee_number', 'cin', 'cne', 'reference'];

    if (!allowedFields.includes(field)) {
        return res.status(400).json({ error: 'Invalid field' });
    }

    try {
        if (field === 'reference') {
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

const parseTranscript = (student) => {
    try {
        return typeof student.transcript_data === 'string' ? JSON.parse(student.transcript_data) : (student.transcript_data || {});
    } catch {
        return {};
    }
};

const pickParcours = (student, academic_year, session) => {
    const data = parseTranscript(student);
    const parcours = data.parcours || [];
    const yearData = academic_year
        ? parcours.find(p => p.academic_year === academic_year) || parcours[0]
        : parcours[0];
    if (!yearData) return { modules: [], mention: '', decision: '', session: session || '', academic_year };

    const semesterData = session
        ? yearData.semesters?.find(s => s.name === session) || yearData.semesters?.[0]
        : yearData.semesters?.[0];

    const result = semesterData?.result || {};
    return {
        modules: semesterData?.modules || [],
        mention: result.mention || '',
        decision: result.decision || '',
        session: semesterData?.name || session || '',
        academic_year: yearData.academic_year || academic_year
    };
};

const mergeDetailsWithStudent = (docType, student, payloadDetails = {}) => {
    const { modules, mention, decision, session, academic_year } = pickParcours(student, payloadDetails.academic_year, payloadDetails.session);

    if (docType === 'transcript') {
        return {
            academic_year: academic_year,
            session: session,
            level: student.level,
            program: student.major,
            modules
        };
    }

    if (docType === 'success-certificate') {
        return {
            academic_year: academic_year,
            birth_date: student.birth_date,
            birth_place: student.birth_place,
            filiere: student.major,
            mention: mention,
            decision: decision,
            session: session,
            level: student.level,
            program: student.major
        };
    }

    if (docType === 'school-certificate') {
        return {
            academic_year: payloadDetails.academic_year || academic_year,
            level: student.level,
            program: student.major
        };
    }

    // For internship we keep student defaults for level/program but allow payload company info
    return {
        academic_year: payloadDetails.academic_year || academic_year,
        level: student.level,
        program: student.major,
        ...payloadDetails
    };
};

exports.createRequest = async (req, res) => {
    const { student_id, document_type, specific_details = {} } = req.body;

    try {
        const [studentRows] = await db.query('SELECT * FROM students WHERE id = ?', [student_id]);
        if (studentRows.length === 0) return res.status(404).json({ message: 'Étudiant introuvable' });
        const student = studentRows[0];

        const mergedDetails = mergeDetailsWithStudent(document_type, student, specific_details);
        const reference = await generateReference(document_type);

        const [insertResult] = await db.query(
            'INSERT INTO requests (reference, student_id, document_type, status, specific_details) VALUES (?, ?, ?, ?, ?)',
            [reference, student_id, document_type, 'En attente', JSON.stringify(mergedDetails)]
        );

        const generated = await documentService.generateDocument({
            docType: document_type,
            student,
            details: mergedDetails,
            reference,
            variant: 'draft'
        });

        await db.query(
            'UPDATE requests SET generated_document_path = ?, template_data = ? WHERE id = ?',
            [generated.publicPath, JSON.stringify(generated.details), insertResult.insertId]
        );

        await emailService.sendRequestConfirmation(student.email, student.first_name, reference, document_type);

        res.status(201).json({
            success: true,
            message: 'Demande enregistrée. Le numéro de référence a été envoyé par email.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createComplaint = async (req, res) => {
    const { request_reference, email, reason, description } = req.body;

    try {
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

        await emailService.sendComplaintConfirmation(email, request.first_name, complaint_number, request_reference);

        res.status(201).json({ success: true, message: 'Complaint submitted successfully. Reference sent via email.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getRequestStatus = async (req, res) => {
    const { reference } = req.body;

    try {
        const [rows] = await db.query(
            `SELECT r.*, s.first_name, s.last_name 
             FROM requests r 
             JOIN students s ON r.student_id = s.id 
             WHERE r.reference = ?`,
            [reference]
        );

        if (rows.length > 0) {
            return res.json(rows[0]);
        }

        const [compRows] = await db.query(
            `SELECT c.*, s.first_name, s.last_name, r.document_type as related_doc_type
             FROM complaints c
             JOIN students s ON c.student_id = s.id
             JOIN requests r ON c.request_id = r.id
             WHERE c.complaint_number = ?`,
            [reference]
        );

        if (compRows.length > 0) {
            const comp = compRows[0];
            return res.json({
                reference: comp.complaint_number,
                document_type: `Réclamation (${comp.related_doc_type})`,
                status: comp.status,
                submission_date: comp.created_at || new Date(),
                refusal_reason: comp.admin_response
            });
        }

        res.status(404).json({ message: 'Introuvable. Vérifiez la référence.' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
