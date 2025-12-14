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
            company_name: incoming.company_name,
            company_address: incoming.company_address,
            company_email: incoming.company_email,
            supervisor_name: incoming.supervisor_name,
            supervisor_role: incoming.supervisor_role,
            internship_subject: incoming.internship_subject,
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
    addLetterhead(
        doc,
        'ROYAUME DU MAROC\nUniversité Hassan Ier\nFaculté des Sciences et Techniques\nService des Affaires Etudiantes',
        'المملكة المغربية\nجامعة الحسن الأول\nكلية العلوم و التقنيات\nمصلحة الشؤون الطلابية'
    );

    doc.moveDown(2);
    doc.fontSize(18).font('Helvetica-Bold').text('CERTIFICAT DE SCOLARITÉ', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica').text(
        `Le Doyen de la Faculté des Sciences et Techniques atteste que l'étudiant(e) :`,
        { align: 'left' }
    );
    doc.moveDown(1);

    doc.fontSize(12).font('Helvetica-Bold').text(`Nom et Prénom : ${formatName(payload.student)}`);
    doc.font('Helvetica').text(`CIN : ${payload.student.cin || '---'}`);
    doc.text(`Code étudiant (Apogée) : ${payload.student.apogee_number || '---'}`);
    doc.text(`Code National de l'étudiant : ${payload.student.cne || payload.student.apogee_number || '---'}`);
    doc.text(`Date de naissance : ${payload.details.birth_date || '01/01/2000'}`);
    doc.moveDown(1);
    doc.text(
        `Poursuit régulièrement ses études pour l'année universitaire ${payload.details.academic_year} en : ${payload.details.level} - ${payload.details.program}.`
    );

    doc.moveDown(2);
    doc.text(`Fait à Marrakech, le ${payload.issuedAt}`, { align: 'right' });
    doc.moveDown(0.5);
    doc.text('Le Doyen', { align: 'right' });

    addFooterNote(doc, 'Le présent document n’est délivré qu’en un seul exemplaire. Il appartient à l’étudiant d’en faire des copies certifiées conformes.');
};

const buildSuccessCertificate = (doc, payload) => {
    addLetterhead(
        doc,
        'FSJES - Ain Chock\nUniversité Hassan II Casablanca',
        'كلية العلوم القانونية والاقتصادية والاجتماعية\nجامعة الحسن الثاني'
    );

    doc.moveDown(2);
    doc.fontSize(18).font('Helvetica-Bold').text('ATTESTATION DE RÉUSSITE', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica').text(`Le Doyen atteste que :`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text(`${formatName(payload.student)}`);
    doc.font('Helvetica').text(`Né(e) le : ${payload.details.birth_date} à ${payload.details.birth_place}`);
    doc.text(`Portant le CNE : ${payload.student.cin || payload.student.cne || '---'}`);
    doc.text(
        `A réussi les examens de la licence d'études fondamentales en validant tous les modules composant la filière : ${payload.details.filiere}`
    );
    doc.text(`Session : ${payload.details.session}`);
    doc.text(`Avec mention : ${payload.details.mention}`);

    doc.moveDown(1.5);
    doc.text(`Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit.`, {
        align: 'left'
    });

    doc.moveDown(2);
    doc.text(`Casablanca le ${payload.issuedAt}`, { align: 'right' });

    addFooterNote(doc, 'La présente attestation n’est délivrée qu’en un seul exemplaire. Copies certifiées conformes recommandées.');
};

const buildTranscript = (doc, payload) => {
    addLetterhead(
        doc,
        'UNIVERSITÉ CADI AYYAD\nFaculté des Sciences Juridiques, Economiques et Sociales\nMarrakech',
        'جامعة القاضي عياض\nكلية العلوم القانونية و الاقتصادية و الاجتماعية\nمراكش'
    );

    doc.moveDown(1.5);
    doc.fontSize(16).font('Helvetica-Bold').text(`Année universitaire : ${payload.details.academic_year}`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(18).text('RELEVÉ DE NOTES ET RÉSULTATS', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(payload.details.session || 'Session 1', { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').text('ÉTUDIANT');
    doc.font('Helvetica').list([
        `Nom : ${payload.student.last_name}`,
        `Prénom : ${payload.student.first_name}`,
        `CNE : ${payload.student.cne || payload.student.apogee_number || '---'}`,
        `CIN : ${payload.student.cin || '---'}`
    ]);
    doc.moveDown(0.5);
    doc.text(`Inscrit en : ${payload.details.level} ${payload.details.program}`);
    doc.moveDown(1);

    const startY = doc.y;
    const tableTop = startY;
    const colModuleX = 80;
    const colNoteX = 380;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('MODULE', colModuleX, tableTop);
    doc.text('NOTE', colNoteX, tableTop);

    doc.moveTo(colModuleX, tableTop + 15).lineTo(colNoteX + 100, tableTop + 15).stroke();
    doc.font('Helvetica');

    let y = tableTop + 25;
    let total = 0;
    payload.details.modules.forEach((m, idx) => {
        const grade = Number(m.grade || 0);
        total += grade;
        doc.text(`${idx + 1}. ${m.name}`, colModuleX, y);
        doc.text(grade.toString(), colNoteX, y);
        y += 20;
    });

    const average = payload.details.modules.length > 0 ? (total / payload.details.modules.length).toFixed(2) : '0';

    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').text(`TOTAL : ${total}`, colModuleX);
    doc.text(`MOYENNE : ${average}`, colNoteX);

    doc.moveDown(1.5);
    doc.font('Helvetica').text(`Résultat d'admission : ${average}/20 - ${average >= 10 ? 'Admis' : 'Ajourné'}`);

    addFooterNote(doc, 'Document généré automatiquement. Vérifier les notes avant validation finale.');
};

const buildInternship = (doc, payload) => {
    addLetterhead(
        doc,
        'Université Abdelmalek Essaadi\nÉcole Nationale des Sciences Appliquées - Tétouan',
        'جامعة عبد المالك السعدي\nالمدرسة الوطنية للعلوم التطبيقية - تطوان'
    );

    doc.moveDown(1.5);
    doc.fontSize(16).font('Helvetica-Bold').text('CONVENTION DE STAGE', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text('(2 exemplaires imprimés en recto-verso)', { align: 'center' });
    doc.moveDown(1.5);

    doc.fontSize(12).font('Helvetica-Bold').text('ENTRE :');
    doc.font('Helvetica').text(
        `L'École Nationale des Sciences Appliquées, Université Abdelmalek Essaadi.\nReprésentée par le Directeur.`
    );
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text('ET :');
    doc.font('Helvetica').text(
        `${payload.details.company_name}\nAdresse : ${payload.details.company_address}\nTél : ${payload.details.company_phone || '---'}    Email : ${payload.details.company_email}`
    );

    doc.moveDown(1);
    doc.font('Helvetica-Bold').text('Objet du stage');
    doc.font('Helvetica').text(
        `Le stage a pour objet d'assurer l'application pratique des enseignements. Sujet : ${payload.details.internship_subject}.`
    );

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').text('Encadrement');
    doc.font('Helvetica').text(
        `L'entreprise désigne ${payload.details.supervisor_name} (${payload.details.supervisor_role}) comme encadrant.`
    );

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').text('Période');
    doc.font('Helvetica').text(`Du ${payload.details.start_date} au ${payload.details.end_date}.`);

    doc.moveDown(0.8);
    doc.font('Helvetica-Bold').text('Engagement');
    doc.font('Helvetica').text(
        `Le stagiaire ${formatName(payload.student)} s'engage à respecter le règlement intérieur et à signaler toute absence.`
    );

    doc.moveDown(2);
    doc.text(`Fait à Tétouan, le ${payload.issuedAt}`, { align: 'right' });
    doc.moveDown(1);
    doc.text('Nom et signature du stagiaire', { align: 'left' });
    doc.text('Nom et cachet de l\'établissement', { align: 'right' });
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
