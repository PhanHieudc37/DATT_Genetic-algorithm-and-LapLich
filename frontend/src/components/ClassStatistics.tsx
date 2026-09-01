import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTimetable } from '../contexts/TimetableContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Eye, Search, GraduationCap, Calendar, MapPin, User } from 'lucide-react';
import { Class } from '../types';

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

export const ClassStatistics: React.FC = () => {
  const { classes, teachers, subjects, rooms } = useData();
  const { selectedTimetableGenes, selectedTimetableId, selectedTimetableName } = useTimetable();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Show message if no timetable selected
  if (!selectedTimetableId || selectedTimetableGenes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê Khóa học</CardTitle>
          <CardDescription>Vui lòng chọn một thời khóa biểu trong mục "Xem Thời Khóa Biểu" để xem thống kê</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <GraduationCap className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Chưa có thời khóa biểu nào được chọn</p>
            <p className="text-sm mt-2">Hãy tạo và chọn một thời khóa biểu để xem thống kê chi tiết</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleViewSchedule = (classItem: Class) => {
    setSelectedClass(classItem);
    setIsDialogOpen(true);
  };

  const filteredClasses = classes.filter((classItem) =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subjects.find(s => s.id === classItem.subjectId)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get schedule for selected class
  const getClassSchedule = () => {
    if (!selectedClass) return [];

    return selectedTimetableGenes.filter(gene => gene.class_id === selectedClass.id);
  };

  const renderTimetableForClass = () => {
    const schedule = getClassSchedule();
    
    if (schedule.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>Chưa có lịch học cho lớp này</p>
        </div>
      );
    }

    // Create a map for quick lookup
    const scheduleMap: { [key: string]: typeof schedule[0] } = {};
    schedule.forEach(gene => {
      const key = `${gene.time_slot.day}-${gene.time_slot.period}`;
      scheduleMap[key] = gene;
    });

    // Get teacher from first gene in schedule (all genes for same class should have same teacher)
    const teacherId = schedule[0]?.teacher_id;
    const teacher = teachers.find(t => t.id === teacherId);
    const subject = subjects.find(s => s.id === selectedClass?.subjectId);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Lớp học</p>
            <p className="font-semibold">{selectedClass?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Môn học</p>
            <p className="font-semibold">{subject?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Giảng viên</p>
            <p className="font-semibold">{teacher?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Số buổi/tuần</p>
            <p className="font-semibold">{selectedClass?.sessionsPerWeek} buổi</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-sm font-medium w-24">Tiết</th>
                {DAYS.map((day) => (
                  <th key={day} className="border border-gray-300 p-2 text-sm font-medium">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((period, periodIndex) => (
                <tr key={periodIndex} className="hover:bg-gray-50">
                  <td className="border border-gray-300 p-2 text-sm font-medium bg-gray-50">
                    {period}
                  </td>
                  {DAYS.map((_, dayIndex) => {
                    const key = `${dayIndex}-${periodIndex}`;
                    const gene = scheduleMap[key];
                    const room = gene ? rooms.find(r => r.id === gene.room_id) : null;

                    return (
                      <td
                        key={dayIndex}
                        className={`border border-gray-300 p-2 text-sm ${
                          gene ? 'bg-blue-50' : ''
                        }`}
                      >
                        {gene && (
                          <div className="space-y-1">
                            <div className="font-semibold text-blue-900">
                              {selectedClass?.name}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {room?.name}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <User className="h-3 w-3" /> {teacher?.name}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-sm text-gray-600 p-4 bg-blue-50 rounded-lg">
          <p className="font-semibold mb-2">Thống kê:</p>
          <ul className="space-y-1">
            <li>• Tổng số buổi học: {schedule.length} buổi</li>
            <li>• Số buổi/tuần theo lịch: {selectedClass?.sessionsPerWeek} buổi</li>
            <li>• Các phòng học: {[...new Set(schedule.map(g => rooms.find(r => r.id === g.room_id)?.name))].join(', ')}</li>
          </ul>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê Khóa học</CardTitle>
        <CardDescription>
          {selectedTimetableName 
            ? `Dựa trên thời khóa biểu: "${selectedTimetableName}"` 
            : 'Dựa trên thời khóa biểu đã chọn'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Search */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm theo tên lớp hoặc môn học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lớp</TableHead>
                  <TableHead>Tên lớp</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Giảng viên</TableHead>
                  <TableHead className="text-center">Số SV</TableHead>
                  <TableHead className="text-center">Buổi/tuần</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Không tìm thấy lớp học nào
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClasses.map((classItem) => {
                    // Get teacher from timetable genes for this class
                    const classGenes = selectedTimetableGenes.filter(g => g.class_id === classItem.id);
                    const teacherId = classGenes[0]?.teacher_id;
                    const teacher = teachers.find(t => t.id === teacherId);
                    const subject = subjects.find(s => s.id === classItem.subjectId);

                    return (
                      <TableRow key={classItem.id}>
                        <TableCell className="font-medium">{classItem.id}</TableCell>
                        <TableCell>{classItem.name}</TableCell>
                        <TableCell>{subject?.name || 'N/A'}</TableCell>
                        <TableCell>{teacher?.name || 'N/A'}</TableCell>
                        <TableCell className="text-center">{classItem.numberOfStudents}</TableCell>
                        <TableCell className="text-center">{classItem.sessionsPerWeek}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewSchedule(classItem)}
                            className="hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Dialog to show class schedule */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Lịch học của lớp {selectedClass?.name}
              </DialogTitle>
            </DialogHeader>
            {renderTimetableForClass()}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
