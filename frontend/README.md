# CampusLens Administration Portal (Frontend)

The complete React + Tailwind CSS admin web application for **CampusLens** Student Profile Management Portal (B.Tech department).

This application consumes the backend REST API to manage 1,382 student profiles, render analytics charts, update student files, print PDF ID cards, and export filtered sheets to Excel.

## Tech Stack
- **Framework**: React (Vite-based)
- **Styling**: Tailwind CSS V3
- **Routing**: React Router DOM V6
- **API Client**: Axios with JWT Interceptors
- **Charts**: Recharts
- **Icon Library**: Lucide React
- **Notifications**: React Hot Toast

---

## Project Structure
```
/frontend
  ├── /src
  │     ├── /api
  │     │     └── api.js              # Axios configuration with JWT injection & 401 interceptor
  │     ├── /context
  │     │     └── AuthContext.jsx     # Admin session state management (local storage sync)
  │     ├── /components
  │     │     ├── Sidebar.jsx         # Collapsible dashboard sidebar
  │     │     ├── Topbar.jsx          # Header with active title & logged-in profile
  │     │     ├── ProtectedRoute.jsx  # Auth router guard
  │     │     ├── StatCard.jsx        # Summary metric displays
  │     │     ├── DataTable.jsx       # Student lists with photo thumbnails
  │     │     ├── Pagination.jsx      # Navigation buttons
  │     │     ├── FilterBar.jsx       # Dropdowns with cascading sections
  │     │     └── Loader.jsx          # UI skeleton loaders & spinner
  │     ├── /pages
  │     │     ├── Login.jsx           # Clean card login form
  │     │     ├── Dashboard.jsx       # Overview page with 3 Recharts panels
  │     │     ├── Directory.jsx       # Paginated directory with search debouncing
  │     │     ├── StudentProfile.jsx  # Editable profile tabs and photo upload
  │     │     ├── IDCardGenerator.jsx # PDF preview & generation sheet
  │     │     └── Reports.jsx         # Statistics filter and Excel export trigger
  │     ├── /routes
  │     │     └── AppRoutes.jsx       # Routing definition & layout wrappers
  │     ├── App.jsx                   # Component tree root (Toaster, Provider)
  │     ├── main.jsx                  # Bootstrapping script
  │     └── index.css                 # Global CSS (Tailwind directives)
  ├── postcss.config.cjs              # PostCSS configuration
  ├── tailwind.config.js              # Tailwind theme configurations
  ├── vite.config.js                  # Vite bundler options
  ├── .env.example                    # Env template VITE_API_BASE_URL
  ├── .env                            # Local base URL configuration
  ├── package.json                    # Project dependencies
  └── README.md                       # Documentation
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install the npm packages:
   ```bash
   npm install
   ```

### Configuration
1. Copy the `.env.example` template to a new `.env` file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and verify the backend API base URL points to your running server:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

### Running the App
To start the React development server:
```bash
npm run dev
```
By default, the Vite server starts on [http://localhost:5173](http://localhost:5173).

---

## Features Walkthrough

1. **Authentication Gate**: Renders a clean admin login form. Logs in with `admin` / `admin123`. Unauthenticated requests to other pages are automatically caught by `ProtectedRoute` and redirected.
2. **Overview Dashboard**: Renders aggregate metrics and charts (branch distribution, category distribution, and quota distribution) using `recharts` for dynamic visual aids.
3. **Directory Search**: Lists student basic profiles with photo thumbnails. Search query utilizes **400ms debouncing** to save backend resources. Cascading drop-downs update section options based on the chosen branch.
4. **Editable Profiles**: Details are structured in tabs. Each tab features a toggle switch enabling form elements that perform transaction-safe `PUT` updates. Uploading a photo updates the image directly on the header card.
5. **ID Card Generator**: Renders a live preview card. Clicking "Generate PDF ID Card" downloads the official printable card from the backend.
6. **Exports**: Generates custom Excel exports matching the search filters.
