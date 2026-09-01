import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Class } from '../types';
import { toast } from 'sonner';

export const ClassesManager: React.FC = () => {
  const { classes, subjects, teachers, addClass, updateClass, deleteClass } = useData();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [formData, setFormData] = useState<{
    name: string;
    subjectId: string;
    teacherId: string;
    numberOfStudents: number | string;
    sessionsPerWeek: number;
    roomType: 'theory' | 'lab' | 'both';
  }>({
    name: '',
    subjectId: '',
    teacherId: '',
    numberOfStudents: 50,
    sessionsPerWeek: 2,
    roomType: 'theory',
  });

  // Helper function to calculate recommended sessions per week based on credits
  const calculateSessionsPerWeek = (credits: number): number => {
    if (credits === 1) return 1;
    if (credits >= 5) return 3;
    return 2; // For 2, 3, 4 credits
  };

  // Get recommendation text - mỗi buổi = 1 tiết
  const getSessionsRecommendation = (credits: number): string => {
    const sessions = calculateSessionsPerWeek(credits);
    return `${sessions} buổi/tuần`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted with data:', formData);
    
    // Convert numberOfStudents to number
    const numberOfStudents = typeof formData.numberOfStudents === 'string' 
      ? parseInt(formData.numberOfStudents) || 50 
      : formData.numberOfStudents;
    
    // Kiểm tra trùng môn học cho cùng một lớp
    if (!editingClass) {
      const duplicateClass = classes.find(
        c => c.name.toLowerCase() === formData.name.toLowerCase() && 
             c.subjectId === formData.subjectId
      );
      if (duplicateClass) {
        const subject = subjects.find(s => s.id === formData.subjectId);
        const subjectName = subject ? `${subject.code} - ${subject.name}` : 'môn học này';
        toast.error(`Lớp "${formData.name}" đã có ${subjectName} rồi! Vui lòng chọn môn học khác.`);
        return;
      }
    } else {
      // Khi sửa, kiểm tra không trùng với các lớp khác
      const duplicateClass = classes.find(
        c => c.id !== editingClass.id && 
             c.name.toLowerCase() === formData.name.toLowerCase() && 
             c.subjectId === formData.subjectId
      );
      if (duplicateClass) {
        const subject = subjects.find(s => s.id === formData.subjectId);
        const subjectName = subject ? `${subject.code} - ${subject.name}` : 'môn học này';
        toast.error(`Lớp "${formData.name}" đã có ${subjectName} rồi! Vui lòng chọn môn học khác.`);
        return;
      }
    }
    
    try {
      if (editingClass) {
        const updateData = {
          name: formData.name,
          subjectId: formData.subjectId,
          numberOfStudents,
          roomType: formData.roomType,
          teacherId: formData.teacherId || '',
          sessionsPerWeek: formData.sessionsPerWeek,
        };
        console.log('Updating class with:', updateData);
        await updateClass(editingClass.id, updateData);
        toast.success('Cập nhật lớp học thành công!');
      } else {
        const createData = {
          name: formData.name,
          subjectId: formData.subjectId,
          numberOfStudents,
          roomType: formData.roomType,
          teacherId: formData.teacherId || '',
          sessionsPerWeek: formData.sessionsPerWeek,
        };
        console.log('Creating class with:', createData);
        await addClass(createData);
        toast.success('Thêm lớp học thành công!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error toast is handled in DataContext
      console.error('Submit error:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subjectId: '',
      teacherId: '',
      numberOfStudents: 50,
      sessionsPerWeek: 2,
      roomType: 'theory' as 'theory' | 'lab' | 'both',
    });
    setEditingClass(null);
  };

  const handleEdit = (classItem: Class) => {
    console.log('Editing class:', classItem);
    setEditingClass(classItem);
    const editFormData = {
      name: classItem.name,
      subjectId: classItem.subjectId,
      teacherId: classItem.teacherId || '',
      numberOfStudents: classItem.numberOfStudents || 50,
      sessionsPerWeek: classItem.sessionsPerWeek || 2,
      roomType: classItem.roomType || 'theory' as 'theory' | 'lab' | 'both',
    };
    console.log('Form data set to:', editFormData);
    setFormData(editFormData);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('class.delete.confirm'))) {
      try {
        await deleteClass(id);
        toast.success('Xóa lớp học thành công!');
      } catch (error) {
        // Error toast is handled in DataContext
      }
    }
  };

  const filteredClasses = classes.filter((classItem) => {
    const subject = subjects.find((s) => s.id === classItem.subjectId);
    const searchLower = searchTerm.toLowerCase();
    return (
      classItem.name.toLowerCase().includes(searchLower) ||
      (subject && subject.code.toLowerCase().includes(searchLower)) ||
      (subject && subject.name.toLowerCase().includes(searchLower))
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('class.title')}</CardTitle>
          <CardDescription>{t('class.description')}</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open: boolean) => {
          setIsDialogOpen(open);
          if (!open) {
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} style={{ backgroundColor: '#003d82' }}>
              <Plus className="mr-2 h-4 w-4" />
              {t('class.add')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingClass ? t('class.edit') : t('class.add.new')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('class.name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="VD: Lớp Kỹ thuật phần mềm K18"
                />
              </div>
              <div>
                <Label htmlFor="subject">{t('class.subject')} *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(value: string) => {
                    const subject = subjects.find(s => s.id === value);
                    const recommendedSessions = subject ? calculateSessionsPerWeek(subject.credits) : 2;
                    setFormData({ 
                      ...formData, 
                      subjectId: value,
                      sessionsPerWeek: recommendedSessions 
                    });
                    setSubjectSearchTerm('');
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('class.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent className="p-0">
                    <div className="sticky top-0 z-10 bg-white border-b p-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Tìm kiếm môn học..."
                          value={subjectSearchTerm}
                          onChange={(e) => setSubjectSearchTerm(e.target.value)}
                          className="h-9 pl-10"
                        />
                      </div>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {subjects
                        .filter(subject => 
                          subjectSearchTerm === '' ||
                          subject.code.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                          subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
                        )
                        .map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.code} - {subject.name}
                          </SelectItem>
                        ))}
                      {subjects.filter(subject => 
                        subjectSearchTerm === '' ||
                        subject.code.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                        subject.name.toLowerCase().includes(subjectSearchTerm.toLowerCase())
                      ).length === 0 && (
                        <div className="py-6 text-center text-sm text-gray-500">
                          Không tìm thấy môn học
                        </div>
                      )}
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sessionsPerWeek">Số buổi/tuần *</Label>
                <Input
                  id="sessionsPerWeek"
                  type="number"
                  min="1"
                  max="5"
                  value={formData.sessionsPerWeek}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 1 && value <= 5) {
                      setFormData({ ...formData, sessionsPerWeek: value });
                    }
                  }}
                  required
                />
                {formData.subjectId && (() => {
                  const subject = subjects.find(s => s.id === formData.subjectId);
                  if (subject) {
                    const recommended = calculateSessionsPerWeek(subject.credits);
                    const min = Math.max(1, recommended - 1);
                    const max = recommended + 1;
                    return (
                      <p className="text-xs text-blue-600 mt-1">
                        {subject.credits} tín chỉ: {recommended} buổi/tuần (cho phép {min}-{max} buổi)
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              <div>
                <Label htmlFor="numberOfStudents">{t('class.students')}</Label>
                <Input
                  id="numberOfStudents"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.numberOfStudents}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty string while typing
                    if (value === '') {
                      setFormData({ ...formData, numberOfStudents: '' as any });
                    } else {
                      const newValue = parseInt(value);
                      // Only update if valid number
                      if (!isNaN(newValue)) {
                        // Clamp value between 1 and 200
                        const clampedValue = Math.max(1, Math.min(200, newValue));
                        setFormData({ ...formData, numberOfStudents: clampedValue });
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // Set default value if empty on blur
                    if (e.target.value === '' || e.target.value === '0') {
                      setFormData({ ...formData, numberOfStudents: 50 });
                    } else {
                      // Ensure value is within range on blur
                      const value = parseInt(e.target.value);
                      if (!isNaN(value)) {
                        const clampedValue = Math.max(1, Math.min(200, value));
                        setFormData({ ...formData, numberOfStudents: clampedValue });
                      }
                    }
                  }}
                  onKeyPress={(e) => {
                    // Prevent entering non-numeric characters
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  required
                  placeholder="Nhập số sinh viên (mặc định: 50)"
                />
                {typeof formData.numberOfStudents === 'number' && 
                 (formData.numberOfStudents < 1 || formData.numberOfStudents > 200) && (
                  <p className="text-xs text-red-500 mt-1">
                    Số sinh viên phải từ 1 đến 200
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="roomType">Loại phòng *</Label>
                <Select
                  value={formData.roomType}
                  onValueChange={(value: 'theory' | 'lab' | 'both') => 
                    setFormData({ ...formData, roomType: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại phòng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Lý thuyết</SelectItem>
                    <SelectItem value="lab">Thực hành</SelectItem>
                    <SelectItem value="both">Cả hai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" style={{ backgroundColor: '#003d82' }}>
                {editingClass ? t('common.update') : t('common.add')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">{t('class.stt')}</TableHead>
              <TableHead>{t('class.name')}</TableHead>
              <TableHead>{t('class.subject')}</TableHead>
              <TableHead className="text-center">{t('class.students')}</TableHead>
              <TableHead className="text-center">Số buổi/tuần</TableHead>
              <TableHead className="text-center">Loại phòng</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((classItem, index) => {
              const subject = subjects.find((s) => s.id === classItem.subjectId);
              const getRoomTypeLabel = (type?: string) => {
                switch (type) {
                  case 'theory': return 'Lý thuyết';
                  case 'lab': return 'Thực hành';
                  case 'both': return 'Cả hai';
                  default: return 'Lý thuyết';
                }
              };
              return (
                <TableRow key={classItem.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{subject ? `${subject.code} - ${subject.name}` : 'N/A'}</TableCell>
                  <TableCell className="text-center">{classItem.numberOfStudents}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-50 text-green-700">
                      {classItem.sessionsPerWeek || 2} buổi
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700">
                      {getRoomTypeLabel(classItem.roomType)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(classItem)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(classItem.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
            )}
          </TableBody>
        </Table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Tổng số: {filteredClasses.length} lớp học
        </div>
      </CardContent>
    </Card>
  );
};