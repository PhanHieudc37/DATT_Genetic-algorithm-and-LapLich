import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  vi: {
    // Landing Page
    'landing.title': 'Hệ thống Lập lịch Thời khóa biểu',
    'landing.subtitle': 'Trường Đại học Xây dựng Hà Nội',
    'landing.description': 'Nghiên cứu giải thuật di truyền cho bài toán sắp xếp thời khóa biểu cho trường đại học',
    'landing.features.title': 'Tính năng nổi bật',
    'landing.features.auto': 'Tự động sắp xếp',
    'landing.features.auto.desc': 'Sử dụng thuật toán di truyền để tối ưu hóa thời khóa biểu',
    'landing.features.manage': 'Quản lý toàn diện',
    'landing.features.manage.desc': 'Quản lý giảng viên, môn học, phòng học và lớp học',
    'landing.features.stats': 'Thống kê chi tiết',
    'landing.features.stats.desc': 'Báo cáo và thống kê sử dụng phòng, giảng viên',
    'landing.features.roles': 'Phân quyền rõ ràng',
    'landing.features.roles.desc': 'Quản lý theo vai trò: Trưởng bộ môn, Giáo vụ, Trưởng khoa, Giảng viên',
    'landing.getStarted': 'Bắt đầu',
    'landing.login': 'Đăng nhập',
    'landing.about': 'Giới thiệu',
    'landing.contact': 'Liên hệ',
    'landing.news': 'Tin tức',
    'landing.news.title': 'Thông báo',
    
    // Login Page
    'login.title': 'Đăng nhập hệ thống',
    'login.subtitle': 'Vui lòng đăng nhập để tiếp tục',
    'login.username': 'Tên đăng nhập',
    'login.password': 'Mật khẩu',
    'login.button': 'Đăng nhập',
    'login.demo': 'Tài khoản demo:',
    'login.back': 'Quay lại trang chủ',
    
    // Roles
    'role.truong_bo_mon': 'Trưởng Bộ Môn',
    'role.giao_vu': 'Giáo Vụ',
    'role.truong_khoa': 'Trưởng Khoa',
    'role.giang_vien': 'Giảng Viên',
    
    // Menu
    'menu.teachers': 'Quản lý giảng viên',
    'menu.schedule': 'Sắp xếp thời khóa biểu',
    'menu.room_stats': 'Xem thống kê phòng sử dụng',
    'menu.classes': 'Quản lý lớp học',
    'menu.teacher_stats': 'Xem thống kê giảng viên dạy',
    'menu.subjects': 'Quản lý môn học',
    'menu.rooms': 'Quản lý phòng học',
    'menu.view_schedule': 'Xem lịch dạy',
    'menu.functions': 'Chức năng',
    'menu.home': 'Trang chủ',
    'menu.timetable_management': 'Quản lý thời khóa biểu',
    'menu.course_management': 'Quản lý khóa học',
    'menu.room_management': 'Quản lý phòng học',
    'menu.create_timetable': 'Tạo thời khóa biểu',
    'menu.view_timetable': 'Xem Thời Khóa Biểu',
    'menu.statistics': 'Thống kê',
    
    // Common
    'common.logout': 'Đăng xuất',
    'common.footer': '© 2025 - Hệ thống Lập lịch Thời khóa biểu - Trường Đại học Xây dựng Hà Nội',
    'common.add': 'Thêm',
    'common.update': 'Cập nhật',
    'common.delete': 'Xóa',
    'common.edit': 'Sửa',
    'common.cancel': 'Hủy',
    'common.search': 'Tìm kiếm',
    'common.actions': 'Thao tác',
    
    // Teacher Management
    'teacher.title': 'Quản lý Giảng viên',
    'teacher.description': 'Danh sách tất cả giảng viên trong hệ thống',
    'teacher.add': 'Thêm giảng viên',
    'teacher.add.new': 'Thêm giảng viên mới',
    'teacher.edit': 'Chỉnh sửa giảng viên',
    'teacher.delete.confirm': 'Bạn có chắc chắn muốn xóa giảng viên này?',
    'teacher.code': 'Mã giảng viên',
    'teacher.username': 'Tài khoản',
    'teacher.password': 'Mật khẩu',
    'teacher.firstName': 'Tên',
    'teacher.lastName': 'Họ',
    'teacher.fullName': 'Họ và tên',
    'teacher.phone': 'Số điện thoại',
    'teacher.email': 'Email',
    'teacher.address': 'Địa chỉ',
    'teacher.department': 'Bộ môn',
    'teacher.subjects': 'Môn học có thể giảng dạy',
    'teacher.subjects.list': 'Môn học',
    
    // Subject Management
    'subject.title': 'Quản lý Môn học',
    'subject.description': 'Danh sách tất cả môn học trong hệ thống',
    'subject.add': 'Thêm môn học',
    'subject.add.new': 'Thêm môn học mới',
    'subject.edit': 'Chỉnh sửa môn học',
    'subject.delete.confirm': 'Bạn có chắc chắn muốn xóa môn học này?',
    'subject.name': 'Tên môn học',
    'subject.code': 'Mã môn học',
    'subject.credits': 'Số tín chỉ',
    'subject.department': 'Bộ môn',
    'subject.requiredHours': 'Số giờ/tuần',
    
    // Class Management
    'class.title': 'Quản lý Lớp học',
    'class.description': 'Danh sách tất cả lớp học trong hệ thống',
    'class.add': 'Thêm lớp học',
    'class.add.new': 'Thêm lớp học mới',
    'class.edit': 'Chỉnh sửa lớp học',
    'class.delete.confirm': 'Bạn có chắc chắn muốn xóa lớp học này?',
    'class.stt': 'STT',
    'class.name': 'Tên Lớp Học',
    'class.subject': 'Môn học',
    'class.students': 'Số sinh viên',
    'class.selectSubject': 'Chọn môn học',
  },
  en: {
    // Landing Page
    'landing.title': 'Course Scheduling System',
    'landing.subtitle': 'Hanoi University of Civil Engineering',
    'landing.description': 'Research on genetic algorithms for university course scheduling optimization',
    'landing.features.title': 'Key Features',
    'landing.features.auto': 'Auto Scheduling',
    'landing.features.auto.desc': 'Use genetic algorithms to optimize timetables',
    'landing.features.manage': 'Comprehensive Management',
    'landing.features.manage.desc': 'Manage teachers, subjects, rooms and classes',
    'landing.features.stats': 'Detailed Statistics',
    'landing.features.stats.desc': 'Reports and statistics on room and teacher usage',
    'landing.features.roles': 'Clear Authorization',
    'landing.features.roles.desc': 'Role-based management: Head of Department, Academic Affairs, Dean, Lecturer',
    'landing.getStarted': 'Get Started',
    'landing.login': 'Login',
    'landing.about': 'About',
    'landing.contact': 'Contact',
    'landing.news': 'News',
    'landing.news.title': 'Announcements',
    
    // Login Page
    'login.title': 'System Login',
    'login.subtitle': 'Please login to continue',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.button': 'Login',
    'login.demo': 'Demo accounts:',
    'login.back': 'Back to home',
    
    // Roles
    'role.truong_bo_mon': 'Head of Department',
    'role.giao_vu': 'Academic Affairs',
    'role.truong_khoa': 'Dean',
    'role.giang_vien': 'Lecturer',
    
    // Menu
    'menu.teachers': 'Teacher Management',
    'menu.schedule': 'Schedule Arrangement',
    'menu.room_stats': 'Room Usage Statistics',
    'menu.classes': 'Class Management',
    'menu.teacher_stats': 'Teacher Teaching Statistics',
    'menu.subjects': 'Subject Management',
    'menu.rooms': 'Room Management',
    'menu.view_schedule': 'View Teaching Schedule',
    'menu.functions': 'Functions',
    'menu.home': 'Home',
    'menu.timetable_management': 'Timetable Management',
    'menu.course_management': 'Course Management',
    'menu.room_management': 'Room Management',
    'menu.create_timetable': 'Create Timetable',
    'menu.view_timetable': 'View Timetable',
    'menu.statistics': 'Statistics',
    
    // Common
    'common.logout': 'Logout',
    'common.footer': '© 2025 - Course Scheduling System - Hanoi University of Civil Engineering',
    'common.add': 'Add',
    'common.update': 'Update',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.cancel': 'Cancel',
    'common.search': 'Search',
    'common.actions': 'Actions',
    
    // Teacher Management
    'teacher.title': 'Teacher Management',
    'teacher.description': 'List of all teachers in the system',
    'teacher.add': 'Add Teacher',
    'teacher.add.new': 'Add New Teacher',
    'teacher.edit': 'Edit Teacher',
    'teacher.delete.confirm': 'Are you sure you want to delete this teacher?',
    'teacher.code': 'Teacher Code',
    'teacher.username': 'Username',
    'teacher.password': 'Password',
    'teacher.firstName': 'First Name',
    'teacher.lastName': 'Last Name',
    'teacher.fullName': 'Full Name',
    'teacher.phone': 'Phone Number',
    'teacher.email': 'Email',
    'teacher.address': 'Address',
    'teacher.department': 'Department',
    'teacher.subjects': 'Teachable Subjects',
    'teacher.subjects.list': 'Subjects',
    
    // Subject Management
    'subject.title': 'Subject Management',
    'subject.description': 'List of all subjects in the system',
    'subject.add': 'Add Subject',
    'subject.add.new': 'Add New Subject',
    'subject.edit': 'Edit Subject',
    'subject.delete.confirm': 'Are you sure you want to delete this subject?',
    'subject.name': 'Subject Name',
    'subject.code': 'Subject Code',
    'subject.credits': 'Credits',
    'subject.department': 'Department',
    'subject.requiredHours': 'Hours/Week',
    
    // Class Management
    'class.title': 'Class Management',
    'class.description': 'List of all classes in the system',
    'class.add': 'Add Class',
    'class.add.new': 'Add New Class',
    'class.edit': 'Edit Class',
    'class.delete.confirm': 'Are you sure you want to delete this class?',
    'class.stt': 'STT',
    'class.name': 'Course Name',
    'class.subject': 'Subject',
    'class.students': 'Number of Students',
    'class.selectSubject': 'Select Subject',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('vi');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.vi] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};