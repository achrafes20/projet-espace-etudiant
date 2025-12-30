# Setup Instructions

## Prerequisites
- Node.js installed
- MySQL Server running

## Database Setup
1. Create a MySQL database named `student_services_db` (or update `.env` later).
2. Import the schema:
    Use phpMyAdmin to run the SQL file.

## Backend Setup
1. Navigate to the project root directory.

   ```bash
   cd projet-espace-etudiant
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy the example environment file to create your local configuration:
   ```bash
   cp server/.env.example server/.env
   ```
   *Note: On Windows, use `copy server\.env.example server\.env`*

4. Open `server/.env` and update the following with your local credentials:
   - `DB_USER` (usually 'root')
   - `DB_PASSWORD`
   - `JWT_SECRET` (generate a secure random string)
   - Email settings if you want to test notifications
4. Seed the default admin user:
   ```bash
   npm run seed
   ```
5. Start the server:
   ```bash
   npm start
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
