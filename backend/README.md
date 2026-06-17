# CampusLens Backend Portal

A complete Node.js + Express REST API backend for the **CampusLens** Student Profile Management Portal (B.Tech department).

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (hosted on Railway) via `mysql2` connection pool
- **Authentication**: JWT (JSON Web Tokens) & `bcrypt` for password hashing
- **File Uploads**: `multer`
- **PDF Generation**: `pdfkit`
- **Excel Export**: `exceljs`
- **Configuration**: `dotenv`

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the project (if not already done).
2. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
1. Create a `.env` file in the root of the `backend` directory (copying from `.env.example`):
   ```bash
   cp .env.example .env
   ```
2. Configure your database variables in `.env`:
   ```env
   PORT=3000
   DB_HOST=your_db_host
   DB_PORT=your_db_port
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRES_IN=7d
   ```

### Database Seeding & Migration
To create the `admins` table, seed default admin credentials, populate departments and sections, and distribute students across years and sections, run the setup script:
```bash
npm run setup
```
*Default admin credentials created: `admin` / `admin123`*

### Running the Server
To start the backend server:
- **Development / Production Mode**:
  ```bash
  npm start
  ```
  The server will start on port `3000` (or your configured `PORT`).

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Body: `{ username, password }` -> Returns a JWT token.

### Students (Protected by JWT)
- `GET /api/students` - Paginated list of students.
  - **Query Params**: `page` (default: 1), `limit` (default: 10), `branch` (CSE/ECE/IT/etc.), `section` (A/B/C), `year` (1/2/3/4), `gender` (M/F), `category` (OC/BC/SC/ST), `admission_category` (Convener Quota/Management Quota).
- `GET /api/students/:htno` - Returns the full student profile with nested categories: `personal`, `contact`, `parents`, `address`, `academic`, `category_info`, and `identification`.
- `PUT /api/students/:htno` - Update student profile fields (transaction-safe partial updates).
- `POST /api/students/:htno/photo` - Upload student photo (`multer`, formats: `.jpg/.jpeg/.png`).
- `GET /api/students/:htno/idcard` - Generate and stream a downloadable PDF student ID card.

### Stats (Protected by JWT)
- `GET /api/stats/overview` - Returns total count, branch distribution, gender ratio, reservation category distribution, admission category distribution, and PH count.

### Export (Protected by JWT)
- `GET /api/export` - Export full filtered list of students to an Excel sheet. Accepts the same query parameters/filters as `GET /api/students`.

### Utilities (Protected by JWT)
- `GET /api/departments` - List all departments.
- `GET /api/sections` - List all sections (optionally filter by `department_code`).
