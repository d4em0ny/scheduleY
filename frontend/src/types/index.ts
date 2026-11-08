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
  startSlot: number; // 1 to 8
  slotDuration: number;
}

export interface InterdeptOffer {
  id: string;
  instructorId: string;
  instructorName: string;
  offeredHours: number;
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
  componentType: RoomCategory;
  sectionName: string;
  requiredHours: number;
  requiredQualification: string;
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

