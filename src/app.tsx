import { AuthProvider, useAuth } from "./context/auth";
import React from "react";
import Navbar from "./components/Navbar";
import Dashboard from "./components/Dashboard";
import BudgetPlanner from "./components/BudgetPlanner";
import TaxPrep from "./components/TaxPrep";
import Goals from "./components/Goals";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import Footer from "./components/Footer";
import { Box } from "@mui/material";
import { PlaidProvider, usePlaid } from "./context/PlaidContext";
import { Button } from "@mui/material";

function AppRoutes() {
  const { currentUser } = useAuth();
  const { fetchLinkToken, openPlaid, ready } = usePlaid();

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
        <PlaidProvider>
          <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
          <Box sx={{ flex: 1 }}>
            <AppRoutes />
          </Box>
            <Footer />
          </Box>
        </PlaidProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;