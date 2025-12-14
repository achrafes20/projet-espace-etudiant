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
        session: incoming.session || 'Session 1'
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
            filiere: incoming.filiere,
            mention: incoming.mention,
            session: incoming.session || incoming.success_session || base.session
        };
    }

    if (docType === 'internship') {
        return {
            ...base,
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

const addLetterhead = (doc, left, right) => {
    doc.fontSize(10).font('Helvetica-Bold').text(left, { align: 'left' });
    doc.fontSize(10).font('Helvetica').text(right, { align: 'right' });
    doc.moveDown(1);
};

const addFooterNote = (doc, text) => {
    doc.moveDown(2);
    doc.fontSize(9).fillColor('#444').text(text, { align: 'center' });
};

const buildSchoolCertificate = (doc, payload) => {
    // En-tête stylisé
    doc.rect(50, 50, 500, 60).fill('#1e40af');
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('ROYAUME DU MAROC', 60, 60, { align: 'left' });
    doc.fontSize(12);
    doc.text('Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique', 60, 75, { align: 'left' });
    doc.text('Université Hassan Ier - Faculté des Sciences et Techniques', 60, 90, { align: 'left' });
    doc.fontSize(10).fillColor('#000');
    
    doc.moveDown(4);
    
    // Titre avec bordure
    doc.rect(100, doc.y, 400, 50).stroke('#1e40af');
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('CERTIFICAT DE SCOLARITÉ', 300, doc.y + 15, { align: 'center' });
    doc.moveDown(2.5);

    doc.fontSize(12).font('Helvetica').fillColor('#000');
    doc.text(
        `Le Doyen de la Faculté des Sciences et Techniques atteste que l'étudiant(e) :`,
        { align: 'left' }
    );
    doc.moveDown(1);

    // Informations dans un cadre
    const infoY = doc.y;
    doc.rect(80, infoY, 440, 120).stroke('#e5e7eb');
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica-Bold').text(`Nom et Prénom :`, 90, doc.y);
    doc.font('Helvetica').text(formatName(payload.student), 220, doc.y);
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text(`CIN :`, 90, doc.y);
    doc.font('Helvetica').text(payload.student.cin || '---', 220, doc.y);
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text(`Code étudiant (Apogée) :`, 90, doc.y);
    doc.font('Helvetica').text(payload.student.apogee_number || '---', 220, doc.y);
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text(`Code National de l'étudiant :`, 90, doc.y);
    doc.font('Helvetica').text(payload.student.cne || payload.student.apogee_number || '---', 220, doc.y);
    doc.moveDown(0.8);
    
    const birthDate = payload.student.birth_date ? new Date(payload.student.birth_date).toLocaleDateString('fr-FR') : '---';
    doc.font('Helvetica-Bold').text(`Date de naissance :`, 90, doc.y);
    doc.font('Helvetica').text(birthDate, 220, doc.y);
    
    doc.y = infoY + 130;
    doc.moveDown(1);
    
    doc.fontSize(12).font('Helvetica').text(
        `Poursuit régulièrement ses études pour l'année universitaire ${payload.details.academic_year || '---'} en : ${payload.details.level || '---'} - ${payload.details.program || '---'}.`
    );

    doc.moveDown(3);
    doc.text(`Fait à Marrakech, le ${payload.issuedAt}`, { align: 'right' });
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Le Doyen', { align: 'right' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text('Signature et cachet', { align: 'right' });

    addFooterNote(doc, 'Le présent document n est délivré qu en un seul exemplaire. Il appartient à l étudiant d en faire des copies certifiées conformes.');
};

const buildSuccessCertificate = (doc, payload) => {
    // En-tête stylisé
    doc.rect(50, 50, 500, 60).fill('#059669');
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('ROYAUME DU MAROC', 60, 60, { align: 'left' });
    doc.fontSize(12);
    doc.text('Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique', 60, 75, { align: 'left' });
    doc.text('Université Hassan II - FSJES Ain Chock', 60, 90, { align: 'left' });
    doc.fontSize(10).fillColor('#000');
    
    doc.moveDown(4);
    
    // Titre avec bordure
    doc.rect(100, doc.y, 400, 50).stroke('#059669');
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#059669');
    doc.text('ATTESTATION DE RÉUSSITE', 300, doc.y + 15, { align: 'center' });
    doc.moveDown(2.5);

    doc.fontSize(12).font('Helvetica').fillColor('#000');
    doc.text(`Le Doyen de la Faculté des Sciences Juridiques, Économiques et Sociales atteste que :`);
    doc.moveDown(1);

    // Informations dans un cadre
    const infoY = doc.y;
    doc.rect(80, infoY, 440, 150).stroke('#e5e7eb');
    doc.moveDown(0.5);
    
    doc.fontSize(12).font('Helvetica-Bold').text(`Nom et Prénom :`, 90, doc.y);
    doc.font('Helvetica').text(formatName(payload.student), 220, doc.y);
    doc.moveDown(0.8);
    
    const birthDate = payload.details.birth_date ? new Date(payload.details.birth_date).toLocaleDateString('fr-FR') : '---';
    doc.font('Helvetica-Bold').text(`Né(e) le :`, 90, doc.y);
    doc.font('Helvetica').text(`${birthDate} à ${payload.details.birth_place || '---'}`, 220, doc.y);
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text(`Portant le CNE :`, 90, doc.y);
    doc.font('Helvetica').text(payload.student.cin || payload.student.cne || '---', 220, doc.y);
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text(`Filière :`, 90, doc.y);
    doc.font('Helvetica').text(payload.details.filiere || '---', 220, doc.y);
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text(`Session :`, 90, doc.y);
    doc.font('Helvetica').text(payload.details.session || '---', 220, doc.y);
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text(`Mention :`, 90, doc.y);
    doc.font('Helvetica').fontSize(14).fillColor('#059669').text(payload.details.mention || '---', 220, doc.y);
    doc.fontSize(12).fillColor('#000');
    
    doc.y = infoY + 160;
    doc.moveDown(1);
    
    doc.fontSize(12).font('Helvetica').text(
        `A réussi les examens de la licence d'études fondamentales en validant tous les modules composant la filière.`
    );
    doc.moveDown(1);
    doc.text(`Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`, {
        align: 'left'
    });

    doc.moveDown(3);
    doc.text(`Casablanca, le ${payload.issuedAt}`, { align: 'right' });
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Le Doyen', { align: 'right' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).text('Signature et cachet', { align: 'right' });

    addFooterNote(doc, 'La présente attestation n est délivrée qu en un seul exemplaire. Copies certifiées conformes recommandées.');
};

const buildTranscript = (doc, payload) => {
    // En-tête stylisé
    doc.rect(50, 50, 500, 60).fill('#dc2626');
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('ROYAUME DU MAROC', 60, 60, { align: 'left' });
    doc.fontSize(12);
    doc.text('Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique', 60, 75, { align: 'left' });
    doc.text('Université Cadi Ayyad - Faculté des Sciences Juridiques, Economiques et Sociales', 60, 90, { align: 'left' });
    doc.fontSize(10).fillColor('#000');
    
    doc.moveDown(4);
    
    // Titre avec bordure
    doc.rect(100, doc.y, 400, 50).stroke('#dc2626');
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#dc2626');
    doc.text('RELEVÉ DE NOTES ET RÉSULTATS', 300, doc.y + 15, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica').fillColor('#000');
    doc.text(`Année universitaire : ${payload.details.academic_year || '---'}`, { align: 'center' });
    doc.text(`Session : ${payload.details.session || 'Session 1'}`, { align: 'center' });
    doc.moveDown(1.5);

    // Informations étudiant dans un cadre
    const studentY = doc.y;
    doc.rect(80, studentY, 440, 80).fill('#f3f4f6').stroke('#d1d5db');
    doc.moveDown(0.5);
    
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000');
    doc.text('INFORMATIONS ÉTUDIANT', 90, doc.y, { align: 'left' });
    doc.moveDown(0.8);
    
    doc.font('Helvetica').fontSize(10);
    doc.text(`Nom : ${payload.student.last_name || '---'}`, 90, doc.y);
    doc.text(`Prénom : ${payload.student.first_name || '---'}`, 300, doc.y);
    doc.moveDown(0.6);
    
    doc.text(`CNE : ${payload.student.cne || payload.student.apogee_number || '---'}`, 90, doc.y);
    doc.text(`CIN : ${payload.student.cin || '---'}`, 300, doc.y);
    doc.moveDown(0.6);
    
    doc.text(`Inscrit en : ${payload.details.level || '---'} - ${payload.details.program || '---'}`, 90, doc.y);
    
    doc.y = studentY + 90;
    doc.moveDown(1);

    // Tableau des notes avec style amélioré
    const tableTop = doc.y;
    const colModuleX = 80;
    const colNoteX = 450;
    
    // En-tête du tableau avec style rouge
    doc.rect(colModuleX - 5, tableTop - 5, colNoteX - colModuleX + 10, 25).fill('#dc2626');
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff');
    doc.text('MODULE', colModuleX, tableTop + 5);
    doc.text('NOTE/20', colNoteX, tableTop + 5);
    doc.fillColor('#000');

    // Ligne de séparation
    doc.moveTo(colModuleX - 5, tableTop + 20).lineTo(colNoteX + 5, tableTop + 20).stroke('#dc2626');

    let y = tableTop + 30;
    let total = 0;
    const modules = Array.isArray(payload.details.modules) ? payload.details.modules : [];
    
    modules.forEach((m, idx) => {
        const grade = Number(m.grade || 0);
        total += grade;
        
        // Alternance de couleurs pour les lignes
        if (idx % 2 === 0) {
            doc.rect(colModuleX - 5, y - 5, colNoteX - colModuleX + 10, 20).fill('#f9fafb');
        }
        
        doc.font('Helvetica').fontSize(10).fillColor('#000');
        doc.text(`${idx + 1}. ${m.name || 'Module ' + (idx + 1)}`, colModuleX, y);
        doc.font('Helvetica-Bold').text(grade.toFixed(2), colNoteX, y);
        y += 20;
    });

    const average = modules.length > 0 ? (total / modules.length).toFixed(2) : '0';
    const isAdmitted = parseFloat(average) >= 10;

    // Ligne de séparation avant le total
    doc.moveTo(colModuleX - 5, y).lineTo(colNoteX + 5, y).stroke('#dc2626');
    y += 10;
    
    // Total dans un cadre bleu foncé (comme dans l'image)
    const totalY = y;
    doc.rect(colModuleX - 5, totalY - 5, colNoteX - colModuleX + 10, 25).fill('#1e3a8a').stroke('#1e40af');
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#ffffff');
    doc.text(`TOTAL : ${total.toFixed(2)}`, colModuleX, totalY + 5);
    doc.text(`MOYENNE : ${average}/20`, colNoteX, totalY + 5);
    
    // Résultat en vert à droite du total (aligné horizontalement)
    doc.fillColor('#059669');
    doc.fontSize(12).font('Helvetica-Bold');
    const resultX = colNoteX + 30;
    doc.text(`Résultat :`, resultX, totalY);
    doc.text(`${isAdmitted ? 'ADMIS(E)' : 'AJOURNÉ(E)'}`, resultX, totalY + 15);
    doc.fillColor('#000');
    
    doc.y = totalY + 30;
    doc.moveDown(2);
    doc.fontSize(10).font('Helvetica').text(`Fait à Marrakech, le ${payload.issuedAt}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('Le Doyen', { align: 'right' });
    doc.moveDown(1);

    addFooterNote(doc, 'Document généré automatiquement. Vérifier les notes avant validation finale.');
};

const buildInternship = (doc, payload) => {
    const details = payload.details;
    
    // En-tête avec style amélioré
    doc.rect(50, 50, 500, 80).stroke('#1e40af');
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#1e40af');
    doc.text('ROYAUME DU MAROC', 60, 60, { align: 'left' });
    doc.text('Ministère de l\'Enseignement Supérieur', 60, 75, { align: 'left' });
    doc.fontSize(12);
    doc.text('École Nationale des Sciences Appliquées', 60, 90, { align: 'left' });
    doc.fontSize(10).font('Helvetica').fillColor('#000');
    doc.text(`Date : ${payload.issuedAt}`, 480, 65, { align: 'right' });

    doc.moveDown(3);
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#000').text('CONVENTION DE STAGE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text('(Conforme aux dispositions réglementaires en vigueur)', { align: 'center' });
    doc.moveDown(2);

    // Partie 1 : Identification des parties
    doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 1 - IDENTIFICATION DES PARTIES', { underline: true });
    doc.moveDown(0.5);
    
    doc.font('Helvetica-Bold').text('ENTRE :');
    doc.font('Helvetica').text(
        `L'École Nationale des Sciences Appliquées (ENSA), établissement d'enseignement supérieur,\n` +
        `représentée par son Directeur, d'une part.`
    );
    doc.moveDown(0.8);
    
    doc.font('Helvetica-Bold').text('ET :');
    doc.font('Helvetica').text(
        `${details.company_legal_name || details.company_name || '---'}\n` +
        `Raison sociale : ${details.company_legal_name || details.company_name || '---'}\n` +
        `Adresse : ${details.company_address || '---'}\n` +
        `${details.company_city ? `Ville : ${details.company_city}\n` : ''}` +
        `Téléphone : ${details.company_phone || '---'}\n` +
        `Email : ${details.company_email || '---'}\n` +
        `Secteur d'activité : ${details.company_sector || '---'}\n` +
        `Représentée par : ${details.company_representative_name || '---'}, ${details.company_representative_function || '---'}, d'autre part.`
    );
    doc.moveDown(1);

    // Partie 2 : Stagiaire
    doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 2 - IDENTIFICATION DU STAGIAIRE', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(
        `Nom et Prénom : ${formatName(payload.student)}\n` +
        `CIN : ${payload.student.cin || '---'}\n` +
        `Code Apogée : ${payload.student.apogee_number || '---'}\n` +
        `Filière : ${payload.student.filiere || payload.student.major || '---'}\n` +
        `Niveau : ${payload.student.level || '---'}`
    );
    doc.moveDown(1);

    // Partie 3 : Objet et sujet
    doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 3 - OBJET DU STAGE', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(
        `Le présent stage a pour objet de permettre au stagiaire d'acquérir une expérience professionnelle\n` +
        `dans le domaine de ${payload.student.filiere || payload.student.major || '---'}.\n\n` +
        `Sujet du stage : ${details.internship_subject || details.internship_title || '---'}`
    );
    doc.moveDown(1);

    // Partie 4 : Encadrement
    doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 4 - ENCADREMENT', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(
        `L'encadrement du stagiaire est assuré par :\n\n` +
        `Au sein de l'entreprise :\n` +
        `- Nom : ${details.supervisor_name || '---'}\n` +
        `- Fonction : ${details.supervisor_role || '---'}\n` +
        `- Téléphone : ${details.supervisor_phone || '---'}\n` +
        `- Email : ${details.supervisor_email || '---'}\n\n` +
        `Au sein de l'ENSA :\n` +
        `- Encadrant pédagogique : ${details.ensa_supervisor_name || '---'}`
    );
    doc.moveDown(1);

    // Partie 5 : Période
    doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 5 - PÉRIODE DU STAGE', { underline: true });
    doc.moveDown(0.5);
    const startDate = details.start_date ? new Date(details.start_date).toLocaleDateString('fr-FR') : '---';
    const endDate = details.end_date ? new Date(details.end_date).toLocaleDateString('fr-FR') : '---';
    doc.font('Helvetica').text(
        `Le stage se déroulera du ${startDate} au ${endDate}.`
    );
    doc.moveDown(1);

    // Partie 6 : Engagements
    doc.fontSize(12).font('Helvetica-Bold').text('ARTICLE 6 - ENGAGEMENTS', { underline: true });
    doc.moveDown(0.5);
    doc.font('Helvetica').text(
        `Le stagiaire s'engage à :\n` +
        `- Respecter le règlement intérieur de l'entreprise\n` +
        `- Respecter les horaires de travail\n` +
        `- Signaler toute absence\n` +
        `- Respecter la confidentialité des informations\n` +
        `- Rédiger un rapport de stage à l'issue de la période`
    );
    doc.moveDown(2);

    // Signatures
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);
    doc.fontSize(10).font('Helvetica').text('Signatures :', { underline: true });
    doc.moveDown(1);
    doc.text('Le stagiaire', 60, doc.y);
    doc.text('Le représentant de l\'entreprise', 350, doc.y);
    doc.moveDown(2);
    doc.text(formatName(payload.student), 60, doc.y);
    doc.text(details.company_representative_name || '---', 350, doc.y);
    doc.moveDown(3);
    doc.text('L\'encadrant pédagogique ENSA', 60, doc.y);
    doc.text('Le Directeur de l\'ENSA', 350, doc.y);
    doc.moveDown(2);
    doc.text(details.ensa_supervisor_name || '---', 60, doc.y);
    doc.moveDown(1);
    doc.text(`Fait à ${details.company_city || 'Tétouan'}, le ${payload.issuedAt}`, { align: 'center' });

    addFooterNote(doc, 'La présente convention est établie en deux exemplaires, un pour chaque partie.');
};

const createPdf = (docType, payload, absolutePath) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
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
            doc.fontSize(16).text('Document non supporté', { align: 'center' });
    }

    doc.end();

    stream.on('finish', resolve);
    stream.on('error', reject);
});

const generateDocument = async ({ docType, student, details = {}, reference, variant = 'draft' }) => {
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

    return { absolutePath, publicPath, details: resolvedDetails };
};

module.exports = {
    generateDocument,
    DOC_LABELS
};
