import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Teacher } from '../types';
import { toast } from 'sonner';

const DEPARTMENTS = [
  'Khoa Xây dựng Dân dụng và Công nghiệp',
  'Khoa Kiến trúc và Quy hoạch',
  'Khoa Kinh tế và Quản lý Xây dựng',
  'Khoa Cầu đường',
  'Khoa Kỹ thuật Môi trường',
  'Khoa Cơ khí Xây dựng',
  'Khoa Công nghệ Thông tin',
  'Khoa Vật liệu Xây dựng',
];

export const TeachersManager: React.FC = () => {
  const { teachers, subjects, addTeacher, updateTeacher, deleteTeacher } = useData();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    teacherCode: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    department: '',
    subjects: [] as string[],
    unavailableDays: [] as number[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${formData.lastName} ${formData.firstName}`;
    
    console.log('TeachersManager - handleSubmit called');
    console.log('Form data:', formData);
    console.log('Editing teacher:', editingTeacher);
    
    // Kiểm tra trùng mã giảng viên
    if (!editingTeacher) {
      // Khi thêm mới: không được trùng với bất kỳ giảng viên nào
      const duplicateTeacher = teachers.find(
        t => t.teacherCode.toLowerCase() === formData.teacherCode.toLowerCase()
      );
      if (duplicateTeacher) {
        toast.error(`Mã giảng viên "${formData.teacherCode}" đã tồn tại! Vui lòng chọn mã khác.`);
        return;
      }
    } else {
      // Khi chỉnh sửa: không được trùng với giảng viên khác (trừ chính mình)
      const duplicateTeacher = teachers.find(
        t => t.id !== editingTeacher.id && 
             t.teacherCode.toLowerCase() === formData.teacherCode.toLowerCase()
      );
      if (duplicateTeacher) {
        toast.error(
          `Mã giảng viên "${formData.teacherCode}" đã được sử dụng bởi giảng viên "${duplicateTeacher.name}"! ` +
          `Vui lòng chọn mã khác.`
        );
        return;
      }
    }
    
    try {
      if (editingTeacher) {
        console.log('Updating teacher:', editingTeacher.id);
        
        // Only include password if user entered a new one
        const updateData: any = {
          teacherCode: formData.teacherCode,
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          department: formData.department,
          subjects: formData.subjects,
          unavailableDays: formData.unavailableDays,
        };
        
        // Only add password if user wants to change it
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }
        
        await updateTeacher(editingTeacher.id, updateData);
        console.log('Teacher updated successfully');
        toast.success('Cập nhật giảng viên thành công!');
      } else {
        console.log('Creating new teacher');
        // Don't include id when creating
        const newTeacherData = {
          teacherCode: formData.teacherCode,
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          name: fullName,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          department: formData.department,
          subjects: formData.subjects,
          unavailableDays: formData.unavailableDays,
        };
        console.log('Sending teacher data:', newTeacherData);
        await addTeacher(newTeacherData);
        console.log('Teacher created successfully');
        toast.success('Thêm giảng viên thành công!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      // Error toast is handled in DataContext
    }
  };

  const resetForm = () => {
    setFormData({
      teacherCode: '',
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      address: '',
      department: '',
      subjects: [],
      unavailableDays: [],
    });
    setEditingTeacher(null);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      teacherCode: teacher.teacherCode,
      username: teacher.username,
      password: '', // Leave empty when editing - user can optionally change it
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone,
      email: teacher.email,
      address: teacher.address,
      department: teacher.department,
      subjects: teacher.subjects,
      unavailableDays: teacher.unavailableDays || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('teacher.delete.confirm'))) {
      try {
        await deleteTeacher(id);
        toast.success('Xóa giảng viên thành công!');
      } catch (error) {
        // Error toast is handled in DataContext
      }
    }
  };

  const filteredTeachers = teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.teacherCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('teacher.title')}</CardTitle>
          <CardDescription>{t('teacher.description')}</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-[#003d82] hover:bg-[#002952]">
              <Plus className="mr-2 h-4 w-4" />
              {t('teacher.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTeacher ? t('teacher.edit') : t('teacher.add.new')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="teacherCode">{t('teacher.code')} *</Label>
                  <Input
                    id="teacherCode"
                    value={formData.teacherCode}
                    onChange={(e) => setFormData({ ...formData, teacherCode: e.target.value })}
                    placeholder="VD: GV001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">{t('teacher.username')} *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="VD: nguyenvana"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">
                  {t('teacher.password')} {editingTeacher ? '' : '*'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingTeacher ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"}
                  required={!editingTeacher}
                />
                {editingTeacher && (
                  <p className="text-xs text-gray-500 mt-1">
                    * Chỉ nhập mật khẩu mới nếu bạn muốn thay đổi
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lastName">{t('teacher.lastName')} *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="VD: Nguyễn Văn"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="firstName">{t('teacher.firstName')} *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="VD: A"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">{t('teacher.phone')} *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0123456789"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('teacher.email')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="VD: email@nuce.edu.vn"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">{t('teacher.address')} *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="VD: Hà Nội"
                  required
                />
              </div>

              <div>
                <Label htmlFor="department">{t('teacher.department')} *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value: string) => {
                    // Reset subjects when department changes
                    setFormData({ ...formData, department: value, subjects: [] });
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn bộ môn" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('teacher.subjects')}</Label>
                {formData.department ? (
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border rounded-md p-3">
                    {subjects
                      .filter((subject) => subject.department === formData.department)
                      .map((subject) => (
                        <label key={subject.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(subject.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  subjects: [...formData.subjects, subject.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  subjects: formData.subjects.filter((id) => id !== subject.id),
                                });
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm">{subject.code} - {subject.name}</span>
                        </label>
                      ))}
                    {subjects.filter((subject) => subject.department === formData.department).length === 0 && (
                      <p className="text-sm text-gray-500 col-span-2 text-center py-4">
                        Không có môn học nào cho bộ môn này
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-2 border rounded-md p-4 bg-gray-50">
                    <p className="text-sm text-gray-500 text-center">
                      Vui lòng chọn bộ môn trước
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label>Ngày Bận</Label>
                <div className="grid grid-cols-3 gap-2 mt-2 border rounded-md p-3">
                  {[
                    { value: 0, label: 'Thứ 2' },
                    { value: 1, label: 'Thứ 3' },
                    { value: 2, label: 'Thứ 4' },
                    { value: 3, label: 'Thứ 5' },
                    { value: 4, label: 'Thứ 6' },
                    { value: 5, label: 'Thứ 7' },
                  ].map((day) => (
                    <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.unavailableDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              unavailableDays: [...formData.unavailableDays, day.value].sort(),
                            });
                          } else {
                            setFormData({
                              ...formData,
                              unavailableDays: formData.unavailableDays.filter((d) => d !== day.value),
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  * Chọn các ngày mà giảng viên không thể dạy (ví dụ: nghỉ phép, họp...)
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-[#003d82] hover:bg-[#002952]">
                  {editingTeacher ? t('common.update') : t('common.add')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  {t('common.cancel')}
                </Button>
              </div>
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
              <TableRow className="bg-[#003d82]/5">
                <TableHead>{t('teacher.code')}</TableHead>
                <TableHead>{t('teacher.fullName')}</TableHead>
                <TableHead>{t('teacher.email')}</TableHead>
                <TableHead>{t('teacher.phone')}</TableHead>
                <TableHead>{t('teacher.department')}</TableHead>
                <TableHead>{t('teacher.subjects.list')}</TableHead>
                <TableHead className="text-center">Ngày Bận</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredTeachers.map((teacher) => {
                  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                  const unavailableDaysText = teacher.unavailableDays && teacher.unavailableDays.length > 0
                    ? teacher.unavailableDays.map(d => dayNames[d]).join(', ')
                    : '-';
                  
                  return (
                    <TableRow key={teacher.id} className="hover:bg-gray-50">
                      <TableCell>{teacher.teacherCode}</TableCell>
                      <TableCell>{teacher.name}</TableCell>
                      <TableCell>{teacher.email}</TableCell>
                      <TableCell>{teacher.phone}</TableCell>
                      <TableCell>{teacher.department}</TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {teacher.subjects
                            .map((subId) => subjects.find((s) => s.id === subId)?.code)
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={teacher.unavailableDays && teacher.unavailableDays.length > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
                          {unavailableDaysText}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(teacher)}
                            className="hover:bg-blue-50 hover:text-[#003d82]"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(teacher.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Tổng số: {filteredTeachers.length} giảng viên
        </div>
      </CardContent>
    </Card>
  );
};
