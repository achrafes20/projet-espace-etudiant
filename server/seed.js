const db = require('./config/db');
const bcrypt = require('bcryptjs');

// Définition des formations
const FORMATIONS = {
    'Science des données, Big Data et Intelligence Artificielle': 'SDIA',
    'Génie Informatique': 'GI',
    'Supply Chain Management': 'SCM',
    'Génie Mécatronique': 'GM',
    'Génie Civil': 'GC',
    'Génie des Systèmes de Télécommunications et Réseaux': 'GSTR'
};

// Modules pour 2AP1 (Année préparatoire 1)
const MODULES_2AP1 = {
    session1: [
        { code: 'AP101', name: 'Mathématiques 1', coefficient: 4 },
        { code: 'AP102', name: 'Physique 1', coefficient: 3 },
        { code: 'AP103', name: 'Chimie', coefficient: 2 },
        { code: 'AP104', name: 'Informatique de base', coefficient: 2 },
        { code: 'AP105', name: 'Français', coefficient: 2 },
        { code: 'AP106', name: 'Anglais', coefficient: 2 }
    ],
    session2: [
        { code: 'AP107', name: 'Mathématiques 2', coefficient: 4 },
        { code: 'AP108', name: 'Physique 2', coefficient: 3 },
        { code: 'AP109', name: 'Sciences de l\'ingénieur', coefficient: 2 },
        { code: 'AP110', name: 'Algorithmique', coefficient: 3 },
        { code: 'AP111', name: 'Expression écrite et orale', coefficient: 2 },
        { code: 'AP112', name: 'Communication', coefficient: 2 }
    ]
};

// Modules pour 2AP2 (Année préparatoire 2)
const MODULES_2AP2 = {
    session1: [
        { code: 'AP201', name: 'Mathématiques 3', coefficient: 4 },
        { code: 'AP202', name: 'Physique 3', coefficient: 3 },
        { code: 'AP203', name: 'Électronique de base', coefficient: 3 },
        { code: 'AP204', name: 'Programmation orientée objet', coefficient: 3 },
        { code: 'AP205', name: 'Méthodologie de travail', coefficient: 2 }
    ],
    session2: [
        { code: 'AP206', name: 'Mathématiques 4', coefficient: 4 },
        { code: 'AP207', name: 'Physique appliquée', coefficient: 3 },
        { code: 'AP208', name: 'Bases de données', coefficient: 3 },
        { code: 'AP209', name: 'Réseaux informatiques', coefficient: 3 },
        { code: 'AP210', name: 'Projet intégré', coefficient: 3 }
    ]
};

// Modules par formation et par année
const MODULES_FORMATIONS = {
    'Génie Informatique': {
        annee1: {
            session1: [
                { code: 'GI301', name: 'Algorithmique avancée', coefficient: 4 },
                { code: 'GI302', name: 'Structures de données', coefficient: 4 },
                { code: 'GI303', name: 'Bases de données relationnelles', coefficient: 3 },
                { code: 'GI304', name: 'Architecture des ordinateurs', coefficient: 3 },
                { code: 'GI305', name: 'Réseaux et protocoles', coefficient: 3 },
                { code: 'GI306', name: 'Mathématiques discrètes', coefficient: 3 }
            ],
            session2: [
                { code: 'GI307', name: 'Développement web', coefficient: 4 },
                { code: 'GI308', name: 'Systèmes d\'exploitation', coefficient: 3 },
                { code: 'GI309', name: 'Génie logiciel', coefficient: 3 },
                { code: 'GI310', name: 'Intelligence artificielle', coefficient: 3 },
                { code: 'GI311', name: 'Sécurité informatique', coefficient: 3 },
                { code: 'GI312', name: 'Projet de développement', coefficient: 4 }
            ]
        },
        annee2: {
            session1: [
                { code: 'GI401', name: 'Architecture logicielle', coefficient: 4 },
                { code: 'GI402', name: 'Cloud Computing', coefficient: 3 },
                { code: 'GI403', name: 'Big Data', coefficient: 3 },
                { code: 'GI404', name: 'Machine Learning', coefficient: 4 },
                { code: 'GI405', name: 'DevOps', coefficient: 3 },
                { code: 'GI406', name: 'Gestion de projet', coefficient: 2 }
            ],
            session2: [
                { code: 'GI407', name: 'Architecture distribuée', coefficient: 4 },
                { code: 'GI408', name: 'Cybersécurité avancée', coefficient: 3 },
                { code: 'GI409', name: 'IoT et systèmes embarqués', coefficient: 3 },
                { code: 'GI410', name: 'Blockchain', coefficient: 3 },
                { code: 'GI411', name: 'Projet intégré', coefficient: 5 },
                { code: 'GI412', name: 'Stage professionnel', coefficient: 2 }
            ]
        },
        annee3: {
            session1: [
                { code: 'GI501', name: 'Projet de fin d\'études (PFE)', coefficient: 6 },
                { code: 'GI502', name: 'Innovation et entrepreneuriat', coefficient: 2 },
                { code: 'GI503', name: 'Éthique et déontologie', coefficient: 2 },
                { code: 'GI504', name: 'Séminaires professionnels', coefficient: 2 },
                { code: 'GI505', name: 'Management des systèmes d\'information', coefficient: 3 }
            ],
            session2: [
                { code: 'GI506', name: 'PFE - Développement', coefficient: 8 },
                { code: 'GI507', name: 'PFE - Soutenance', coefficient: 2 }
            ]
        }
    },
    'Science des données, Big Data et Intelligence Artificielle': {
        annee1: {
            session1: [
                { code: 'SDIA301', name: 'Statistiques descriptives', coefficient: 4 },
                { code: 'SDIA302', name: 'Probabilités', coefficient: 4 },
                { code: 'SDIA303', name: 'Python pour la data science', coefficient: 4 },
                { code: 'SDIA304', name: 'Bases de données avancées', coefficient: 3 },
                { code: 'SDIA305', name: 'Algèbre linéaire', coefficient: 3 }
            ],
            session2: [
                { code: 'SDIA306', name: 'Machine Learning fondamental', coefficient: 4 },
                { code: 'SDIA307', name: 'Visualisation de données', coefficient: 3 },
                { code: 'SDIA308', name: 'Traitement du signal', coefficient: 3 },
                { code: 'SDIA309', name: 'Big Data technologies', coefficient: 4 },
                { code: 'SDIA310', name: 'Projet data science', coefficient: 4 }
            ]
        },
        annee2: {
            session1: [
                { code: 'SDIA401', name: 'Deep Learning', coefficient: 4 },
                { code: 'SDIA402', name: 'Natural Language Processing', coefficient: 3 },
                { code: 'SDIA403', name: 'Computer Vision', coefficient: 3 },
                { code: 'SDIA404', name: 'Big Data Analytics', coefficient: 4 },
                { code: 'SDIA405', name: 'Cloud et distributed computing', coefficient: 3 }
            ],
            session2: [
                { code: 'SDIA406', name: 'Reinforcement Learning', coefficient: 3 },
                { code: 'SDIA407', name: 'Data Engineering', coefficient: 4 },
                { code: 'SDIA408', name: 'Projet IA avancé', coefficient: 5 },
                { code: 'SDIA409', name: 'Stage professionnel', coefficient: 2 }
            ]
        },
        annee3: {
            session1: [
                { code: 'SDIA501', name: 'PFE - Conception', coefficient: 6 },
                { code: 'SDIA502', name: 'Éthique de l\'IA', coefficient: 2 },
                { code: 'SDIA503', name: 'Innovation technologique', coefficient: 2 },
                { code: 'SDIA504', name: 'Management de projets data', coefficient: 3 }
            ],
            session2: [
                { code: 'SDIA505', name: 'PFE - Développement', coefficient: 8 },
                { code: 'SDIA506', name: 'PFE - Soutenance', coefficient: 2 }
            ]
        }
    },
    'Supply Chain Management': {
        annee1: {
            session1: [
                { code: 'SCM301', name: 'Introduction à la logistique', coefficient: 3 },
                { code: 'SCM302', name: 'Gestion des stocks', coefficient: 4 },
                { code: 'SCM303', name: 'Transport et distribution', coefficient: 3 },
                { code: 'SCM304', name: 'Achats et approvisionnement', coefficient: 3 },
                { code: 'SCM305', name: 'Mathématiques appliquées', coefficient: 3 }
            ],
            session2: [
                { code: 'SCM306', name: 'Planification de la production', coefficient: 4 },
                { code: 'SCM307', name: 'Gestion de la qualité', coefficient: 3 },
                { code: 'SCM308', name: 'ERP et systèmes d\'information', coefficient: 3 },
                { code: 'SCM309', name: 'Commerce international', coefficient: 3 },
                { code: 'SCM310', name: 'Projet logistique', coefficient: 4 }
            ]
        },
        annee2: {
            session1: [
                { code: 'SCM401', name: 'Supply Chain avancée', coefficient: 4 },
                { code: 'SCM402', name: 'Optimisation logistique', coefficient: 3 },
                { code: 'SCM403', name: 'E-commerce et logistique', coefficient: 3 },
                { code: 'SCM404', name: 'Gestion des risques', coefficient: 3 },
                { code: 'SCM405', name: 'Management stratégique', coefficient: 3 }
            ],
            session2: [
                { code: 'SCM406', name: 'Logistique durable', coefficient: 3 },
                { code: 'SCM407', name: 'Projet intégré SCM', coefficient: 5 },
                { code: 'SCM408', name: 'Stage professionnel', coefficient: 2 }
            ]
        },
        annee3: {
            session1: [
                { code: 'SCM501', name: 'PFE - Conception', coefficient: 6 },
                { code: 'SCM502', name: 'Innovation en logistique', coefficient: 2 },
                { code: 'SCM503', name: 'Management opérationnel', coefficient: 3 }
            ],
            session2: [
                { code: 'SCM504', name: 'PFE - Développement', coefficient: 8 },
                { code: 'SCM505', name: 'PFE - Soutenance', coefficient: 2 }
            ]
        }
    },
    'Génie Mécatronique': {
        annee1: {
            session1: [
                { code: 'GM301', name: 'Mécanique des solides', coefficient: 4 },
                { code: 'GM302', name: 'Électronique analogique', coefficient: 3 },
                { code: 'GM303', name: 'Automatique de base', coefficient: 3 },
                { code: 'GM304', name: 'Informatique industrielle', coefficient: 3 },
                { code: 'GM305', name: 'CAO/DAO', coefficient: 3 }
            ],
            session2: [
                { code: 'GM306', name: 'Robotique industrielle', coefficient: 4 },
                { code: 'GM307', name: 'Capteurs et actionneurs', coefficient: 3 },
                { code: 'GM308', name: 'Systèmes embarqués', coefficient: 3 },
                { code: 'GM309', name: 'Projet mécatronique', coefficient: 4 }
            ]
        },
        annee2: {
            session1: [
                { code: 'GM401', name: 'Automatisation industrielle', coefficient: 4 },
                { code: 'GM402', name: 'Conception de systèmes', coefficient: 3 },
                { code: 'GM403', name: 'Maintenance industrielle', coefficient: 3 },
                { code: 'GM404', name: 'Gestion de production', coefficient: 3 }
            ],
            session2: [
                { code: 'GM405', name: 'Projet intégré', coefficient: 5 },
                { code: 'GM406', name: 'Stage professionnel', coefficient: 2 }
            ]
        },
        annee3: {
            session1: [
                { code: 'GM501', name: 'PFE - Conception', coefficient: 6 },
                { code: 'GM502', name: 'Innovation technologique', coefficient: 2 }
            ],
            session2: [
                { code: 'GM503', name: 'PFE - Développement', coefficient: 8 },
                { code: 'GM504', name: 'PFE - Soutenance', coefficient: 2 }
            ]
        }
    },
    'Génie Civil': {
        annee1: {
            session1: [
                { code: 'GC301', name: 'Résistance des matériaux', coefficient: 4 },
                { code: 'GC302', name: 'Mécanique des structures', coefficient: 4 },
                { code: 'GC303', name: 'Géotechnique', coefficient: 3 },
                { code: 'GC304', name: 'Topographie', coefficient: 3 },
                { code: 'GC305', name: 'Béton armé', coefficient: 3 }
            ],
            session2: [
                { code: 'GC306', name: 'Construction métallique', coefficient: 3 },
                { code: 'GC307', name: 'Routes et ouvrages d\'art', coefficient: 3 },
                { code: 'GC308', name: 'Hydraulique', coefficient: 3 },
                { code: 'GC309', name: 'Projet de construction', coefficient: 4 }
            ]
        },
        annee2: {
            session1: [
                { code: 'GC401', name: 'Conception de structures', coefficient: 4 },
                { code: 'GC402', name: 'Génie urbain', coefficient: 3 },
                { code: 'GC403', name: 'Environnement et développement durable', coefficient: 3 },
                { code: 'GC404', name: 'Gestion de chantier', coefficient: 3 }
            ],
            session2: [
                { code: 'GC405', name: 'Projet intégré', coefficient: 5 },
                { code: 'GC406', name: 'Stage professionnel', coefficient: 2 }
            ]
        },
        annee3: {
            session1: [
                { code: 'GC501', name: 'PFE - Conception', coefficient: 6 },
                { code: 'GC502', name: 'Management de projets', coefficient: 3 }
            ],
            session2: [
                { code: 'GC503', name: 'PFE - Développement', coefficient: 8 },
                { code: 'GC504', name: 'PFE - Soutenance', coefficient: 2 }
            ]
        }
    },
    'Génie des Systèmes de Télécommunications et Réseaux': {
        annee1: {
            session1: [
                { code: 'GSTR301', name: 'Signaux et systèmes', coefficient: 4 },
                { code: 'GSTR302', name: 'Télécommunications analogiques', coefficient: 3 },
                { code: 'GSTR303', name: 'Réseaux locaux', coefficient: 3 },
                { code: 'GSTR304', name: 'Antennes et propagation', coefficient: 3 },
                { code: 'GSTR305', name: 'Électronique RF', coefficient: 3 }
            ],
            session2: [
                { code: 'GSTR306', name: 'Télécommunications numériques', coefficient: 4 },
                { code: 'GSTR307', name: 'Réseaux IP', coefficient: 3 },
                { code: 'GSTR308', name: 'Sécurité des réseaux', coefficient: 3 },
                { code: 'GSTR309', name: 'Projet télécom', coefficient: 4 }
            ]
        },
        annee2: {
            session1: [
                { code: 'GSTR401', name: '5G et réseaux mobiles', coefficient: 4 },
                { code: 'GSTR402', name: 'IoT et réseaux de capteurs', coefficient: 3 },
                { code: 'GSTR403', name: 'Cloud networking', coefficient: 3 },
                { code: 'GSTR404', name: 'Gestion de réseaux', coefficient: 3 }
            ],
            session2: [
                { code: 'GSTR405', name: 'Projet intégré', coefficient: 5 },
                { code: 'GSTR406', name: 'Stage professionnel', coefficient: 2 }
            ]
        },
        annee3: {
            session1: [
                { code: 'GSTR501', name: 'PFE - Conception', coefficient: 6 },
                { code: 'GSTR502', name: 'Innovation en télécoms', coefficient: 2 }
            ],
            session2: [
                { code: 'GSTR503', name: 'PFE - Développement', coefficient: 8 },
                { code: 'GSTR504', name: 'PFE - Soutenance', coefficient: 2 }
            ]
        }
    }
};

// Fonction pour obtenir les modules selon le niveau et la formation
const getModulesForLevel = (level, major) => {
    // Niveau 1 = 2AP1
    if (level === 1) return MODULES_2AP1;
    // Niveau 2 = 2AP2
    if (level === 2) return MODULES_2AP2;
    
    // Niveaux 3, 4, 5 = Formation (année 1, 2, 3)
    if (!MODULES_FORMATIONS[major]) {
        return MODULES_FORMATIONS['Génie Informatique']; // Par défaut
    }
    
    const formationModules = MODULES_FORMATIONS[major];
    if (level === 3) return formationModules.annee1;
    if (level === 4) return formationModules.annee2;
    if (level === 5) return formationModules.annee3;
    
    return MODULES_2AP1; // Par défaut
};

// Fonction pour convertir le niveau textuel en niveau numérique
const parseLevel = (levelText) => {
    if (levelText.includes('1ere') || levelText.includes('1ère')) return 1;
    if (levelText.includes('2eme') || levelText.includes('2ème')) return 2;
    if (levelText.includes('3eme') || levelText.includes('3ème')) return 3;
    if (levelText.includes('4eme') || levelText.includes('4ème')) return 4;
    if (levelText.includes('5eme') || levelText.includes('5ème')) return 5;
    return 1;
};

// Fonction pour obtenir le niveau textuel
const getLevelText = (levelNum) => {
    if (levelNum === 1) return '1ère année (2AP1)';
    if (levelNum === 2) return '2ème année (2AP2)';
    if (levelNum === 3) return '3ème année';
    if (levelNum === 4) return '4ème année';
    if (levelNum === 5) return '5ème année';
    return '1ère année';
};

// Génération des données de transcript
const generateTranscriptData = (levelText, major) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentAcademicYear = currentMonth >= 8 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
    
    const currentLevel = parseLevel(levelText);
    const parcours = [];
    
    // Générer les notes pour toutes les années précédentes
    for (let level = 1; level <= currentLevel; level++) {
        const yearOffset = currentLevel - level;
        const [startY, endY] = currentAcademicYear.split('/').map(Number);
        const academicYear = `${startY - yearOffset}/${endY - yearOffset}`;
        
        const modules = getModulesForLevel(level, major);
        
        const generateGrade = () => {
            const failChance = Math.random() < 0.12; // 12% de chance d'échec
            const base = failChance ? 7 + Math.random() * 3 : 10 + Math.random() * 8;
            return Math.round(base * 10) / 10;
        };
        
        const buildSession = (mods) => {
            const sessionModules = mods.map((m) => {
                const grade = generateGrade();
                return { 
                    ...m, 
                    grade, 
                    validated: grade >= 10,
                    session: mods === modules.session1 ? 'S1' : 'S2'
                };
            });
            const total = sessionModules.reduce((sum, m) => sum + m.grade * m.coefficient, 0);
            const coeff = sessionModules.reduce((sum, m) => sum + m.coefficient, 0);
            const avg = Math.round((total / coeff) * 10) / 10;
            let mention = 'Passable';
            if (avg >= 16) mention = 'Très Bien';
            else if (avg >= 14) mention = 'Bien';
            else if (avg >= 12) mention = 'Assez Bien';
            return { modules: sessionModules, average: avg, mention };
        };
        
        const session1 = buildSession(modules.session1);
        const session2 = buildSession(modules.session2);
        
        // Session combinée (rattrapage)
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
        if (rAvg >= 16) rMention = 'Très Bien';
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

// Génération de données d'étudiants réalistes
const generateStudents = () => {
    const students = [];
    const firstNames = ['Ahmed', 'Fatima', 'Youssef', 'Aicha', 'Mohamed', 'Sanae', 'Omar', 'Salma', 'Hassan', 'Nadia', 'Karim', 'Layla', 'Amine', 'Imane', 'Bilal', 'Sara', 'Mehdi', 'Hiba', 'Anas', 'Zineb', 'Khalid', 'Nour', 'Rachid', 'Leila', 'Tarik', 'Yasmine', 'Said', 'Meryem', 'Reda', 'Hind'];
    const lastNames = ['Alaoui', 'Benali', 'Idrissi', 'Amrani', 'Bennani', 'Cherkaoui', 'El Fassi', 'Hajji', 'Kadiri', 'Lamrani', 'Mansouri', 'Naciri', 'Ouazzani', 'Rachidi', 'Saadi', 'Tazi', 'Zahiri', 'Bouazza', 'Chraibi', 'Dahbi', 'El Amrani', 'Bensaid', 'Chakir', 'El Ouazzani', 'Fassi', 'Gharbi', 'Haddad', 'Jazouli', 'Kettani', 'Lahlou'];
    const cities = ['Tétouan', 'Casablanca', 'Rabat', 'Fès', 'Marrakech', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Settat', 'El Jadida', 'Kenitra', 'Safi', 'Mohammedia', 'Nador'];
    
    let apogeeCounter = 22000000;
    const usedEmails = new Set();
    
    // Générer des étudiants pour chaque formation et chaque niveau
    Object.keys(FORMATIONS).forEach((major, majorIdx) => {
        // 2AP1 (niveau 1)
        for (let i = 0; i < 3; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const birthYear = 2004 + Math.floor(Math.random() * 2);
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            
            let email = `${fName.toLowerCase()}.${lName.toLowerCase()}@etu.uae.ac.ma`;
            let emailCounter = 1;
            while (usedEmails.has(email)) {
                email = `${fName.toLowerCase()}.${lName.toLowerCase()}${emailCounter}@etu.uae.ac.ma`;
                emailCounter++;
            }
            usedEmails.add(email);
            
            students.push({
                email,
                apogee: String(apogeeCounter++),
                cin: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                cne: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                fName,
                lName,
                major,
                level: '1ère année (2AP1)',
                birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
                birth_place: cities[Math.floor(Math.random() * cities.length)]
            });
        }
        
        // 2AP2 (niveau 2)
        for (let i = 0; i < 3; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const birthYear = 2003 + Math.floor(Math.random() * 2);
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            
            let email = `${fName.toLowerCase()}.${lName.toLowerCase()}@etu.uae.ac.ma`;
            let emailCounter = 1;
            while (usedEmails.has(email)) {
                email = `${fName.toLowerCase()}.${lName.toLowerCase()}${emailCounter}@etu.uae.ac.ma`;
                emailCounter++;
            }
            usedEmails.add(email);
            
            students.push({
                email,
                apogee: String(apogeeCounter++),
                cin: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                cne: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                fName,
                lName,
                major,
                level: '2ème année (2AP2)',
                birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
                birth_place: cities[Math.floor(Math.random() * cities.length)]
            });
        }
        
        // Formation année 1 (niveau 3)
        for (let i = 0; i < 4; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const birthYear = 2002 + Math.floor(Math.random() * 2);
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            
            let email = `${fName.toLowerCase()}.${lName.toLowerCase()}@etu.uae.ac.ma`;
            let emailCounter = 1;
            while (usedEmails.has(email)) {
                email = `${fName.toLowerCase()}.${lName.toLowerCase()}${emailCounter}@etu.uae.ac.ma`;
                emailCounter++;
            }
            usedEmails.add(email);
            
            students.push({
                email,
                apogee: String(apogeeCounter++),
                cin: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                cne: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                fName,
                lName,
                major,
                level: '3ème année',
                birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
                birth_place: cities[Math.floor(Math.random() * cities.length)]
            });
        }
        
        // Formation année 2 (niveau 4)
        for (let i = 0; i < 3; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const birthYear = 2001 + Math.floor(Math.random() * 2);
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            
            let email = `${fName.toLowerCase()}.${lName.toLowerCase()}@etu.uae.ac.ma`;
            let emailCounter = 1;
            while (usedEmails.has(email)) {
                email = `${fName.toLowerCase()}.${lName.toLowerCase()}${emailCounter}@etu.uae.ac.ma`;
                emailCounter++;
            }
            usedEmails.add(email);
            
            students.push({
                email,
                apogee: String(apogeeCounter++),
                cin: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                cne: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                fName,
                lName,
                major,
                level: '4ème année',
                birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
                birth_place: cities[Math.floor(Math.random() * cities.length)]
            });
        }
        
        // Formation année 3 (niveau 5)
        for (let i = 0; i < 2; i++) {
            const fName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const birthYear = 2000 + Math.floor(Math.random() * 2);
            const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
            const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
            
            let email = `${fName.toLowerCase()}.${lName.toLowerCase()}@etu.uae.ac.ma`;
            let emailCounter = 1;
            while (usedEmails.has(email)) {
                email = `${fName.toLowerCase()}.${lName.toLowerCase()}${emailCounter}@etu.uae.ac.ma`;
                emailCounter++;
            }
            usedEmails.add(email);
            
            students.push({
                email,
                apogee: String(apogeeCounter++),
                cin: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                cne: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`,
                fName,
                lName,
                major,
                level: '5ème année',
                birth_date: `${birthYear}-${birthMonth}-${birthDay}`,
                birth_place: cities[Math.floor(Math.random() * cities.length)]
            });
        }
    });
    
    return students;
};

const seedDatabase = async () => {
    try {
        console.log('🌱 Démarrage du seeding de la base de données...\n');

        // Admin
        const [admins] = await db.query('SELECT * FROM administrators WHERE email = ?', ['admin@university.edu']);
        if (admins.length === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO administrators (first_name, last_name, email, password, login) VALUES (?, ?, ?, ?, ?)',
                ['Admin', 'User', 'admin@university.edu', hashedPassword, 'admin']
            );
            console.log('✅ Administrateur par défaut créé');
        }

        // Génération des étudiants
        const studentsData = generateStudents();
        console.log(`📚 Génération de ${studentsData.length} étudiants...\n`);

        console.log('👥 Seeding des étudiants...');
        for (const s of studentsData) {
            const [exists] = await db.query('SELECT id FROM students WHERE apogee_number = ?', [s.apogee]);
            const transcriptData = generateTranscriptData(s.level, s.major);

            if (exists.length === 0) {
                await db.query(
                    `INSERT INTO students (email, apogee_number, cin, cne, first_name, last_name, major, level, birth_date, birth_place, transcript_data)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [s.email, s.apogee, s.cin, s.cne, s.fName, s.lName, s.major, s.level, s.birth_date, s.birth_place, JSON.stringify(transcriptData)]
                );
                console.log(`  ✅ ${s.fName} ${s.lName} - ${s.major} (${s.level})`);
            } else {
                await db.query(
                    'UPDATE students SET transcript_data = ? WHERE apogee_number = ?',
                    [JSON.stringify(transcriptData), s.apogee]
                );
                console.log(`  🔄 ${s.fName} ${s.lName} mis à jour`);
            }
        }

        const [students] = await db.query('SELECT * FROM students');

        // Génération de demandes variées
        console.log('\n📋 Seeding des demandes...');
        const requestsData = [];
        const requestTypes = ['school-certificate', 'transcript', 'success-certificate', 'internship'];
        const statuses = ['En attente', 'Accepté', 'Refusé'];
        
        // Générer des demandes pour différents étudiants
        for (let i = 0; i < Math.min(30, students.length); i++) {
            const student = students[i];
            const type = requestTypes[Math.floor(Math.random() * requestTypes.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const year = new Date().getFullYear();
            const refPrefix = type === 'school-certificate' ? 'AS' : 
                             type === 'transcript' ? 'RN' : 
                             type === 'success-certificate' ? 'AR' : 'CS';
            const ref = `${refPrefix}-${year}-${String(i + 1).padStart(3, '0')}`;
            
            const academicYear = `${year - Math.floor(Math.random() * 3)}/${year - Math.floor(Math.random() * 3) + 1}`;
            
            requestsData.push({
                student,
                type,
                status,
                ref,
                academic_year: academicYear,
                session: type === 'transcript' || type === 'success-certificate' ? 
                    (Math.random() > 0.5 ? 'Session 1' : 'Session 2') : null,
                reason: status === 'Refusé' ? 
                    ['Notes manquantes', 'Documents incomplets', 'Informations incorrectes'][Math.floor(Math.random() * 3)] : null,
                company_name: type === 'internship' ? 
                    ['TechLabs', 'GreenCorp', 'InnovateMaroc', 'DigitalSolutions'][Math.floor(Math.random() * 4)] : null
            });
        }

        for (const r of requestsData) {
            const [exists] = await db.query('SELECT id FROM requests WHERE reference = ?', [r.ref]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO requests (reference, student_id, document_type, status, refusal_reason, specific_details) VALUES (?, ?, ?, ?, ?, ?)',
                    [
                        r.ref,
                        r.student.id,
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
                console.log(`  ✅ Demande ${r.ref} - ${r.student.first_name} ${r.student.last_name}`);
            }
        }

        // Génération de réclamations
        console.log('\n📢 Seeding des réclamations...');
        const [reqRows] = await db.query('SELECT * FROM requests WHERE status = ?', ['Refusé']);
        const complaintsData = [];
        
        for (let i = 0; i < Math.min(5, reqRows.length); i++) {
            const req = reqRows[i];
            const year = new Date().getFullYear();
            const number = `CMP-${year}-${String(i + 1).padStart(3, '0')}`;
            const reasons = ['Information incorrecte', 'Décision contestée', 'Délai long', 'Documents manquants'];
            const descriptions = [
                'Veuillez vérifier mes notes S1.',
                'Je conteste le refus, modules valides.',
                'Merci de confirmer l\'envoi.',
                'Les informations sont correctes.'
            ];
            
            complaintsData.push({
                req,
                number,
                reason: reasons[Math.floor(Math.random() * reasons.length)],
                description: descriptions[Math.floor(Math.random() * descriptions.length)],
                status: Math.random() > 0.5 ? 'En attente' : 'Traitée'
            });
        }

        for (const c of complaintsData) {
            const [exists] = await db.query('SELECT id FROM complaints WHERE complaint_number = ?', [c.number]);
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO complaints (complaint_number, request_id, student_id, reason, description, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [c.number, c.req.id, c.req.student_id, c.reason, c.description, c.status]
                );
                console.log(`  ✅ Réclamation ${c.number}`);
            }
        }

        console.log('\n✨ Seeding terminé avec succès!');
        console.log(`📊 Statistiques:`);
        console.log(`   - ${studentsData.length} étudiants créés`);
        console.log(`   - ${requestsData.length} demandes créées`);
        console.log(`   - ${complaintsData.length} réclamations créées`);
        process.exit();
    } catch (error) {
        console.error('❌ Erreur lors du seeding:', error);
        process.exit(1);
    }
};

seedDatabase();
