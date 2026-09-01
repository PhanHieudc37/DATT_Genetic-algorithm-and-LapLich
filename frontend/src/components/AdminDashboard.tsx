import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { Dashboard } from './Dashboard';
import { TeachersManager } from './TeachersManager';
import { SubjectsManager } from './SubjectsManager';
import { RoomsManager } from './RoomsManager';
import { ClassesManager } from './ClassesManager';
import { GeneticAlgorithm } from './GeneticAlgorithm';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DoorOpen,
  GraduationCap,
  Dna,
  LogOut,
  Menu,
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

export const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'teachers', label: 'Quản lý giảng viên', icon: Users },
    { id: 'subjects', label: 'Môn học', icon: BookOpen },
    { id: 'rooms', label: 'Phòng học', icon: DoorOpen },
    { id: 'classes', label: 'Lớp học', icon: GraduationCap },
    { id: 'algorithm', label: 'Thuật toán GA', icon: Dna },
  ];

  const Sidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-red-500 rounded flex items-center justify-center">
            <span className="text-red-500 italic text-sm">eL</span>
          </div>
          <div>
            <p className="text-xs text-gray-600">Hệ thống Lập lịch TKB</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          <div className="mb-4">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
              <Menu className="h-4 w-4" />
              <span>Trang chủ</span>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 cursor-pointer">
              <Users className="h-4 w-4" />
              <span>Quản lý giảng viên</span>
            </div>
          </div>

          <div className="ml-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm">Xin chào, {user?.fullName}</p>
            <p className="text-xs text-gray-600">{user?.role === 'admin' ? 'Quản trị viên' : 'Giảng viên'}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} title="Đăng xuất">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <DataProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-xl">
                    {navigation.find((n) => n.id === activeTab)?.label || 'Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {user?.department}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm hidden md:block">
                  Xin chào, <strong>{user?.fullName}</strong>
                </p>
                <Button variant="outline" onClick={logout} className="hidden md:flex">
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </Button>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="dashboard">
                <Dashboard />
              </TabsContent>

              <TabsContent value="teachers">
                <TeachersManager />
              </TabsContent>

              <TabsContent value="subjects">
                <SubjectsManager />
              </TabsContent>

              <TabsContent value="rooms">
                <RoomsManager />
              </TabsContent>

              <TabsContent value="classes">
                <ClassesManager />
              </TabsContent>

              <TabsContent value="algorithm">
                <GeneticAlgorithm />
              </TabsContent>
            </Tabs>
          </main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200">
            <div className="px-6 py-4 text-center text-sm text-gray-600">
              <p>© 2025 - Hệ thống Lập lịch Thời khóa biểu - Trường Đại học Xây dựng Hà Nội</p>
            </div>
          </footer>
        </div>
      </div>
    </DataProvider>
  );
};
