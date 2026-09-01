import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { LogOut, Calendar, BookOpen, Users, Clock, AlertCircle, RefreshCcw } from 'lucide-react';
import { DataProvider } from '../contexts/DataContext';
import { geneticApi } from '../lib/api';

const GiangVienDashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { classes, subjects, rooms } = useData();

  const [timetables, setTimetables] = useState<any[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [schedule, setSchedule] = useState<
    Array<{ class_id: string; room_id: string; time_slot: { day: number; period: number } }>
  >([]);
  const [teacherStats, setTeacherStats] = useState({
    total_classes: 0,
    total_sessions: 0,
  });

  // Get classes for current teacher - FROM SCHEDULE (not from classes table)
  // Since classes.teacher_id = NULL, we need to get this from timetable genes
  const myClassIds = new Set(schedule.map(s => s.class_id));
  const myClasses = classes.filter(c => myClassIds.has(c.id));
  const mySubjects = subjects.filter((s) =>
    myClasses.some((c) => c.subjectId === s.id)
  );

  const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const PERIODS = [
    '6:30 - 7:20',   // Tiết 1
    '7:25 - 8:15',   // Tiết 2
    '8:20 - 9:10',   // Tiết 3
    '9:20 - 10:10',  // Tiết 4
    '10:15 - 11:05', // Tiết 5
    '11:10 - 12:00', // Tiết 6
    '12:30 - 13:20', // Tiết 7
    '13:25 - 14:15', // Tiết 8
    '14:20 - 15:10', // Tiết 9
    '15:20 - 16:10', // Tiết 10
    '16:15 - 17:05', // Tiết 11
    '17:10 - 18:00', // Tiết 12
    '18:15 - 19:05', // Tiết 13
    '19:10 - 20:00', // Tiết 14
    '20:05 - 20:55', // Tiết 15
  ];

  // Load timetables on mount and auto-select latest
  useEffect(() => {
    const loadTimetables = async () => {
      try {
        const list = await geneticApi.getTimetables();
        setTimetables(list);
        if (list.length > 0) {
          setSelectedTimetable(list[0].id);
          await loadTeacherSchedule(list[0].id);
        }
      } finally {
        setLoading(false);
      }
    };
    loadTimetables();
  }, []);

  const loadTeacherSchedule = async (timetableId: string) => {
    setLoading(true);
    try {
      const res = await geneticApi.getTeacherSchedule(timetableId);
      setSchedule(res.genes || []);
      setTeacherStats({
        total_classes: res.total_classes || 0,
        total_sessions: res.total_sessions || 0,
      });
    } catch (e) {
      console.error('Failed to load teacher schedule:', e);
      setSchedule([]);
      setTeacherStats({ total_classes: 0, total_sessions: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#003d82] to-[#002952] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-[#003d82]">GV</span>
              </div>
              <div>
                <h1 className="text-xl">{t('role.giang_vien')}</h1>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h2 className="mb-2">Xin chào, {user?.fullName}!</h2>
            <p className="text-gray-600">
              Xem lịch giảng dạy của bạn
            </p>
          </div>

          {/* Timetable selector - MOVED TO TOP */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chọn thời khóa biểu</CardTitle>
                  <CardDescription>
                    Xem lịch giảng dạy theo thời khóa biểu đã lưu
                  </CardDescription>
                </div>
                <Button
                  onClick={() => selectedTimetable && loadTeacherSchedule(selectedTimetable)}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Làm mới
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading && timetables.length === 0 ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-600">Đang tải...</p>
                </div>
              ) : timetables.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Chưa có thời khóa biểu nào được tạo. Vui lòng liên hệ Giáo vụ để tạo thời khóa biểu.
                  </AlertDescription>
                </Alert>
              ) : (
                <select
                  className="w-full p-2 border rounded-md"
                  title="Chọn thời khóa biểu"
                  value={selectedTimetable || ''}
                  onChange={(e) => {
                    setSelectedTimetable(e.target.value);
                    loadTeacherSchedule(e.target.value);
                  }}
                >
                  {timetables.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} - {new Date(t.created_at).toLocaleDateString('vi-VN')} (Fitness: {t.fitness.toFixed(2)})
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-l-4 border-l-[#003d82]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Lớp học</CardTitle>
                <Calendar className="h-4 w-4 text-[#003d82]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{teacherStats.total_classes}</div>
                <p className="text-xs text-gray-600 mt-1">Tổng số lớp giảng dạy</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Môn học</CardTitle>
                <BookOpen className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{mySubjects.length}</div>
                <p className="text-xs text-gray-600 mt-1">Môn học đang dạy</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Sinh viên</CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">
                  {myClasses.reduce((sum, c) => sum + c.numberOfStudents, 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">Tổng số sinh viên</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">Buổi học/tuần</CardTitle>
                <Clock className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{teacherStats.total_sessions}</div>
                <p className="text-xs text-gray-600 mt-1">Tổng số buổi</p>
              </CardContent>
            </Card>
          </div>

          {/* My Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Lớp học của tôi</CardTitle>
              <CardDescription>Danh sách các lớp học bạn đang giảng dạy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#003d82]/5">
                      <TableHead>Tên lớp</TableHead>
                      <TableHead>Môn học</TableHead>
                      <TableHead>Số sinh viên</TableHead>
                      <TableHead>Buổi/tuần</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myClasses.length > 0 ? (
                      myClasses.map((classItem) => {
                        const subject = subjects.find((s) => s.id === classItem.subjectId);
                        return (
                          <TableRow key={classItem.id} className="hover:bg-gray-50">
                            <TableCell>{classItem.name}</TableCell>
                            <TableCell>
                              {subject ? `${subject.code} - ${subject.name}` : 'N/A'}
                            </TableCell>
                            <TableCell>{classItem.numberOfStudents}</TableCell>
                            <TableCell>{classItem.sessionsPerWeek}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                          Chưa có lớp học nào được phân công
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#003d82]" />
                Lịch dạy của tôi
              </CardTitle>
              <CardDescription>Lịch giảng dạy trong tuần</CardDescription>
            </CardHeader>
            <CardContent>
              {timetables.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Chưa có thời khóa biểu nào được tạo. Vui lòng liên hệ Giáo vụ để tạo thời khóa biểu.
                  </AlertDescription>
                </Alert>
              ) : schedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Chưa có lịch giảng dạy</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border">
                    <thead>
                      <tr>
                        <th className="border p-2 bg-[#003d82] text-white text-sm">Giờ</th>
                        {DAYS.map((day, idx) => (
                          <th key={idx} className="border p-2 bg-[#003d82] text-white text-sm">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PERIODS.map((period, periodIdx) => (
                        <tr key={periodIdx}>
                          <td className="border p-2 bg-gray-50 text-sm text-center">{period}</td>
                          {DAYS.map((_, dayIdx) => {
                            const sessionsAtSlot = schedule.filter(
                              (gene) => gene.time_slot.day === dayIdx && gene.time_slot.period === periodIdx
                            );
                            return (
                              <td key={dayIdx} className="border p-2 align-top min-w-[150px]">
                                {sessionsAtSlot.length > 0 ? (
                                  <div className="space-y-1">
                                    {sessionsAtSlot.map((gene, idx) => {
                                      const classItem = classes.find((c) => c.id === gene.class_id);
                                      const subject = subjects.find((s) => s.id === classItem?.subjectId);
                                      const room = rooms.find((r) => r.id === gene.room_id);
                                      
                                      return (
                                        <div
                                          key={idx}
                                          className="text-xs p-2 bg-blue-50 rounded-md border border-blue-200"
                                        >
                                          <div className="font-medium text-[#003d82]">
                                            {classItem?.name}
                                          </div>
                                          <div className="text-gray-600 mt-1">
                                            {subject?.code} - {subject?.name}
                                          </div>
                                          <div className="text-gray-600 mt-1 flex items-center justify-between">
                                            <span>📍 {room?.name}</span>
                                            <span className="text-gray-500">
                                              {classItem?.numberOfStudents} SV
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>{t('common.footer')}</p>
        </div>
      </footer>
    </div>
  );
};

export const GiangVienDashboard: React.FC = () => {
  return (
    <DataProvider>
      <GiangVienDashboardContent />
    </DataProvider>
  );
};
