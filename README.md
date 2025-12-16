# Hệ Thống Xếp Thời Khóa Biểu Sử Dụng Thuật Toán Di Truyền

## Tổng Quan Dự Án

Dự án này là một hệ thống quản lý và tối ưu hóa thời khóa biểu cho trường đại học, sử dụng **Thuật toán di truyền (Genetic Algorithm)** để tự động xếp lịch học tối ưu.

### Mục Tiêu
- Tự động hóa việc xếp thời khóa biểu cho các lớp học
- Tối ưu hóa việc phân bổ phòng học, giảng viên và thời gian
- Giảm thiểu xung đột lịch dạy và tối đa hóa hiệu quả sử dụng tài nguyên
- Cung cấp giao diện thân thiện cho các vai trò khác nhau trong trường

### Đặc Điểm Nổi Bật
- 🧬 **Thuật toán di truyền tiên tiến**: Tối ưu hóa thời khóa biểu với hàm fitness đa tiêu chí
- 🎯 **Xử lý ràng buộc thông minh**: Tự động giải quyết xung đột phòng học, giảng viên
- 👥 **Đa vai trò người dùng**: Hỗ trợ Trưởng bộ môn, Giáo vụ, Trưởng khoa, Giảng viên
- 📊 **Theo dõi hiệu suất**: Biểu đồ fitness, thống kê thế hệ
- 🔄 **Tối ưu hóa liên tục**: Adaptive restart, elitism

## Công Nghệ Sử Dụng

### Backend
- **FastAPI**: Web framework hiện đại và nhanh
- **SQLAlchemy**: ORM cho Python với hỗ trợ async
- **SQLite**: Database nhẹ, phù hợp cho demo
- **Pydantic**: Validation dữ liệu
- **JWT**: Authentication và authorization
- **Uvicorn**: ASGI server

### Frontend  
- **React 18**: Library UI hiện đại
- **TypeScript**: Type safety
- **Vite**: Build tool nhanh
- **Tailwind CSS**: Styling utility-first
- **Radix UI**: Component library
- **Recharts**: Biểu đồ và visualization
- **Sonner**: Toast notifications

### Thuật Toán
- **Genetic Algorithm**: Tối ưu hóa thời khóa biểu
- **Tournament Selection**: Chọn lọc cá thể
- **Uniform Crossover**: Lai ghép
- **Smart Mutation**: Đột biến thông minh

## Cấu Trúc Dự Án

```
├── backend/                    # Backend API
│   ├── app/
│   │   ├── api/v1/            # API routes
│   │   ├── core/              # Business logic
│   │   │   └── genetic_algorithm.py  # Thuật toán di truyền
│   │   ├── models/            # Database models
│   │   ├── schemas/           # Pydantic schemas
│   │   └── utils/             # Utilities
│   ├── requirements.txt       # Python dependencies
│   └── README.md             # Backend documentation
├── frontend/                  # Frontend React
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── contexts/          # Context providers
│   │   ├── lib/              # API client
│   │   └── types/            # TypeScript types
│   ├── package.json          # Node dependencies
│   └── README.md            # Frontend documentation
├── 1_start_backend.bat       # Script chạy backend
├── 2_start_tunnel.bat        # Script tạo tunnel (optional)
├── 3_start_frontend.bat      # Script chạy frontend
└── README.md                 # Tài liệu chính
```

## Cách Chạy Dự Án

### Yêu Cầu Hệ Thống
- Python 3.8+ 
- Node.js 16+
- npm hoặc yarn

### Chạy Nhanh (Recommended)
1. **Chạy Backend**:
   ```bash
   # Double-click hoặc chạy file
   1_start_backend.bat
   ```

2. **Chạy Frontend** (terminal khác):
   ```bash
   # Double-click hoặc chạy file  
   3_start_frontend.bat
   ```

3. **Truy cập ứng dụng**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Chạy Thủ Công

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Tài Khoản Mặc Định

Hệ thống có sẵn các tài khoản demo:

| Vai trò | Username | Password | Quyền hạn |
|---------|----------|----------|-----------|
| Trưởng bộ môn | tbm | 123456 | Quản lý đầy đủ |
| Giáo vụ | giaovu | 123456 | Quản lý lịch, phòng |
| Trưởng khoa | truongkhoa | 123456 | Xem báo cáo |
| Giảng viên | giangvien | 123456 | Xem lịch cá nhân |

## Hướng Dẫn Sử Dụng

### 1. Quản Lý Dữ Liệu Cơ Bản
- **Giảng viên**: Thêm/sửa/xóa giảng viên, thiết lập ngày không rảnh
- **Môn học**: Quản lý danh sách môn học
- **Phòng học**: Thêm phòng với loại (lý thuyết/thực hành) và sức chứa
- **Lớp học**: Tạo lớp với môn học, số sinh viên, số tiết/tuần

### 2. Chạy Thuật Toán Di Truyền
- Vào tab "Thuật toán di truyền"
- Điều chỉnh tham số (nếu cần):
  - Kích thước quần thể: 200-300
  - Tỉ lệ đột biến: 0.1-0.2  
  - Tỉ lệ lai ghép: 0.7-0.9
  - Số thế hệ tối đa: 200-300
- Nhấn "Chạy thuật toán"
- Theo dõi tiến độ qua biểu đồ fitness
- Lưu kết quả với tên thời khóa biểu

### 3. Xem Kết Quả
- Tab "Xem thời khóa biểu" hiển thị lịch theo tuần
- Thống kê vi phạm và điểm fitness
- So sánh nhiều phiên bản thời khóa biểu

## Chi Tiết Thuật Toán Di Truyền

### Nguyên Lý
Thuật toán mô phỏng quá trình tiến hóa tự nhiên để tìm thời khóa biểu tối ưu:
1. **Khởi tạo**: Tạo quần thể các thời khóa biểu ngẫu nhiên
2. **Đánh giá**: Tính điểm thích nghi (fitness) cho mỗi cá thể
3. **Chọn lọc**: Chọn cá thể tốt nhất để sinh sản
4. **Lai ghép**: Kết hợp gen của cha mẹ tạo con
5. **Đột biến**: Thay đổi ngẫu nhiên để tăng đa dạng
6. **Lặp lại** cho đến khi đạt điều kiện dừng

### Hàm Fitness
Đánh giá chất lượng thời khóa biểu dựa trên:

**Ràng buộc cứng (Hard Constraints)**:
- Không xung đột phòng học
- Không xung đột giảng viên  
- Không xung đột lớp học
- Phòng đủ sức chứa
- Giảng viên có sẵn theo ngày

**Ràng buộc mềm (Soft Constraints)**:
- Phân bố đều trong tuần
- Tránh giờ xấu (sáng sớm, tối muộn)
- Cân bằng khối lượng giảng viên
- Tránh dạy liên tiếp quá nhiều

### Tối Ưu Hóa
- **Tournament Selection**: Chọn lọc cạnh tranh
- **Elitism**: Giữ lại cá thể tốt nhất
- **Adaptive Restart**: Tự động khởi động lại khi bị kẹt
- **Smart Mutation**: Đột biến thông minh theo ràng buộc

## Kiến Trúc Hệ Thống

### Database Schema
- **users**: Tài khoản người dùng
- **teachers**: Thông tin giảng viên
- **subjects**: Môn học  
- **rooms**: Phòng học
- **classes**: Lớp học
- **timetables**: Thời khóa biểu được tạo
- **schedule_genes**: Chi tiết lịch học

### API Endpoints
- `/api/v1/auth/*`: Authentication
- `/api/v1/teachers/*`: Quản lý giảng viên
- `/api/v1/subjects/*`: Quản lý môn học
- `/api/v1/rooms/*`: Quản lý phòng học
- `/api/v1/classes/*`: Quản lý lớp học
- `/api/v1/genetic/*`: Thuật toán di truyền

### Frontend Architecture  
- **Context API**: Quản lý state toàn cục
- **Component-based**: Tái sử dụng cao
- **TypeScript**: Type safety
- **Responsive Design**: Tương thích mobile

## Tính Năng Đặc Biệt

### 1. Tối Ưu Hóa Giảng Viên
- Tự động cân bằng khối lượng giảng dạy
- Tôn trọng lịch không rảnh của giảng viên
- Ưu tiên giảng viên phù hợp nhất cho môn

### 2. Quản Lý Phòng Học Thông Minh
- Phân loại phòng lý thuyết/thực hành
- Tối ưu sức chứa
- Luân phiên sử dụng để cân bằng

### 3. UI/UX Thân Thiện
- Dashboard riêng cho từng vai trò
- Biểu đồ trực quan tiến độ thuật toán  
- Toast notification và loading states
- Responsive design

## Hạn Chế và Hướng Phát Triển

### Hạn Chế Hiện Tại
- Chỉ hỗ trợ SQLite (không phù hợp production lớn)
- Chưa có tính năng backup/restore
- Thuật toán chưa song song hóa

### Hướng Phát Triển
- Hỗ trợ PostgreSQL/MySQL
- Cải tiến thuật toán với GPU computing
- Thêm tính năng export Excel/PDF
- Mobile app
- Multi-campus support

## Đóng Góp

Dự án này được phát triển cho mục đích nghiên cứu và học tập. Mọi đóng góp và phản hồi đều được hoan nghênh.

## License

Dự án này sử dụng MIT License - xem file [LICENSE](LICENSE) để biết chi tiết.

---

**Tác giả**: Phan Văn Hiếu
**Trường**: [Tên trường]  
**Ngành**: Công nghệ thông tin  
**Năm**: 2024
