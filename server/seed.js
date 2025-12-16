const db = require('./config/db');
const bcrypt = require('bcryptjs');

// Generate realistic transcript data per level and major
const generateTranscriptData = (level, major) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentAcademicYear = currentMonth >= 8 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;

    let numYears = 1;
    if (level.includes('2')) numYears = 2;
    else if (level.includes('3')) numYears = 3;
    else if (level.includes('4')) numYears = 4;
    else if (level.includes('5')) numYears = 5;

    const getAllModulesForMajor = (m) => {
        if (m.toLowerCase().includes('info')) {
            return {
                session1: [
                    { code: 'GI101', name: 'Algorithmique et structures', coefficient: 3 },
                    { code: 'GI102', name: 'Bases de donnees', coefficient: 3 },
                    { code: 'GI103', name: 'POO', coefficient: 3 },
                    { code: 'GI104', name: 'Reseaux', coefficient: 2 },
                    { code: 'GI105', name: 'Systemes', coefficient: 2 },
                    { code: 'GI106', name: 'Maths pour info', coefficient: 2 }
                ],
                session2: [
                    { code: 'GI107', name: 'Architecture', coefficient: 2 },
                    { code: 'GI108', name: 'Securite', coefficient: 2 },
                    { code: 'GI109', name: 'Developpement web', coefficient: 3 },
                    { code: 'GI110', name: 'IA', coefficient: 3 },
                    { code: 'GI111', name: 'Genie logiciel', coefficient: 3 },
                    { code: 'GI112', name: 'BDD avancees', coefficient: 2 }
                ]
            };
        }
        if (m.toLowerCase().includes('eco') || m.toLowerCase().includes('gestion')) {
            return {
                session1: [
                    { code: 'ECO101', name: 'Microeconomie', coefficient: 3 },
                    { code: 'ECO102', name: 'Macroeconomie', coefficient: 3 },
                    { code: 'ECO103', name: 'Stats descriptives', coefficient: 2 },
                    { code: 'ECO104', name: 'Comptabilite generale', coefficient: 3 },
                    { code: 'ECO105', name: 'Maths financieres', coefficient: 2 },
                    { code: 'ECO106', name: 'Droit des affaires', coefficient: 2 }
                ],
                session2: [
                    { code: 'ECO107', name: 'Marketing', coefficient: 2 },
                    { code: 'ECO108', name: 'GRH', coefficient: 2 },
                    { code: 'ECO109', name: 'Analyse financiere', coefficient: 3 },
                    { code: 'ECO110', name: 'Economie internationale', coefficient: 3 },
                    { code: 'ECO111', name: 'Compta analytique', coefficient: 3 },
                    { code: 'ECO112', name: 'Strategie', coefficient: 2 }
                ]
            };
        }
        if (m.toLowerCase().includes('droit')) {
            return {
                session1: [
                    { code: 'DR101', name: 'Droit civil', coefficient: 4 },
                    { code: 'DR102', name: 'Droit constitutionnel', coefficient: 3 },
                    { code: 'DR103', name: 'Droit administratif', coefficient: 3 },
                    { code: 'DR104', name: 'Histoire du droit', coefficient: 2 },
                    { code: 'DR105', name: 'Introduction au droit', coefficient: 2 }
                ],
                session2: [
                    { code: 'DR106', name: 'Droit penal', coefficient: 3 },
                    { code: 'DR107', name: 'Droit commercial', coefficient: 2 },
                    { code: 'DR108', name: 'Droit international', coefficient: 2 },
                    { code: 'DR109', name: 'Droit du travail', coefficient: 3 },
                    { code: 'DR110', name: 'Droit fiscal', coefficient: 2 },
                    { code: 'DR111', name: 'Procedure civile', coefficient: 3 }
                ]
            };
        }
        return {
            session1: [
                { code: 'MOD101', name: 'Module 1', coefficient: 3 },
                { code: 'MOD102', name: 'Module 2', coefficient: 3 },
                { code: 'MOD103', name: 'Module 3', coefficient: 2 },
                { code: 'MOD104', name: 'Module 4', coefficient: 2 }
            ],
            session2: [
                { code: 'MOD105', name: 'Module 5', coefficient: 2 },
                { code: 'MOD106', name: 'Module 6', coefficient: 2 },
                { code: 'MOD107', name: 'Module 7', coefficient: 3 },
                { code: 'MOD108', name: 'Module 8', coefficient: 3 }
            ]
        };
    };

    const allModules = getAllModulesForMajor(major);
    const parcours = [];

    for (let i = 0; i < numYears; i++) {
        const yearOffset = numYears - 1 - i;
        const [startY, endY] = currentAcademicYear.split('/').map(Number);
        const academicYear = `${startY - yearOffset}/${endY - yearOffset}`;

        const generateGrade = () => {
            const failChance = Math.random() < 0.15;
            const base = failChance ? 7 + Math.random() * 3 : 10 + Math.random() * 8;
            return Math.round(base * 10) / 10;
        };

        const buildSession = (mods) => {
            const modules = mods.map((m) => {
                const grade = generateGrade();
                return { ...m, grade, validated: grade >= 10 };
            });
            const total = modules.reduce((sum, m) => sum + m.grade * m.coefficient, 0);
            const coeff = modules.reduce((sum, m) => sum + m.coefficient, 0);
            const avg = Math.round((total / coeff) * 10) / 10;
            let mention = 'Passable';
            if (avg >= 16) mention = 'Tres Bien';
            else if (avg >= 14) mention = 'Bien';
            else if (avg >= 12) mention = 'Assez Bien';
            return { modules, average: avg, mention };
        };

        const session1 = buildSession(allModules.session1);
        const session2 = buildSession(allModules.session2);

        const rattrapageModules = [
            ...session1.modules.map((m) => ({
                ...m,
                session1: { grade: m.grade, validated: m.validated },
                session2: null
            })),
            ...session2.modules.map((m) => ({
                ...m,
                session1: null,
                session2: { grade: m.grade, validated: m.validated }
            }))
        ];

        const rTotal = rattrapageModules.reduce((sum, m) => sum + m.grade * m.coefficient, 0);
        const rCoeff = rattrapageModules.reduce((sum, m) => sum + m.coefficient, 0);
        const rAvg = Math.round((rTotal / rCoeff) * 10) / 10;
        let rMention = 'Passable';
        if (rAvg >= 16) rMention = 'Tres Bien';
        else if (rAvg >= 14) rMention = 'Bien';
        else if (rAvg >= 12) rMention = 'Assez Bien';

        parcours.push({
            academic_year: academicYear,
            semesters: [
                {
                    name: 'Session 1',
                    modules: session1.modules,
                    result: {
                        average: session1.average,
                        decision: session1.average >= 10 ? 'Admis' : 'Ajourné',
                        mention: session1.average >= 10 ? session1.mention : null
                    }
                },
                {
                    name: 'Session 2',
                    modules: session2.modules,
                    result: {
                        average: session2.average,
                        decision: session2.average >= 10 ? 'Admis' : 'Ajourné',
                        mention: session2.average >= 10 ? session2.mention : null
                    }
                },
                {
                    name: 'Session 1 + 2',
                    modules: rattrapageModules,
                    result: {
                        average: rAvg,
                        decision: rAvg >= 10 ? 'Admis' : 'Ajourné',
                        mention: rAvg >= 10 ? rMention : null
                    }
                }
            ]
        });
    }

    return { parcours };
};

const seedDatabase = async () => {
    try {
        console.log('Starting database seeding...');

        // Admin
        const [admins] = await db.query('SELECT * FROM administrators WHERE email = ?', ['admin@university.edu']);
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO administrators (first_name, last_name, email, password, login) VALUES (?, ?, ?, ?, ?)',
                ['Admin', 'User', 'admin@university.edu', hashedPassword, 'admin']
            );
            console.log('Default admin created');
        }

        // Students with transcript data
        const studentsData = [
            { email: 'akram.mazari@etu.uae.ac.ma', apogee: '22789524', cin: 'EE9B785', cne: 'EE98965', fName: 'Akram', lName: 'Mazari', major: 'Genie Informatique', level: '1ere annee', birth_date: '2001-01-01', birth_place: 'Tetouan' },
            { email: 'naima.ziatti@etu.uae.ac.ma', apogee: 'G131541390', cin: 'EE986532', cne: 'G131541390', fName: 'Naima', lName: 'Ziatti', major: 'Economie et Gestion', level: '2eme annee', birth_date: '2000-03-12', birth_place: 'Marrakech' },
            { email: 'abdellah.benmoussa@etu.uae.ac.ma', apogee: '20003456', cin: 'R149077334', cne: 'R149077334', fName: 'Abdelilah', lName: 'Ben Moussa', major: 'Droit Public', level: '3eme annee', birth_date: '2000-03-15', birth_place: 'Casablanca' },
            { email: 'irene.thiombiano@etu.uae.ac.ma', apogee: '21004567', cin: 'A3139620', cne: 'A3139620', fName: 'Irene', lName: 'Thiombiano', major: 'Genie Informatique', level: '1ere annee', birth_date: '2002-05-04', birth_place: 'Settat' },
            { email: 'mohamed.alami@etu.uae.ac.ma', apogee: '22005678', cin: 'AB123456', cne: 'AB123456', fName: 'Mohamed', lName: 'Alami', major: 'Genie Informatique', level: '2eme annee', birth_date: '2001-06-20', birth_place: 'Rabat' },
            { email: 'fatima.berrada@etu.uae.ac.ma', apogee: '22007890', cin: 'CD789012', cne: 'CD789012', fName: 'Fatima', lName: 'Berrada', major: 'Economie et Gestion', level: '1ere annee', birth_date: '2002-09-15', birth_place: 'Fes' },
            { email: 'youssef.idrissi@etu.uae.ac.ma', apogee: '22009012', cin: 'EF345678', cne: 'EF345678', fName: 'Youssef', lName: 'Idrissi', major: 'Droit Public', level: '2eme annee', birth_date: '2001-11-30', birth_place: 'Tanger' },
            { email: 'sanae.ouazzani@etu.uae.ac.ma', apogee: '22001234', cin: 'GH901234', cne: 'GH901234', fName: 'Sanae', lName: 'Ouazzani', major: 'Genie Informatique', level: '3eme annee', birth_date: '2000-04-10', birth_place: 'Agadir' },
            { email: 'ilyas.gharbi@etu.uae.ac.ma', apogee: '23007890', cin: 'HI908877', cne: 'HI908877', fName: 'Ilyas', lName: 'Gharbi', major: 'Genie Informatique', level: '4eme annee', birth_date: '1999-09-09', birth_place: 'El Jadida' },
            { email: 'salma.haddad@etu.uae.ac.ma', apogee: '23001122', cin: 'JK334455', cne: 'JK334455', fName: 'Salma', lName: 'Haddad', major: 'Economie et Gestion', level: '3eme annee', birth_date: '1999-12-01', birth_place: 'Oujda' }
        ];

        console.log('... Seeding students');
        for (const s of studentsData) {
            const [exists] = await db.query('SELECT id FROM students WHERE apogee_number = ?', [s.apogee]);
            const transcriptData = generateTranscriptData(s.level, s.major);

            if (exists.length === 0) {
                await db.query(
                    `INSERT INTO students (email, apogee_number, cin, cne, first_name, last_name, major, level, birth_date, birth_place, transcript_data)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [s.email, s.apogee, s.cin, s.cne, s.fName, s.lName, s.major, s.level, s.birth_date, s.birth_place, JSON.stringify(transcriptData)]
                );
                console.log(`  + Student ${s.fName} ${s.lName}`);
            } else {
                await db.query(
                    'UPDATE students SET transcript_data = ? WHERE apogee_number = ?',
                    [JSON.stringify(transcriptData), s.apogee]
                );
                console.log(`  ~ Student ${s.fName} ${s.lName} updated`);
            }
        }

        const [students] = await db.query('SELECT * FROM students');

        // Requests
        console.log('... Seeding requests');
        const requestsData = [
            { sIdx: 0, type: 'school-certificate', status: 'En attente', ref: 'AS-2025-001', academic_year: '2023/2024' },
            { sIdx: 3, type: 'transcript', status: 'En attente', ref: 'RN-2025-101', academic_year: '2023/2024', session: 'Session 1' },
            { sIdx: 4, type: 'internship', status: 'En attente', ref: 'CS-2025-077', academic_year: '2024/2025', company_name: 'TechLabs' },
            { sIdx: 0, type: 'transcript', status: 'Accepté', ref: 'RN-2025-012', academic_year: '2023/2024', session: 'Session 1' },
            { sIdx: 2, type: 'school-certificate', status: 'Accepté', ref: 'AS-2025-089', academic_year: '2020/2021' },
            { sIdx: 5, type: 'success-certificate', status: 'Accepté', ref: 'AR-2025-055', academic_year: '2022/2023', session: 'Session 2' },
            { sIdx: 1, type: 'success-certificate', status: 'Refusé', ref: 'AR-2025-003', academic_year: '2019/2020', session: 'Session 1', reason: 'Notes manquantes' },
            { sIdx: 6, type: 'transcript', status: 'Refusé', ref: 'RN-2025-210', academic_year: '2022/2023', session: 'Session 2', reason: 'Modules non valides' },
            { sIdx: 9, type: 'internship', status: 'Refusé', ref: 'CS-2025-330', academic_year: '2024/2025', company_name: 'GreenCorp', reason: 'Convention incomplete' }
        ];

        for (const r of requestsData) {
            const [exists] = await db.query('SELECT id FROM requests WHERE reference = ?', [r.ref]);
            if (exists.length === 0) {
                const student = students.find((st) => st.apogee_number === studentsData[r.sIdx].apogee);
                if (student) {
                    await db.query(
                        'INSERT INTO requests (reference, student_id, document_type, status, refusal_reason, specific_details) VALUES (?, ?, ?, ?, ?, ?)',
                        [
                            r.ref,
                            student.id,
                            r.type,
                            r.status,
                            r.reason || null,
                            JSON.stringify({
                                academic_year: r.academic_year,
                                session: r.session,
                                company_name: r.company_name
                            })
                        ]
                    );
                }
            }
        }

        // Complaints
        console.log('... Seeding complaints');
        const [reqRows] = await db.query('SELECT * FROM requests');
        const complaintsData = [
            { ref: 'AR-2025-003', number: 'CMP-2025-001', reason: 'Information incorrecte', description: 'Veuillez verifier mes notes S1.', status: 'En attente' },
            { ref: 'RN-2025-210', number: 'CMP-2025-002', reason: 'Decision contestee', description: 'Je conteste le refus, modules valides.', status: 'En attente' },
            { ref: 'AS-2025-089', number: 'CMP-2025-003', reason: 'Delai long', description: 'Merci de confirmer l envoi.', status: 'Traitee' }
        ];

        for (const c of complaintsData) {
            const req = reqRows.find((r) => r.reference === c.ref);
            if (!req) continue;
            const [exists] = await db.query('SELECT id FROM complaints WHERE complaint_number = ?', [c.number]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO complaints (complaint_number, request_id, student_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [c.number, req.id, req.student_id, c.reason, c.description, c.status]
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
