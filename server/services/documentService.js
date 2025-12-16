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
        // Ajouter les champs d'identification de l'étudiant pour qu'ils soient éditables
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
            major: incoming.major,
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

const addFooterNote = (doc, text) => {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 60;
    
    doc.fontSize(8).fillColor('#666666').font('Helvetica-Oblique');
    doc.text(text, 50, footerY, { 
        align: 'center', 
        width: doc.page.width - 100,
        lineGap: 2
    });
};

const buildSchoolCertificate = (doc, payload) => {
    // En-tête avec dégradé visuel
    doc.rect(0, 0, doc.page.width, 100).fill('#1e40af');
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('ROYAUME DU MAROC', 60, 25, { align: 'left' });
    doc.fontSize(11).font('Helvetica');
    doc.text('Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique', 60, 45);
    doc.text('et de l\'Innovation', 60, 60);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('L\'École Nationale des Sciences Appliquées Tétouan (ENSATe)', 60, 78);
    
    // Ligne décorative
    doc.rect(0, 100, doc.page.width, 3).fill('#93c5fd');
    
    doc.fillColor('#000000');
    doc.moveDown(6);
    
    // Titre principal avec encadrement élégant
    const titleY = doc.y;
    doc.roundedRect(80, titleY, doc.page.width - 160, 60, 5).lineWidth(2).stroke('#1e40af');
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('CERTIFICAT DE SCOLARITÉ', 0, titleY + 20, { align: 'center' });
    
    doc.moveDown(4);
    doc.fontSize(12).font('Helvetica').fillColor('#000000');
    doc.text(
        'Le Doyen de la Faculté des Sciences et Techniques atteste que l\'étudiant(e) :',
        60, doc.y,
        { align: 'left', width: doc.page.width - 120 }
    );
    
    doc.moveDown(1.5);

    // Cadre d'informations avec ombrage
    const infoY = doc.y;
    doc.roundedRect(60, infoY, doc.page.width - 120, 140, 8).fill('#f8fafc').stroke('#cbd5e1');
    
    const labelX = 80;
    const valueX = 280;
    let currentY = infoY + 15;
    
    const addInfoLine = (label, value) => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(label, labelX, currentY);
        doc.font('Helvetica').fillColor('#000000').text(value || '---', valueX, currentY);
        currentY += 22;
    };
    
    addInfoLine('Nom et Prénom :', formatName(payload.student));
    addInfoLine('CIN :', payload.details.cin || payload.student.cin || '---');
    addInfoLine('Code étudiant (Apogée) :', payload.details.apogee_number || payload.student.apogee_number || '---');
    addInfoLine('Code National de l\'étudiant (CNE) :', payload.details.cne || payload.student.cne || '---');
    
    const birthDate = (payload.details.birth_date || payload.student.birth_date)
        ? new Date(payload.details.birth_date || payload.student.birth_date).toLocaleDateString('fr-FR')
        : '---';
    const birthPlace = payload.details.birth_place || payload.student.birth_place || '---';
    const birthInfo = birthDate !== '---' ? `Né(e) le ${birthDate} à ${birthPlace}` : '---';
    addInfoLine('Né(e) le :', birthInfo);
    
    doc.y = infoY + 155;
    doc.fontSize(12).font('Helvetica').fillColor('#000000');
    doc.text(
        `Poursuit régulièrement ses études pour l'année universitaire ${payload.details.academic_year || '---'} en :`,
        60, doc.y,
        { align: 'left', width: doc.page.width - 120 }
    );
    
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').fillColor('#1e40af');
    doc.text(
        `${payload.details.level || '---'} - ${payload.details.program || '---'}`,
        60, doc.y,
        { align: 'left', width: doc.page.width - 120 }
    );

    doc.moveDown(4);
    doc.fontSize(11).font('Helvetica').fillColor('#000000');
    doc.text(`Fait à Tétouan, le ${payload.issuedAt}`, doc.page.width - 250, doc.y);
    
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold');
    doc.text('Le Doyen', doc.page.width - 250, doc.y);
    
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
    doc.text('Signature et cachet', doc.page.width - 250, doc.y);

    addFooterNote(
        doc, 
        'Le présent document n\'est délivré qu\'en un seul exemplaire. Il appartient à l\'étudiant d\'en faire des copies certifiées conformes.'
    );
};

const buildSuccessCertificate = (doc, payload) => {
    // En-tête avec style vert
    doc.rect(0, 0, doc.page.width, 100).fill('#059669');
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('ROYAUME DU MAROC', 60, 25);
    doc.fontSize(11).font('Helvetica');
    doc.text('Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique', 60, 45);
    doc.text('et de l\'Innovation', 60, 60);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('L\'École Nationale des Sciences Appliquées Tétouan (ENSATe)', 60, 78);
    
    // Ligne décorative
    doc.rect(0, 100, doc.page.width, 3).fill('#6ee7b7');
    
    doc.fillColor('#000000');
    doc.moveDown(6);
    
    // Titre avec encadrement
    const titleY = doc.y;
    doc.roundedRect(80, titleY, doc.page.width - 160, 60, 5).lineWidth(2).stroke('#059669');
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#059669');
    doc.text('ATTESTATION DE RÉUSSITE', 0, titleY + 20, { align: 'center' });
    
    doc.moveDown(4);
    doc.fontSize(12).font('Helvetica').fillColor('#000000');
    doc.text(
        'Le Doyen de L\'École Nationale des Sciences Appliquées Tétouan (ENSATe) atteste que :',
        60, doc.y,
        { align: 'left', width: doc.page.width - 120 }
    );
    
    doc.moveDown(1.5);

    // Cadre d'informations
    const infoY = doc.y;
    doc.roundedRect(60, infoY, doc.page.width - 120, 160, 8).fill('#f0fdf4').stroke('#bbf7d0');
    
    const labelX = 80;
    const valueX = 280;
    let currentY = infoY + 15;
    
    const addInfoLine = (label, value, isHighlight = false) => {
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155').text(label, labelX, currentY);
        if (isHighlight) {
            doc.fontSize(13).font('Helvetica-Bold').fillColor('#059669').text(value || '---', valueX, currentY);
        } else {
            doc.fontSize(11).font('Helvetica').fillColor('#000000').text(value || '---', valueX, currentY);
        }
        currentY += 22;
    };
    
    addInfoLine('Nom et Prénom :', formatName(payload.student));
    
    const birthDate = (payload.details.birth_date || payload.student.birth_date)
        ? new Date(payload.details.birth_date || payload.student.birth_date).toLocaleDateString('fr-FR')
        : '---';
    const birthPlace = payload.details.birth_place || payload.student.birth_place || '---';
    const birthInfo = birthDate !== '---' ? `${birthDate} à ${birthPlace}` : '---';
    addInfoLine('Né(e) le :', birthInfo);
    
    addInfoLine('Portant le CNE :', payload.details.cne || payload.student.cne || '---');
    addInfoLine('Filière :', payload.details.filiere || '---');
    addInfoLine('Session :', payload.details.session || '---');
    addInfoLine('Mention :', payload.details.mention || '---', true);
    
    doc.y = infoY + 175;
    doc.fontSize(12).font('Helvetica').fillColor('#000000');
    doc.text(
        'A réussi les examens en validant tous les modules composant la filière.',
        60, doc.y,
        { align: 'justify', width: doc.page.width - 120, lineGap: 4 }
    );
    
    doc.moveDown(1);
    doc.text(
        'Cette attestation est délivrée à l\'intéressé(e) pour servir et valoir ce que de droit.',
        60, doc.y,
        { align: 'left', width: doc.page.width - 120 }
    );

    doc.moveDown(4);
    doc.fontSize(11).font('Helvetica');
    doc.text(`Tétouan, le ${payload.issuedAt}`, doc.page.width - 250, doc.y);
    
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold');
    doc.text('Le Doyen', doc.page.width - 250, doc.y);
    
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
    doc.text('Signature et cachet', doc.page.width - 250, doc.y);

    addFooterNote(
        doc, 
        'La présente attestation n\'est délivrée qu\'en un seul exemplaire. Copies certifiées conformes recommandées.'
    );
};

const buildTranscript = (doc, payload) => {
    // En-tête avec style rouge
    doc.rect(0, 0, doc.page.width, 100).fill('#dc2626');
    
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('ROYAUME DU MAROC', 60, 25);
    doc.fontSize(11).font('Helvetica');
    doc.text('Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique', 60, 45);
    doc.text('et de l\'Innovation', 60, 60);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('L\'École Nationale des Sciences Appliquées Tétouan (ENSATe)', 60, 78);
    
    // Ligne décorative
    doc.rect(0, 100, doc.page.width, 3).fill('#fca5a5');
    
    doc.fillColor('#000000');
    doc.moveDown(2);
    
    // Titre
    const titleY = doc.y;
    doc.roundedRect(80, titleY, doc.page.width - 160, 70, 5).lineWidth(2).stroke('#dc2626');
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('RELEVÉ DE NOTES ET RÉSULTATS', 0, titleY + 12, { align: 'center' });
    doc.fontSize(11).font('Helvetica').fillColor('#000000');
    doc.text(`Année universitaire : ${payload.details.academic_year || '---'}`, 0, titleY + 38, { align: 'center' });
    doc.text(`Session : ${payload.details.session || 'Session 1'}`, 0, titleY + 53, { align: 'center' });
    
    doc.moveDown(2);

    // Informations étudiant
    const studentY = doc.y;
    doc.roundedRect(60, studentY, doc.page.width - 120, 110, 5).fill('#fef2f2').stroke('#fca5a5');
    
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('INFORMATIONS ÉTUDIANT', 80, studentY + 12);
    
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    const col1X = 80;
    const col2X = 320;
    let infoY = studentY + 35;
    
    doc.text(`Nom : ${payload.student.last_name || '---'}`, col1X, infoY);
    doc.text(`Prénom : ${payload.student.first_name || '---'}`, col2X, infoY);
    infoY += 18;
    
    doc.text(`CNE : ${payload.details.cne || payload.student.cne || '---'}`, col1X, infoY);
    doc.text(`CIN : ${payload.details.cin || payload.student.cin || '---'}`, col2X, infoY);
    infoY += 18;
    
    const birthDate = (payload.details.birth_date || payload.student.birth_date)
        ? new Date(payload.details.birth_date || payload.student.birth_date).toLocaleDateString('fr-FR')
        : '---';
    const birthPlace = payload.details.birth_place || payload.student.birth_place || '---';
    const birthInfo = birthDate !== '---' ? `Né(e) le ${birthDate} à ${birthPlace}` : '---';
    doc.text(birthInfo, col1X, infoY);

    infoY += 18;
    
    doc.text(`Inscrit en : ${payload.details.level || '---'} - ${payload.details.program || '---'}`, col1X, infoY);
    
    doc.y = studentY + 120;
    doc.moveDown(1);

    // Tableau des notes
    const tableTop = doc.y;
    const colModuleX = 80;
    const colNoteX = 470;
    const tableWidth = colNoteX - colModuleX + 50;
    
    // En-tête du tableau
    doc.roundedRect(colModuleX, tableTop, tableWidth, 30, 3).fill('#dc2626');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('MODULE', colModuleX + 10, tableTop + 10);
    doc.text('NOTE/20', colNoteX, tableTop + 10);

    let y = tableTop + 35;
    let total = 0;
    const modules = Array.isArray(payload.details.modules) ? payload.details.modules : [];
    
    modules.forEach((m, idx) => {
        const grade = Number(m.grade || 0);
        total += grade;
        
        // Alternance de couleurs
        if (idx % 2 === 0) {
            doc.roundedRect(colModuleX, y - 3, tableWidth, 22, 2).fill('#fef2f2');
        }
        
        doc.fontSize(10).font('Helvetica').fillColor('#000000');
        doc.text(`${idx + 1}. ${m.name || 'Module ' + (idx + 1)}`, colModuleX + 10, y, { 
            width: colNoteX - colModuleX - 70 
        });
        doc.font('Helvetica-Bold').text(grade.toFixed(2), colNoteX, y);
        y += 22;
    });

    const average = modules.length > 0 ? (total / modules.length).toFixed(2) : '0.00';
    const isAdmitted = parseFloat(average) >= 10;

    // Ligne totale
    doc.moveTo(colModuleX, y + 5).lineTo(colModuleX + tableWidth, y + 5).lineWidth(2).stroke('#dc2626');
    y += 12;
    
// --- Totaux + Résultat (stylé) ---
const boxH = 46;

// Bandeau moyenne (gauche)
doc.roundedRect(colModuleX, y, tableWidth, boxH, 6).fill('#1e3a8a');

// Centrage vertical pour "MOYENNE :"
const textHeight = 11; // Hauteur approximative du texte fontSize 11
const moyenneY = y + (boxH - textHeight) / 2;

doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
doc.text('MOYENNE :', colModuleX + 12, moyenneY);

// Centrage vertical pour la valeur de la moyenne
const valueHeight = 13; // Hauteur approximative du texte fontSize 13
const valueY = y + (boxH - valueHeight) / 2;

doc.font('Helvetica-Bold').fontSize(13).fillColor('#ffffff');
doc.text(`${average}/20`, colModuleX + 85, valueY);

// Carte résultat (droite) — même ligne : "Résultat : ADMIS(E)"
const resultColor = isAdmitted ? '#10b981' : '#ef4444';
const resultW = 180;
const resultBoxH = boxH - 14;
const resultX = colModuleX + tableWidth - resultW - 10;
const resultY = y + (boxH - resultBoxH) / 2; // Centré verticalement dans le bandeau

doc.roundedRect(resultX, resultY, resultW, resultBoxH, 8).fill(resultColor);

// Centrage vertical du texte dans la carte résultat
const resultTextHeight = 11;
const resultTextY = resultY + (resultBoxH - resultTextHeight) / 2;

doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
doc.text(
  `Résultat : ${isAdmitted ? 'ADMIS(E)' : 'AJOURNÉ(E)'}`,
  resultX,
  resultTextY,
  { width: resultW, align: 'center' }
);

    
    doc.y = y + 60;
    doc.fillColor('#000000');
    doc.moveDown(2);
    
    doc.fontSize(11).font('Helvetica');
    doc.text(`Fait à Tétouan, le ${payload.issuedAt}`, doc.page.width - 250, doc.y);
    
    doc.moveDown(1.5);
    doc.font('Helvetica-Bold');
    doc.text('Le Doyen', doc.page.width - 250, doc.y);

    addFooterNote(
        doc, 
        ''
    );
};

const buildInternship = (doc, payload) => {
    const details = payload.details;
    
    // En-tête élégant
    doc.roundedRect(40, 40, doc.page.width - 80, 90, 5).lineWidth(2).stroke('#1e40af');
    
    doc.fontSize(15).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ROYAUME DU MAROC', 60, 55);
    doc.fontSize(12);
    doc.text('Ministère de l\'Enseignement Supérieur', 60, 73);
    doc.fontSize(11).font('Helvetica');
    doc.text('de la Recherche Scientifique et de l\'Innovation', 60, 88);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('École Nationale des Sciences Appliquées Tétouan', 60, 105);
    
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text(`Date : ${payload.issuedAt}`, doc.page.width - 160, 55, { align: 'right' });

    doc.fillColor('#000000');
    doc.moveDown(8);
    
    // Titre
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('CONVENTION DE STAGE', 0, doc.y, { align: 'center' });
    doc.fontSize(9).font('Helvetica-Oblique').fillColor('#666666');
    doc.text('(Conforme aux dispositions réglementaires en vigueur)', 0, doc.y + 5, { align: 'center' });
    
    doc.fillColor('#000000');
    doc.moveDown(2);

    // ARTICLE 1
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ARTICLE 1 - IDENTIFICATION DES PARTIES', 60, doc.y, { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
    doc.text('ENTRE :', 60, doc.y);
    doc.moveDown(0.3);
    doc.font('Helvetica');
    doc.text(
        'L\'École Nationale des Sciences Appliquées Tétouan (ENSATe), établissement d\'enseignement supérieur, représentée par son Directeur, d\'une part.',
        60, doc.y,
        { align: 'justify', width: doc.page.width - 120, lineGap: 2 }
    );
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold');
    doc.text('ET :', 60, doc.y);
    doc.moveDown(0.3);
    doc.font('Helvetica');
    doc.text(
        `${details.company_legal_name || details.company_name || '---'}\n` +
        `Raison sociale : ${details.company_legal_name || details.company_name || '---'}\n` +
        `Adresse : ${details.company_address || '---'}${details.company_city ? ', ' + details.company_city : ''}\n` +
        `Téléphone : ${details.company_phone || '---'} | Email : ${details.company_email || '---'}\n` +
        `Secteur d\'activité : ${details.company_sector || '---'}\n` +
        `Représentée par : ${details.company_representative_name || '---'}, ${details.company_representative_function || '---'}, d\'autre part.`,
        60, doc.y,
        { align: 'left', width: doc.page.width - 120, lineGap: 3 }
    );
    doc.moveDown(1);

    // ARTICLE 2
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ARTICLE 2 - IDENTIFICATION DU STAGIAIRE', 60, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    const birthDate = (payload.details.birth_date || payload.student.birth_date)
        ? new Date(payload.details.birth_date || payload.student.birth_date).toLocaleDateString('fr-FR')
        : '---';
    const birthPlace = payload.details.birth_place || payload.student.birth_place || '---';
    const birthInfo = birthDate !== '---' ? `Né(e) le ${birthDate} à ${birthPlace}` : '---';
    
    doc.text(
        `Nom et Prénom : ${formatName(payload.student)}\n` +
        `CIN : ${payload.details.cin || payload.student.cin || '---'}\n` +
        `Code Apogée : ${payload.details.apogee_number || payload.student.apogee_number || '---'}\n` +
        `${birthInfo}\n` +
        `Filière : ${payload.details.major || payload.student.major || '---'}\n` +
        `Niveau : ${payload.details.level || payload.student.level || '---'}`,
        60, doc.y,
        { lineGap: 3 }
    );
    doc.moveDown(1);

    // ARTICLE 3
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ARTICLE 3 - OBJET DU STAGE', 60, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text(
        `Le présent stage a pour objet de permettre au stagiaire d\'acquérir une expérience professionnelle dans le domaine de ${payload.student.major || '---'}.`,
        60, doc.y,
        { align: 'justify', width: doc.page.width - 120, lineGap: 2 }
    );
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold');
    doc.text(`Sujet du stage : `, 60, doc.y, { continued: true });
    doc.font('Helvetica');
    doc.text(details.internship_subject || details.internship_title || '---');
    doc.moveDown(1);

    // ARTICLE 4
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ARTICLE 4 - ENCADREMENT', 60, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text('L\'encadrement du stagiaire est assuré par :', 60, doc.y);
    doc.moveDown(0.5);
    
    doc.font('Helvetica-Bold').text('Au sein de l\'entreprise :', 80, doc.y);
    doc.font('Helvetica');
    doc.text(
        `- Nom : ${details.supervisor_name || '---'}\n` +
        `- Fonction : ${details.supervisor_role || '---'}\n` +
        `- Téléphone : ${details.supervisor_phone || '---'}\n` +
        `- Email : ${details.supervisor_email || '---'}`,
        80, doc.y + 15,
        { lineGap: 2 }
    );
    doc.moveDown(0.5);
    
    doc.font('Helvetica-Bold').text('Au sein de l\'ENSA :', 80, doc.y);
    doc.font('Helvetica');
    doc.text(`- Encadrant pédagogique : ${details.ensa_supervisor_name || '---'}`, 80, doc.y + 15);
    doc.moveDown(3);

    // ARTICLE 5
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ARTICLE 5 - PÉRIODE DU STAGE', 60, doc.y, { underline: true });
    doc.moveDown(1);
    const startDate = details.start_date ? new Date(details.start_date).toLocaleDateString('fr-FR') : '---';
    const endDate = details.end_date ? new Date(details.end_date).toLocaleDateString('fr-FR') : '---';
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text(`Le stage se déroulera du ${startDate} au ${endDate}.`, 60, doc.y);
    doc.moveDown(1);

    // ARTICLE 6
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ARTICLE 6 - ENGAGEMENTS', 60, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text('Le stagiaire s\'engage à :', 60, doc.y);
    doc.list([
        'Respecter le règlement intérieur de l\'entreprise',
        'Respecter les horaires de travail convenus',
        'Signaler toute absence dans les délais',
        'Respecter la confidentialité des informations',
        'Rédiger et soutenir un rapport de stage à l\'issue de la période'
    ], 80, doc.y + 15, { bulletRadius: 2, lineGap: 3 });
    
    doc.moveDown(3);

    // Signatures
    doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y).lineWidth(1.5).stroke('#1e40af');
    doc.moveDown(1);
    
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('SIGNATURES', 60, doc.y);
    doc.moveDown(1);
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    const sigY = doc.y;
    doc.text('Le stagiaire', 80, sigY);
    doc.text('Le représentant de l\'entreprise', 340, sigY);
    
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica');
    doc.text(formatName(payload.student), 80, doc.y);
    doc.text(details.company_representative_name || '---', 340, doc.y);
    
    doc.moveDown(2.5);
    
    doc.fontSize(9).font('Helvetica-Bold');
    const encY = doc.y;
    doc.text('L\'encadrant pédagogique ENSA', 80, encY);
    doc.text('Le Directeur de l\'ENSA', 340, encY);
    
    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica');
    doc.text(details.ensa_supervisor_name || '---', 80, doc.y);
    
    doc.moveDown(4);
    doc.fontSize(9).font('Helvetica').fillColor('#666666');
    doc.text(
        `Fait à 'Tétouan', le ${payload.issuedAt}`, 
        0, doc.y, 
        { align: 'center' }
    );

    addFooterNote(
        doc, 
        'La présente convention est établie en deux exemplaires originaux, un pour chaque partie.'
    );
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
                doc.fontSize(16).font('Helvetica-Bold').fillColor('#dc2626');
                doc.text('Document non supporté', { align: 'center' });
                doc.moveDown(1);
                doc.fontSize(12).font('Helvetica').fillColor('#000000');
                doc.text(`Type de document demandé : ${docType}`, { align: 'center' });
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
