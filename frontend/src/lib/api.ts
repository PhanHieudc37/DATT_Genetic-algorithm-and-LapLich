import { Teacher, Subject, Room, Class } from '../types';
import { toast } from 'sonner';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

console.log('API Base URL:', API_BASE_URL);

// Xử lý 401 Unauthorized - Tự động logout
const handle401Error = () => {
  console.log('Token expired or invalid - Auto logout');
  toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!', {
    duration: 5000,
  });
  
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = '/';
  }, 1500);
};

// Kiểm tra response có lỗi 401 và xử lý
const checkAuthError = (response: Response): Response => {
  if (response.status === 401) {
    console.log('401 Unauthorized detected');
    handle401Error();
    throw new Error('Unauthorized - Token expired');
  }
  return response;
};

// Get token from localStorage
const getToken = () => {
  const token = localStorage.getItem('token');
  console.log('Token:', token ? `${token.substring(0, 20)}...` : 'NOT FOUND');
  return token;
};

const getHeaders = () => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  console.log('Request headers:', Object.keys(headers));
  return headers;
};

// Retry fetch with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      console.log(`Attempt ${i + 1}/${retries + 1}: ${url}`);
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        credentials: 'omit',
      });
      console.log(`Response: ${response.status} ${response.statusText}`);
      
      // Kiểm tra lỗi xác thực
      checkAuthError(response);
      
      return response;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      
      // Don't retry on 401 errors
      if (error instanceof Error && error.message.includes('Unauthorized')) {
        throw error;
      }
      
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  throw new Error('All retry attempts failed');
}

// Safe fetch wrapper with auth check
async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  checkAuthError(response);
  return response;
}

// Teachers API
export const teachersApi = {
  getAll: async (): Promise<Teacher[]> => {
    console.log('Fetching teachers from:', `${API_BASE_URL}/teachers`);
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/teachers`, {
        method: 'GET',
        headers: getHeaders(),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch teachers:', errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Teachers data received:', data.length, 'items');
      console.log('First teacher (raw):', data[0]);
      
      // Map from snake_case to camelCase
      const mappedData = data.map((teacher: any) => ({
        id: teacher.id,
        teacherCode: teacher.teacher_code,
        username: teacher.username,
        password: '', // Don't expose password
        firstName: teacher.first_name,
        lastName: teacher.last_name,
        name: teacher.name,
        phone: teacher.phone,
        email: teacher.email,
        address: teacher.address,
        department: teacher.department,
        subjects: teacher.subjects || [],
        unavailableDays: teacher.unavailable_days || [],
      }));
      
      console.log('First teacher (mapped):', mappedData[0]);
      return mappedData;
    } catch (error) {
      console.error('Fetch error:', error);
      if (error instanceof TypeError) {
        console.error('Network error - Cannot connect to backend at', API_BASE_URL);
        console.error('Make sure backend is running: python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000');
      }
      throw error;
    }
  },

  create: async (teacher: Omit<Teacher, 'id'>): Promise<Teacher> => {
    console.log('teachersApi.create called with:', teacher);
    const requestBody = {
      teacher_code: teacher.teacherCode,
      username: teacher.username,
      password: teacher.password,
      first_name: teacher.firstName,
      last_name: teacher.lastName,
      phone: teacher.phone,
      email: teacher.email,
      address: teacher.address,
      department: teacher.department,
      subjects: teacher.subjects,
      unavailable_days: teacher.unavailableDays,
    };
    console.log('Request body:', requestBody);
    
    const response = await safeFetch(`${API_BASE_URL}/teachers`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error:', errorData);
      throw new Error(errorData.detail || 'Failed to create teacher');
    }
    const data = await response.json();
    console.log('API response data:', data);
    
    return {
      id: data.id,
      teacherCode: data.teacher_code,
      username: data.username,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      department: data.department,
      subjects: data.subjects,
      unavailableDays: data.unavailable_days || [],
    };
  },

  update: async (id: string, teacher: Partial<Teacher>): Promise<Teacher> => {
    console.log('🟨 teachersApi.update called with id:', id, 'data:', teacher);
    const requestBody = {
      teacher_code: teacher.teacherCode,
      username: teacher.username,
      password: teacher.password,
      first_name: teacher.firstName,
      last_name: teacher.lastName,
      phone: teacher.phone,
      email: teacher.email,
      address: teacher.address,
      department: teacher.department,
      subjects: teacher.subjects,
      unavailable_days: teacher.unavailableDays,
    };
    console.log('Request body:', requestBody);
    
    const response = await safeFetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error:', errorData);
      throw new Error(errorData.detail || 'Failed to update teacher');
    }
    const data = await response.json();
    console.log('API response data:', data);
    
    return {
      id: data.id,
      teacherCode: data.teacher_code,
      username: data.username,
      password: data.password,
      firstName: data.first_name,
      lastName: data.last_name,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      department: data.department,
      subjects: data.subjects,
      unavailableDays: data.unavailable_days || [],
    };
  },

  delete: async (id: string): Promise<void> => {
    console.log('🟥 teachersApi.delete called with id:', id);
    const response = await safeFetch(`${API_BASE_URL}/teachers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API error:', errorData);
      throw new Error(errorData.detail || 'Failed to delete teacher');
    }
    console.log('Teacher deleted successfully');
  },
};

// Subjects API
export const subjectsApi = {
  getAll: async (): Promise<Subject[]> => {
    const response = await safeFetch(`${API_BASE_URL}/subjects`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch subjects');
    }
    const data = await response.json();
    // Map from snake_case to camelCase
    return data.map((subject: any) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      credits: subject.credits,
      department: subject.department,
      requiredHours: subject.required_hours,
    }));
  },

  create: async (subject: Omit<Subject, 'id'>): Promise<Subject> => {
    const response = await safeFetch(`${API_BASE_URL}/subjects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        department: subject.department,
        required_hours: subject.requiredHours,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create subject');
    }
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      credits: data.credits,
      department: data.department,
      requiredHours: data.required_hours,
    };
  },

  update: async (id: string, subject: Partial<Subject>): Promise<Subject> => {
    const response = await safeFetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        department: subject.department,
        required_hours: subject.requiredHours,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update subject');
    }
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      code: data.code,
      credits: data.credits,
      department: data.department,
      requiredHours: data.required_hours,
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await safeFetch(`${API_BASE_URL}/subjects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete subject');
    }
  },
};

// Rooms API
export const roomsApi = {
  getAll: async (): Promise<Room[]> => {
    const response = await safeFetch(`${API_BASE_URL}/rooms`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch rooms');
    }
    return response.json();
  },

  create: async (room: Omit<Room, 'id'>): Promise<Room> => {
    const response = await safeFetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(room),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create room');
    }
    return response.json();
  },

  update: async (id: string, room: Partial<Room>): Promise<Room> => {
    const response = await safeFetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(room),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update room');
    }
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await safeFetch(`${API_BASE_URL}/rooms/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete room');
    }
  },
};

// Classes API
export const classesApi = {
  getAll: async (): Promise<Class[]> => {
    const response = await safeFetch(`${API_BASE_URL}/classes`, {
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to fetch classes');
    }
    const data = await response.json();
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      subjectId: item.subject_id,
      teacherId: item.teacher_id,
      numberOfStudents: item.number_of_students,
      sessionsPerWeek: item.sessions_per_week,
      roomType: item.room_type,
    }));
  },

  create: async (classItem: Omit<Class, 'id'>): Promise<Class> => {
    const response = await safeFetch(`${API_BASE_URL}/classes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        name: classItem.name,
        subject_id: classItem.subjectId,
        teacher_id: classItem.teacherId,
        number_of_students: classItem.numberOfStudents,
        sessions_per_week: classItem.sessionsPerWeek,
        room_type: classItem.roomType,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to create class');
    }
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      subjectId: data.subject_id,
      teacherId: data.teacher_id,
      numberOfStudents: data.number_of_students,
      sessionsPerWeek: data.sessions_per_week,
      roomType: data.room_type,
    };
  },

  update: async (id: string, classItem: Partial<Class>): Promise<Class> => {
    const response = await safeFetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({
        name: classItem.name,
        subject_id: classItem.subjectId,
        teacher_id: classItem.teacherId,
        number_of_students: classItem.numberOfStudents,
        sessions_per_week: classItem.sessionsPerWeek,
        room_type: classItem.roomType,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to update class');
    }
    const data = await response.json();
    return {
      id: data.id,
      name: data.name,
      subjectId: data.subject_id,
      teacherId: data.teacher_id,
      numberOfStudents: data.number_of_students,
      sessionsPerWeek: data.sessions_per_week,
      roomType: data.room_type,
    };
  },

  delete: async (id: string): Promise<void> => {
    const response = await safeFetch(`${API_BASE_URL}/classes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete class');
    }
  },
};

// Genetic Algorithm API
export const geneticApi = {
  runAlgorithm: async (config: {
    populationSize: number;
    mutationRate: number;
    crossoverRate: number;
    elitismRate: number;
    maxGenerations: number;
  } | null, saveBest: boolean = false, timetableName?: string): Promise<{
    timetable_id: string | null;
    fitness: number;
    generations: number;
    genes: Array<{
      class_id: string;
      teacher_id: string;
      room_id: string;
      time_slot: { day: number; period: number };
    }>;
    stats: Array<{
      generation: number;
      best_fitness: number;
      best_ever_fitness?: number;
      avg_fitness: number;
      worst_fitness: number;
    }>;
  }> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/genetic/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        config: config ? {
          population_size: config.populationSize,
          mutation_rate: config.mutationRate,
          crossover_rate: config.crossoverRate,
          elitism_rate: config.elitismRate,
          max_generations: config.maxGenerations,
        } : null,
        save_best: saveBest,
        timetable_name: timetableName,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to run genetic algorithm');
    }
    return response.json();
  },

  getTimetables: async (): Promise<Array<{
    id: string;
    name: string;
    fitness: number;
    generation: number;
    config: any;
    created_at: string;
  }>> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/genetic/timetables`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch timetables');
    }
    return response.json();
  },

  getTimetable: async (id: string): Promise<{
    id: string;
    name: string;
    fitness: number;
    generation: number;
    genes: Array<{
      class_id: string;
      teacher_id: string;
      room_id: string;
      time_slot: { day: number; period: number };
    }>;
  }> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/genetic/timetable/${id}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch timetable');
    }
    return response.json();
  },

  getTeacherSchedule: async (timetableId: string): Promise<{
    teacher_id: string;
    teacher_name: string;
    teacher_code: string;
    department: string;
    total_classes: number;
    total_sessions: number;
    genes: Array<{
      class_id: string;
      teacher_id: string;
      room_id: string;
      time_slot: { day: number; period: number };
    }>;
  }> => {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/genetic/timetable/${timetableId}/teacher`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', response.status, errorData);
      throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch teacher schedule`);
    }
    return response.json();
  },

  saveTimetable: async (data: {
    name: string;
    fitness: number;
    generations: number;
    genes: Array<{
      class_id: string;
      teacher_id: string;
      room_id: string;
      time_slot: { day: number; period: number };
    }>;
    config: any;
  }): Promise<{
    timetable_id: string;
    name: string;
    fitness: number;
    genes: Array<{
      class_id: string;
      teacher_id: string;
      room_id: string;
      time_slot: { day: number; period: number };
    }>;
  }> => {
    const response = await fetchWithRetry(`${API_BASE_URL}/genetic/save-timetable`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to save timetable');
    }
    return response.json();
  },

  getBestTimetable: async (): Promise<{
    id: string;
    name: string;
    fitness: number;
    generation: number;
    genes: Array<{
      id: string;
      class_id: string;
      teacher_id: string;
      room_id: string;
      time_slot: { day: number; period: number };
    }>;
  } | null> => {
    try {
      const response = await fetchWithRetry(`${API_BASE_URL}/genetic/best`, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!response.ok) {
        if (response.status === 404) {
          // No timetables found - this is expected when no timetables exist yet
          return null;
        }
        throw new Error('Failed to fetch best timetable');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching best timetable:', error);
      return null;
    }
  },

  deleteTimetable: async (timetableId: string): Promise<void> => {
    const response = await fetchWithRetry(
      `${API_BASE_URL}/genetic/timetable/${timetableId}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Failed to delete timetable');
    }
  },
};

