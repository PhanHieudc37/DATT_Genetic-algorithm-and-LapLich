import React from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { LandingPage } from "./components/LandingPage";
import { TruongBoMonDashboard } from "./components/TruongBoMonDashboard";
import { GiaoVuDashboard } from "./components/GiaoVuDashboard";
import { TruongKhoaDashboard } from "./components/TruongKhoaDashboard";
import { GiangVienDashboard } from "./components/GiangVienDashboard";
import { Toaster } from "./components/ui/sonner";

function AppContent() {
  const { user, isAuthenticated } = useAuth();

  // If not authenticated, show landing page with login
  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Route based on user role (handle both lowercase and uppercase)
  const role = user?.role?.toUpperCase();
  
  if (role === "TRUONG_BO_MON") {
    return <TruongBoMonDashboard />;
  }

  if (role === "GIAO_VU") {
    return <GiaoVuDashboard />;
  }

  if (role === "TRUONG_KHOA") {
    return <TruongKhoaDashboard />;
  }

  if (role === "GIANG_VIEN") {
    return <GiangVienDashboard />;
  }

  return null;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" />
      </AuthProvider>
    </LanguageProvider>
  );
}