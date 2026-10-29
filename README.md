# Disaster Relief & Resource Management System

A comprehensive Disaster Relief & Resource Management platform designed to coordinate emergency response, track relief supplies, manage rescue operations, handle volunteers, and support affected populations during crisis events.

## Features

- **Disaster Tracking & Management**: Monitor ongoing disasters, severity levels, affected locations, and status.
- **Relief Centers & Resources**: Manage relief centers, resource allocation, and inventory stock in real-time.
- **Rescue Operations & Tasks**: Coordinate emergency dispatch teams, rescue missions, and task assignments.
- **Volunteer & Contact Directory**: Register volunteers, assign deployment roles, and maintain emergency contact registries.
- **Medical & Transportation Logistics**: Track patient treatments, medical supplies, ambulances, and logistics transport.
- **Donation Management**: Monitor monetary and in-kind relief aid contributions.
- **Reports & Analytics**: Comprehensive statistical insights and audit reporting on relief efforts.

## Project Structure

```
├── assets/             # Global static assets (CSS, icons, images)
├── backend/            # Node.js / Express REST API
├── config/             # PHP database configuration & authentication helpers
├── database/           # MySQL database schema (schema.sql) and sample seed data (seed.sql)
├── frontend/           # Modern React + TypeScript + Vite frontend
├── includes/           # Shared PHP layout templates (header, sidebar, navbar)
├── *.php               # PHP Web Application modules & dashboards
└── README.md
```

## Setup & Installation

### 1. Database Setup
1. Import `database/schema.sql` and `database/seed.sql` into MySQL (via phpMyAdmin or MySQL CLI).
2. Default database name: `dbms_project`.
3. Configure your credentials in `config/db.php` if required.

### 2. PHP Application
Run through an Apache / PHP environment like XAMPP or PHP built-in server:
```bash
php -S localhost:8080
```
Open `http://localhost:8080/login.php` in your browser.

### 3. Node.js Backend (Optional / API)
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### 4. React Frontend (Optional / Modern UI)
```bash
cd frontend
npm install
npm run dev
```

## License
Open-source under the MIT License.
