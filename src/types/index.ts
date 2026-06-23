// User types
export type UserRole = 'admin' | 'truong_nganh' | 'glv' | 'student';

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  avatar?: string;
  studentId?: string;
  birthDate?: string;
  phone?: string;
  address?: string;
}

// Academic year
export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  classCount: number;
  studentCount: number;
}

// Branch (Ngành)
export interface Branch {
  id: string;
  name: string;
  academicYearId: string;
  academicYearName?: string;
  leaderCatechistId?: string | null;
  leaderName?: string | null;
  description?: string | null;
  classCount?: number;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Class (Chi đoàn)
export interface ClassInfo {
  id: string;
  name: string;
  academicYearId: string;
  academicYearName: string;
  branchId?: string | null;
  branchName?: string | null;
  description?: string;
  schedule?: string;
  catechists: User[];
  studentCount: number;
  createdAt: string;
}

// Student
export interface Student {
  id: string;
  studentId: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  phone?: string;
  parentPhone?: string;
  address?: string;
  classId: string;
  className: string;
  branchId?: string | null;
  branchName?: string | null;
  baptismName?: string;
  avatar?: string;
  enrollmentDate: string;
}

// Attendance
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  note?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  date: string;
  week: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  records: AttendanceRecord[];
}

// Mass attendance
export interface MassAttendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string;
  attended: boolean;
  note?: string;
}

// Scores
export interface Score {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  type: 'presentation' | 'semester1' | 'semester2';
  score: number;
  maxScore: number;
  date: string;
  note?: string;
  gradedBy: string;
}

// Learning materials
export interface LearningMaterial {
  id: string;
  classId?: string | null;
  branchId?: string | null;
  branchName?: string | null;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: 'pdf';
  week?: number;
  uploadedBy: string;
  uploadedAt: string;
}

// Dashboard stats
export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalCatechists: number;
  averageAttendance: number;
  todayAttendance?: number;
  upcomingEvents?: number;
}
