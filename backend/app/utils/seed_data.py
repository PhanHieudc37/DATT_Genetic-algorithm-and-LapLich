"""
Seed initial data to database

Run this script to populate the database with initial data:
python -m app.utils.seed_data
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import async_session_maker, init_db
from app.models.user import User, UserRole
from app.models.teacher import Teacher
from app.models.subject import Subject
from app.models.room import Room, RoomType
from app.models.class_model import Class
from app.core.security import get_password_hash


async def seed_users(session: AsyncSession):
    """Seed users"""
    users_data = [
        {
            "id": "1",
            "username": "truongbomon",
            "password": "123456",
            "full_name": "Nguyễn Văn Trường",
            "role": UserRole.TRUONG_BO_MON,
            "department": "Khoa Xây dựng Dân dụng và Công nghiệp",
            "email": "truongbomon@university.edu.vn",
        },
        {
            "id": "2",
            "username": "giaovu",
            "password": "123456",
            "full_name": "Trần Thị Hương",
            "role": UserRole.GIAO_VU,
            "department": "Phòng Giáo vụ",
            "email": "giaovu@university.edu.vn",
        },
        {
            "id": "3",
            "username": "truongkhoa",
            "password": "123456",
            "full_name": "Lê Văn Nam",
            "role": UserRole.TRUONG_KHOA,
            "department": "Khoa Kiến trúc và Quy hoạch",
            "email": "truongkhoa@university.edu.vn",
        },
        {
            "id": "4",
            "username": "giangvien",
            "password": "123456",
            "full_name": "Phạm Minh Tuấn",
            "role": UserRole.GIANG_VIEN,
            "department": "Khoa Công nghệ Thông tin",
            "email": "giangvien@university.edu.vn",
        },
    ]
    
    for user_data in users_data:
        # Check if user exists
        result = await session.execute(
            select(User).where(User.username == user_data["username"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            user = User(
                id=user_data["id"],
                username=user_data["username"],
                password_hash=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
                department=user_data.get("department"),
                email=user_data.get("email"),
            )
            session.add(user)
    
    await session.commit()
    print("✓ Users seeded")


async def seed_subjects(session: AsyncSession):
    """Seed subjects - 200 môn học"""
    subjects_data = []
    
    # Danh sách các môn học theo khoa
    xd_subjects = [
        "Sức bền Vật liệu", "Cơ học Kết cấu", "Kết cấu Bê tông Cốt thép", "Kết cấu Thép",
        "Nền và Móng", "Tổ chức Thi công", "Nguyên lý Thiết kế Kiến trúc", "Lịch sử Kiến trúc",
        "Cấu tạo Kiến trúc", "Vật lý Kiến trúc (Nhiệt, Âm, Sáng)", "Quy hoạch Đô thị",
        "Đồ án Kiến trúc", "Kinh tế Xây dựng", "Quản lý Dự án Xây dựng", "Dự toán Công trình",
        "Hợp đồng và Thanh quyết toán", "Cơ học Đất", "Thí nghiệm Cơ học Đất", "Công nghệ Bê tông",
        "Vật liệu Xây dựng", "Kỹ thuật Thi công", "An toàn Lao động", "Quản lý Chất lượng",
        "Thiết kế Móng", "Kết cấu Gỗ", "Kết cấu Xây", "Cơ học Công trình", "Sức bền Vật liệu 1",
        "Sức bền Vật liệu 2", "Cơ học Lý thuyết", "Vẽ Kỹ thuật", "CAD Xây dựng", "BIM", "Revit",
        "Kết cấu Bê tông 1", "Kết cấu Bê tông 2", "Kết cấu Thép 1", "Kết cấu Thép 2",
        "Nền Móng 1", "Nền Móng 2", "Thi công 1", "Thi công 2"
    ]
    
    kt_subjects = [
        "Thiết kế Kiến trúc Cơ sở", "Thiết kế Nhà ở", "Thiết kế Công trình Công cộng",
        "Quy hoạch Chi tiết", "Quy hoạch Nông thôn", "Cảnh quan Đô thị", "Mỹ thuật Kiến trúc",
        "Vẽ Phối cảnh", "3D Max", "SketchUp", "Photoshop Kiến trúc", "Illustrator Kiến trúc",
        "Lịch sử Kiến trúc Việt Nam", "Lịch sử Kiến trúc Phương Tây", "Kiến trúc Đương đại",
        "Kiến trúc Xanh", "Kiến trúc Bền vững", "Vật liệu Kiến trúc", "Kết cấu Kiến trúc",
        "Vật lý Kiến trúc Âm thanh", "Vật lý Kiến trúc Ánh sáng", "Vật lý Kiến trúc Nhiệt",
        "Thiết kế Nội thất", "Thiết kế Cảnh quan", "Đồ án Tốt nghiệp", "Thực tập Kiến trúc",
        "Nghiên cứu Đô thị", "Phát triển Đô thị", "Giao thông Đô thị", "Hạ tầng Đô thị",
        "Môi trường Đô thị", "Kinh tế Đô thị", "Xã hội học Đô thị", "Địa lý Đô thị",
        "Đồ họa Kiến trúc", "Kỹ xảo Đồ họa", "Presentation Kiến trúc", "Portfolio Kiến trúc",
        "Phương pháp Nghiên cứu", "Lý thuyết Kiến trúc", "Phê bình Kiến trúc", "Bảo tồn Di tích"
    ]
    
    cd_subjects = [
        "Kết cấu Cầu", "Thiết kế Đường ô tô", "Thiết kế Cầu Bê tông", "Thiết kế Cầu Thép",
        "Nền Đường", "Mặt Đường", "Thi công Cầu", "Thi công Đường", "Thí nghiệm Đường",
        "Cơ học Đất Đường", "Vật liệu Đường", "Kỹ thuật Đường ô tô", "Kỹ thuật Cầu",
        "Thiết kế Hầm", "Thiết kế Đường sắt", "Kỹ thuật Đường sắt", "Cầu Đường sắt",
        "Kết cấu Đặc biệt", "Động lực học Công trình", "Cầu vượt", "Giao thông Công trình",
        "Quy hoạch Giao thông", "An toàn Giao thông", "Quản lý Đường bộ", "Bảo trì Đường bộ",
        "Công nghệ Thi công Cầu", "Công nghệ Thi công Đường", "Máy Thi công", "Cơ giới hóa",
        "Thiết kế Đường Cao tốc", "Hệ thống Thoát nước Đường", "Công trình Bảo vệ",
        "Gia cố Nền", "Xử lý Nền yếu", "Thí nghiệm Kết cấu Cầu", "Mô hình Cầu",
        "Tin học Cầu đường", "CAD Cầu đường", "SAP2000", "MIDAS Civil"
    ]
    
    ql_subjects = [
        "Quản lý Dự án", "Kinh tế Xây dựng", "Dự toán", "Thanh quyết toán",
        "Hợp đồng Xây dựng", "Luật Xây dựng", "Quản lý Chất lượng", "Quản lý Chi phí",
        "Quản lý Thời gian", "Quản lý Rủi ro", "Đầu tư Xây dựng", "Thẩm định Dự án",
        "Lập Dự án", "Khả thi Dự án", "Tài chính Doanh nghiệp", "Kế toán Xây dựng",
        "Phân tích Tài chính", "Quản trị Kinh doanh", "Marketing Xây dựng", "Quản lý Nguồn lực",
        "Quản lý Hợp đồng", "Quản lý Nhà thầu", "Quản lý Thi công", "Giám sát Công trình",
        "Định mức Xây dựng", "Đấu thầu", "Đàm phán Hợp đồng", "Pháp luật Kinh tế",
        "Kinh tế Vi mô", "Kinh tế Vĩ mô", "Toán Kinh tế", "Thống kê Xây dựng",
        "Excel Dự toán", "Phần mềm Dự toán", "BIM 5D", "Quản lý Bất động sản",
        "Thị trường Bất động sản", "Định giá Bất động sản", "Phát triển Bất động sản"
    ]
    
    ht_subjects = [
        "Cấp thoát nước", "Xử lý Nước thải", "Xử lý Nước cấp", "Công trình Cấp nước",
        "Công trình Thoát nước", "Thủy lực", "Thủy văn", "Công trình Thủy lợi",
        "Đập", "Kênh", "Trạm bơm", "Công trình Đầu mối", "Tưới tiêu", "Thuỷ điện",
        "Kinh tế Thủy lợi", "Quản lý Thủy lợi", "Tính toán Thủy lực", "Cơ học Chất lỏng",
        "Kỹ thuật Môi trường", "Xử lý Chất thải Rắn", "Xử lý Khí thải", "Quan trắc Môi trường",
        "Quản lý Môi trường", "Đánh giá Tác động Môi trường", "Quy hoạch Môi trường",
        "Công nghệ Sinh học Môi trường", "Hóa Môi trường", "Vi sinh Môi trường",
        "Độc học Môi trường", "Sinh thái học", "Bảo vệ Môi trường", "Phát triển Bền vững",
        "Năng lượng Tái tạo", "Công nghệ Sạch", "Kinh tế Môi trường", "Luật Môi trường",
        "ISO Môi trường", "Quản lý Chất lượng Nước", "Công nghệ Xử lý Nước", "Hệ thống Cấp nước"
    ]
    
    # Tạo 200 môn học
    all_subjects = []
    departments = [
        "Khoa Xây dựng Dân dụng và Công nghiệp",
        "Khoa Kiến trúc và Quy hoạch",
        "Khoa Cầu đường",
        "Khoa Kinh tế và Quản lý Xây dựng",
        "Khoa Công trình Thủy"
    ]
    
    subject_lists = [xd_subjects, kt_subjects, cd_subjects, ql_subjects, ht_subjects]
    code_prefixes = ["XD", "KT", "CD", "QL", "HT"]
    
    count = 1
    for dept_idx, (dept, subjects_list, code_prefix) in enumerate(zip(departments, subject_lists, code_prefixes)):
        for idx, subject_name in enumerate(subjects_list, 1):
            if count > 200:
                break
            credits = 2 + (count % 4)  # 2-5 tín chỉ
            subjects_data.append({
                "id": f"S{count:04d}",
                "name": subject_name,
                "code": f"{code_prefix}{idx:03d}",
                "credits": credits,
                "department": dept,
                "required_hours": credits,
            })
            count += 1
        if count > 200:
            break
    
    # Đảm bảo đủ 200 môn
    while len(subjects_data) < 200:
        dept_idx = len(subjects_data) % 5
        code_prefix = code_prefixes[dept_idx]
        subjects_data.append({
            "id": f"S{len(subjects_data)+1:04d}",
            "name": f"Môn học {code_prefix} {len(subjects_data)+1}",
            "code": f"{code_prefix}{len(subjects_data)+1:03d}",
            "credits": 3,
            "department": departments[dept_idx],
            "required_hours": 3,
        })
    
    subjects_data = subjects_data[:200]
    
    for subject_data in subjects_data:
        result = await session.execute(
            select(Subject).where(Subject.id == subject_data["id"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            subject = Subject(**subject_data)
            session.add(subject)
    
    await session.commit()
    print("✓ Subjects seeded")


async def seed_rooms(session: AsyncSession):
    """Seed rooms"""
    rooms_data = [
        {"id": "r1", "name": "A101", "capacity": 60, "type": RoomType.THEORY},
        {"id": "r2", "name": "A102", "capacity": 60, "type": RoomType.THEORY},
        {"id": "r3", "name": "B201", "capacity": 40, "type": RoomType.LAB},
        {"id": "r4", "name": "B202", "capacity": 40, "type": RoomType.LAB},
        {"id": "r5", "name": "C301", "capacity": 80, "type": RoomType.BOTH},
        {"id": "r6", "name": "C302", "capacity": 80, "type": RoomType.BOTH},
    ]
    
    for room_data in rooms_data:
        result = await session.execute(
            select(Room).where(Room.id == room_data["id"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            room = Room(**room_data)
            session.add(room)
    
    await session.commit()
    print("✓ Rooms seeded")


async def seed_teachers(session: AsyncSession):
    """Seed teachers - 200 giảng viên"""
    
    # Danh sách họ và tên phổ biến
    last_names = [
        "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
        "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đinh", "Trương", "Cao", "Mai",
        "Tô", "Đoàn", "Lâm", "Phùng", "Hà", "Chu", "Lưu", "Tạ", "Thái", "Tăng"
    ]
    
    first_names_male = [
        "Văn A", "Văn B", "Văn C", "Văn D", "Văn E", "Anh", "Minh", "Hoàng", "Tuấn", "Hải",
        "Đức", "Quân", "Nam", "Bình", "Cường", "Hùng", "Dũng", "Thành", "Tân", "Long",
        "Phong", "Khoa", "Tùng", "Kiên", "Hiếu", "Huy", "Sơn", "Linh", "Thắng", "Trung",
        "Đạt", "Khang", "Phúc", "Lộc", "An", "Toàn", "Thịnh", "Vinh", "Vương", "Thái"
    ]
    
    first_names_female = [
        "Thị A", "Thị B", "Thị C", "Thị D", "Thị E", "Hương", "Linh", "Mai", "Lan", "Hà",
        "Phương", "Thảo", "Chi", "Ngọc", "Trang", "Hằng", "Nhung", "Huyền", "Dung", "Nga",
        "Yến", "Loan", "Hiền", "Giang", "Thu", "Xuân", "Hạ", "Thu", "Đông", "Bích",
        "Thanh", "Thùy", "Vân", "Anh", "My", "Tú", "Vy", "Nhi", "Như", "Uyên"
    ]
    
    departments = [
        "Khoa Xây dựng Dân dụng và Công nghiệp",
        "Khoa Kiến trúc và Quy hoạch",
        "Khoa Cầu đường",
        "Khoa Kinh tế và Quản lý Xây dựng",
        "Khoa Công trình Thủy"
    ]
    
    teachers_data = []
    
    for i in range(1, 201):
        # Xác định giới tính (50-50)
        is_male = i % 2 == 1
        last_name = last_names[(i - 1) % len(last_names)]
        
        if is_male:
            first_name = first_names_male[(i - 1) % len(first_names_male)]
        else:
            first_name = first_names_female[(i - 1) % len(first_names_female)]
        
        # Tạo username từ họ tên (không dấu, chữ thường)
        username_map = {
            'Đ': 'd', 'đ': 'd', 'Ă': 'a', 'ă': 'a', 'Â': 'a', 'â': 'a',
            'Ê': 'e', 'ê': 'e', 'Ô': 'o', 'ô': 'o', 'Ơ': 'o', 'ơ': 'o',
            'Ư': 'u', 'ư': 'u', 'À': 'a', 'à': 'a', 'Á': 'a', 'á': 'a',
            'Ả': 'a', 'ả': 'a', 'Ã': 'a', 'ã': 'a', 'Ạ': 'a', 'ạ': 'a',
            'Ằ': 'a', 'ằ': 'a', 'Ắ': 'a', 'ắ': 'a', 'Ẳ': 'a', 'ẳ': 'a',
            'Ẵ': 'a', 'ẵ': 'a', 'Ặ': 'a', 'ặ': 'a', 'Ầ': 'a', 'ầ': 'a',
            'Ấ': 'a', 'ấ': 'a', 'Ẩ': 'a', 'ẩ': 'a', 'Ẫ': 'a', 'ẫ': 'a',
            'Ậ': 'a', 'ậ': 'a', 'È': 'e', 'è': 'e', 'É': 'e', 'é': 'e',
            'Ẻ': 'e', 'ẻ': 'e', 'Ẽ': 'e', 'ẽ': 'e', 'Ẹ': 'e', 'ẹ': 'e',
            'Ề': 'e', 'ề': 'e', 'Ế': 'e', 'ế': 'e', 'Ể': 'e', 'ể': 'e',
            'Ễ': 'e', 'ễ': 'e', 'Ệ': 'e', 'ệ': 'e', 'Ì': 'i', 'ì': 'i',
            'Í': 'i', 'í': 'i', 'Ỉ': 'i', 'ỉ': 'i', 'Ĩ': 'i', 'ĩ': 'i',
            'Ị': 'i', 'ị': 'i', 'Ò': 'o', 'ò': 'o', 'Ó': 'o', 'ó': 'o',
            'Ỏ': 'o', 'ỏ': 'o', 'Õ': 'o', 'õ': 'o', 'Ọ': 'o', 'ọ': 'o',
            'Ồ': 'o', 'ồ': 'o', 'Ố': 'o', 'ố': 'o', 'Ổ': 'o', 'ổ': 'o',
            'Ỗ': 'o', 'ỗ': 'o', 'Ộ': 'o', 'ộ': 'o', 'Ờ': 'o', 'ờ': 'o',
            'Ớ': 'o', 'ớ': 'o', 'Ở': 'o', 'ở': 'o', 'Ỡ': 'o', 'ỡ': 'o',
            'Ợ': 'o', 'ợ': 'o', 'Ù': 'u', 'ù': 'u', 'Ú': 'u', 'ú': 'u',
            'Ủ': 'u', 'ủ': 'u', 'Ũ': 'u', 'ũ': 'u', 'Ụ': 'u', 'ụ': 'u',
            'Ừ': 'u', 'ừ': 'u', 'Ứ': 'u', 'ứ': 'u', 'Ử': 'u', 'ử': 'u',
            'Ữ': 'u', 'ữ': 'u', 'Ự': 'u', 'ự': 'u', 'Ỳ': 'y', 'ỳ': 'y',
            'Ý': 'y', 'ý': 'y', 'Ỷ': 'y', 'ỷ': 'y', 'Ỹ': 'y', 'ỹ': 'y',
            'Ỵ': 'y', 'ỵ': 'y'
        }
        
        full_name = f"{last_name} {first_name}"
        username_raw = full_name.lower().replace(" ", "")
        username = ""
        for char in username_raw:
            username += username_map.get(char, char)
        username = f"{username}{i}"
        
        # Phân bổ môn học (mỗi giảng viên dạy 2-4 môn)
        num_subjects = 2 + (i % 3)  # 2-4 môn
        dept_idx = (i - 1) % 5
        dept = departments[dept_idx]
        
        # Chọn môn học từ cùng khoa
        subject_start = dept_idx * 40 + 1  # Mỗi khoa có 40 môn
        subject_ids = [f"S{(subject_start + j):04d}" for j in range(min(num_subjects, 40))]
        
        teachers_data.append({
            "id": f"T{i:04d}",
            "teacher_code": f"GV{i:03d}",
            "username": username,
            "password": "123456",
            "first_name": first_name,
            "last_name": last_name,
            "phone": f"09{i:08d}",
            "email": f"{username}@nuce.edu.vn",
            "address": "Hà Nội",
            "department": dept,
            "subjects": subject_ids,
        })
    
    for teacher_data in teachers_data:
        result = await session.execute(
            select(Teacher).where(Teacher.id == teacher_data["id"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            subject_ids = teacher_data.pop("subjects")
            password = teacher_data.pop("password")
            
            teacher = Teacher(
                **teacher_data,
                password_hash=get_password_hash(password)
            )
            
            # Add subjects
            subjects_result = await session.execute(
                select(Subject).where(Subject.id.in_(subject_ids))
            )
            subjects = subjects_result.scalars().all()
            teacher.subjects.extend(subjects)
            
            session.add(teacher)
    
    await session.commit()
    print("✓ Teachers seeded")


async def seed_classes(session: AsyncSession):
    """Seed classes
    
    sessions_per_week theo chuẩn đại học:
    - 1 tín chỉ: 1 buổi/tuần
    - 2-4 tín chỉ: 2 buổi/tuần
    - ≥5 tín chỉ: 3 buổi/tuần
    
    Tạo lớp học cho 200 môn với 200 giảng viên
    """
    classes_data = []
    
    # Tạo lớp học cho mỗi môn (có thể có nhiều lớp cho 1 môn)
    for i in range(1, 201):
        subject_id = f"S{i:04d}"
        
        # Mỗi môn có 1-2 lớp
        num_classes = 1 + (i % 2)
        
        for class_num in range(1, num_classes + 1):
            # Chọn giảng viên từ cùng khoa (40 giảng viên/khoa)
            dept_idx = (i - 1) // 40
            teacher_idx = dept_idx * 40 + ((i - 1) % 40) + 1
            teacher_id = f"T{teacher_idx:04d}"
            
            # Số sinh viên ngẫu nhiên từ 30-70
            num_students = 30 + ((i + class_num) * 7) % 41
            
            # Sessions per week dựa trên tín chỉ
            credits = 2 + (i % 4)
            sessions_per_week = 2 if credits <= 4 else 3
            
            class_id = f"C{len(classes_data) + 1:04d}"
            classes_data.append({
                "id": class_id,
                "name": f"S{i:04d}-{class_num:02d}",
                "subject_id": subject_id,
                "teacher_id": teacher_id,
                "number_of_students": num_students,
                "sessions_per_week": sessions_per_week,
            })
    
    for class_data in classes_data:
        result = await session.execute(
            select(Class).where(Class.id == class_data["id"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            class_obj = Class(**class_data)
            session.add(class_obj)
    
    await session.commit()
    print("✓ Classes seeded")


async def main():
    """Main function to seed all data"""
    print("Initializing database...")
    await init_db()
    
    print("\nSeeding data...")
    async with async_session_maker() as session:
        await seed_users(session)
        await seed_subjects(session)
        await seed_rooms(session)
        await seed_teachers(session)
        await seed_classes(session)
    
    print("\nDatabase seeded successfully!")


if __name__ == "__main__":
    asyncio.run(main())
