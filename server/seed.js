const db = require('./config/db');
const bcrypt = require('bcryptjs');

// Fonction helper pour générer des données de transcript selon le niveau
const generateTranscriptData = (level, major) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const currentAcademicYear = currentMonth >= 8 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
    
    // Déterminer le nombre d'années académiques selon le niveau
    let numYears = 1;
    if (level.includes('2') || level.includes('deuxième') || level.includes('2ème')) {
        numYears = 2;
    } else if (level.includes('3') || level.includes('troisième') || level.includes('3ème')) {
        numYears = 3;
    } else if (level.includes('4') || level.includes('quatrième') || level.includes('4ème')) {
        numYears = 4;
    } else if (level.includes('5') || level.includes('cinquième') || level.includes('5ème')) {
        numYears = 5;
    }
    
    // Générer les modules selon la filière
    const getModulesForMajor = (major) => {
        if (major.includes('Informatique') || major.includes('GI')) {
            return [
                { code: 'GI101', name: 'Algorithmique et structures de données', coefficient: 3 },
                { code: 'GI102', name: 'Bases de données', coefficient: 3 },
                { code: 'GI103', name: 'Programmation orientée objet', coefficient: 3 },
                { code: 'GI104', name: 'Réseaux et protocoles', coefficient: 2 },
                { code: 'GI105', name: 'Systèmes d\'exploitation', coefficient: 2 },
                { code: 'GI106', name: 'Mathématiques pour l\'informatique', coefficient: 2 }
            ];
        } else if (major.includes('économie') || major.includes('Gestion')) {
            return [
                { code: 'ECO101', name: 'Microéconomie', coefficient: 3 },
                { code: 'ECO102', name: 'Macroéconomie', coefficient: 3 },
                { code: 'ECO103', name: 'Statistiques descriptives', coefficient: 2 },
                { code: 'ECO104', name: 'Comptabilité générale', coefficient: 3 },
                { code: 'ECO105', name: 'Mathématiques financières', coefficient: 2 },
                { code: 'ECO106', name: 'Droit des affaires', coefficient: 2 }
            ];
        } else if (major.includes('Droit')) {
            return [
                { code: 'DP101', name: 'Droit civil', coefficient: 4 },
                { code: 'DP102', name: 'Droit constitutionnel', coefficient: 3 },
                { code: 'DP103', name: 'Droit administratif', coefficient: 3 },
                { code: 'DP104', name: 'Histoire du droit', coefficient: 2 },
                { code: 'DP105', name: 'Introduction au droit', coefficient: 2 }
            ];
        } else {
            // Modules génériques
            return [
                { code: 'MOD101', name: 'Module 1', coefficient: 3 },
                { code: 'MOD102', name: 'Module 2', coefficient: 3 },
                { code: 'MOD103', name: 'Module 3', coefficient: 2 },
                { code: 'MOD104', name: 'Module 4', coefficient: 2 },
                { code: 'MOD105', name: 'Module 5', coefficient: 2 }
            ];
        }
    };
    
    const baseModules = getModulesForMajor(major);
    const parcours = [];
    
    // Générer les années académiques
    for (let i = 0; i < numYears; i++) {
        const yearOffset = numYears - 1 - i;
        const yearParts = currentAcademicYear.split('/');
        const startYear = parseInt(yearParts[0]) - yearOffset;
        const endYear = parseInt(yearParts[1]) - yearOffset;
        const academicYear = `${startYear}/${endYear}`;
        
        const semesters = [];
        
        // Session 1
        const session1Modules = baseModules.map((mod, idx) => {
            // Générer des notes réalistes (entre 7 et 18, avec majorité entre 10-16)
            let baseGrade;
            if (Math.random() < 0.15) {
                // 15% de chance d'avoir une note entre 7 et 10 (échec)
                baseGrade = 7 + Math.random() * 3;
            } else {
                // 85% de chance d'avoir une note entre 10 et 18 (réussite)
                baseGrade = 10 + Math.random() * 8;
            }
            const grade = Math.round(baseGrade * 10) / 10;
            return {
                code: mod.code,
                name: mod.name,
                grade: grade,
                coefficient: mod.coefficient,
                validated: grade >= 10
            };
        });
        
        const session1Total = session1Modules.reduce((sum, m) => sum + (m.grade * m.coefficient), 0);
        const session1Coeff = session1Modules.reduce((sum, m) => sum + m.coefficient, 0);
        const session1Average = Math.round((session1Total / session1Coeff) * 10) / 10;
        
        let session1Mention = 'Passable';
        if (session1Average >= 16) session1Mention = 'Très Bien';
        else if (session1Average >= 14) session1Mention = 'Bien';
        else if (session1Average >= 12) session1Mention = 'Assez Bien';
        
        semesters.push({
            name: 'Session 1',
            modules: session1Modules,
            result: {
                average: session1Average,
                decision: session1Average >= 10 ? 'Admis' : 'Ajourné',
                mention: session1Average >= 10 ? session1Mention : null
            }
        });
        
        // Session 2
        const session2Modules = baseModules.map((mod, idx) => {
            // Pour la session 2, ajuster les notes (peut être meilleur ou pire)
            const session1Grade = session1Modules[idx].grade;
            const variation = (Math.random() - 0.5) * 3; // Variation de -1.5 à +1.5
            const grade = Math.max(0, Math.min(20, Math.round((session1Grade + variation) * 10) / 10));
            return {
                code: mod.code,
                name: mod.name,
                grade: grade,
                coefficient: mod.coefficient,
                validated: grade >= 10
            };
        });
        
        const session2Total = session2Modules.reduce((sum, m) => sum + (m.grade * m.coefficient), 0);
        const session2Coeff = session2Modules.reduce((sum, m) => sum + m.coefficient, 0);
        const session2Average = Math.round((session2Total / session2Coeff) * 10) / 10;
        
        let session2Mention = 'Passable';
        if (session2Average >= 16) session2Mention = 'Très Bien';
        else if (session2Average >= 14) session2Mention = 'Bien';
        else if (session2Average >= 12) session2Mention = 'Assez Bien';
        
        semesters.push({
            name: 'Session 2',
            modules: session2Modules,
            result: {
                average: session2Average,
                decision: session2Average >= 10 ? 'Admis' : 'Ajourné',
                mention: session2Average >= 10 ? session2Mention : null
            }
        });
        
        // Session 1 + 2 (Rattrapage) - Contient tous les modules avec les données des sessions 1 et 2
        // Pour chaque module, on inclut les notes des deux sessions mais on utilise la meilleure pour le calcul
        const sessionRattrapageModules = baseModules.map((mod, idx) => {
            const session1Grade = session1Modules[idx].grade;
            const session2Grade = session2Modules[idx].grade;
            const bestGrade = Math.max(session1Grade, session2Grade);
            
            return {
                code: mod.code,
                name: mod.name,
                grade: bestGrade, // Note utilisée pour le calcul (meilleure des deux)
                coefficient: mod.coefficient,
                validated: bestGrade >= 10,
                // Inclure les données des deux sessions
                session1: {
                    grade: session1Grade,
                    validated: session1Grade >= 10
                },
                session2: {
                    grade: session2Grade,
                    validated: session2Grade >= 10
                }
            };
        });
        
        // Calculer la moyenne en utilisant la meilleure note de chaque module
        const rattrapageTotal = sessionRattrapageModules.reduce((sum, m) => sum + (m.grade * m.coefficient), 0);
        const rattrapageCoeff = sessionRattrapageModules.reduce((sum, m) => sum + m.coefficient, 0);
        const rattrapageAverage = Math.round((rattrapageTotal / rattrapageCoeff) * 10) / 10;
        
        let rattrapageMention = 'Passable';
        if (rattrapageAverage >= 16) rattrapageMention = 'Très Bien';
        else if (rattrapageAverage >= 14) rattrapageMention = 'Bien';
        else if (rattrapageAverage >= 12) rattrapageMention = 'Assez Bien';
        
        semesters.push({
            name: 'Session 1 + 2',
            modules: sessionRattrapageModules,
            result: {
                average: rattrapageAverage,
                decision: rattrapageAverage >= 10 ? 'Admis' : 'Ajourné',
                mention: rattrapageAverage >= 10 ? rattrapageMention : null
            }
        });
        
        parcours.push({
            academic_year: academicYear,
            semesters: semesters
        });
    }
    
    return { parcours };
};

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
                birth_place: 'Tétouan'
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
                birth_place: 'Marrakech'
            },
            {
                email: 'abdellah.benmoussa@etu.uae.ac.ma',
                apogee: '20003456',
                cin: 'R149077334',
                cne: 'R149077334',
                fName: 'ABDELILAH',
                lName: 'BEN MOUSSA',
                major: 'Droit Public',
                level: '3ème année',
                birth_date: '2000-03-15',
                birth_place: 'Casablanca'
            },
            {
                email: 'irene.thiombiano@etu.uae.ac.ma',
                apogee: '21004567',
                cin: 'A3139620',
                cne: 'A3139620',
                fName: 'IRENE MARTIAL',
                lName: 'THIOMBIANO',
                major: 'Génie Informatique',
                level: '1ére année',
                birth_date: '2002-05-04',
                birth_place: 'Settat'
            },
            {
                email: 'mohamed.alami@etu.uae.ac.ma',
                apogee: '22005678',
                cin: 'AB123456',
                cne: 'AB123456',
                fName: 'MOHAMED',
                lName: 'ALAMI',
                major: 'Génie Informatique',
                level: '2éme année',
                birth_date: '2001-06-20',
                birth_place: 'Rabat'
            },
            {
                email: 'fatima.berrada@etu.uae.ac.ma',
                apogee: '22007890',
                cin: 'CD789012',
                cne: 'CD789012',
                fName: 'FATIMA',
                lName: 'BERRADA',
                major: 'économie et Gestion',
                level: '1ére année',
                birth_date: '2002-09-15',
                birth_place: 'Fès'
            },
            {
                email: 'youssef.idrissi@etu.uae.ac.ma',
                apogee: '22009012',
                cin: 'EF345678',
                cne: 'EF345678',
                fName: 'YOUSSEF',
                lName: 'IDRISSI',
                major: 'Droit Public',
                level: '2éme année',
                birth_date: '2001-11-30',
                birth_place: 'Tanger'
            },
            {
                email: 'sanae.ouazzani@etu.uae.ac.ma',
                apogee: '22001234',
                cin: 'GH901234',
                cne: 'GH901234',
                fName: 'SANAE',
                lName: 'OUAZZANI',
                major: 'Génie Informatique',
                level: '3ème année',
                birth_date: '2000-04-10',
                birth_place: 'Agadir'
            }
        ];

        console.log('... Seeding students');
        for (const s of studentsData) {
            const [exists] = await db.query('SELECT id FROM students WHERE apogee_number = ?', [s.apogee]);
            if (exists.length === 0) {
                // Générer les données de transcript selon le niveau
                const transcriptData = generateTranscriptData(s.level, s.major);
                
                await db.query(
                    `INSERT INTO students (email, apogee_number, cin, cne, first_name, last_name, major, level, birth_date, birth_place, transcript_data)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
                    [
                        s.email, s.apogee, s.cin, s.cne, s.fName, s.lName, s.major, s.level,
                        s.birth_date, s.birth_place, JSON.stringify(transcriptData)
                    ]
                );
                console.log(`  ✓ Student ${s.fName} ${s.lName} (${s.level}) - Transcript generated`);
            } else {
                // Mettre à jour les étudiants existants avec des données de transcript complètes
                const transcriptData = generateTranscriptData(s.level, s.major);
                await db.query(
                    'UPDATE students SET transcript_data = ? WHERE apogee_number = ?',
                    [JSON.stringify(transcriptData), s.apogee]
                );
                console.log(`  ↻ Student ${s.fName} ${s.lName} (${s.level}) - Transcript updated`);
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
