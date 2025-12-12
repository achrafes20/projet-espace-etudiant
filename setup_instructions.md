# Setup Instructions

## Prerequisites
- Node.js installed
- MySQL Server running

## Database Setup
1. Create a MySQL database named `student_services_db` (or update `.env` later).
2. Import the schema:
   ```bash
   mysql -u root -p student_services_db < projet_db.sql
   ```
   (Or use your preferred SQL client like phpMyAdmin or Workbench to run the SQL file).

## Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```
3. Update `.env` file with your database credentials:
   ```
   DB_USER=root
   DB_PASSWORD=your_password
   ```
4. Seed the default admin user:
   ```bash
   node seed.js
   ```
5. Start the server:
   ```bash
   node server.js
   ```
   Server will run on http://localhost:5000

## Frontend Setup
1. Open a new terminal and navigate to client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

## Default Login
- **Email**: `admin@university.edu`
- **Password**: `admin123`
