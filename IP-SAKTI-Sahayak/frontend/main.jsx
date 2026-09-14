import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import TwinPage from "./pages/TwinPage.jsx";
import TKRiskPage from "./pages/TKRiskPage.jsx";
import RegulationsPage from "./pages/RegulationsPage.jsx";
import CalendarPage from "./pages/CalendarPage.jsx";
import ExpertBriefPage from "./pages/ExpertBriefPage.jsx";
import { LanguageProvider } from "./lib/i18n.jsx";
import "./app/globals.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<ChatPage />} />
            <Route path="/twin" element={<TwinPage />} />
            <Route path="/tk-risk" element={<TKRiskPage />} />
            <Route path="/regulations" element={<RegulationsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/expert-brief" element={<ExpertBriefPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  </React.StrictMode>
);
