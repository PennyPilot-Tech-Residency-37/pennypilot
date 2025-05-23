import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import Dashboard from "./components/Dashboard";
import BudgetPlanner from "./components/BudgetPlanner";
import TaxPrep from "./components/TaxPrep";
import Goals from "./components/Goals";
import Footer from "./components/Footer";
import PageNotFound from "./components/PageNotFound";

import { AuthProvider, useAuth } from "./context/auth";
import { PlaidProvider } from "./context/PlaidContext";

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/" />} />
      <Route path="/budget" element={currentUser ? <BudgetPlanner /> : <Navigate to="/" />} />
      <Route path="/tax-prep" element={currentUser ? <TaxPrep /> : <Navigate to="/" />} />
      <Route path="/goals" element={currentUser ? <Goals /> : <Navigate to="/" />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <PlaidProvider>
        <BrowserRouter>
          <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar />
            <Box sx={{ flex: 1 }}>
              <AppRoutes />
            </Box>
            <Footer />
          </Box>
        </BrowserRouter>
      </PlaidProvider>
    </AuthProvider>
  );
}

export default App;
