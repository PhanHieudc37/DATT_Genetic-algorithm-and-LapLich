import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Building2, Calendar, Users, BarChart3, Globe, BookOpen, Dna, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription } from './ui/alert';
import logoImage from '../assets/logo.png';

export const LandingPage: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (!success) {
        setError(language === 'vi' 
          ? 'Tên đăng nhập hoặc mật khẩu không chính xác' 
          : 'Username or password is incorrect');
      }
    } catch (err) {
      setError(language === 'vi' 
        ? 'Đã xảy ra lỗi. Vui lòng thử lại.' 
        : 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#003d82] text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1">
                <img 
                  src={logoImage} 
                  alt="Logo ĐHXD"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg">
                  {language === 'vi' ? 'TRƯỜNG ĐẠI HỌC XÂY DỰNG HÀ NỘI' : 'HANOI UNIVERSITY OF CIVIL ENGINEERING'}
                </h1>
                <p className="text-sm text-blue-200">
                  {t('landing.title')}
                </p>
              </div>
            </div>
            <nav className="flex items-center gap-6">
              <a href="#" className="text-sm hover:text-blue-200 transition-colors hidden md:block">
                {t('landing.about')}
              </a>
              <a href="#" className="text-sm hover:text-blue-200 transition-colors hidden md:block">
                {t('landing.contact')}
              </a>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="text-white hover:text-blue-200 hover:bg-blue-700"
              >
                <Globe className="h-4 w-4 mr-2" />
                {language === 'vi' ? 'English' : 'Tiếng Việt'}
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="bg-[#0052a3] text-white">
        <div className="container mx-auto px-4">
          <nav className="flex gap-8 py-3">
            <a href="#" className="text-sm hover:text-blue-200 transition-colors">
              {language === 'vi' ? 'ĐÀO TẠO' : 'TRAINING'}
            </a>
            <a href="#" className="text-sm hover:text-blue-200 transition-colors">
              {language === 'vi' ? 'HƯỚNG DẪN' : 'GUIDELINES'}
            </a>
            <a href="#" className="text-sm hover:text-blue-200 transition-colors">
              {language === 'vi' ? 'BIỂU MẪU' : 'FORMS'}
            </a>
          </nav>
        </div>
      </div>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Card */}
            <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl">{t('landing.subtitle')}</h2>
                    <p className="text-blue-100 text-sm">
                      {language === 'vi' ? 'Hệ thống Lập lịch Thời khóa biểu tự động' : 'Automatic Timetable Scheduling System'}
                    </p>
                  </div>
                </div>
                <p className="text-lg mb-6">{t('landing.description')}</p>
              </CardContent>
            </Card>

            {/* Features */}
            <div>
              <h3 className="mb-4">{t('landing.features.title')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Dna className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-base">{t('landing.features.auto')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{t('landing.features.auto.desc')}</CardDescription>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-base">{t('landing.features.manage')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{t('landing.features.manage.desc')}</CardDescription>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle className="text-base">{t('landing.features.stats')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{t('landing.features.stats.desc')}</CardDescription>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-600" />
                      </div>
                      <CardTitle className="text-base">{t('landing.features.roles')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{t('landing.features.roles.desc')}</CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Login Portal */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center text-[#003d82]">
                  {language === 'vi' ? 'CỔNG THÔNG TIN' : 'INFORMATION PORTAL'}
                </CardTitle>
                <CardTitle className="text-center text-[#003d82]">
                  {language === 'vi' ? 'HỆ THỐNG' : 'SYSTEM'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {language === 'vi' ? 'Nhập tài khoản' : 'Enter account'}
                  </div>
                  <Input
                    type="text"
                    placeholder={language === 'vi' ? 'Nhập mã' : 'Enter code'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                    required
                  />
                  <div className="text-sm text-gray-600">
                    {language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10"
                      disabled={isLoading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button 
                    type="submit"
                    className="w-full bg-[#ff6600] hover:bg-[#ff7700]"
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? (language === 'vi' ? 'ĐĂNG NHẬP...' : 'LOGIN...') 
                      : (language === 'vi' ? 'ĐĂNG NHẬP' : 'LOGIN')}
                  </Button>
                  
                  {/* Demo credentials */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-xs mb-2">
                      {language === 'vi' ? 'Tài khoản demo:' : 'Demo accounts:'}
                    </p>
                    <div className="space-y-1 text-xs text-gray-700">
                      <p>
                        <strong>
                          {language === 'vi' ? 'Trưởng Bộ Môn' : 'Dept. Head'}:
                        </strong> truongbomon / 123456
                      </p>
                      <p>
                        <strong>
                          {language === 'vi' ? 'Giáo Vụ' : 'Academic'}:
                        </strong> giaovu / 123456
                      </p>
                      <p>
                        <strong>
                          {language === 'vi' ? 'Trưởng Khoa' : 'Dean'}:
                        </strong> truongkhoa / 123456
                      </p>
                      <p>
                        <strong>
                          {language === 'vi' ? 'Giảng Viên' : 'Lecturer'}:
                        </strong> giangvien / 123456
                      </p>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* News/Announcements */}
            <Card>
              <CardHeader>
                <CardTitle>{t('landing.news.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    date: { month: 10, day: 17 },
                    title: language === 'vi' 
                      ? 'Danh sách thí đánh giá trình độ tiếng Anh tháng 10/2025'
                      : 'English proficiency test list October 2025',
                    isNew: true,
                  },
                  {
                    date: { month: 10, day: 16 },
                    title: language === 'vi'
                      ? 'Danh sách thi Kết thúc học phần tiếng Anh TOEIC 2'
                      : 'TOEIC 2 final exam list',
                    isNew: true,
                  },
                  {
                    date: { month: 10, day: 14 },
                    title: language === 'vi'
                      ? 'Thông báo thu tiếp nguyên vọng lớp học kỳ II 2025-2026'
                      : 'Notice of class registration for semester II 2025-2026',
                    isNew: false,
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 pb-3 border-b last:border-0">
                    <div className="flex flex-col items-center bg-blue-100 rounded p-2 min-w-[50px]">
                      <div className="text-xs text-blue-600">
                        {language === 'vi' ? 'Tháng' : 'Month'} {item.date.month}
                      </div>
                      <div className="text-xl">{item.date.day}</div>
                    </div>
                    <div className="flex-1">
                      <a href="#" className="text-sm text-blue-600 hover:underline line-clamp-2">
                        {item.title}
                      </a>
                      {item.isNew && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-500 text-white rounded">
                          NEW
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {language === 'vi' ? 'Xem chi tiết' : 'View details'}
                      </p>
                    </div>
                  </div>
                ))}
                <div className="text-right">
                  <a href="#" className="text-sm text-red-600 hover:underline">
                    {language === 'vi' ? 'XEM THÊM' : 'VIEW MORE'}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#003d82] text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="mb-3">{language === 'vi' ? 'Liên hệ' : 'Contact'}</h4>
              <p className="text-sm text-blue-200">
                {language === 'vi' 
                  ? 'Trường Đại học Xây dựng Hà Nội'
                  : 'Hanoi University of Civil Engineering'}
              </p>
              <p className="text-sm text-blue-200">
                {language === 'vi' 
                  ? 'Địa chỉ: 55 Giải Phóng, Hai Bà Trưng, Hà Nội'
                  : 'Address: 55 Giai Phong, Hai Ba Trung, Hanoi'}
              </p>
            </div>
            <div>
              <h4 className="mb-3">{language === 'vi' ? 'Liên kết' : 'Links'}</h4>
              <ul className="space-y-2 text-sm text-blue-200">
                <li><a href="#" className="hover:text-white">{language === 'vi' ? 'Đào tạo' : 'Training'}</a></li>
                <li><a href="#" className="hover:text-white">{language === 'vi' ? 'Hướng dẫn' : 'Guidelines'}</a></li>
                <li><a href="#" className="hover:text-white">{language === 'vi' ? 'Biểu mẫu' : 'Forms'}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3">{language === 'vi' ? 'Hỗ trợ' : 'Support'}</h4>
              <p className="text-sm text-blue-200">
                Email: support@huce.edu.vn
              </p>
              <p className="text-sm text-blue-200">
                {language === 'vi' ? 'Điện thoại' : 'Phone'}: (024) 3869 2067
              </p>
            </div>
          </div>
          <div className="border-t border-blue-700 mt-8 pt-6 text-center text-sm text-blue-200">
            <p>{t('common.footer')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
