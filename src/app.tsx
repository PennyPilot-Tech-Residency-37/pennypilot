// src/App.tsx
import { AuthProvider, useAuth } from "./context/auth";
import React from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import BudgetPlanner from "./components/BudgetPlanner";
import TaxPrep from "./components/TaxPrep";
import Goals from "./components/Goals";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Footer from "./components/Footer"; // Import the new Footer component
import { Box } from "@mui/material";

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/budget" element={currentUser ? <BudgetPlanner /> : <Navigate to="/" />} />
      <Route path="/tax-prep" element={currentUser ? <TaxPrep /> : <Navigate to="/" />} />
      <Route path="/goals" element={currentUser ? <Goals /> : <Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <Box sx={{ flex: 1 }}>
            <AppRoutes />
          </Box>
          <Footer /> {/* Add the Footer component here */}
        </Box>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;