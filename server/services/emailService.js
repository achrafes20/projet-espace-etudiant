const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const createTransporter = () => {
    // Debug logging
    console.log('[DEBUG] Creating transporter with User:', process.env.EMAIL_USER);

    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

exports.sendRequestConfirmation = async (email, name, reference, documentType) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Request Received - ${reference}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Request Confirmation</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Your request for a <strong>${documentType}</strong> has been successfully received.</p>
                <div style="background-color: #f4f4f4; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #666;">Reference Number:</p>
                    <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #0056b3;">${reference}</p>
                </div>
                <p>Please keep this reference number safe. You will need it to track your request status.</p>
                <p>Best regards,<br>Student Administration</p>
            </div>
        `
    };

    try {
        console.log(`[DEBUG] Sending email to ${email}...`);
        await transporter.sendMail(mailOptions);
        console.log(`[DEBUG] ✅ Confirmation email sent to ${email}`);
    } catch (error) {
        console.error('[DEBUG] ❌ Error sending confirmation email:', error);
    }
};

exports.sendRequestUpdate = async (email, name, reference, documentType, status, reason, documentPath) => {
    const transporter = createTransporter();

    let subject = `Update on Request ${reference}`;
    let htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
            <h2>Request Status Update</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your request for <strong>${documentType}</strong> (Ref: ${reference}) has been updated.</p>
            <p><strong>Status: <span style="color: ${status === 'Accepté' ? 'green' : 'red'}">${status}</span></strong></p>
    `;

    const attachments = [];

    if (status === 'Accepté') {
        htmlContent += `
            <p>Good news! Your document has been prepared and approved.</p>
            ${documentPath ? '<p>Please find the document attached to this email.</p>' : '<p>You can pick it up at the administration office.</p>'}
        `;

        if (documentPath) {
            attachments.push({
                path: documentPath // path on the server
            });
        }
    } else if (status === 'Refusé') {
        htmlContent += `
            <div style="background-color: #fff0f0; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #dc3545;">Reason for Rejection:</p>
                <p style="margin: 5px 0 0;">${reason}</p>
            </div>
            <p>You can submit a reclamation if you believe this is a mistake, referencing the code above.</p>
        `;
    }

    htmlContent += `
            <p>Best regards,<br>Student Administration</p>
        </div>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: subject,
        html: htmlContent,
        attachments: attachments
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Update email sent to ${email}`);
    } catch (error) {
        console.error('Error sending update email:', error);
    }
};

exports.sendComplaintResponse = async (email, name, complaintNumber, response) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Response to Complaint ${complaintNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Complaint Response</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>We have reviewed your complaint (<strong>${complaintNumber}</strong>).</p>
                <div style="background-color: #eef2ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 0; font-weight: bold; color: #4338ca;">Administration Response:</p>
                    <p style="margin: 10px 0 0; white-space: pre-wrap;">${response}</p>
                </div>
                <p>Best regards,<br>Student Administration</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Complaint response email sent to ${email}`);
    } catch (error) {
        console.error('Error sending complaint response email:', error);
    }
};

exports.sendComplaintConfirmation = async (email, name, complaintNumber, requestReference) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Complaint Received - ${complaintNumber}`,
        html: `
            <div style="font-family: Arial, sans-serif; color: #333;">
                <h2>Complaint Received</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>We have successfully received your complaint regarding request <strong>${requestReference}</strong>.</p>
                <div style="background-color: #fef3c7; padding: 15px; border-left: 4px solid #d97706; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px; color: #92400e;">Complaint Reference Number:</p>
                    <p style="margin: 5px 0 0; font-size: 24px; font-weight: bold; color: #b45309;">${complaintNumber}</p>
                </div>
                <p>Please use this number to track the status of your complaint.</p>
                <p>Best regards,<br>Student Administration</p>
            </div>
        `
    };

    try {
        console.log(`[DEBUG] Sending complaint confirmation to ${email}...`);
        await transporter.sendMail(mailOptions);
        console.log(`[DEBUG] ✅ Complaint confirmation email sent to ${email}`);
    } catch (error) {
        console.error('[DEBUG] ❌ Error sending complaint confirmation email:', error);
    }
};
