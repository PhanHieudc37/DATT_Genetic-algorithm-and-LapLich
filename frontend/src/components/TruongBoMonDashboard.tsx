import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { Button } from './ui/button';
import { TeachersManager } from './TeachersManager';
import { LogOut } from 'lucide-react';
import logo from '../assets/logo.png';

export const TruongBoMonDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#003d82] to-[#0052a3] text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl">Trưởng Bộ Môn</h1>
                  <p className="text-sm text-blue-100">{user?.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm hidden md:block">
                  <strong>{user?.fullName}</strong>
                </p>
                <Button variant="secondary" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <TeachersManager />
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
            <p>© 2025 - Hệ thống Lập lịch Thời khóa biểu - Trường Đại học Xây dựng Hà Nội</p>
          </div>
        </footer>
      </div>
    </DataProvider>
  );
};
