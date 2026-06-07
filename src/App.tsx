import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { RegistrationProvider } from "./context/RegistrationContext.js";
import { RegistrationPage } from "./pages/RegistrationPage.js";
import { PreviewPage } from "./pages/PreviewPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ClubPortal } from "./pages/ClubPortal.js";
import { AdminPage } from "./pages/AdminPage.js";
import { PublicPage } from "./components/PublicPage.js";

export default function App() {
  return (
    <RegistrationProvider>
      <Router>
        <Routes>
          {/* Public Intake registration */}
          <Route path="/register" element={<RegistrationPage />} />
          
          {/* Staging & layouts validation previews */}
          <Route path="/preview" element={<PreviewPage />} />

           {/* Public Tournament Hub - no login required */}
          <Route path="/livescore" element={<PublicPage />} /> 
          
          {/* Traditional Club authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<LoginPage />} />
          
          {/* Authentic workspace panels */}
          <Route path="/portal" element={<ClubPortal />} />
          
          {/* Administrative supervision systems */}
          <Route path="/admin" element={<AdminPage />} />

          {/* Wildcard rerouter links */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </RegistrationProvider>
  );
}
