import React from "react";
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { RegistrationProvider } from "./context/RegistrationContext.js";
import { RegistrationPage } from "./pages/RegistrationPage.js";
import { PreviewPage } from "./pages/PreviewPage.js";
import { LoginPage } from "./pages/LoginPage.js";
import { ClubPortal } from "./pages/ClubPortal.js";
import { AdminPage } from "./pages/AdminPage.js";

export default function App() {
  return (
    <RegistrationProvider>
      <Router>
        <Routes>
          {/* Public Intake registration */}
          <Route path="/" element={<RegistrationPage />} />
          
          {/* Staging & layouts validation previews */}
          <Route path="/preview" element={<PreviewPage />} />
          
          {/* Traditional Club authentication */}
          <Route path="/login" element={<LoginPage />} />
          
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
