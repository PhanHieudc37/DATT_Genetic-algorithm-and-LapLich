import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useTimetable } from '../contexts/TimetableContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DoorOpen, Eye, Calendar, User, BookOpen } from 'lucide-react';
import { Room } from '../types';

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

export const RoomStatistics: React.FC = () => {
  const { rooms, classes, teachers, subjects } = useData();
  const { selectedTimetableGenes, selectedTimetableId, selectedTimetableName } = useTimetable();
  const [renderKey, setRenderKey] = useState(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Force re-render when timetable changes
  useEffect(() => {
    console.log('RoomStatistics - Timetable changed, re-rendering...');
    setRenderKey(prev => prev + 1);
  }, [selectedTimetableId, selectedTimetableGenes.length]);
  
  // Kiểm tra khi component mount
  useEffect(() => {
    if (!selectedTimetableId) {
      console.warn('RoomStatistics mounted but NO timetable selected! User needs to select one in "Xem Thời Khóa Biểu"');
    } else {
      console.log('RoomStatistics mounted with timetable:', selectedTimetableId, selectedTimetableName);
    }
  }, []);
  
  console.log('RoomStatistics - Using timetable:', { 
    id: selectedTimetableId, 
    name: selectedTimetableName,
    genesCount: selectedTimetableGenes.length,
    sampleGene: selectedTimetableGenes[0],
    roomsCount: rooms.length,
    renderKey,
    allRoomIds: rooms.map(r => r.id),
    genesRoomIds: [...new Set(selectedTimetableGenes.map(g => g.room_id))]
  });

  // Calculate room usage statistics from actual timetable
  const roomStats = rooms.map((room) => {
    // Count how many time slots this room is used in the timetable
    const roomUsageCount = selectedTimetableGenes.filter(gene => gene.room_id === room.id).length;
    
    // Total available slots per week: 6 days * 15 periods = 90 slots
    const totalSlots = 90;
    const usagePercentage = Math.round((roomUsageCount / totalSlots) * 100);
    
    // Get unique classes assigned to this room
    const assignedClassIds = new Set(
      selectedTimetableGenes
        .filter(gene => gene.room_id === room.id)
        .map(gene => gene.class_id)
    );
    
    console.log(`Room ${room.name}: ${roomUsageCount} slots used, ${usagePercentage}% (${assignedClassIds.size} classes)`);
    
    return {
      ...room,
      classCount: assignedClassIds.size,
      usagePercentage: Math.min(usagePercentage, 100),
      slotCount: roomUsageCount,
    };
  });
  
  console.log('Room stats calculated:', roomStats.map(r => `${r.name}: ${r.slotCount} slots`).join(', '));

  // Data for bar chart
  const chartData = roomStats.map((stat) => ({
    name: stat.name,
    'Tỷ lệ sử dụng': stat.usagePercentage,
  }));

  // Data for pie chart - room types
  const roomTypes = [
    { name: 'Lý thuyết', value: rooms.filter((r) => r.type === 'theory').length },
    { name: 'Thực hành', value: rooms.filter((r) => r.type === 'lab').length },
    { name: 'Cả hai', value: rooms.filter((r) => r.type === 'both').length },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b'];

  const handleViewSchedule = (room: Room) => {
    setSelectedRoom(room);
    setIsDialogOpen(true);
  };

  // Get schedule for selected room
  const getRoomSchedule = () => {
    if (!selectedRoom) return [];
    return selectedTimetableGenes.filter(gene => gene.room_id === selectedRoom.id);
  };

  const renderTimetableForRoom = () => {
    const schedule = getRoomSchedule();
    
    if (schedule.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
          <p>Phòng này chưa được sử dụng trong thời khóa biểu</p>
        </div>
      );
    }

    // Create a map for quick lookup
    const scheduleMap: { [key: string]: typeof schedule[0] } = {};
    schedule.forEach(gene => {
      const key = `${gene.time_slot.day}-${gene.time_slot.period}`;
      scheduleMap[key] = gene;
    });

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Phòng học</p>
            <p className="font-semibold">{selectedRoom?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Loại phòng</p>
            <p className="font-semibold">
              {selectedRoom?.type === 'theory' ? 'Lý thuyết' : selectedRoom?.type === 'lab' ? 'Thực hành' : 'Cả hai'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Sức chứa</p>
            <p className="font-semibold">{selectedRoom?.capacity} sinh viên</p>
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
                    const classItem = gene ? classes.find(c => c.id === gene.class_id) : null;
                    const subject = classItem ? subjects.find(s => s.id === classItem.subjectId) : null;
                    // Get teacher from gene.teacher_id (selected by GA), not from classItem
                    const teacher = gene ? teachers.find(t => t.id === gene.teacher_id) : null;

                    return (
                      <td
                        key={dayIndex}
                        className={`border border-gray-300 p-2 text-sm ${
                          gene ? 'bg-green-50' : ''
                        }`}
                      >
                        {gene && classItem && (
                          <div className="space-y-1">
                            <div className="font-semibold text-green-900">
                              {classItem.name}
                            </div>
                            <div className="text-xs text-gray-600 flex items-center gap-1">
                              <BookOpen className="h-3 w-3" /> {subject?.name}
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

        <div className="text-sm text-gray-600 p-4 bg-green-50 rounded-lg">
          <p className="font-semibold mb-2">Thống kê:</p>
          <ul className="space-y-1">
            <li>• Tổng số buổi sử dụng: {schedule.length} buổi</li>
            <li>• Tỷ lệ sử dụng: {Math.round((schedule.length / 90) * 100)}% (trên tổng 90 tiết/tuần)</li>
            <li>• Số lớp sử dụng: {[...new Set(schedule.map(g => g.class_id))].length} lớp</li>
            <li>• Các lớp: {[...new Set(schedule.map(g => classes.find(c => c.id === g.class_id)?.name))].join(', ')}</li>
          </ul>
        </div>
      </div>
    );
  };

  // Show message if no timetable selected
  if (!selectedTimetableId || selectedTimetableGenes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Thống kê phòng sử dụng</CardTitle>
          <CardDescription>Vui lòng chọn một thời khóa biểu trong mục "Xem Thời Khóa Biểu" để xem thống kê</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <DoorOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
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
          <CardTitle>Thống kê phòng sử dụng</CardTitle>
          <CardDescription>
            {selectedTimetableName 
              ? `Dựa trên thời khóa biểu: "${selectedTimetableName}"` 
              : 'Dựa trên thời khóa biểu đã chọn'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <DoorOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng số phòng</p>
                  <p className="text-2xl">{rooms.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DoorOpen className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng sức chứa</p>
                  <p className="text-2xl">
                    {rooms.reduce((sum, r) => sum + r.capacity, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DoorOpen className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">TB sử dụng</p>
                  <p className="text-2xl">
                    {Math.round(
                      roomStats.reduce((sum, r) => sum + r.usagePercentage, 0) /
                        roomStats.length
                    )}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ sử dụng phòng</CardTitle>
            <CardDescription>Phần trăm sử dụng của từng phòng học</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Tỷ lệ sử dụng" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân loại phòng học</CardTitle>
            <CardDescription>Số lượng phòng theo loại</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roomTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết sử dụng phòng</CardTitle>
          <CardDescription>Thông tin chi tiết về tình trạng sử dụng từng phòng</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Tên phòng</TableHead>
                <TableHead className="text-center">Loại phòng</TableHead>
                <TableHead className="text-center">Sức chứa</TableHead>
                <TableHead className="text-center">Số lớp</TableHead>
                <TableHead className="text-center">Tỷ lệ sử dụng</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-center">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomStats.map((stat) => (
                <TableRow key={stat.id}>
                  <TableCell className="text-center">{stat.name}</TableCell>
                  <TableCell className="text-center">
                    {stat.type === 'theory'
                      ? 'Lý thuyết'
                      : stat.type === 'lab'
                      ? 'Thực hành'
                      : 'Cả hai'}
                  </TableCell>
                  <TableCell className="text-center">{stat.capacity}</TableCell>
                  <TableCell className="text-center">{stat.classCount}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[200px]">
                        <div
                          className={`h-2 rounded-full ${
                            stat.usagePercentage > 80
                              ? 'bg-red-500'
                              : stat.usagePercentage > 50
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${stat.usagePercentage}%` }}
                        />
                      </div>
                      <span className="text-sm">{stat.usagePercentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        stat.usagePercentage > 80
                          ? 'bg-red-100 text-red-700'
                          : stat.usagePercentage > 50
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {stat.usagePercentage > 80
                        ? 'Quá tải'
                        : stat.usagePercentage > 50
                        ? 'Bình thường'
                        : 'Dư thừa'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewSchedule(stat)}
                      className="hover:bg-green-50"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog to show room schedule */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lịch sử dụng phòng {selectedRoom?.name}
            </DialogTitle>
          </DialogHeader>
          {renderTimetableForRoom()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
