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
import { Subject } from '../types';
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

export const SubjectsManager: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject } = useData();
  const { t } = useLanguage();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 3,
    department: '',
    requiredHours: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra trùng mã môn học
    if (!editingSubject) {
      // Khi thêm mới: không được trùng với bất kỳ môn nào
      const duplicateSubject = subjects.find(
        s => s.code.toLowerCase() === formData.code.toLowerCase()
      );
      if (duplicateSubject) {
        toast.error(`Mã môn học "${formData.code}" đã tồn tại! Vui lòng chọn mã khác.`);
        return;
      }
    } else {
      // Khi chỉnh sửa: không được trùng với môn khác (trừ chính nó)
      const duplicateSubject = subjects.find(
        s => s.id !== editingSubject.id && 
             s.code.toLowerCase() === formData.code.toLowerCase()
      );
      if (duplicateSubject) {
        toast.error(
          `Mã môn học "${formData.code}" đã được sử dụng bởi môn "${duplicateSubject.name}"! ` +
          `Vui lòng chọn mã khác.`
        );
        return;
      }
    }
    
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData);
        toast.success('Cập nhật môn học thành công!');
      } else {
        // Don't include id when creating
        await addSubject({
          name: formData.name,
          code: formData.code,
          credits: formData.credits,
          department: formData.department,
          requiredHours: formData.requiredHours,
        });
        toast.success('Thêm môn học thành công!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error toast is handled in DataContext
      console.error('Submit error:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', credits: 3, department: '', requiredHours: 3 });
    setEditingSubject(null);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      department: subject.department,
      requiredHours: subject.requiredHours,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(t('subject.delete.confirm'))) {
      try {
        await deleteSubject(id);
        toast.success('Xóa môn học thành công!');
      } catch (error) {
        // Error toast is handled in DataContext
      }
    }
  };

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('subject.title')}</CardTitle>
          <CardDescription>{t('subject.description')}</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="bg-[#003d82] hover:bg-[#002952]">
              <Plus className="mr-2 h-4 w-4" />
              {t('subject.add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? t('subject.edit') : t('subject.add.new')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('subject.name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: Cấu trúc dữ liệu và giải thuật"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="code">{t('subject.code')} *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VD: CS101"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="credits">{t('subject.credits')} *</Label>
                <Input
                  id="credits"
                  type="number"
                  min="1"
                  max="15"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="department">{t('subject.department')} *</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value: string) => setFormData({ ...formData, department: value })}
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

              <div className="flex gap-2 pt-4">
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
                <Button type="submit" className="flex-1 bg-[#003d82] hover:bg-[#002952]">
                  {editingSubject ? t('common.update') : t('common.add')}
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
                <TableHead className="text-center">{t('subject.code')}</TableHead>
                <TableHead className="text-center">{t('subject.name')}</TableHead>
                <TableHead className="text-center">{t('subject.credits')}</TableHead>
                <TableHead className="text-center">{t('subject.department')}</TableHead>
                <TableHead className="text-center">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    Không có dữ liệu
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject) => (
                  <TableRow key={subject.id} className="hover:bg-gray-50">
                    <TableCell className="text-center">{subject.code}</TableCell>
                    <TableCell className="text-center">{subject.name}</TableCell>
                    <TableCell className="text-center">{subject.credits}</TableCell>
                    <TableCell className="text-center">{subject.department}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(subject)}
                          className="hover:bg-blue-50 hover:text-[#003d82]"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(subject.id)}
                          className="hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Tổng số: {filteredSubjects.length} môn học
        </div>
      </CardContent>
    </Card>
  );
};
