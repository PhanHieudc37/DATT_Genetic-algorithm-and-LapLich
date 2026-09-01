# Timetable Genetic Algorithm Backend

Backend API cho hệ thống xếp thời khóa biểu sử dụng giải thuật di truyền (Genetic Algorithm).

## Công nghệ sử dụng

- **FastAPI**: Framework web hiện đại, nhanh chóng
- **SQLAlchemy**: ORM để tương tác với database
- **SQLite**: Database nhẹ, dễ triển khai
- **Pydantic**: Validation và serialization
- **JWT**: Authentication và Authorization

## Cấu trúc thư mục

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Entry point
│   ├── config.py              # Configuration
│   ├── database.py            # Database connection
│   ├── api/                   # API routes
│   │   ├── __init__.py
│   │   ├── deps.py           # Dependencies
│   │   └── v1/               # API version 1
│   │       ├── __init__.py
│   │       ├── auth.py       # Authentication endpoints
│   │       ├── teachers.py   # Teacher CRUD
│   │       ├── subjects.py   # Subject CRUD
│   │       ├── rooms.py      # Room CRUD
│   │       ├── classes.py    # Class CRUD
│   │       └── genetic.py    # Genetic Algorithm endpoints
│   ├── models/               # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── teacher.py
│   │   ├── subject.py
│   │   ├── room.py
│   │   ├── class_model.py
│   │   └── timetable.py
│   ├── schemas/              # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── teacher.py
│   │   ├── subject.py
│   │   ├── room.py
│   │   ├── class_schema.py
│   │   ├── timetable.py
│   │   └── genetic.py
│   ├── core/                 # Core functionality
│   │   ├── __init__.py
│   │   ├── security.py      # Password hashing, JWT
│   │   └── genetic_algorithm.py  # GA implementation
│   └── utils/               # Utilities
│       ├── __init__.py
│       └── seed_data.py     # Initial data seeding
├── alembic/                 # Database migrations
├── tests/                   # Unit tests
├── .env                     # Environment variables
├── .env.example
├── requirements.txt
└── README.md
```

## Cài đặt

1. Tạo virtual environment:
```bash
python -m venv venv
```

2. Kích hoạt virtual environment:

Windows (PowerShell):
```powershell
.\venv\Scripts\Activate.ps1
```

Windows (CMD):
```cmd
.\venv\Scripts\activate.bat
```

Linux/Mac:
```bash
source venv/bin/activate
```

3. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

4. Tạo file .env từ .env.example và cập nhật các giá trị

5. Khởi tạo database:
```bash
python -m app.utils.seed_data
```

## Chạy server

Development mode:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Production mode:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Documentation

Sau khi chạy server, truy cập:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/logout` - Đăng xuất
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

### Teachers
- `GET /api/v1/teachers` - Lấy danh sách giảng viên
- `POST /api/v1/teachers` - Tạo giảng viên mới
- `GET /api/v1/teachers/{id}` - Lấy thông tin giảng viên
- `PUT /api/v1/teachers/{id}` - Cập nhật giảng viên
- `DELETE /api/v1/teachers/{id}` - Xóa giảng viên

### Subjects
- `GET /api/v1/subjects` - Lấy danh sách môn học
- `POST /api/v1/subjects` - Tạo môn học mới
- `GET /api/v1/subjects/{id}` - Lấy thông tin môn học
- `PUT /api/v1/subjects/{id}` - Cập nhật môn học
- `DELETE /api/v1/subjects/{id}` - Xóa môn học

### Rooms
- `GET /api/v1/rooms` - Lấy danh sách phòng học
- `POST /api/v1/rooms` - Tạo phòng học mới
- `GET /api/v1/rooms/{id}` - Lấy thông tin phòng học
- `PUT /api/v1/rooms/{id}` - Cập nhật phòng học
- `DELETE /api/v1/rooms/{id}` - Xóa phòng học

### Classes
- `GET /api/v1/classes` - Lấy danh sách lớp học
- `POST /api/v1/classes` - Tạo lớp học mới
- `GET /api/v1/classes/{id}` - Lấy thông tin lớp học
- `PUT /api/v1/classes/{id}` - Cập nhật lớp học
- `DELETE /api/v1/classes/{id}` - Xóa lớp học

### Genetic Algorithm
- `POST /api/v1/genetic/run` - Chạy giải thuật di truyền
- `GET /api/v1/genetic/timetable/{id}` - Lấy thời khóa biểu đã tạo
- `GET /api/v1/genetic/timetables` - Lấy danh sách thời khóa biểu
- `GET /api/v1/genetic/best` - Lấy thời khóa biểu tốt nhất

## Giải thuật di truyền

### Các bước thực hiện:

1. **Khởi tạo quần thể**: Tạo ngẫu nhiên các cá thể (thời khóa biểu)
2. **Đánh giá fitness**: Tính điểm cho mỗi cá thể dựa trên các ràng buộc
3. **Chọn lọc**: Chọn các cá thể tốt nhất để lai ghép
4. **Lai ghép**: Kết hợp các gen của cha mẹ để tạo con
5. **Đột biến**: Thay đổi ngẫu nhiên một số gen
6. **Thay thế**: Tạo quần thể mới và lặp lại

### Hàm fitness xem xét:

- Xung đột phòng học (cùng phòng, cùng thời gian)
- Xung đột giảng viên (cùng giảng viên, cùng thời gian)
- Sức chứa phòng học
- Phân bố thời khóa biểu đều
- Ưu tiên thời gian của giảng viên

### Tham số có thể điều chỉnh:

- `population_size`: Kích thước quần thể (50-500)
- `mutation_rate`: Tỷ lệ đột biến (0.01-0.3)
- `crossover_rate`: Tỷ lệ lai ghép (0.5-0.95)
- `elitism_rate`: Tỷ lệ ưu tú (0.05-0.2)
- `max_generations`: Số thế hệ tối đa (50-1000)

## Testing

Chạy tests:
```bash
pytest
```

Chạy với coverage:
```bash
pytest --cov=app tests/
```

## License

MIT License
