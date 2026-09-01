import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DataProvider } from '../contexts/DataContext';
import { TimetableProvider } from '../contexts/TimetableContext';
import { Button } from './ui/button';
import { ClassesManager } from './ClassesManager';
import { TeacherStatistics } from './TeacherStatistics';
import { ClassStatistics } from './ClassStatistics';
import { RoomsManager } from './RoomsManager';
import { GeneticAlgorithm } from './GeneticAlgorithm';
import { RoomStatistics } from './RoomStatistics';
import { TimetableViewer } from './TimetableViewer';
import { LogOut, Home, ChevronDown, ChevronRight, Calendar, GraduationCap, DoorOpen, BarChart3, Users, Eye } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Card, CardContent } from './ui/card';
import logo from '../assets/logo.png';

type MenuType = 'home' | 'schedule' | 'room-stats' | 'class-stats' | 'classes' | 'teacher-stats' | 'rooms' | 'view-timetable';

export const GiaoVuDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeMenu, setActiveMenu] = useState<MenuType>('home');
  const [timetableOpen, setTimetableOpen] = useState(true);
  const [statisticsOpen, setStatisticsOpen] = useState(false);

  const handleMenuClick = (menu: MenuType) => {
    setActiveMenu(menu);
    // Auto-expand parent menu when clicking submenu
    if (menu === 'room-stats' || menu === 'teacher-stats' || menu === 'class-stats') {
      setStatisticsOpen(true);
    }
    if (menu === 'classes' || menu === 'rooms' || menu === 'schedule' || menu === 'view-timetable') {
      setTimetableOpen(true);
    }
  };

  return (
    <DataProvider>
      <TimetableProvider>
        <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-[#003d82] to-[#002952] text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                  <img src={logo} alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl">{t('role.giao_vu')}</h1>
                  <p className="text-sm text-blue-100">{user?.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm hidden md:block">
                  <strong>{user?.fullName}</strong>
                </p>
                <Button 
                  variant="secondary" 
                  onClick={logout}
                  className="bg-white text-[#003d82] hover:bg-gray-100"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('common.logout')}
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Menu */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-6">
                <nav className="p-2">
                  {/* Trang chủ */}
                  <button
                    onClick={() => handleMenuClick('home')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all mb-1 ${
                      activeMenu === 'home'
                        ? 'bg-[#003d82] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Home className="h-5 w-5" />
                    <span>{t('menu.home')}</span>
                  </button>

                  {/* Quản lý thời khóa biểu */}
                  <Collapsible open={timetableOpen} onOpenChange={setTimetableOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all mb-1">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5" />
                        <span>{t('menu.timetable_management')}</span>
                      </div>
                      {timetableOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-1">
                      <button
                        onClick={() => handleMenuClick('classes')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                          activeMenu === 'classes'
                            ? 'bg-gray-100 text-[#003d82]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <GraduationCap className="h-4 w-4" />
                        <span>{t('menu.course_management')}</span>
                      </button>
                      <button
                        onClick={() => handleMenuClick('rooms')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                          activeMenu === 'rooms'
                            ? 'bg-gray-100 text-[#003d82]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <DoorOpen className="h-4 w-4" />
                        <span>{t('menu.room_management')}</span>
                      </button>
                      <button
                        onClick={() => handleMenuClick('schedule')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                          activeMenu === 'schedule'
                            ? 'bg-[#003d82] text-white shadow-md'
                            : 'bg-[#003d82] text-white hover:bg-[#002952]'
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                        <span>{t('menu.create_timetable')}</span>
                      </button>
                      <button
                        onClick={() => handleMenuClick('view-timetable')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                          activeMenu === 'view-timetable'
                            ? 'bg-gray-100 text-[#003d82]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        <span>{t('menu.view_timetable')}</span>
                      </button>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Thống kê */}
                  <Collapsible open={statisticsOpen} onOpenChange={setStatisticsOpen}>
                    <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-all mb-1">
                      <div className="flex items-center gap-3">
                        <BarChart3 className="h-5 w-5" />
                        <span>{t('menu.statistics')}</span>
                      </div>
                      {statisticsOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-4 space-y-1">
                      <button
                        onClick={() => handleMenuClick('class-stats')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                          activeMenu === 'class-stats'
                            ? 'bg-gray-100 text-[#003d82]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <GraduationCap className="h-4 w-4" />
                        <span>Thống kê Khóa học</span>
                      </button>
                      <button
                        onClick={() => handleMenuClick('room-stats')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                          activeMenu === 'room-stats'
                            ? 'bg-gray-100 text-[#003d82]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <DoorOpen className="h-4 w-4" />
                        <span>{t('menu.room_stats')}</span>
                      </button>
                      <button
                        onClick={() => handleMenuClick('teacher-stats')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                          activeMenu === 'teacher-stats'
                            ? 'bg-gray-100 text-[#003d82]'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Users className="h-4 w-4" />
                        <span>{t('menu.teacher_stats')}</span>
                      </button>
                    </CollapsibleContent>
                  </Collapsible>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeMenu === 'home' && (
                <div className="space-y-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-2xl mb-4 text-[#003d82]">
                        Chào mừng đến với Hệ thống Quản lý Thời khóa biểu
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Hệ thống sắp xếp thời khóa biểu tự động sử dụng thuật toán di truyền cho Trường Đại học Xây dựng Hà Nội
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <Card className="border-l-4 border-l-[#003d82]">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Calendar className="h-6 w-6 text-[#003d82]" />
                              </div>
                              <div>
                                <h3>Quản lý Thời khóa biểu</h3>
                                <p className="text-sm text-gray-600">
                                  Tạo và quản lý thời khóa biểu tự động
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <BarChart3 className="h-6 w-6 text-green-600" />
                              </div>
                              <div>
                                <h3>Thống kê</h3>
                                <p className="text-sm text-gray-600">
                                  Xem thống kê phòng và giảng viên
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <GraduationCap className="h-6 w-6 text-purple-600" />
                              </div>
                              <div>
                                <h3>Quản lý Lớp học</h3>
                                <p className="text-sm text-gray-600">
                                  Thêm và quản lý các lớp học
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <DoorOpen className="h-6 w-6 text-orange-600" />
                              </div>
                              <div>
                                <h3>Quản lý Phòng học</h3>
                                <p className="text-sm text-gray-600">
                                  Thêm và quản lý phòng học
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              {activeMenu === 'schedule' && <GeneticAlgorithm />}
              {activeMenu === 'class-stats' && <ClassStatistics />}
              {activeMenu === 'room-stats' && <RoomStatistics />}
              {activeMenu === 'classes' && <ClassesManager />}
              {activeMenu === 'teacher-stats' && <TeacherStatistics />}
              {activeMenu === 'rooms' && <RoomsManager />}
              {activeMenu === 'view-timetable' && <TimetableViewer />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
            <p>{t('common.footer')}</p>
          </div>
        </footer>
        </div>
      </TimetableProvider>
    </DataProvider>
  );
};
