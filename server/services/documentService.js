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

const addHeader = (doc) => {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000');
    doc.text('ROYAUME DU MAROC', { align: 'center' });
    doc.moveDown(0.1);
    doc.fontSize(9).font('Helvetica');
    doc.text('Ministère de l\'Enseignement Supérieur, de la Recherche Scientifique', { align: 'center' });
    doc.text('et de l\'Innovation', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Université Abdelmalek Essaâdi', { align: 'center' });
    doc.text('École Nationale des Sciences Appliquées - Tétouan', { align: 'center' });

    // Thick separator line
    doc.moveDown(0.5);
    const y = doc.y;
    doc.moveTo(70, y).lineTo(doc.page.width - 70, y).strokeColor('#000000').lineWidth(1.5).stroke();
    doc.moveDown(2);
};

const addFooterNote = (doc, text) => {};


const buildSchoolCertificate = (doc, payload) => {
    addHeader(doc);

    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('ATTESTATION DE SCOLARITÉ', { align: 'center' });

    doc.moveDown(3);
    doc.fontSize(11).font('Helvetica');
    doc.text(
        'Le Directeur de l\'École Nationale des Sciences Appliquées de Tétouan atteste que l\'étudiant(e) :',
        { align: 'justify', width: doc.page.width - 140 }
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
    const birthPlace = payload.details.birth_place || payload.student.birth_place || '---';
    addLine('Né(e) le', `: ${birthDate} à ${birthPlace}`);

    doc.y = currentY + 15;
    doc.x = 70;

    doc.font('Helvetica').text(
        `Est régulièrement inscrit(e) à l'École Nationale des Sciences Appliquées de Tétouan pour l'année universitaire ${payload.details.academic_year || '2024/2025'} en :`,
        { align: 'justify', width: doc.page.width - 140 }
    );

    doc.moveDown(1.5);
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`${payload.details.level || '---'} - ${payload.details.program || '---'}`, { align: 'center' });

    doc.moveDown(4);
    doc.fontSize(10).font('Helvetica');
    doc.text(`Fait à Tétouan, le ${payload.issuedAt}`, { align: 'right' });

    doc.moveDown(3);
    doc.font('Helvetica-Bold');
    doc.text('Le Directeur', { align: 'right' });

    addFooterNote(doc, 'Note : Le présent document n\'est délivré qu\'en un seul exemplaire. Il appartient à l\'étudiant d\'en faire des photocopies certifiées conformes.');
};

const buildSuccessCertificate = (doc, payload) => {
    addHeader(doc);

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

    addFooterNote(doc, 'Cette attestation est délivrée pour servir et valoir ce que de droit.');
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

    // Title block
    doc.lineWidth(0.8).rect(left + 120, 105, contentWidth - 240, 20).stroke();
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('RELEVE DE NOTES ET RESULTATS', left + 125, 110, { width: contentWidth - 250, align: 'center' });
    doc.lineWidth(0.8).rect(left + 220, 130, contentWidth - 440, 16).stroke();
    doc.font('Helvetica-Bold').fontSize(10);
    doc.text(sessionLabel, left + 220, 132, { width: contentWidth - 440, align: 'center' });

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
        doc.text(sessionShort, colSession, currentY + 4);
        currentY += rowHeight;
    });

    // Result line
    currentY += 10;
    const average = modules.length > 0 ? (total / modules.length).toFixed(3) : '0.000';
    const isAdmitted = parseFloat(average) >= 10;
    doc.font('Helvetica-Bold').fontSize(9);
    doc.text(`Resultat d'admission session ${sessionNumber} :`, left + 5, currentY);
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
    addHeader(doc);

    doc.moveDown(2);
    doc.fontSize(16).font('Helvetica-Bold');
    doc.text('CONVENTION DE STAGE', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica');
    doc.text('(PFE / Technique / Ouvrier)', { align: 'center' });

    doc.moveDown(2);

    const details = payload.details;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ENTRE :', 50);
    doc.font('Helvetica').text(
        'L\'École Nationale des Sciences Appliquées de Tétouan, représentée par son Directeur.',
        { indent: 20, align: 'justify' }
    );

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('ET L\'ORGANISME D\'ACCUEIL :', 50);
    doc.font('Helvetica').text(
        `${details.company_name || '---'}, représenté par ${details.company_representative_name || '---'} en qualité de ${details.company_representative_function || '---'}.`,
        { indent: 20, align: 'justify' }
    );
    doc.text(`Adresse : ${details.company_address || '---'} | Tél : ${details.company_phone || '---'}`, { indent: 20 });

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('CONCERNANT LE STAGIAIRE :', 50);
    doc.font('Helvetica');
    doc.text(`Nom et Prénom : ${formatName(payload.student)}`, { indent: 20 });
    doc.text(`CIN : ${details.cin || payload.student.cin}`, { indent: 20 });
    doc.text(`Filière : ${details.major || '---'}`, { indent: 20 });

    doc.moveDown(2);
    doc.font('Helvetica-Bold').text('OBJET DU STAGE', { bold: true });
    doc.font('Helvetica').text(
        `Le stage a pour objet la mise en pratique des connaissances théoriques. Sujet : ${details.internship_subject || '---'}`,
        { align: 'justify' }
    );

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('DURÉE DU STAGE');
    const start = details.start_date ? new Date(details.start_date).toLocaleDateString('fr-FR') : '---';
    const end = details.end_date ? new Date(details.end_date).toLocaleDateString('fr-FR') : '---';
    doc.font('Helvetica').text(`Période du ${start} au ${end}.`);

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('ENCADREMENT');
    doc.font('Helvetica').text(`Encadrant Professionnel : ${details.supervisor_name || '---'}`);
    doc.text(`Encadrant Académique : ${details.ensa_supervisor_name || '---'}`);

    doc.moveDown(4);

    // Signatures block
    const sigY = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Le Stagiaire', 70, sigY);
    doc.text('L\'Organisme', 250, sigY);
    doc.text('L\'École', 430, sigY);

    doc.moveDown(6);
    doc.fontSize(9).font('Helvetica');
    doc.text(`Fait à Tétouan, le ${payload.issuedAt}`, 50);
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










