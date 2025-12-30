const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const uploadRoot = path.join(__dirname, '..', 'uploads');
const draftDir = path.join(uploadRoot, 'generated');
const finalDir = path.join(uploadRoot, 'final');

const DOC_LABELS = {
    'school-certificate': 'Attestation de scolarité',
    'success-certificate': 'Attestation de réussite',
    transcript: 'Relevé de notes',
    internship: 'Convention de stage'
};
const ARABIC_FONT_PATH = 'C:\\Windows\\Fonts\\tahoma.ttf';

const ensureDirectory = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

ensureDirectory(uploadRoot);
ensureDirectory(draftDir);
ensureDirectory(finalDir);

const formatName = (student) => `${(student?.last_name || '').toUpperCase()} ${student?.first_name || ''}`.trim();

const resolveDetails = (docType, incoming = {}) => {
    const base = {
        academic_year: incoming.academic_year || '2024/2025',
        program: incoming.program,
        level: incoming.level,
        session: incoming.session || 'Session 1',
        cin: incoming.cin,
        apogee_number: incoming.apogee_number,
        cne: incoming.cne,
        birth_date: incoming.birth_date,
        birth_place: incoming.birth_place
    };

    if (docType === 'transcript') {
        const modules = Array.isArray(incoming.modules) ? incoming.modules : [];
        return { ...base, ...incoming, modules };
    }

    if (docType === 'success-certificate') {
        return {
            ...base,
            birth_date: incoming.birth_date,
            birth_place: incoming.birth_place,
            filiere: incoming.filiere || incoming.program || incoming.major,
            mention: incoming.mention,
            session: incoming.session || incoming.success_session || base.session
        };
    }

    if (docType === 'internship') {
        return {
            ...base,
            major: incoming.major || incoming.filiere || incoming.program,
            company_name: incoming.company_name || incoming.company_legal_name,
            company_legal_name: incoming.company_legal_name,
            company_address: incoming.company_address,
            company_city: incoming.company_city,
            company_email: incoming.company_email,
            company_phone: incoming.company_phone,
            company_sector: incoming.company_sector,
            company_representative_name: incoming.company_representative_name,
            company_representative_function: incoming.company_representative_function,
            supervisor_name: incoming.supervisor_name,
            supervisor_role: incoming.supervisor_role,
            supervisor_phone: incoming.supervisor_phone,
            supervisor_email: incoming.supervisor_email,
            ensa_supervisor_name: incoming.ensa_supervisor_name,
            internship_subject: incoming.internship_subject || incoming.internship_title,
            internship_title: incoming.internship_title || incoming.internship_subject,
            start_date: incoming.start_date,
            end_date: incoming.end_date
        };
    }

    return { ...base, ...incoming };
};

const addHeaderWithLogo = (doc) => {
    const pageWidth = doc.page.width;
    const margin = 50;
    const headerTop = 50;
    
    // Colonne gauche (français)
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('ROYAUME DU MAROC', margin, headerTop, { width: 180, align: 'left' });
    doc.fontSize(8).font('Helvetica');
    doc.text('Université Abdelmalek Essaâdi', margin, headerTop + 15, { width: 180, align: 'left' });
    doc.text('Ecole Nationale des Sciences', margin, headerTop + 28, { width: 180, align: 'left' });
    doc.text('Appliquées', margin, headerTop + 41, { width: 180, align: 'left' });
    doc.text('Tétouan', margin, headerTop + 54, { width: 180, align: 'left' });
    doc.fontSize(7.5);
    doc.text('Service des Affaires Etudiantes', margin, headerTop + 70, { width: 180, align: 'left' });
    
    // Logo au centre (placeholder - vous devrez ajouter votre propre logo)
    // Si vous avez un fichier logo, utilisez: doc.image('path/to/logo.png', centerX, headerTop, { width: 80 });
    const centerX = (pageWidth / 2) - 40;
    doc.fontSize(8).font('Helvetica');
    doc.text('[LOGO]', centerX, headerTop + 30, { width: 80, align: 'center' });
    
    
    // Ligne de séparation
    doc.moveDown(6);
    const lineY = doc.y;
    doc.moveTo(margin, lineY).lineTo(pageWidth - margin, lineY).lineWidth(1.5).strokeColor('#000000').stroke();
    doc.moveDown(1.5);
};

const addFooterWithAddress = (doc, payload) => {
    const pageHeight = doc.page.height;
    const pageWidth = doc.page.width;
    const margin = 50;
    const footerY = pageHeight - 100;
    
    // Ligne de séparation avant le footer
    doc.moveTo(margin, footerY - 27).lineTo(pageWidth - margin, footerY - 20).lineWidth(0.5).strokeColor('#000000').stroke();
    
    // Adresse (gauche et arabe à droite)
    doc.fontSize(7).font('Helvetica');
    doc.text('Adresse:', margin, footerY, { continued: true });
    doc.text(' MHannech II', { continued: false });
    doc.text('         B.P. 2222 Tétouan', margin, footerY + 12);
    doc.text('Tél: 0539688802 FAX : 0539994624', margin, footerY + 24);
    
    
    // Note importante en bas
    doc.fontSize(7).font('Helvetica-Oblique');
    doc.text(
        'Il appartient à l\'étudiant d\'en faire des photocopies certifiées conformes.',
        margin,
        footerY + 55,
        { width: pageWidth - 2 * margin, align: 'center' }
    );
    doc.text(
        'Le présent document n\'est délivré qu\'en un seul exemplaire.',
        margin,
        footerY + 67,
        { width: pageWidth - 2 * margin, align: 'center' }
    );
};

const buildSchoolCertificate = (doc, payload) => {
    addHeaderWithLogo(doc);

    // Titre principal
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('ATTESTATION DE SCOLARITE', { align: 'center', underline: true });
    doc.moveDown(2);

    // Texte d'introduction
    doc.fontSize(10).font('Helvetica');
    doc.text(
        'Le Directeur de l\'Ecole Nationale des Sciences Appliquées de Tétouan atteste que l\'étudiant(e) :',
        { align: 'left' }
    );
    doc.moveDown(1.5);

    // Informations de l'étudiant
    const leftMargin = 80;
    let currentY = doc.y;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text(formatName(payload.student), leftMargin, currentY);
    currentY += 25;

    // CIN
    doc.font('Helvetica');
    doc.text('Numéro de la carte d\'identité nationale :', leftMargin, currentY, { continued: true });
    doc.font('Helvetica-Bold');
    doc.text(`    ${payload.details.cin || payload.student.cin || '___________'}`);
    currentY += 20;

    // CNE
    doc.font('Helvetica');
    doc.text('Code national de l\'étudiante :', leftMargin, currentY, { continued: true });
    doc.font('Helvetica-Bold');
    doc.text(`    ${payload.details.cne || payload.student.cne || '___________'}`);
    currentY += 20;

    // Date et lieu de naissance
    const birthDate = (payload.details.birth_date || payload.student.birth_date)
        ? new Date(payload.details.birth_date || payload.student.birth_date).toLocaleDateString('fr-FR')
        : '__/__/____';
    const birthPlace = payload.details.birth_place || payload.student.birth_place || '_________';
    
    doc.font('Helvetica');
    doc.text(`née le ${birthDate} à ${birthPlace.toUpperCase()} ( MAROC )`, leftMargin, currentY);
    currentY += 25;

    // Inscription
    doc.font('Helvetica');
    doc.text(
        `Poursuit ses études à l' Ecole Nationale des Sciences Appliquées Tétouan pour l'année`,
        leftMargin,
        currentY
    );
    currentY += 15;
    doc.text(`universitaire ${payload.details.academic_year || '2024/2025'}.`, leftMargin, currentY);
    currentY += 25;

    // Diplôme
    doc.font('Helvetica');
    doc.text('Diplôme :', leftMargin, currentY, { continued: true });
    doc.font('Helvetica-Bold');
    const diploma = payload.details.program || payload.student.major || '___________';
    doc.text(`   ${diploma}`);
    currentY += 20;

    // Filière
    doc.font('Helvetica');
    doc.text('Filière :', leftMargin, currentY, { continued: true });
    doc.font('Helvetica-Bold');
    const filiere = payload.details.program || payload.student.major || '___________';
    doc.text(`     ${filiere}`);
    currentY += 20;

    // Année
    doc.font('Helvetica');
    doc.text('Année :', leftMargin, currentY, { continued: true });
    doc.font('Helvetica-Bold');
    const level = payload.details.level || payload.student.level || '___________';
    doc.text(`     ${level}`);
    currentY += 40;

    // Date et lieu
    doc.fontSize(9).font('Helvetica');
    doc.text(
        `Fait à TETOUAN, le ${payload.issuedAt}`,
        doc.page.width - 250,
        currentY,
        { width: 200, align: 'left' }
    );
    currentY += 30;

    // Signature avec cachet
    doc.fontSize(9).font('Helvetica');
    doc.text('Le Directeur', doc.page.width - 250, currentY, { width: 200, align: 'center' });
    currentY += 15;
    
    // Espace pour cachet et signature
    doc.fontSize(8).font('Helvetica-Oblique');
    doc.text('[Cachet et Signature]', doc.page.width - 250, currentY, { width: 200, align: 'center' });
    currentY += 30;
    
    // Numéro d'étudiant en bas à droite
    doc.fontSize(8).font('Helvetica');
    doc.text(
        `N°étudiant :    ${payload.details.apogee_number || payload.student.apogee_number || '___________'}`,
        doc.page.width - 250,
        currentY,
        { width: 200, align: 'left' }
    );

    // Footer avec adresse
    addFooterWithAddress(doc, payload);
};

const buildSuccessCertificate = (doc, payload) => {
    addHeaderWithLogo(doc);

    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('ATTESTATION DE RÉUSSITE', { align: 'center' });

    doc.moveDown(3);
    doc.fontSize(11).font('Helvetica');
    doc.text(
        'Le Directeur de l\'École Nationale des Sciences Appliquées de Tétouan atteste que l\'étudiant(e) :',
        { align: 'justify' }
    );

    doc.moveDown(2);

    const infoX = 90;
    const valueX = 260;
    let currentY = doc.y;

    const addLine = (label, value) => {
        doc.font('Helvetica-Bold').text(label, infoX, currentY);
        doc.font('Helvetica').text(value || '---', valueX, currentY);
        currentY += 22;
    };

    addLine('Nom et Prénom', `: ${formatName(payload.student)}`);
    addLine('Numéro Apogée', `: ${payload.details.apogee_number || payload.student.apogee_number}`);
    addLine('CNE', `: ${payload.details.cne || payload.student.cne}`);
    addLine('CIN', `: ${payload.details.cin || payload.student.cin}`);

    const birthDate = (payload.details.birth_date || payload.student.birth_date)
        ? new Date(payload.details.birth_date || payload.student.birth_date).toLocaleDateString('fr-FR')
        : '---';
    addLine('Né(e) le', `: ${birthDate}`);
    addLine('Filière', `: ${payload.details.filiere || '---'}`);

    doc.y = currentY + 20;
    doc.x = 70;

    doc.font('Helvetica').text('A validé tous les modules de l\'année universitaire et est déclaré(e) admis(e).', { align: 'justify' });

    doc.moveDown(4);
    doc.fontSize(10).text(`Fait à Tétouan, le ${payload.issuedAt}`, { align: 'right' });

    doc.moveDown(3);
    doc.font('Helvetica-Bold');
    doc.text('Le Directeur', { align: 'right' });

    addFooterWithAddress(doc, payload);
};

const buildTranscript = (doc, payload) => {
    const pageWidth = doc.page.width;
    const left = 40;
    const right = pageWidth - 40;
    const contentWidth = right - left;
    const academicYear = payload.details.academic_year || '2024/2025';
    const sessionLabel = payload.details.session || 'Session 1';
    const yearParts = academicYear.split('/');
    const shortYear = yearParts.length === 2 ? `${yearParts[0]}/${yearParts[1].slice(-2)}` : academicYear;
    const sessionCode = sessionLabel.toLowerCase().includes('2') ? 'S2' : 'S1';
    const sessionShort = `${sessionCode} ${shortYear}`;
    const sessionNumber = sessionCode === 'S2' ? '2' : '1';
    const normalizedSession = String(sessionLabel).toLowerCase().replace(/\s+/g, '');
    const isCombinedSession = normalizedSession.includes('1+2') || normalizedSession.includes('s1+s2');

    const getModuleSessionShort = (module) => {
        if (!isCombinedSession) return sessionShort;
        const moduleSession = String(module?.session || '').toLowerCase();
        const hasS1 = Boolean(module?.session1) || moduleSession.includes('1');
        const hasS2 = Boolean(module?.session2) || moduleSession.includes('2');
        if (hasS1 && !hasS2) return `S1 ${shortYear}`;
        if (hasS2 && !hasS1) return `S2 ${shortYear}`;
        if (hasS1 && hasS2) return `S1+S2 ${shortYear}`;
        return sessionShort;
    };

    // Header block
    doc.lineWidth(1).rect(left, 35, contentWidth, 42).stroke();
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Universite Abdelmalek Essaadi', left + 8, 45);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Annee universitaire  ${academicYear}`, left + 180, 55);
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Page : 1 / 1', right - 70, 120);

    // School line
    doc.font('Helvetica').fontSize(10);
    doc.text('Ecole Nationale des Sciences Appliquees Tetouan', left, 95);
    doc.moveDown(2);
    // Title block
    doc.lineWidth(0.8).rect(left + 120, 105, contentWidth - 240, 20).stroke();
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('RELEVE DE NOTES ET RESULTATS', left + 125, 110, { width: contentWidth - 250, align: 'center' });
    doc.lineWidth(0.8).rect(left + 220, 130, contentWidth - 440, 16).stroke();
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(sessionLabel, left + 220, 132, { width: contentWidth - 440, align: 'center' });
    doc.moveDown(2);
    // Student identity block
    let y = 155;
    const colA = left;
    const colB = left + 230;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(`${payload.student.last_name || ''} ${payload.student.first_name || ''}`.trim(), colA, y);
    y += 18;
    doc.font('Helvetica').fontSize(9);
    doc.text(`N Etudiant : ${payload.details.apogee_number || payload.student.apogee_number || '---'}`, colA, y);
    doc.text(`CNE : ${payload.details.cne || payload.student.cne || '---'}`, colB, y);
    y += 16;
    const birthDate = (payload.details.birth_date || payload.student.birth_date)
        ? new Date(payload.details.birth_date || payload.student.birth_date).toLocaleDateString('fr-FR')
        : '---';
    doc.text(`Ne le : ${birthDate}`, colA, y);
    doc.text(`a : ${payload.details.birth_place || payload.student.birth_place || '---'}`, colB, y);
    y += 18;
    doc.text(`inscrit en ${payload.details.level || payload.student.level || '---'} du Cycle Ingenieur : ${payload.details.program || payload.student.major || '---'}`, colA, y);
    y += 14;
    doc.text('a obtenu les notes suivantes :', colA, y);

    // Table header
    y += 12;
    const tableTop = y;
    const colModule = left + 6;
    const colNote = left + 270;
    const colResult = left + 350;
    const colSession = left + 420;
    const colJury = left + 470;
    const rowHeight = 16;

    doc.rect(left, tableTop, contentWidth, rowHeight).stroke();
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text('Libelle du Module', colModule, tableTop + 4);
    doc.text('Note/Bareme', colNote, tableTop + 4);
    doc.text('Resultat', colResult, tableTop + 4);
    doc.text('Session', colSession, tableTop + 4);
    doc.text('Pts jury', colJury, tableTop + 4, { width: 40 });

    // Table rows
    const modules = Array.isArray(payload.details.modules) ? payload.details.modules : [];
    let currentY = tableTop + rowHeight;
    let total = 0;
    doc.font('Helvetica').fontSize(8.5);

    modules.forEach((m, i) => {
        const grade = Number(m.grade || 0);
        total += grade;
        doc.rect(left, currentY, contentWidth, rowHeight).stroke();
        doc.text(m.name || `Module ${i + 1}`, colModule, currentY + 4, { width: 250 });
        doc.text(`${grade.toFixed(2)} / 20`, colNote, currentY + 4);
        doc.text(grade >= 10 ? 'Valide' : 'Non valide', colResult, currentY + 4);
        doc.text(getModuleSessionShort(m), colSession, currentY + 4);
        currentY += rowHeight;
    });

    // Result line
    currentY += 10;
    const average = modules.length > 0 ? (total / modules.length).toFixed(3) : '0.000';
    const isAdmitted = parseFloat(average) >= 10;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(`Resultat d'admission ${sessionLabel} :`, left + 5, currentY);
    doc.text(`${average} / 20`, left + 260, currentY);
    doc.text(isAdmitted ? 'Admis' : 'Ajourne', left + 360, currentY);

    // Signature block (stamp/signature images can be added here if provided)
    currentY += 55;
    doc.font('Helvetica').fontSize(8);
    doc.text(`Fait a TETOUAN, le ${payload.issuedAt}`, left + 160, currentY);
    currentY += 12;
    doc.text('Le Directeur de l\'Ecole Nationale des Sciences Appliquees de Tetouan', left + 90, currentY);
    currentY += 16;
    doc.text('Le Directeur', left + 260, currentY);

    // Footer note
    addFooterNote(doc, 'Avis important : Il ne peut etre delivre qu\'un seul exemplaire du present releve de note. Aucun duplicata ne sera fourni.');
};

const buildInternship = (doc, payload) => {
    const d = payload.details;
    const s = payload.student;
    const margin = 50;
    
    // En-tête avec tableau
    doc.fontSize(10).font('Helvetica-Bold');
    const headerY = 50;
    doc.text('Université Abdelmalek Essaâdi', margin, headerY);
    doc.text('Ecole Nationale des Sciences Appliquées', margin, headerY + 15);
    doc.text('Tétouan', margin, headerY + 30);
    
    // Titre principal
    doc.moveDown(4);
    doc.fontSize(14).font('Helvetica-Bold');
    doc.text('CONVENTION DE STAGE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text('(2 exemplaires imprimés en recto-verso)', { align: 'center', underline: true });
    doc.fillColor('#000000');

    doc.moveDown(2);

    // ENTRE
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('ENTRE', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text('L\'Ecole Nationale des Sciences Appliquées, Université Abdelmalek Essaâdi - Tétouan', margin, doc.y, { 
        width: doc.page.width - 2 * margin, 
        align: 'left' 
    });
    doc.moveDown(0.5);
    doc.text('B.P. 2222, Mhannech II, Tétouan , Maroc', margin);
    doc.moveDown(0.3);
    doc.text('Tél. +212 5 39 68 80 27 ; Fax. +212 39 99 46 24.', margin);
    doc.text('Web: https://ensa-tetouan.ac.ma', margin, doc.y, { link: 'https://ensa-tetouan.ac.ma' });
    doc.moveDown(0.5);
    doc.text('Représenté par le Professeur Kamal REKLAOUI en qualité de Directeur.', margin, doc.y, { 
        width: doc.page.width - 2 * margin 
    });
    doc.moveDown(0.5);
    doc.text('Ci-après, dénommé ', margin, doc.y, { 
        continued: true 
    });
    doc.font('Helvetica-Bold').text('l\'Etablissement', { continued: false });
    doc.moveDown(1.5);

    // ET
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('ET', { align: 'center' });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`La Société : `, margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text(d.company_name || '_______________');
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Adresse :   ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text(d.company_address || '_______________');
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Tél : ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text((d.company_phone || '_______________') + '   ', { continued: true });
    doc.font('Helvetica').text('Email: ', { continued: true });
    doc.font('Helvetica-Bold').text(d.company_email || '_______________');
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Représentée par Monsieur ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text((d.company_representative_name || '_______________') + ' ', { continued: true });
    doc.font('Helvetica').text('en qualité ', { continued: true });
    doc.font('Helvetica-Bold').text(d.company_representative_function || '_______________');
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Ci-après dénommée ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE');

    doc.moveDown(1.5);

    // Article 1
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 1 : Engagement', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', margin, doc.y, { continued: true });
    doc.font('Helvetica').text(' accepte de recevoir à titre de stagiaire ', { continued: true });
    doc.font('Helvetica-Bold').text(formatName(s) + ' ', { continued: true });
    doc.font('Helvetica').text('étudiant de la filière du Cycle Ingénieur ', { continued: true });
    doc.font('Helvetica-Bold').text(`« ${d.major || s.major || '_______________'} » `, { continued: true });
    doc.font('Helvetica').text('de l\'ENSA de Tétouan, Université Abdelmalek Essaâdi (Tétouan), pour une période allant du ', { continued: true });
    
    const startDate = d.start_date ? new Date(d.start_date).toISOString().split('T')[0] : '_______________';
    const endDate = d.end_date ? new Date(d.end_date).toISOString().split('T')[0] : '_______________';
    
    doc.font('Helvetica-Bold').text(`${startDate} `, { continued: true });
    doc.font('Helvetica').text('au ', { continued: true });
    doc.font('Helvetica-Bold').text(endDate);
    
    doc.moveDown(1);
    doc.font('Helvetica-Bold');
    doc.text('En aucun cas, cette convention ne pourra autoriser les étudiants à s\'absenter durant la période des contrôles ou des enseignements.', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        align: 'left'
    });

    doc.moveDown(1.5);

    // Article 2
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 2 : Objet', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Le stage aura pour objet essentiel d\'assurer l\'application pratique de l\'enseignement donné par ', margin, doc.y, { 
        continued: true,
        width: doc.page.width - 2 * margin 
    });
    doc.font('Helvetica-Bold').text('l\'Etablissement', { continued: true });
    doc.font('Helvetica').text(', et ce, en organisant des visites sur les installations et en réalisant des études proposées par ', { continued: true });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text('.');

    doc.moveDown(1.5);

    // Article 3
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 3 : Encadrement et suivi', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Pour accompagner le Stagiaire durant son stage, et ainsi instaurer une véritable collaboration L\'ENTREPRISE/Stagiaire/Etablissement, L\'ENTREPRISE désigne Mme/Mr ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text((d.supervisor_name || '_______________') + ' ', { continued: true });
    doc.font('Helvetica').text('encadrant(e) et parrain(e), pour superviser et assurer la qualité du travail fourni par le Stagiaire.');
    
    doc.moveDown(0.5);
    doc.text('L\'Etablissement désigne ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text((d.ensa_supervisor_name || '_______________') + ' ', { continued: true });
    doc.font('Helvetica').text('en tant que tuteur qui procurera une assistance pédagogique');

    doc.moveDown(1.5);

    // Article 4
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 4 : Programme:', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Le thème du stage est: ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text(`« ${d.internship_subject || d.internship_title || '_______________'} »`);
    
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.text('Ce programme a été défini conjointement par ', margin, doc.y, { 
        width: doc.page.width - 2 * margin,
        continued: true 
    });
    doc.font('Helvetica-Bold').text('l\'Etablissement', { continued: true });
    doc.font('Helvetica').text(', ', { continued: true });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text(' et le ', { continued: true });
    doc.font('Helvetica-Bold').text('Stagiaire', { continued: true });
    doc.font('Helvetica').text('.');
    
    doc.moveDown(0.5);
    doc.text('Le contenu de ce programme doit permettre au Stagiaire une réflexion en relation avec les enseignements ou le projet de fin d\'études qui s\'inscrit dans le programme de formation de ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text('l\'Etablissement', { continued: true });
    doc.font('Helvetica').text('.');

    doc.moveDown(1.5);

    // Article 5
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 5 : Indemnité de stage', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Au cours du stage, l\'étudiant ne pourra prétendre à aucun salaire de la part de ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text('.');
    
    doc.moveDown(0.5);
    doc.text('Cependant, si ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text('l\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text(' et l\'étudiant le conviennent, ce dernier pourra recevoir une indemnité forfaitaire de la part de l\'ENTREPRISE des frais occasionnés par la mission confiée à l\'étudiant.', {
        width: doc.page.width - 2 * margin
    });

    doc.moveDown(1.5);

    // Article 6
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 6 : Règlement', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Pendant la durée du stage, le Stagiaire reste placé sous la responsabilité de ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text('l\'Etablissement', { continued: true });
    doc.font('Helvetica').text('.');
    
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold');
    doc.text('Cependant, l\'étudiant est tenu d\'informer l\'école dans un délai de 24h sur toute modification portant sur la convention déjà signée, sinon il en assumera toute sa responsabilité sur son non-respect de la convention signée par l\'école.', margin, doc.y, {
        width: doc.page.width - 2 * margin
    });
    
    doc.moveDown(0.5);
    doc.font('Helvetica');
    doc.text('Toutefois, le Stagiaire est soumis à la discipline et au règlement intérieur de ', margin, doc.y, {
        continued: true
    });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text('.');
    
    doc.moveDown(0.5);
    doc.text('En cas de manquement, ', margin, doc.y, { continued: true });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text(' se réserve le droit de mettre fin au stage après en avoir convenu avec le Directeur de l\'Etablissement.', {
        width: doc.page.width - 2 * margin
    });

    doc.moveDown(1.5);

    // Article 7
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 7 : Confidentialité', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Le Stagiaire et l\'ensemble des acteurs liés à son travail (l\'administration de ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text('l\'Etablissement', { continued: true });
    doc.font('Helvetica').text(', le parrain pédagogique ...) sont tenus au secret professionnel. Ils s\'engagent à ne pas diffuser les informations recueillies à des fins de publications, conférences, communications, sans raccord préalable de ', { continued: true });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text('. Cette obligation demeure valable après l\'expiration du stage');

    doc.moveDown(1.5);

    // Article 8
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 8 : Assurance accident de travail', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica-Bold');
    doc.text('Le stagiaire', margin, doc.y, { continued: true });
    doc.font('Helvetica').text(' devra obligatoirement souscrire une assurance couvrant la Responsabilité Civile et Accident de Travail, durant les stages et trajets effectués.');
    
    doc.moveDown(0.5);
    doc.text('En cas d\'accident de travail survenant durant la période du stage, ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text(' s\'engage à faire parvenir immédiatement à l\'Etablissement toutes les informations indispensables à la déclaration dudit accident.');

    doc.moveDown(1.5);

    // Article 9
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 9: Evaluation de L\'ENTREPRISE', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('Le stage accompli, le parrain établira un rapport d\'appréciations générales sur le travail effectué et le comportement du Stagiaire durant son séjour chez ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text('.');
    
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', margin, doc.y, { continued: true });
    doc.font('Helvetica').text(' remettra au Stagiaire une attestation indiquant la nature et la durée des travaux effectués.');

    doc.moveDown(1.5);

    // Article 10
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article 10 : Rapport de stage', margin);
    doc.moveDown(0.5);
    
    doc.font('Helvetica');
    doc.text('A l\'issue de chaque stage, le Stagiaire rédigera un rapport de stage faisant état de ses travaux et de son vécu au sein de ', margin, doc.y, {
        width: doc.page.width - 2 * margin,
        continued: true
    });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text('. Ce rapport sera communiqué à ', { continued: true });
    doc.font('Helvetica-Bold').text('L\'ENTREPRISE', { continued: true });
    doc.font('Helvetica').text(' et restera strictement confidentiel.');

    doc.moveDown(3);

    // Date et lieu
    const currentDateTime = new Date().toLocaleString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    doc.font('Helvetica');
    doc.text(`Fait à Tétouan en deux exemplaires, le ${currentDateTime}`, margin, doc.y, {
        width: doc.page.width - 2 * margin,
        align: 'center'
    });

    doc.moveDown(3);

    // Tableau des signatures
    const sigTableY = doc.y;
    const colWidth = (doc.page.width - 2 * margin) / 2;
    
    doc.fontSize(9).font('Helvetica');
    
    // Ligne 1
    doc.text('Nom et signature du Stagiaire', margin, sigTableY, { 
        width: colWidth, 
        align: 'left' 
    });
    doc.text('Le Coordonnateur de la filière', margin + colWidth, sigTableY, { 
        width: colWidth, 
        align: 'left' 
    });
    
    // Ligne 2 (avec espace pour signatures)
    const sig2Y = sigTableY + 60;
    doc.text('Signature et cachet de L\'Etablissement', margin, sig2Y, { 
        width: colWidth, 
        align: 'left' 
    });
    doc.text('Signature et cachet de L\'ENTREPRISE', margin + colWidth, sig2Y, { 
        width: colWidth, 
        align: 'left' 
    });
};


const createPdf = (docType, payload, absolutePath) => new Promise((resolve, reject) => {
    try {
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4',
            bufferPages: true
        });

        const stream = fs.createWriteStream(absolutePath);
        doc.pipe(stream);

        switch (docType) {
            case 'school-certificate':
                buildSchoolCertificate(doc, payload);
                break;
            case 'success-certificate':
                buildSuccessCertificate(doc, payload);
                break;
            case 'transcript':
                buildTranscript(doc, payload);
                break;
            case 'internship':
                buildInternship(doc, payload);
                break;
            default:
                addHeader(doc);
                doc.moveDown(4);
                doc.fontSize(16).font('Helvetica-Bold').text('Document non supporté', { align: 'center' });
        }

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', (err) => reject(err));
    } catch (error) {
        reject(error);
    }
});

const generateDocument = async ({ docType, student, details = {}, reference, variant = 'draft' }) => {
    try {
        const resolvedDetails = resolveDetails(docType, details);
        const payload = {
            student,
            details: resolvedDetails,
            issuedAt: new Date().toLocaleDateString('fr-FR'),
            label: DOC_LABELS[docType] || 'Document'
        };

        const filename = `${reference}-${variant}.pdf`;
        const targetDir = variant === 'final' ? finalDir : draftDir;
        const absolutePath = path.join(targetDir, filename);
        const publicPath = `/uploads/${variant === 'final' ? 'final' : 'generated'}/${filename}`;

        await createPdf(docType, payload, absolutePath);

        return {
            absolutePath,
            publicPath,
            details: resolvedDetails,
            success: true
        };
    } catch (error) {
        console.error('Erreur lors de la génération du document:', error);
        throw error;
    }
};

module.exports = {
    generateDocument,
    DOC_LABELS
};



