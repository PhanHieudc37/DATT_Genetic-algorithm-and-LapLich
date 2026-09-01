import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Room } from '../types';
import { toast } from 'sonner';

export const RoomsManager: React.FC = () => {
  const { rooms, addRoom, updateRoom, deleteRoom } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    capacity: 50,
    type: 'theory' as 'theory' | 'lab' | 'both',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra trùng tên phòng học
    if (!editingRoom) {
      // Khi thêm mới: không được trùng với bất kỳ phòng nào
      const duplicateRoom = rooms.find(
        r => r.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (duplicateRoom) {
        toast.error(`Tên phòng học "${formData.name}" đã tồn tại! Vui lòng chọn tên khác.`);
        return;
      }
    } else {
      // Khi chỉnh sửa: không được trùng với phòng khác (trừ chính mình)
      const duplicateRoom = rooms.find(
        r => r.id !== editingRoom.id && 
             r.name.toLowerCase() === formData.name.toLowerCase()
      );
      if (duplicateRoom) {
        toast.error(
          `Tên phòng học "${formData.name}" đã được sử dụng! ` +
          `Vui lòng chọn tên khác.`
        );
        return;
      }
    }
    
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, formData);
        toast.success('Cập nhật phòng học thành công!');
      } else {
        // Don't include id when creating
        await addRoom({
          name: formData.name,
          capacity: formData.capacity,
          type: formData.type,
        });
        toast.success('Thêm phòng học thành công!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      // Error toast is handled in DataContext
      console.error('Submit error:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', capacity: 50, type: 'theory' });
    setEditingRoom(null);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      type: room.type,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phòng học này?')) {
      try {
        await deleteRoom(id);
        toast.success('Xóa phòng học thành công!');
      } catch (error) {
        // Error toast is handled in DataContext
      }
    }
  };

  const getRoomTypeLabel = (type: string) => {
    switch (type) {
      case 'theory':
        return 'Lý thuyết';
      case 'lab':
        return 'Thực hành';
      case 'both':
        return 'Cả hai';
      default:
        return type;
    }
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoomTypeLabel(room.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.capacity.toString().includes(searchTerm)
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Quản lý Phòng học</CardTitle>
          <CardDescription>Danh sách tất cả phòng học trong hệ thống</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm phòng học
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? 'Chỉnh sửa phòng học' : 'Thêm phòng học mới'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Tên phòng</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="capacity">Sức chứa</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="10"
                  max="200"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Loại phòng</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'theory' | 'lab' | 'both') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Lý thuyết</SelectItem>
                    <SelectItem value="lab">Thực hành</SelectItem>
                    <SelectItem value="both">Cả hai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                {editingRoom ? 'Cập nhật' : 'Thêm'}
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
              placeholder="Tìm kiếm theo tên phòng, loại phòng hoặc sức chứa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-center">Tên phòng</TableHead>
              <TableHead className="text-center">Sức chứa</TableHead>
              <TableHead className="text-center">Loại phòng</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell className="text-center">{room.name}</TableCell>
                <TableCell className="text-center">{room.capacity}</TableCell>
                <TableCell className="text-center">{getRoomTypeLabel(room.type)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(room)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(room.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 text-sm text-gray-600">
          {searchTerm ? (
            <>
              Hiển thị: {filteredRooms.length} / {rooms.length} phòng học
            </>
          ) : (
            <>Tổng số: {rooms.length} phòng học</>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
