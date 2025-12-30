const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const DOC_LABELS = {
    'school-certificate': 'Attestation de scolarité',
    'success-certificate': 'Attestation de réussite',
    transcript: 'Relevé de notes',
    internship: 'Convention de stage'
};

const translateDocumentType = (docType) => {
    return DOC_LABELS[docType] || docType;
};

const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const resolveAttachmentPath = (documentPath) => {
    if (!documentPath) return null;
    if (documentPath.startsWith('/uploads')) {
        return path.join(__dirname, '..', documentPath);
    }
    return documentPath;
};

exports.sendRequestConfirmation = async (email, name, reference, documentType) => {
    const transporter = createTransporter();
    const documentTypeLabel = translateDocumentType(documentType);

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Demande reçue - ${reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Confirmation de demande</h2>
                <p>Bonjour <strong>${name}</strong>,</p>
                <p>Votre demande de <strong>${documentTypeLabel}</strong> a été enregistrée.</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Numéro de référence :</p>
                    <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #0056b3;">${reference}</p>
                </div>
                <p>Conservez ce numéro pour suivre l'état de votre demande.</p>
                <p>Cordialement,<br>Service scolarité</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
    }
};

exports.sendRequestUpdate = async (email, name, reference, documentType, status, reason, documentPath) => {
    const transporter = createTransporter();
    const documentTypeLabel = translateDocumentType(documentType);

    let htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Suivi de votre demande</h2>
            <p>Bonjour <strong>${name}</strong>,</p>
            <p>Votre demande de <strong>${documentTypeLabel}</strong> (Ref: ${reference}) a été mise à jour.</p>
            <p><strong>Statut: <span style="color: ${status === 'Accepté' ? 'green' : 'red'}">${status}</span></strong></p>
    `;

    const attachments = [];
    const resolvedPath = resolveAttachmentPath(documentPath);

    if (status === 'Accepté') {
        htmlContent += `
            <p>Bonne nouvelle ! Votre document a été validé.</p>
            ${documentPath ? '<p>Le document est joint à cet email.</p>' : '<p>Vous pouvez le récupérer à l\'administration.</p>'}
        `;

        if (resolvedPath) {
            attachments.push({
                path: resolvedPath,
                filename: path.basename(documentPath)
            });
        }
    } else if (status === 'Refusé') {
        htmlContent += `
            <div style="background-color: #fff0f0; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #dc3545;">Motif du refus :</p>
                <p style="margin: 5px 0 0;">${reason || 'Non spécifié'}</p>
            </div>
            <p>Vous pouvez déposer une réclamation en utilisant la référence ci-dessus.</p>
        `;
    }

    htmlContent += `
            <p>Cordialement,<br>Service scolarité</p>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Mise à jour de votre demande ${reference}`,
        html: htmlContent,
        attachments
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de mise à jour:', error);
    }
};

exports.sendComplaintResponse = async (email, name, complaintNumber, response, documentPath = null) => {
    const transporter = createTransporter();
    const path = require('path');
    const fs = require('fs');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Réponse à la réclamation ${complaintNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Réponse à votre réclamation</h2>
                <p>Bonjour <strong>${name}</strong>,</p>
                <p>Nous avons traité votre réclamation (<strong>${complaintNumber}</strong>).</p>
                <div style="background-color: #eef2ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #4338ca;">Réponse de l'administration :</p>
                    <p style="margin: 10px 0 0; white-space: pre-wrap;">${response}</p>
                </div>
                ${documentPath ? '<p style="margin-top: 20px;"><strong>Un nouveau document corrigé est joint à cet email.</strong></p>' : ''}
                <p>Cordialement,<br>Service scolarité</p>
            </div>
        `
    };

    // Ajouter le document en pièce jointe si fourni
    if (documentPath) {
        // documentPath est déjà un chemin public comme /uploads/final/... ou /uploads/generated/...
        // On doit le convertir en chemin absolu
        const absolutePath = resolveAttachmentPath(documentPath);
        if (absolutePath && fs.existsSync(absolutePath)) {
            mailOptions.attachments = [{
                filename: path.basename(absolutePath),
                path: absolutePath
            }];
        } else {
            console.warn(`Chemin du document introuvable: ${documentPath}`);
        }
    }

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de réponse à la réclamation:', error);
    }
};

exports.sendComplaintConfirmation = async (email, name, complaintNumber, requestReference) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Réclamation reçue - ${complaintNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Réclamation enregistrée</h2>
                <p>Bonjour <strong>${name}</strong>,</p>
                <p>Nous avons bien reçu votre réclamation concernant la demande <strong>${requestReference}</strong>.</p>
                <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #d97706; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">Numéro de réclamation :</p>
                    <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #b45309;">${complaintNumber}</p>
                </div>
                <p>Conservez ce numéro pour suivre votre réclamation.</p>
                <p>Cordialement,<br>Service scolarité</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email de confirmation de réclamation:', error);
    }
};
