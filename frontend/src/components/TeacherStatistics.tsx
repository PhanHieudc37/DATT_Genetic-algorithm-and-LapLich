import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTimetable } from '../contexts/TimetableContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users } from 'lucide-react';

export const TeacherStatistics: React.FC = () => {
  const { teachers, classes, subjects } = useData();
  const { selectedTimetableGenes, selectedTimetableId, selectedTimetableName } = useTimetable();
  const [renderKey, setRenderKey] = useState(0);
  
  // Force re-render when timetable changes
  useEffect(() => {
    console.log('TeacherStatistics - Timetable changed, re-rendering...');
    setRenderKey(prev => prev + 1);
  }, [selectedTimetableId, selectedTimetableGenes.length]);
  
  // Kiểm tra khi component mount
  useEffect(() => {
    if (!selectedTimetableId) {
      console.warn('TeacherStatistics mounted but NO timetable selected! User needs to select one in "Xem Thời Khóa Biểu"');
    } else {
      console.log('TeacherStatistics mounted with timetable:', selectedTimetableId, selectedTimetableName);
    }
  }, []);
  
  console.log('TeacherStatistics - Using timetable:', { 
    id: selectedTimetableId, 
    name: selectedTimetableName,
    genesCount: selectedTimetableGenes.length,
    sampleGene: selectedTimetableGenes[0],
    classesCount: classes.length,
    teachersCount: teachers.length,
    renderKey,
    genesClassIds: [...new Set(selectedTimetableGenes.map(g => g.class_id))],
    classesWithTeachers: classes.filter(c => c.teacherId).length
  });

  // Calculate teacher statistics from actual timetable
  const teacherStats = teachers.map((teacher) => {
    // Get classes assigned to this teacher from timetable (using gene.teacher_id from GA)
    const teacherClassIds = new Set(
      selectedTimetableGenes
        .filter(gene => gene.teacher_id === teacher.id)
        .map(gene => gene.class_id)
    );
    
    const teacherClasses = classes.filter((c) => teacherClassIds.has(c.id));
    const totalStudents = teacherClasses.reduce((sum, c) => sum + c.numberOfStudents, 0);
    
    // Count actual teaching slots from timetable (using gene.teacher_id)
    const teachingSlots = selectedTimetableGenes.filter(gene => 
      gene.teacher_id === teacher.id
    ).length;
    
    // Assume each slot is 1 hour
    const totalHours = teachingSlots;
    
    // Đếm số môn học từ các lớp thực tế đang dạy trong thời khóa biểu
    const teacherSubjectIds = new Set(
      teacherClasses.map(c => c.subjectId)
    );
    const subjectCount = teacherSubjectIds.size;

    return {
      ...teacher,
      classCount: teacherClasses.length,
      totalStudents,
      totalHours,
      subjectCount,
      teachingSlots,
    };
  });
  
  console.log('Teacher stats calculated:', teacherStats.map(t => `${t.name}: ${t.teachingSlots} slots`).join(', '));

  // Data for bar chart
  const chartData = teacherStats.map((stat) => ({
    name: stat.name,
    'Số lớp': stat.classCount,
    'Giờ dạy/tuần': stat.totalHours,
  }));

  // Calculate averages
  const avgClassesPerTeacher = teachers.length > 0 ? teacherStats.reduce((sum, t) => sum + t.classCount, 0) / teachers.length : 0;
  const avgHoursPerTeacher = teachers.length > 0 ? teacherStats.reduce((sum, t) => sum + t.totalHours, 0) / teachers.length : 0;
  const totalStudents = teacherStats.reduce((sum, t) => sum + t.totalStudents, 0);

  // Show message if no timetable selected
  if (!selectedTimetableId || selectedTimetableGenes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê giảng viên dạy</CardTitle>
          <CardDescription>Vui lòng chọn một thời khóa biểu trong mục "Xem Thời Khóa Biểu" để xem thống kê</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Chưa có thời khóa biểu nào được chọn</p>
            <p className="text-sm mt-2">Hãy tạo và chọn một thời khóa biểu để xem thống kê chi tiết</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thống kê giảng viên dạy</CardTitle>
          <CardDescription>
            {selectedTimetableName 
              ? `Dựa trên thời khóa biểu: "${selectedTimetableName}"` 
              : 'Dựa trên thời khóa biểu đã chọn'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng giảng viên</p>
                  <p className="text-2xl">{teachers.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">TB lớp/GV</p>
                  <p className="text-2xl">{avgClassesPerTeacher.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">TB giờ/tuần</p>
                  <p className="text-2xl">{avgHoursPerTeacher.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng SV</p>
                  <p className="text-2xl">{totalStudents}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Khối lượng giảng dạy</CardTitle>
          <CardDescription>So sánh số lớp và giờ dạy của từng giảng viên</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Số lớp" fill="#3b82f6" />
              <Bar dataKey="Giờ dạy/tuần" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết giảng viên</CardTitle>
          <CardDescription>Thông tin chi tiết về khối lượng giảng dạy</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Số lớp</TableHead>
                <TableHead className="text-center">Số môn</TableHead>
                <TableHead className="text-center">Tổng SV</TableHead>
                <TableHead className="text-center">Giờ/tuần</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teacherStats.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell>{stat.name}</TableCell>
                  <TableCell className="text-sm text-gray-600">{stat.email}</TableCell>
                  <TableCell className="text-center">{stat.classCount}</TableCell>
                  <TableCell className="text-center">{stat.subjectCount}</TableCell>
                  <TableCell className="text-center">{stat.totalStudents}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                        <div
                          className={`h-2 rounded-full ${
                            stat.totalHours > 20
                              ? 'bg-red-500'
                              : stat.totalHours > 12
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((stat.totalHours / 24) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm">{stat.totalHours}h</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        stat.totalHours > 20
                          ? 'bg-red-100 text-red-700'
                          : stat.totalHours > 12
                          ? 'bg-yellow-100 text-yellow-700'
                          : stat.totalHours === 0
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {stat.totalHours > 20
                        ? 'Quá tải'
                        : stat.totalHours > 12
                        ? 'Bình thường'
                        : stat.totalHours === 0
                        ? 'Chưa phân công'
                        : 'Nhẹ'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
