import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 3500,
            style: {
              background: "#1E293B",
              color: "#FFF",
              borderRadius: "0.75rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            },
            success: {
              iconTheme: {
                primary: "#10B981",
                secondary: "#FFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#FFF",
              },
            },
          }} 
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
