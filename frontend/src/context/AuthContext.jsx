import React, { createContext, useState, useEffect, useContext } from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage on initial mount
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (storedToken && storedUser && storedRole) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
        setRole(storedRole);
      } catch (e) {
        console.error("Error parsing stored session:", e);
        // Clear corrupt data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login", { username, password });
      const { token: jwtToken, admin: adminData } = response.data;
      const userRole = adminData.role || "admin";

      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(adminData));
      localStorage.setItem("role", userRole);

      setToken(jwtToken);
      setUser(adminData);
      setRole(userRole);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Login failed. Please check your network and credentials.";
      return { success: false, error: errorMsg };
    }
  };

  const studentLogin = async (email, password) => {
    try {
      const response = await api.post("/auth/student-login", { email, password });
      const { token: jwtToken, student: studentData } = response.data;
      const userRole = studentData.role || "student";

      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user", JSON.stringify(studentData));
      localStorage.setItem("role", userRole);

      setToken(jwtToken);
      setUser(studentData);
      setRole(userRole);
      return { success: true };
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Login failed. Please check your network and credentials.";
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    setToken(null);
    setUser(null);
    setRole(null);
  };

  // Provide 'admin' for backward compatibility
  const admin = role === "admin" ? user : null;

  return (
    <AuthContext.Provider value={{ token, user, admin, role, loading, login, studentLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
