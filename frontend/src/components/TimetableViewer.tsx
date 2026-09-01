import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTimetable } from '../contexts/TimetableContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar, AlertCircle, CheckCircle2, RefreshCcw, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { geneticApi } from '../lib/api';
import { toast } from 'sonner';

interface ScheduleGene {
  class_id: string;
  teacher_id: string;  // Teacher selected by GA
  room_id: string;
  time_slot: {
    day: number;
    period: number;
  };
}

interface SavedTimetable {
  id: string;
  name: string;
  fitness: number;
  created_at: string;
  genes: ScheduleGene[];
}

export const TimetableViewer: React.FC = () => {
  const { classes, rooms, subjects, teachers } = useData();
  const { t } = useLanguage();
  const { setSelectedTimetable: setContextTimetable } = useTimetable();
  const [viewMode, setViewMode] = useState<'all' | 'teacher' | 'room'>('all');
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);
  const [selectedTimetable, setSelectedTimetable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [timetableToDelete, setTimetableToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // DEBUG: Log data availability
  useEffect(() => {
    console.log('TimetableViewer - Data loaded:', {
      classes: classes.length,
      rooms: rooms.length,
      subjects: subjects.length,
      teachers: teachers.length,
      teacherIds: teachers.map(t => t.id).slice(0, 10)
    });
  }, [classes, rooms, subjects, teachers]);

  useEffect(() => {
    loadTimetables();
  }, []);

  useEffect(() => {
    if (selectedTimetable) {
      loadTimetableDetail(selectedTimetable);
    }
  }, [selectedTimetable]);

  const loadTimetables = async () => {
    try {
      setLoading(true);
      console.log('Loading timetables list...');
      const data = await geneticApi.getTimetables();
      console.log('Received timetables:', data.length, data.map(t => ({ id: t.id, name: t.name })));
      setTimetables(data.map(t => ({...t, genes: []})));
      
      if (data.length > 0 && !selectedTimetable) {
        // Auto-select the latest timetable
        const latest = data.reduce((prev, current) => 
          new Date(current.created_at) > new Date(prev.created_at) ? current : prev
        );
        console.log('Auto-selecting latest timetable:', latest.name, latest.id);
        setSelectedTimetable(latest.id);
      } else if (data.length > 0 && selectedTimetable) {
        // Tải lại thời khóa biểu hiện tại
        console.log('Re-loading currently selected timetable:', selectedTimetable);
        await loadTimetableDetail(selectedTimetable);
      }
    } catch (error) {
      console.error('Failed to load timetables:', error);
      toast.error('Không thể tải danh sách thời khóa biểu');
    } finally {
      setLoading(false);
    }
  };

  const loadTimetableDetail = async (id: string) => {
    try {
      setLoading(true);
      console.log('Loading timetable detail for ID:', id);
      const data = await geneticApi.getTimetable(id);
      console.log('Received timetable data:', { id: data.id, name: data.name, genesCount: data.genes?.length || 0 });
      
      // Chuẩn hóa genes - đảm bảo format nhất quán và bao gồm teacher_id
      const normalizedGenes = data.genes.map((gene: any) => ({
        class_id: gene.class_id,
        teacher_id: gene.teacher_id,
        room_id: gene.room_id,
        time_slot: {
          day: gene.time_slot.day,
          period: gene.time_slot.period
        }
      }));
      
      console.log('🔧 Normalized genes:', { 
        count: normalizedGenes.length, 
        sampleBefore: data.genes[0],
        sampleAfter: normalizedGenes[0],
        hasTeacherId: !!normalizedGenes[0]?.teacher_id
      });
      
      const updatedTimetables = timetables.map(t => 
        t.id === id ? { ...t, genes: normalizedGenes } : t
      );
      setTimetables(updatedTimetables);
      
      // Cập nhật context cho thống kê
      if (normalizedGenes && normalizedGenes.length > 0) {
        setContextTimetable(id, normalizedGenes, data.name);
        console.log('Loaded timetable with genes:', { 
          id, 
          name: data.name, 
          genesCount: normalizedGenes.length,
          sampleGene: normalizedGenes[0] 
        });
        toast.success(`Đã chọn thời khóa biểu: ${data.name}`);
      } else {
        console.warn('No genes found in timetable data');
        toast.warning('Thời khóa biểu không có dữ liệu');
      }
    } catch (error) {
      console.error('Failed to load timetable detail:', error);
      toast.error('Không thể tải chi tiết thời khóa biểu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTimetable = async () => {
    if (!timetableToDelete) return;

    try {
      setDeleting(true);
      await geneticApi.deleteTimetable(timetableToDelete);
      
      toast.success('Đã xóa thời khóa biểu thành công');
      
      // Remove from list
      const updatedTimetables = timetables.filter(t => t.id !== timetableToDelete);
      setTimetables(updatedTimetables);
      
      // If deleted timetable was selected, select another one
      if (selectedTimetable === timetableToDelete) {
        if (updatedTimetables.length > 0) {
          const latest = updatedTimetables.reduce((prev, current) => 
            new Date(current.created_at) > new Date(prev.created_at) ? current : prev
          );
          setSelectedTimetable(latest.id);
        } else {
          setSelectedTimetable(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete timetable:', error);
      toast.error('Không thể xóa thời khóa biểu');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTimetableToDelete(null);
    }
  };

  const openDeleteDialog = (timetableId: string) => {
    setTimetableToDelete(timetableId);
    setDeleteDialogOpen(true);
  };

  const currentTimetable = timetables.find(t => t.id === selectedTimetable);
  const bestTimetable = currentTimetable?.genes || [];

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

  if (loading && timetables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('menu.view_timetable')}
          </CardTitle>
          <CardDescription>
            Xem thời khóa biểu đã được tạo từ thuật toán di truyền
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải thời khóa biểu...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timetables.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('menu.view_timetable')}
          </CardTitle>
          <CardDescription>
            Xem thời khóa biểu đã được tạo từ thuật toán di truyền
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chưa có thời khóa biểu nào được lưu. Vui lòng vào mục "Tạo thời khóa biểu" để sử dụng thuật toán di truyền và lưu thời khóa biểu.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Filter timetable based on view mode
  const filteredTimetable = bestTimetable.filter((gene) => {
    if (viewMode === 'all') return true;
    if (viewMode === 'teacher' && selectedFilter) {
      // Filter by gene.teacher_id (selected by GA), not classItem.teacherId
      return gene.teacher_id === selectedFilter;
    }
    if (viewMode === 'room' && selectedFilter) {
      return gene.room_id === selectedFilter;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#003d82]" />
              {t('menu.view_timetable')}
            </CardTitle>
            <CardDescription>
              Xem thời khóa biểu đã được tạo từ thuật toán di truyền
            </CardDescription>
          </div>
          <Button onClick={loadTimetables} variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timetable Selector */}
        {timetables.length > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="timetable-select">Chọn thời khóa biểu</Label>
              {selectedTimetable && timetables.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openDeleteDialog(selectedTimetable)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa
                </Button>
              )}
            </div>
            <select
              id="timetable-select"
              title="Chọn thời khóa biểu"
              className="w-full mt-2 p-2 border rounded-md"
              value={selectedTimetable || ''}
              onChange={(e) => setSelectedTimetable(e.target.value)}
            >
              {timetables.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} - {new Date(t.created_at).toLocaleDateString('vi-VN')} (Fitness: {t.fitness.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
        )}

        {bestTimetable.length > 0 && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Thời khóa biểu "{currentTimetable?.name}" có {bestTimetable.length} buổi học
            </AlertDescription>
          </Alert>
        )}

        {/* Filter Options */}
        {bestTimetable.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <Label htmlFor="viewMode">Chế độ xem</Label>
            <Select value={viewMode} onValueChange={(value: any) => {
              setViewMode(value);
              setSelectedFilter('');
            }}>
              <SelectTrigger id="viewMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="teacher">Theo giảng viên</SelectItem>
                <SelectItem value="room">Theo phòng học</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {viewMode === 'teacher' && (
            <div>
              <Label htmlFor="teacher">Chọn giảng viên</Label>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger id="teacher">
                  <SelectValue placeholder="Chọn giảng viên" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {viewMode === 'room' && (
            <div>
              <Label htmlFor="room">Chọn phòng học</Label>
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger id="room">
                  <SelectValue placeholder="Chọn phòng học" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        )}

        {/* Timetable Grid */}
        {bestTimetable.length > 0 && (
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
                    const genesAtSlot = filteredTimetable.filter(
                      (gene) =>
                        gene.time_slot.day === dayIdx &&
                        gene.time_slot.period === periodIdx
                    );
                    return (
                      <td key={dayIdx} className="border p-2 align-top min-w-[150px]">
                        {genesAtSlot.length > 0 ? (
                          <div className="space-y-1">
                            {genesAtSlot.map((gene, idx) => {
                              const classItem = classes.find((c) => c.id === gene.class_id);
                              const room = rooms.find((r) => r.id === gene.room_id);
                              const subject = subjects.find((s) => s.id === classItem?.subjectId);
                              // Get teacher from gene.teacher_id (selected by GA), not from classItem
                              const teacher = teachers.find((t) => t.id === gene.teacher_id);
                              
                              return (
                                <div
                                  key={idx}
                                  className="text-xs p-2 bg-blue-50 rounded-md border border-blue-200 hover:bg-blue-100 transition-colors"
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
                                  {viewMode !== 'teacher' && (
                                    <div className="text-gray-600 mt-1">
                                      👤 {teacher?.name}
                                    </div>
                                  )}
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

        {/* Statistics */}
        {bestTimetable.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl text-[#003d82]">{classes.length}</div>
            <div className="text-sm text-gray-600 mt-1">Lớp học</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#003d82]">{bestTimetable.length}</div>
            <div className="text-sm text-gray-600 mt-1">Buổi học</div>
          </div>
          <div className="text-center">
            <div className="text-2xl text-[#003d82]">{rooms.length}</div>
            <div className="text-sm text-gray-600 mt-1">Phòng học</div>
          </div>
        </div>
        )}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thời khóa biểu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thời khóa biểu này không? 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={deleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTimetable}
              disabled={deleting}
              style={{
                backgroundColor: deleting ? '#9ca3af' : '#dc2626',
                color: 'white',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!deleting) e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                if (!deleting) e.currentTarget.style.backgroundColor = '#dc2626';
              }}
            >
              {deleting ? 'Đang xóa...' : 'Xóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
