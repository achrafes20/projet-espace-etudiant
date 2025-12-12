const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('🌱 Starting database seeding...');

        // 1. Seed Admin
        const [admins] = await db.query('SELECT * FROM administrators WHERE email = ?', ['admin@university.edu']);
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO administrators (first_name, last_name, email, password, login) VALUES (?, ?, ?, ?, ?)',
                ['Admin', 'User', 'admin@university.edu', hashedPassword, 'admin']
            );
            console.log('✅ Default admin created');
        } else {
            console.log('ℹ️ Admin already exists');
        }

        // 2. Seed Students
        const studentsData = [
            { email: 'ahmed.hassan@university.edu', apogee: '10001', cin: 'A1000', fName: 'Ahmed', lName: 'Hassan', major: 'Computer Science' },
            { email: 'fatima.zahra@university.edu', apogee: '10002', cin: 'B2000', fName: 'Fatima', lName: 'Zahra', major: 'Economics' },
            { email: 'youssef.benali@university.edu', apogee: '10003', cin: 'C3000', fName: 'Youssef', lName: 'Benali', major: 'Physics' },
            { email: 'leila.amrani@university.edu', apogee: '10004', cin: 'D4000', fName: 'Leila', lName: 'Amrani', major: 'Biology' },
            { email: 'karim.idrissi@university.edu', apogee: '10005', cin: 'E5000', fName: 'Karim', lName: 'Idrissi', major: 'Mathematics' }
        ];

        console.log('... Seeding students');
        for (const s of studentsData) {
            const [exists] = await db.query('SELECT id FROM students WHERE apogee_number = ?', [s.apogee]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO students (email, apogee_number, cin, first_name, last_name, major, level) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [s.email, s.apogee, s.cin, s.fName, s.lName, s.major, 'L3']
                );
            }
        }

        // Get all students for reference
        const [students] = await db.query('SELECT * FROM students');

        // 3. Seed Requests
        console.log('... Seeding requests');
        const requestsData = [
            // Student 1
            { sIdx: 0, type: 'school-certificate', status: 'En attente', ref: 'AS-2025-001' },
            { sIdx: 0, type: 'transcript', status: 'Accepté', ref: 'RN-2025-012' },
            // Student 2
            { sIdx: 1, type: 'internship', status: 'En attente', ref: 'CS-2025-045' },
            { sIdx: 1, type: 'success-certificate', status: 'Refusé', ref: 'AR-2025-003', reason: 'Missing grades for semester 6' },
            // Student 3
            { sIdx: 2, type: 'school-certificate', status: 'Accepté', ref: 'AS-2025-089' },
            // Student 4
            { sIdx: 3, type: 'transcript', status: 'En attente', ref: 'RN-2025-101' },
            // Student 5
            { sIdx: 4, type: 'internship', status: 'Accepté', ref: 'CS-2025-055' },
            { sIdx: 4, type: 'school-certificate', status: 'En attente', ref: 'AS-2025-112' }
        ];

        for (const r of requestsData) {
            const [exists] = await db.query('SELECT id FROM requests WHERE reference = ?', [r.ref]);
            if (exists.length === 0) {
                const student = students.find(s => s.apogee_number === studentsData[r.sIdx].apogee);
                if (student) {
                    await db.query(
                        'INSERT INTO requests (reference, student_id, document_type, status, refusal_reason, specific_details) VALUES (?, ?, ?, ?, ?, ?)',
                        [r.ref, student.id, r.type, r.status, r.reason || null, JSON.stringify({ year: '2024-2025' })]
                    );
                }
            }
        }

        // 4. Seed Complaints
        console.log('... Seeding complaints');
        const defaultRequests = await db.query('SELECT * FROM requests');
        const reqList = defaultRequests[0];

        // Find a rejected request to complain about
        const rejectedReq = reqList.find(r => r.status === 'Refusé');
        if (rejectedReq) {
            const [exists] = await db.query('SELECT id FROM complaints WHERE request_id = ?', [rejectedReq.id]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO complaints (complaint_number, request_id, student_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
                    ['CMP-2025-001', rejectedReq.id, rejectedReq.student_id, 'Incorrect Information', 'I actually passed semester 6, please check again.', 'En attente']
                );
            }
        }

        // Find a pending request to complain about (delay)
        const pendingReq = reqList.find(r => r.status === 'En attente');
        if (pendingReq) {
            const [exists] = await db.query('SELECT id FROM complaints WHERE request_id = ?', [pendingReq.id]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO complaints (complaint_number, request_id, student_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
                    ['CMP-2025-002', pendingReq.id, pendingReq.student_id, 'Processing Delay', 'It has been 2 weeks.', 'En attente']
                );
            }
        }

        console.log('✅ Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
