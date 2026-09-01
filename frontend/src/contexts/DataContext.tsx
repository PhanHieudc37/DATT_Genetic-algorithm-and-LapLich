import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Teacher, Subject, Room, Class, ScheduleGene } from '../types';
import { mockTeachers, mockSubjects, mockRooms, mockClasses } from '../lib/mockData';
import { teachersApi, subjectsApi, roomsApi, classesApi, geneticApi } from '../lib/api';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface DataContextType {
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  classes: Class[];
  bestTimetable: ScheduleGene[] | null;
  addTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => Promise<void>;
  deleteTeacher: (id: string) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  addClass: (classItem: Omit<Class, 'id'>) => Promise<void>;
  updateClass: (id: string, classItem: Partial<Class>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  saveBestTimetable: (timetable: ScheduleGene[]) => void;
  reloadData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [bestTimetable, setBestTimetable] = useState<ScheduleGene[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data from backend
  const loadData = async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping data load');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Đang tải dữ liệu từ backend...');
      console.log('Token:', localStorage.getItem('token')?.substring(0, 30) + '...');
      
      const [teachersData, subjectsData, roomsData, classesData] = await Promise.all([
        teachersApi.getAll(),
        subjectsApi.getAll(),
        roomsApi.getAll(),
        classesApi.getAll(),
      ]);
      
      console.log('Giáo viên đã tải:', teachersData.length);
      console.log('Dữ liệu giáo viên:', teachersData);
      console.log('Môn học đã tải:', subjectsData.length);
      console.log('Phòng học đã tải:', roomsData.length);
      console.log('Lớp học đã tải:', classesData.length);
      
      setTeachers(teachersData);
      setSubjects(subjectsData);
      setRooms(roomsData);
      setClasses(classesData);

      // Không tải best timetable khi khởi động
      setBestTimetable(null);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      toast.error('Không thể tải dữ liệu từ server. Vui lòng đăng nhập lại!');
      // Không dùng mock data - hiển thị lỗi
      setTeachers([]);
      setSubjects([]);
      setRooms([]);
      setClasses([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when authenticated
  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const addTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    console.log('DataContext.addTeacher called with:', teacher);
    try {
      console.log('Calling teachersApi.create...');
      const newTeacher = await teachersApi.create(teacher);
      console.log('Teacher created, response:', newTeacher);
      setTeachers([...teachers, newTeacher]);
      console.log('Teachers state updated');
    } catch (error) {
      console.error('Error adding teacher:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi thêm giảng viên';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateTeacher = async (id: string, teacher: Partial<Teacher>) => {
    console.log('DataContext.updateTeacher called with id:', id, 'data:', teacher);
    try {
      console.log('Calling teachersApi.update...');
      const updatedTeacher = await teachersApi.update(id, teacher);
      console.log('Teacher updated, response:', updatedTeacher);
      setTeachers(teachers.map(t => t.id === id ? updatedTeacher : t));
      console.log('Teachers state updated');
    } catch (error) {
      console.error('Error updating teacher:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi cập nhật giảng viên';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteTeacher = async (id: string) => {
    console.log('DataContext.deleteTeacher called with id:', id);
    try {
      console.log('Calling teachersApi.delete...');
      await teachersApi.delete(id);
      console.log('Teacher deleted');
      setTeachers(teachers.filter(t => t.id !== id));
      console.log('Teachers state updated');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi xóa giảng viên';
      toast.error(errorMessage);
      throw error;
    }
  };

  const addSubject = async (subject: Omit<Subject, 'id'>) => {
    try {
      const newSubject = await subjectsApi.create(subject);
      setSubjects([...subjects, newSubject]);
    } catch (error) {
      console.error('Error adding subject:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi thêm môn học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateSubject = async (id: string, subject: Partial<Subject>) => {
    try {
      const updatedSubject = await subjectsApi.update(id, subject);
      setSubjects(subjects.map(s => s.id === id ? updatedSubject : s));
    } catch (error) {
      console.error('Error updating subject:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi cập nhật môn học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      await subjectsApi.delete(id);
      setSubjects(subjects.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting subject:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi xóa môn học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const addRoom = async (room: Omit<Room, 'id'>) => {
    try {
      const newRoom = await roomsApi.create(room);
      setRooms([...rooms, newRoom]);
    } catch (error) {
      console.error('Error adding room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi thêm phòng học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateRoom = async (id: string, room: Partial<Room>) => {
    try {
      const updatedRoom = await roomsApi.update(id, room);
      setRooms(rooms.map(r => r.id === id ? updatedRoom : r));
    } catch (error) {
      console.error('Error updating room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi cập nhật phòng học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteRoom = async (id: string) => {
    try {
      await roomsApi.delete(id);
      setRooms(rooms.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting room:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi xóa phòng học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const addClass = async (classItem: Omit<Class, 'id'>) => {
    try {
      const newClass = await classesApi.create(classItem);
      setClasses([...classes, newClass]);
    } catch (error) {
      console.error('Error adding class:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi thêm lớp học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const updateClass = async (id: string, classItem: Partial<Class>) => {
    try {
      const updatedClass = await classesApi.update(id, classItem);
      setClasses(classes.map(c => c.id === id ? updatedClass : c));
    } catch (error) {
      console.error('Error updating class:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi cập nhật lớp học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const deleteClass = async (id: string) => {
    try {
      await classesApi.delete(id);
      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      console.error('Error deleting class:', error);
      const errorMessage = error instanceof Error ? error.message : 'Lỗi khi xóa lớp học';
      toast.error(errorMessage);
      throw error;
    }
  };

  const saveBestTimetable = (timetable: ScheduleGene[]) => {
    setBestTimetable(timetable);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003d82] mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <DataContext.Provider
      value={{
        teachers,
        subjects,
        rooms,
        classes,
        bestTimetable,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        addSubject,
        updateSubject,
        deleteSubject,
        addRoom,
        updateRoom,
        deleteRoom,
        addClass,
        updateClass,
        deleteClass,
        saveBestTimetable,
        reloadData: loadData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
