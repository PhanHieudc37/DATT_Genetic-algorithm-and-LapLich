import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Eye, EyeOff, Globe } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Alert, AlertDescription } from './ui/alert';
import logoImage from '../assets/logo.png';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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
      if (success) {
        onLoginSuccess();
      } else {
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
    <div className="min-h-screen bg-gradient-to-br from-[#1e6fdf] via-[#2563eb] to-[#3b82f6] relative overflow-hidden">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          className="text-white hover:text-blue-200 hover:bg-white/10 backdrop-blur-sm"
        >
          <Globe className="h-4 w-4 mr-2" />
          {language === 'vi' ? 'English' : 'Tiếng Việt'}
        </Button>
      </div>

      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(6)].map((_, i) => (
            <div
              key={`tl-${i}`}
              className="absolute border-2 border-white transform rotate-45"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                top: `${-100 + i * 50}px`,
                left: `${-100 + i * 50}px`,
              }}
            />
          ))}
        </div>
        <div className="absolute bottom-0 right-0 w-full h-full">
          {[...Array(6)].map((_, i) => (
            <div
              key={`br-${i}`}
              className="absolute border-2 border-white transform -rotate-45"
              style={{
                width: `${200 + i * 100}px`,
                height: `${200 + i * 100}px`,
                bottom: `${-100 + i * 50}px`,
                right: `${-100 + i * 50}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Login form */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="space-y-6 pb-6">
            {/* Logo */}
            <div className="flex justify-center">
              <img 
                src={logoImage} 
                alt={language === 'vi' ? 'Logo Đại học Xây dựng Hà Nội' : 'Hanoi University of Civil Engineering Logo'}
                className="h-32 w-auto object-contain"
              />
            </div>
            
            {/* Title */}
            <div className="text-center space-y-1">
              <CardTitle className="text-[#003d82]">
                {language === 'vi' ? 'CỔNG THÔNG TIN' : 'INFORMATION PORTAL'}
              </CardTitle>
              <CardTitle className="text-[#003d82]">
                {language === 'vi' ? 'HỆ THỐNG' : 'SYSTEM'}
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#003d82]">
                  {language === 'vi' ? 'Nhập tài khoản sinh viên' : 'Enter student account'}
                </Label>
                <Input
                  id="username"
                  placeholder={language === 'vi' ? 'Nhập mã' : 'Enter code'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-11 bg-gray-50 border-gray-300"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#003d82]">
                  {language === 'vi' ? 'Nhập mật khẩu' : 'Enter password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 pr-10 bg-gray-50 border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-12 bg-[#ff6600] hover:bg-[#ff7700] text-white" 
                disabled={isLoading}
              >
                {isLoading 
                  ? (language === 'vi' ? 'ĐĂNG NHẬP...' : 'LOGIN...') 
                  : (language === 'vi' ? 'ĐĂNG NHẬP' : 'LOGIN')}
              </Button>

              {/* Demo credentials */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm mb-2">
                  {language === 'vi' ? 'Tài khoản demo:' : 'Demo accounts:'}
                </p>
                <div className="space-y-1 text-xs text-gray-700">
                  <p>
                    <strong>
                      {language === 'vi' ? 'Trưởng Bộ Môn' : 'Department Head'}:
                    </strong> truongbomon / 123456
                  </p>
                  <p>
                    <strong>
                      {language === 'vi' ? 'Giáo Vụ' : 'Academic Affairs'}:
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
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 z-10 text-center text-white py-4 bg-black/10 backdrop-blur-sm">
        <p className="text-sm">
          {language === 'vi' 
            ? '© 2025 - Trường Đại học Xây dựng Hà Nội' 
            : '© 2025 - Hanoi University of Civil Engineering'}
        </p>
      </div>
    </div>
  );
};
