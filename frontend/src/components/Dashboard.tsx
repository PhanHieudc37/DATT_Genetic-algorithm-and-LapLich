import React from 'react';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, BookOpen, DoorOpen, GraduationCap, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { teachers, subjects, rooms, classes } = useData();

  const stats = [
    {
      title: 'Giảng viên',
      value: teachers.length,
      icon: Users,
      description: 'Tổng số giảng viên',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Môn học',
      value: subjects.length,
      icon: BookOpen,
      description: 'Tổng số môn học',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Phòng học',
      value: rooms.length,
      icon: DoorOpen,
      description: 'Tổng số phòng học',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Lớp học',
      value: classes.length,
      icon: GraduationCap,
      description: 'Tổng số lớp học',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  const totalStudents = classes.reduce((sum, c) => sum + c.numberOfStudents, 0);
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
  const utilizationRate = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2">Hệ thống Lập lịch Thời khóa biểu</h2>
        <p className="text-gray-600">
          Sử dụng Thuật toán Di truyền để tối ưu hóa lịch học tự động
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{stat.value}</div>
                <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan</CardTitle>
            <CardDescription>Thông tin tổng hợp về hệ thống</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng số sinh viên:</span>
              <span>{totalStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tổng sức chứa phòng:</span>
              <span>{totalCapacity}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tỷ lệ sử dụng:</span>
              <span>{utilizationRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Trung bình SV/lớp:</span>
              <span>
                {classes.length > 0 ? Math.round(totalStudents / classes.length) : 0}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hướng dẫn sử dụng</CardTitle>
            <CardDescription>Các bước để tạo thời khóa biểu</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 list-decimal list-inside">
              <li className="text-sm">
                Quản lý dữ liệu: Thêm giảng viên, môn học, phòng học, và lớp học
              </li>
              <li className="text-sm">
                Cấu hình thuật toán: Điều chỉnh các tham số GA phù hợp
              </li>
              <li className="text-sm">Chạy thuật toán: Bắt đầu quá trình tối ưu hóa</li>
              <li className="text-sm">
                Xem kết quả: Kiểm tra thời khóa biểu được tạo ra
              </li>
              <li className="text-sm">
                Tinh chỉnh: Điều chỉnh dữ liệu hoặc tham số nếu cần
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Về Thuật toán Di truyền</CardTitle>
          <CardDescription>
            Giải thích ngắn gọn về cách hoạt động của thuật toán
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-700">
            <strong>Thuật toán Di truyền (Genetic Algorithm)</strong> là một phương pháp tối
            ưu hóa lấy cảm hứng từ quá trình tiến hóa tự nhiên. Thuật toán hoạt động
            thông qua các bước:
          </p>
          <ul className="space-y-2 list-disc list-inside text-sm text-gray-700">
            <li>
              <strong>Khởi tạo quần thể:</strong> Tạo ngẫu nhiên một tập hợp các lịch học
              ban đầu
            </li>
            <li>
              <strong>Đánh giá fitness:</strong> Đo lường chất lượng của mỗi lịch học dựa
              trên các ràng buộc (không xung đột phòng, giảng viên, v.v.)
            </li>
            <li>
              <strong>Chọn lọc:</strong> Chọn các lịch học tốt nhất để tạo thế hệ mới
            </li>
            <li>
              <strong>Lai ghép (Crossover):</strong> Kết hợp hai lịch học để tạo lịch học
              mới
            </li>
            <li>
              <strong>Đột biến (Mutation):</strong> Thay đổi ngẫu nhiên một số phần của
              lịch học để tăng tính đa dạng
            </li>
            <li>
              <strong>Lặp lại:</strong> Tiếp tục quá trình qua nhiều thế hệ cho đến khi đạt
              được lịch học tối ưu
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
