export type RoomCategory =
  | 'REGULAR_CLASSROOM'
  | 'LECTURE_HALL'
  | 'COMPUTER_LAB'
  | 'SCIENCE_LAB'
  | 'SEMINAR_ROOM';

export type UserRole = 'UNIVERSITY_ADMIN' | 'DEPARTMENT_CHAIR' | 'INSTRUCTOR';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  departmentCode: string | null;
  departmentName: string | null;
}

export type InterdeptStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface Department {
  id: string;
  code: string;
  name: string;
}

export interface Classroom {
  id: string;
  roomNumber: string;
  buildingCode: string;
  capacity: number;
  category: RoomCategory;
}

export interface StudentSection {
  id: string;
  departmentCode: string;
  programCode: string;
  batchYear: number;
  sectionName: string;
  studentCount: number;
  assignedRoomNumber: string;
  assignedBuilding: string;
}

export interface Instructor {
  id: string;
  departmentCode: string;
  employeeId: string;
  name: string;
  email: string;
  maxWeeklyWorkload: number;
  committedHours: number;
  heldHours: number;
  qualifications: string[];
}

export interface ScheduledSession {
  id: string;
  courseCode: string;
  courseTitle: string;
  componentType: RoomCategory;
  sectionName: string;
  instructorName: string;
  instructorId: string;
  roomNumber: string;
  dayOfWeek: number; // 1 = Mon, 5 = Fri
  startSlot: number; // 1 to 7 (Slots 1-4: 08:00-12:00, Slots 5-7: 14:00-17:00)
  slotDuration: number;
}

export interface TimeSlot {
  dayOfWeek: number; // 1 = Mon .. 5 = Fri
  slot: number; // 1..4 (08:00-12:00), 5..7 (14:00-17:00)
}

export interface InterdeptOffer {
  id: string;
  instructorId: string;
  instructorName: string;
  offeredHours: number;
  availableSlots: TimeSlot[];
  expiresAt: string;
  isActiveHold: boolean;
}

export interface InterdeptRequest {
  id: string;
  requestNumber: string;
  requestingDept: string;
  supplyingDept: string;
  courseCode: string;
  courseTitle: string;
  componentType?: RoomCategory;
  sectionName: string;
  requiredHours?: number;
  requiredQualification?: string;
  status: InterdeptStatus;
  remarks?: string;
  createdAt: string;
  currentOffer?: InterdeptOffer;
}

export interface AllocationRecommendation {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  sectionName: string;
  componentType: RoomCategory;
  requiredHours: number;
  recommendedInstructorId?: string;
  recommendedInstructorName?: string;
  qualificationMatch: boolean;
  utilizationAfter?: number;
  status: 'RECOMMENDED' | 'NO_QUALIFIED_INSTRUCTOR' | 'COMMITTED';
}

export interface CourseOfferingItem {
  id: string;
  departmentCode: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  contactHours: number;
  weeklySessions: number;
  componentType: RoomCategory;
  batchYear: number; // 2024 (Year 1), 2023 (Year 2), 2022 (Year 3), 2021 (Year 4)
  yearLabel: 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4';
  semester: 1 | 2;
  sectionName: string;
  assignedRoomNumber: string;
  assignedInstructorName?: string;
  assignedInstructorId?: string;
  allowedInstructorSlots?: TimeSlot[];
  requiredQualification: string;
}

export type ActiveNavTab =
  | 'timetable'
  | 'courses'
  | 'faculty'
  | 'coordination'
  | 'workload'
  | 'allocations';


