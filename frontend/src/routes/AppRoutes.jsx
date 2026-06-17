import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import Directory from "../pages/Directory";
import StudentProfile from "../pages/StudentProfile";
import IDCardGenerator from "../pages/IDCardGenerator";
import Reports from "../pages/Reports";
import MyProfile from "../pages/MyProfile";
import ChangePassword from "../pages/ChangePassword";

// Component to handle default path redirect depending on active role
const RootRedirect = () => {
  const { role } = useAuth();
  if (role === "student") {
    return <Navigate to="/my-profile" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

// Shared layout for dashboard pages (with Sidebar and Topbar)
const DashboardLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Dynamic titles depending on active path
  const titleMap = {
    "/dashboard": "Overview & Analytics",
    "/directory": "Student Directory",
    "/idcard": "Identity Card Generator",
    "/reports": "Reports & Exports",
    "/my-profile": "My Profile",
    "/change-password": "Change Password"
  };

  let title = titleMap[location.pathname] || "Overview";
  if (location.pathname.startsWith("/students/")) {
    title = "Student Profile";
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - fixed left */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 pt-16 min-w-0">
        <Topbar title={title} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        
        {/* Admin-only Routes */}
        <Route 
          path="dashboard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="directory" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Directory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="students/:htno" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <StudentProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="idcard" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <IDCardGenerator />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="reports" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          } 
        />

        {/* Student/Shared Routes */}
        <Route 
          path="my-profile" 
          element={
            <ProtectedRoute allowedRoles={["student"]}>
              <MyProfile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="change-password" 
          element={
            <ProtectedRoute allowedRoles={["student", "admin"]}>
              <ChangePassword />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Redirect all unknown paths to root redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
