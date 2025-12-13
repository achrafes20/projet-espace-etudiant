-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS email_notifications;
DROP TABLE IF EXISTS action_history;
DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS administrators;
DROP TABLE IF EXISTS students;

-- Students table
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(100),
    apogee_number VARCHAR(20),
    cin VARCHAR(20),
    last_name VARCHAR(50),
    first_name VARCHAR(50),
    major VARCHAR(100),
    level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Administrators table
CREATE TABLE administrators (
    id INT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(50) UNIQUE,
    password VARCHAR(255),
    last_name VARCHAR(50),
    first_name VARCHAR(50),
    email VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Requests table
CREATE TABLE requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    reference VARCHAR(20),
    student_id INT,
    document_type VARCHAR(50),
    status VARCHAR(20),
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_date TIMESTAMP NULL,
    processed_by_admin_id INT NULL,
    refusal_reason TEXT NULL,
    document_path VARCHAR(255),
    specific_details JSON,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (processed_by_admin_id) REFERENCES administrators(id)
);

-- Complaints table
CREATE TABLE complaints (
    id INT PRIMARY KEY AUTO_INCREMENT,
    complaint_number VARCHAR(20),
    request_id INT,
    student_id INT,
    reason VARCHAR(20),
    description TEXT,
    status VARCHAR(20),
    response TEXT NULL,
    processed_by_admin_id INT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processing_date TIMESTAMP NULL,
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (processed_by_admin_id) REFERENCES administrators(id)
);

-- Action history table
CREATE TABLE action_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT,
    action_type VARCHAR(50),
    entity_type VARCHAR(50),
    entity_id INT,
    details JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administrators(id)
);

-- Email notifications table
CREATE TABLE email_notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    recipient VARCHAR(100),
    subject VARCHAR(200),
    email_type VARCHAR(50),
    request_id INT NULL,
    complaint_id INT NULL,
    email_content TEXT,
    sent_at TIMESTAMP NULL,
    status VARCHAR(20),
    error_message TEXT NULL,
    attempts INT DEFAULT 0,
    FOREIGN KEY (request_id) REFERENCES requests(id),
    FOREIGN KEY (complaint_id) REFERENCES complaints(id)
);

-- Indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_apogee ON students(apogee_number);
CREATE INDEX idx_requests_student ON requests(student_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_complaints_request ON complaints(request_id);
CREATE INDEX idx_complaints_student ON complaints(student_id);
CREATE INDEX idx_action_history_admin ON action_history(admin_id);