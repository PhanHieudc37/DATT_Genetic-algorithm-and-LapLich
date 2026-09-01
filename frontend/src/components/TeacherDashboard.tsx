import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { LogOut, Calendar, BookOpen, MapPin, Clock, RefreshCcw } from 'lucide-react';
import { DataProvider } from '../contexts/DataContext';
import { geneticApi } from '../lib/api';
import { toast } from 'sonner';

interface ScheduleItem {
  id: string;
  classId: string;
  className: string;
  subjectName: string;
  roomName: string;
  day: number;
  period: number;
  numberOfStudents: number;
}

const TeacherDashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { classes, subjects, rooms } = useData();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [timetables, setTimetables] = useState<any[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string | null>(null);

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

  // My classes for this teacher (for the table section)
  const myClasses = user?.id ? classes.filter(c => c.teacherId === user.id) : [];

  useEffect(() => {
    console.log('🚀 TeacherDashboard mounted');
    console.log('User:', user);
    loadTimetables();
  }, []);

  useEffect(() => {
    // Reload schedule when classes/subjects/rooms data changes
    if (selectedTimetable && classes.length > 0 && subjects.length > 0 && rooms.length > 0) {
      console.log('Data loaded, reloading schedule...');
      loadTeacherSchedule(selectedTimetable);
    }
  }, [teachers, classes, selectedTimetable]);

  const loadTimetables = async () => {
    try {
      console.log('Loading timetables...');
      console.log('Current token:', localStorage.getItem('token')?.substring(0, 30) + '...');
      const data = await geneticApi.getTimetables();
      console.log('Timetables loaded:', data.length, 'items');
      console.log('Timetables:', data);
      setTimetables(data);
      if (data.length > 0) {
        // Auto-select the latest timetable
        console.log('Auto-selecting timetable:', data[0].id);
        setSelectedTimetable(data[0].id);
        loadTeacherSchedule(data[0].id);
      } else {
        console.log('No timetables found in database');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error loading timetables:', error);
      console.error('Error details:', error.message, error.stack);
      toast.error('Không thể tải danh sách thời khóa biểu: ' + error.message);
      setLoading(false);
    }
  };

  const loadTeacherSchedule = async (timetableId: string) => {
    if (!user?.id) {
      console.log('No user ID, skipping schedule load');
      return;
    }

    setLoading(true);
    try {
      console.log('Loading teacher schedule for timetable:', timetableId);
      console.log('Current user:', user.id, user.username);
      const data = await geneticApi.getTeacherSchedule(timetableId);
      console.log('Teacher schedule data:', data);
      console.log('Genes count:', data.genes?.length);
      console.log('Full genes:', data.genes);
      
      if (!data.genes || data.genes.length === 0) {
        console.warn('No genes returned from API');
        setSchedule([]);
        setLoading(false);
        return;
      }
      
      // Convert API data to schedule items
      const scheduleItems: ScheduleItem[] = data.genes.map((gene, index) => {
        const classItem = classes.find(c => c.id === gene.class_id);
        const subject = subjects.find(s => s.id === classItem?.subjectId);
        const room = rooms.find(r => r.id === gene.room_id);
        
        console.log(`Gene ${index}:`, {
          gene,
          classItem,
          subject,
          room
        });
        
        return {
          id: `${gene.class_id}-${gene.time_slot.day}-${gene.time_slot.period}`,
          classId: gene.class_id,
          className: classItem?.name || 'N/A',
          subjectName: subject?.name || 'N/A',
          roomName: room?.name || 'N/A',
          day: gene.time_slot.day,
          period: gene.time_slot.period,
          numberOfStudents: classItem?.numberOfStudents || 0,
        };
      });
      
      console.log('Schedule items created:', scheduleItems);
      setSchedule(scheduleItems);
    } catch (error) {
      console.error('Error loading teacher schedule:', error);
      toast.error('Không thể tải lịch giảng dạy: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getScheduleForDayPeriod = (day: number, period: number) => {
    return schedule.find(s => s.day === day && s.period === period);
  };

  const handleRefresh = () => {
    if (selectedTimetable) {
      loadTeacherSchedule(selectedTimetable);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border-2 border-red-500 rounded flex items-center justify-center">
                <span className="text-red-500 italic text-sm">eL</span>
              </div>
              <div>
                <h1 className="text-xl">Hệ thống Lập lịch TKB - Giảng viên</h1>
                <p className="text-sm text-gray-600">{user?.department}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm hidden md:block">
                Xin chào, <strong>{user?.fullName}</strong>
              </p>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Timetable Selector */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chọn thời khóa biểu</CardTitle>
                  <CardDescription>
                    Xem lịch giảng dạy của bạn theo thời khóa biểu đã lưu
                  </CardDescription>
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm">
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
                  value={selectedTimetable || ''}
                  onChange={(e) => {
                    setSelectedTimetable(e.target.value);
                    loadTeacherSchedule(e.target.value);
                  }}
                >
                  {timetables.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Fitness: {t.fitness.toFixed(2)})
                    </option>
                  ))}
                </select>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {schedule.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Tiết dạy / tuần</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{schedule.length}</div>
                  <p className="text-xs text-gray-600 mt-1">Tổng số tiết</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Lớp học</CardTitle>
                  <BookOpen className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {[...new Set(schedule.map(s => s.classId))].length}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Đang giảng dạy</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm">Phòng học</CardTitle>
                  <MapPin className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {[...new Set(schedule.map(s => s.roomName))].length}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Phòng khác nhau</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* My Classes - table */}
          {myClasses.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lớp học của tôi</CardTitle>
                <CardDescription>Danh sách các lớp học bạn đang giảng dạy</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-left p-2 border">Tên lớp</th>
                        <th className="text-left p-2 border">Môn học</th>
                        <th className="text-right p-2 border">Số sinh viên</th>
                        <th className="text-right p-2 border">Buổi/tuần</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myClasses.map((c) => {
                        const subject = subjects.find(s => s.id === c.subjectId);
                        return (
                          <tr key={c.id} className="hover:bg-gray-50">
                            <td className="p-2 border">{c.name}</td>
                            <td className="p-2 border">{subject ? `${subject.code} - ${subject.name}` : 'N/A'}</td>
                            <td className="p-2 border text-right">{c.numberOfStudents}</td>
                            <td className="p-2 border text-right">{c.sessionsPerWeek}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule Table */}
          {selectedTimetable && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Lịch giảng dạy tuần
              </CardTitle>
              <CardDescription>
                Xem lịch giảng dạy chi tiết theo từng ngày trong tuần
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Đang tải lịch giảng dạy...</p>
                </div>
              ) : timetables.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Chưa có thời khóa biểu nào được tạo</p>
                  <p className="text-sm mt-2">Vui lòng liên hệ Giáo vụ để tạo thời khóa biểu</p>
                  <Button 
                    onClick={loadTimetables} 
                    variant="outline" 
                    size="sm"
                    className="mt-4"
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Thử lại
                  </Button>
                </div>
              ) : schedule.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium">Chưa có lịch giảng dạy</p>
                  <p className="text-sm mt-2">Bạn chưa được xếp lịch dạy trong thời khóa biểu này</p>
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
                      {PERIODS.map((period, periodIndex) => (
                        <tr key={periodIndex}>
                          <td className="border p-2 bg-gray-50 text-sm text-center">{period}</td>
                          {DAYS.map((_, dayIndex) => {
                            const scheduleItem = getScheduleForDayPeriod(dayIndex, periodIndex);
                            return (
                              <td key={dayIndex} className="border p-2 align-top min-w-[150px]">
                                {scheduleItem ? (
                                  <div className="text-xs p-2 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors">
                                    <div className="font-medium text-[#003d82]">
                                      {scheduleItem.className}
                                    </div>
                                    <div className="text-gray-600 mt-1">
                                      {scheduleItem.subjectName}
                                    </div>
                                    <div className="text-gray-600 mt-1 flex items-center justify-between">
                                      <span>📍 {scheduleItem.roomName}</span>
                                      <span className="text-gray-500">
                                        {scheduleItem.numberOfStudents} SV
                                      </span>
                                    </div>
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
          )}
        </div>
      </main>
    </div>
  );
};

export const TeacherDashboard: React.FC = () => {
  return (
    <DataProvider>
      <TeacherDashboardContent />
    </DataProvider>
  );
};
