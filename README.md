# 🎓 Student Services Management System

## Project Overview

A modern web application for managing student administrative document requests at university level. This system digitizes the entire process of requesting, processing, and delivering official academic documents.

---

## 📋 Document Types Managed

The system handles four types of official documents:

1. **Attestation de scolarité** (Enrollment Certificate)
2. **Attestation de réussite** (Achievement Certificate)
3. **Relevé de notes** (Transcript)
4. **Convention de stage** (Internship Agreement)

---

## 👥 User Roles

### Student Features
- Submit document requests online
- Track request status with unique reference number
- File complaints about requests
- Receive automatic email notifications

### Administrator Features
- Secure authentication (login/password)
- Process requests (approve/reject)
- Manage complaints and provide responses
- View comprehensive dashboard with statistics
- Access complete request history
- Export data (Excel/PDF)

---

## 🔄 Request Workflow

### Student Side:
1. **Identity Verification**: Enter email, Apogee number, and CIN
2. **Simultaneous Validation**: System verifies all three fields against database
3. **Document-Specific Form**: Additional information based on document type
4. **Confirmation**: Receive unique reference number and email confirmation

### Admin Side:
1. **Review Requests**: View all pending requests organized by document type
2. **Process Decision**:
   - **Approve**: Upload PDF document → Email sent to student with attachment
   - **Reject**: Provide detailed reason → Email sent with explanation
3. **Track History**: All actions logged with timestamps

---

## 🎯 Key Business Rules

### Validation Rules
- All three identifiers (Email + Apogee Number + CIN) must match database exactly
- No partial error messages shown for security
- Document-specific form only appears after successful validation

### Document Delivery Policy
- **One original copy** per approved request
- Students informed they can make photocopies as needed
- Reduces administrative workload and printing costs

### Reference System
Format: `[TYPE]-[YEAR]-[NUMBER]`
- AS-2025-001 (Attestation de Scolarité)
- AR-2025-045 (Attestation de Réussite)
- RN-2025-123 (Relevé de Notes)
- CS-2025-089 (Convention de Stage)

### Request Statuses
- **En attente** (Pending): Submitted, not yet processed
- **Accepté** (Accepted): Approved, document sent
- **Refusé** (Rejected): Rejected with reason provided

---

## 📧 Automated Email Notifications

### Confirmation Email
Sent immediately after request submission with reference number

### Approval Email
- Document attached as PDF
- Note about making photocopies
- Reference number included

### Rejection Email
- Detailed reason for rejection
- Reference number for potential complaint
- Contact information for questions

### Complaint Response Email
Administrator's personalized response to student complaint

---

## 🔒 Security Features

- Encrypted administrator passwords
- Session management with auto-logout after inactivity
- Secure student data access
- Single-step validation to prevent multiple attempts
- No information leakage in error messages

---

## 📊 Dashboard Features

### Statistics Display
- Total accepted requests
- Total rejected requests
- Total pending requests

### Visual Analytics
- Charts by document type
- Charts by request status
- Trend analysis over time

### Filtering & Search
- Filter by date range
- Filter by document type
- Filter by status
- Search by student name or Apogee number

---

## 🗄️ Database Structure

### Core Tables
- **students**: Student information (pre-existing)
- **requests**: All document requests with status tracking
- **complaints**: Student complaints linked to requests
- **administrators**: Admin user accounts
- **action_history**: Audit trail of all admin actions
- **email_notifications**: Email delivery tracking

### Document-Specific Information (JSON)
Each request stores additional fields based on document type:

**Attestation de scolarité**
- Academic year
- Major/Program

**Attestation de réussite**
- Year obtained
- Diploma name

**Relevé de notes**
- Semester(s)
- Academic year

**Convention de stage**
- Company name & address
- Supervisor name & email
- Internship period (start/end dates)
- Internship subject/topic

---

## 📅 Project Timeline

| Date | Deliverable |
|------|-------------|
| November 25, 2025 | Functional Specifications Document |
| December 3, 2025 | Design Document |
| December 17, 2025 | Application Presentation |

---

## 🎨 Design Requirements

The professor highly values design quality. The application should feature:

- **Modern, Clean UI**: Professional appearance suitable for academic institution
- **Intuitive Navigation**: Clear user flow for both students and administrators
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Visual Feedback**: Loading states, success/error messages, progress indicators
- **Data Visualization**: Clear charts and statistics on admin dashboard
- **Accessible Interface**: Proper contrast, readable fonts, clear call-to-actions
- **Consistent Branding**: University logo and colors throughout

---

## 🚀 Technical Expectations

- Full-stack web application
- Secure authentication system
- PDF generation for official documents
- Email integration for automated notifications
- Database connectivity with provided schema
- Export functionality (Excel/PDF)
- File upload capability for administrators
- Real-time status updates

---

## 📝 Sample Messages & Templates

### Success Messages
✅ "Votre demande a été enregistrée avec succès. Référence : [XXX]. Vous recevrez une notification par email."

### Error Messages
❌ "Les informations saisies ne correspondent pas à nos enregistrements. Veuillez vérifier votre email, numéro Apogée et CIN."

---

## 🎓 Project Context

This application aims to:
- Digitize administrative document requests
- Reduce processing time
- Enable online request tracking
- Simplify administration management
- Improve student experience
- Reduce paper usage and administrative costs

---

## 📄 Files Included

- `projet_db.sql` - Complete database schema with tables, indexes, and relationships
- `README.md` - This project documentation

---
