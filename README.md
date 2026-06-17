# 🎓 CampusLens: Student Profile Management Portal

CampusLens is a modern, high-performance web portal designed for colleges and universities to manage, search, and export student academic and personal profiles. It features a complete administrative control panel and a student self-profile management interface.

---

## 🚀 Key Features

### 👤 Student Side
- **Self-Profile Management**: Update contact numbers, permanent address, and profile photo.
- **Dynamic Photo via URL**: Paste a direct link (e.g. from Google Drive/Photos) to update the profile photo with a live preview and invalid link fallback.
- **Data Privacy Protection**: Sensitive fields like Aadhaar Card numbers and mole/identification marks are hidden from the student view.
- **Secure Password Reset**: In-app secure password updates.

### 🛡️ Admin Side
- **Student Directory**: Advanced search (by Name or HTNO/Roll Number) and multi-level filtering (by branch, section, year, category, and admission quota).
- **In-Depth Profiles**: Full CRUD access to student records including academic history, parent details, addresses, and identification marks.
- **PDF ID Card Generator**: Instantly generate and download standard landscape student identity cards with profile pictures and authorized signature lines.
- **CSV/Excel Export**: Bulk export of student records with filters.

---

## 🛠️ Technology Stack

- **Frontend**: React (v18), Vite, Tailwind CSS, Lucide React (Icons), Axios, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MySQL (relational structure with relational constraints)
- **Token Authentication**: JSON Web Tokens (JWT) for secure, role-based session management.
- **PDF Generation**: PDFKit (Backend landscape layout compilation)

---

## 📁 Project Structure

```text
working-project/
├── backend/            # Express.js REST API
│   ├── config/         # Database pools
│   ├── controllers/    # API Request Handlers
│   ├── middleware/     # Auth & upload middleware
│   ├── models/         # Database query models
│   ├── routes/         # Router declarations
│   ├── server.js       # Express server initialization
│   └── assignSections.js # Section assignment automation
└── frontend/           # React Single Page App (SPA)
    ├── src/
    │   ├── api/        # Axios configuration
    │   ├── components/ # Reusable UI components
    │   ├── context/    # Auth context
    │   ├── pages/      # View components
    │   └── App.jsx     # Navigation & Router
```

---

## 🛠️ Getting Started

### 📋 Prerequisites
- **Node.js** (v18 or higher)
- **MySQL** Server

---

### 1. Database Setup
Create a database in your MySQL instance (e.g. named `campuslens` or `railway`) and import the schema.

1. Navigate to the backend directory and configure the environment variables in a `.env` file:
   ```env
   PORT=3000
   DB_HOST=your_db_host
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   ```
2. Install dependencies and seed the database schemas/admin accounts:
   ```bash
   cd backend
   npm install
   npm run setup
   ```
3. Run the student default password migration:
   ```bash
   node studentMigration.js
   ```
4. Run the roll-number-based section assignment script (divides students into groups of 64):
   ```bash
   node assignSections.js
   ```

---

### 2. Run Backend API
Start the server in development mode:
```bash
npm run dev
```
The backend server will run on `http://localhost:3000`.

---

### 3. Run Frontend (Vite)
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   npm install
   ```
2. Configure your API base URL in `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
The application will open on `http://localhost:5173`.

---

## 🔒 Default Administrator Accounts
To test the admin console, use one of the seeded accounts:
* **User 1**: `admin` / `admin123`

*(Password changes can be updated securely in the settings dashboard).*

---

## 📄 License
This project is licensed under the MIT License.
