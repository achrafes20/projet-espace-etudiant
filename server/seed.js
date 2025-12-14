const db = require('./config/db');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');

        // 1. Seed Admin
        const [admins] = await db.query('SELECT * FROM administrators WHERE email = ?', ['admin@university.edu']);
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO administrators (first_name, last_name, email, password, login) VALUES (?, ?, ?, ?, ?)',
                ['Admin', 'User', 'admin@university.edu', hashedPassword, 'admin']
            );
            console.log('Default admin created');
        } else {
            console.log('Admin already exists');
        }

        // 2. Seed Students with full transcript_data
        const studentsData = [
            {
                email: 'achraf.esserrar@etu.uae.ac.ma',
                apogee: '22001234',
                cin: 'EE9B6532',
                cne: 'EE9B6532',
                fName: 'ACHRAF',
                lName: 'ES-SERRAR',
                major: 'Génie Informatique',
                level: '1ére année',
                birth_date: '2001-01-01',
                birth_place: 'Tétouan',
                transcript_data: {
                    parcours: [
                        {
                            academic_year: '2023/2024',
                            semesters: [
                                {
                                    name: 'Session 1',
                                    modules: [
                                        { code: 'GI101', name: 'Algorithmique', grade: 15, coefficient: 1, validated: true },
                                        { code: 'GI102', name: 'Bases de données', grade: 14, coefficient: 1, validated: true }
                                    ],
                                    result: { average: 14.5, decision: 'Validé', mention: 'Bien' }
                                }
                            ]
                        }
                    ]
                }
            },
            {
                email: 'naima.ziatti@etu.uae.ac.ma',
                apogee: 'G131541390',
                cin: 'EE986532',
                cne: 'G131541390',
                fName: 'NAIMA',
                lName: 'ZIATTI',
                major: 'économie et Gestion',
                level: '2éme année',
                birth_date: '2000-03-12',
                birth_place: 'Marrakech',
                transcript_data: {
                    parcours: [
                        {
                            academic_year: '2019/2020',
                            semesters: [
                                {
                                    name: 'Session 1',
                                    modules: [
                                        { code: 'ECO1', name: 'Microéconomie', grade: 12, coefficient: 1, validated: true },
                                        { code: 'ECO2', name: 'Macroéconomie', grade: 13, coefficient: 1, validated: true },
                                        { code: 'ECO3', name: 'Statistiques', grade: 11, coefficient: 1, validated: true }
                                    ],
                                    result: { average: 12, decision: 'Admis', mention: 'Passable' }
                                }
                            ]
                        }
                    ]
                }
            },
            {
                email: 'abdellah.benmoussa@etu.uae.ac.ma',
                apogee: '20003456',
                cin: 'R149077334',
                cne: 'R149077334',
                fName: 'ABDELILAH',
                lName: 'BEN MOUSSA',
                major: 'Droit Public',
                level: 'Licence',
                birth_date: '2000-03-15',
                birth_place: 'Casablanca',
                transcript_data: {
                    parcours: [
                        {
                            academic_year: '2020/2021',
                            semesters: [
                                {
                                    name: 'Printemps',
                                    modules: [
                                        { code: 'DP1', name: 'Droit civil', grade: 13, coefficient: 1, validated: true },
                                        { code: 'DP2', name: 'Droit constitutionnel', grade: 12, coefficient: 1, validated: true }
                                    ],
                                    result: { average: 12.5, decision: 'Admis', mention: 'Passable' }
                                }
                            ]
                        }
                    ]
                }
            },
            {
                email: 'irene.thiombiano@etu.uae.ac.ma',
                apogee: '21004567',
                cin: 'A3139620',
                cne: 'A3139620',
                fName: 'IRENE MARTIAL',
                lName: 'THIOMBIANO',
                major: 'ICP',
                level: '1ére année',
                birth_date: '2002-05-04',
                birth_place: 'Settat',
                transcript_data: {
                    parcours: [
                        {
                            academic_year: '2023/2024',
                            semesters: [
                                {
                                    name: 'Session 1',
                                    modules: [
                                        { code: 'ICP1', name: 'ICP Module 1', grade: 14, coefficient: 1, validated: true },
                                        { code: 'ICP2', name: 'ICP Module 2', grade: 13, coefficient: 1, validated: true }
                                    ],
                                    result: { average: 13.5, decision: 'Validé', mention: 'Bien' }
                                }
                            ]
                        }
                    ]
                }
            }
        ];

        console.log('... Seeding students');
        for (const s of studentsData) {
            const [exists] = await db.query('SELECT id FROM students WHERE apogee_number = ?', [s.apogee]);
            if (exists.length === 0) {
                await db.query(
                    `INSERT INTO students (email, apogee_number, cin, cne, first_name, last_name, major, level, birth_date, birth_place, transcript_data)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
                    [
                        s.email, s.apogee, s.cin, s.cne, s.fName, s.lName, s.major, s.level,
                        s.birth_date, s.birth_place, JSON.stringify(s.transcript_data)
                    ]
                );
            }
        }

        const [students] = await db.query('SELECT * FROM students');

        // 3. Seed Requests
        console.log('... Seeding requests');
        const requestsData = [
            { sIdx: 0, type: 'school-certificate', status: 'En attente', ref: 'AS-2025-001', academic_year: '2023/2024' },
            { sIdx: 0, type: 'transcript', status: 'Accepté', ref: 'RN-2025-012', academic_year: '2023/2024', session: 'Session 1' },
            { sIdx: 1, type: 'internship', status: 'En attente', ref: 'CS-2025-045', academic_year: '2024/2025', company_name: 'Entreprise X' },
            { sIdx: 1, type: 'success-certificate', status: 'Refusé', ref: 'AR-2025-003', academic_year: '2019/2020', session: 'Session 1', reason: 'Notes manquantes' },
            { sIdx: 2, type: 'school-certificate', status: 'Accepté', ref: 'AS-2025-089', academic_year: '2020/2021' },
            { sIdx: 3, type: 'transcript', status: 'En attente', ref: 'RN-2025-101', academic_year: '2023/2024', session: 'Session 1' }
        ];

        for (const r of requestsData) {
            const [exists] = await db.query('SELECT id FROM requests WHERE reference = ?', [r.ref]);
            if (exists.length === 0) {
                const student = students.find(s => s.apogee_number === studentsData[r.sIdx].apogee);
                if (student) {
                    await db.query(
                        'INSERT INTO requests (reference, student_id, document_type, status, refusal_reason, specific_details) VALUES (?, ?, ?, ?, ?, ?)',
                        [r.ref, student.id, r.type, r.status, r.reason || null, JSON.stringify({ academic_year: r.academic_year, session: r.session, company_name: r.company_name })]
                    );
                }
            }
        }

        // 4. Seed Complaints
        console.log('... Seeding complaints');
        const defaultRequests = await db.query('SELECT * FROM requests');
        const reqList = defaultRequests[0];

        const rejectedReq = reqList.find(r => r.status === 'Refusé');
        if (rejectedReq) {
            const [exists] = await db.query('SELECT id FROM complaints WHERE request_id = ?', [rejectedReq.id]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO complaints (complaint_number, request_id, student_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
                    ['CMP-2025-001', rejectedReq.id, rejectedReq.student_id, 'Incorrect Information', 'Vérifier mes notes S6.', 'En attente']
                );
            }
        }

        console.log('Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase();
