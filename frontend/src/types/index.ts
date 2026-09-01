export interface Teacher {
  id: string;
  teacherCode: string; // Mã GV
  username: string; // Tài khoản
  password: string; // Mật khẩu
  firstName: string; // Tên
  lastName: string; // Họ
  name: string; // Họ và tên (computed from firstName + lastName)
  phone: string; // SDT
  email: string;
  address: string; // Địa chỉ
  department: string; // Bộ môn
  subjects: string[]; // subject IDs
  unavailableDays?: number[]; // Ngày không rảnh (0=T2, 1=T3, ..., 5=T7)
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  department: string; // Bộ môn
  requiredHours: number; // hours per week
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'theory' | 'lab' | 'both';
}

export interface Class {
  id: string;
  name: string;
  subjectId: string;
  teacherId?: string; // Optional - backend auto-assigns based on subject
  numberOfStudents: number;
  sessionsPerWeek: number;
  roomType?: 'theory' | 'lab' | 'both'; // Loại phòng yêu cầu
}

export interface TimeSlot {
  day: number; // 0-5 (Monday-Saturday)
  period: number; // 0-14 (15 periods per day)
}

export interface ScheduleGene {
  classId: string;
  teacherId: string;
  roomId: string;
  timeSlot: TimeSlot;
}

export interface Individual {
  id: string;
  genes: ScheduleGene[];
  fitness: number;
}

export interface GeneticAlgorithmConfig {
  populationSize: number;
  mutationRate: number;
  crossoverRate: number;
  elitismRate: number;
  maxGenerations: number;
}

export interface GenerationStats {
  generation: number;
  bestFitness: number;
  bestEverFitness?: number;  // Track best fitness ever found
  avgFitness: number;
  worstFitness: number;
}
