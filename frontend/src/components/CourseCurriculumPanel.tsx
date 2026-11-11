import { useState } from 'react';
import type { CourseOfferingItem, StudentSection, RoomCategory } from '../types';
import {
  GraduationCap,
  BookOpen,
  Plus,
  MapPin,
  Clock,
  UserCheck,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';

interface CourseCurriculumPanelProps {
  courses: CourseOfferingItem[];
  sections: StudentSection[];
  currentDept: string;
  onAddCourse: (newCourse: CourseOfferingItem) => void;
}

interface YearSemesterOption {
  key: string;
  yearLabel: 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4';
  semester: 1 | 2;
  batchYear: number;
  label: string;
  desc: string;
}

const YEAR_SEMESTER_OPTIONS: YearSemesterOption[] = [
  {
    key: 'Year 1|1',
    yearLabel: 'Year 1',
    semester: 1,
    batchYear: 2024,
    label: 'Year 1 Semester 1',
    desc: 'Freshmen Cohort (Batch of 2024) • Semester 1',
  },
  {
    key: 'Year 1|2',
    yearLabel: 'Year 1',
    semester: 2,
    batchYear: 2024,
    label: 'Year 1 Semester 2',
    desc: 'Freshmen Cohort (Batch of 2024) • Semester 2',
  },
  {
    key: 'Year 2|1',
    yearLabel: 'Year 2',
    semester: 1,
    batchYear: 2023,
    label: 'Year 2 Semester 1',
    desc: 'Sophomores Cohort (Batch of 2023) • Semester 1',
  },
  {
    key: 'Year 2|2',
    yearLabel: 'Year 2',
    semester: 2,
    batchYear: 2023,
    label: 'Year 2 Semester 2',
    desc: 'Sophomores Cohort (Batch of 2023) • Semester 2',
  },
  {
    key: 'Year 3|1',
    yearLabel: 'Year 3',
    semester: 1,
    batchYear: 2022,
    label: 'Year 3 Semester 1',
    desc: 'Juniors Cohort (Batch of 2022) • Semester 1',
  },
  {
    key: 'Year 3|2',
    yearLabel: 'Year 3',
    semester: 2,
    batchYear: 2022,
    label: 'Year 3 Semester 2',
    desc: 'Juniors Cohort (Batch of 2022) • Semester 2',
  },
  {
    key: 'Year 4|1',
    yearLabel: 'Year 4',
    semester: 1,
    batchYear: 2021,
    label: 'Year 4 Semester 1',
    desc: 'Graduating Seniors (Batch of 2021) • Semester 1',
  },
  {
    key: 'Year 4|2',
    yearLabel: 'Year 4',
    semester: 2,
    batchYear: 2021,
    label: 'Year 4 Semester 2',
    desc: 'Graduating Seniors (Batch of 2021) • Semester 2',
  },
];

export const CourseCurriculumPanel: React.FC<CourseCurriculumPanelProps> = ({
  courses,
  sections,
  currentDept,
  onAddCourse,
}) => {
  const [selectedYearSemKey, setSelectedYearSemKey] = useState<string>('Year 1|1');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const activeOption =
    YEAR_SEMESTER_OPTIONS.find((o) => o.key === selectedYearSemKey) || YEAR_SEMESTER_OPTIONS[0];

  // Form states for entering a new course offering
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formYearSemKey, setFormYearSemKey] = useState<string>(selectedYearSemKey);
  const [formSectionName, setFormSectionName] = useState(
    sections.find((s) => currentDept === 'ALL' || s.departmentCode === currentDept)?.sectionName ||
      'CS-Year 1 Sec A'
  );
  const [formComponentType, setFormComponentType] = useState<RoomCategory>('REGULAR_CLASSROOM');
  const [formContactHours, setFormContactHours] = useState(3.0);
  const [formWeeklySessions, setFormWeeklySessions] = useState(3);
  const [formCreditHours, setFormCreditHours] = useState(3.0);
  const [formRequiredSkill, setFormRequiredSkill] = useState('PROGRAMMING');

  // Filter courses by department scope
  const deptCourses = courses.filter(
    (c) => currentDept === 'ALL' || c.departmentCode === currentDept
  );

  // Filter courses by selected student year AND semester
  const yearSemesterCourses = deptCourses.filter(
    (c) => c.yearLabel === activeOption.yearLabel && c.semester === activeOption.semester
  );

  // Available sections scoped by department
  const scopedSections = sections.filter(
    (s) => currentDept === 'ALL' || s.departmentCode === currentDept
  );

  // Handle submit new course offering
  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formTitle) return;

    const formOption =
      YEAR_SEMESTER_OPTIONS.find((o) => o.key === formYearSemKey) || YEAR_SEMESTER_OPTIONS[0];

    const matchedSec = sections.find((s) => s.sectionName === formSectionName);
    const roomToAssign =
      formComponentType === 'COMPUTER_LAB'
        ? 'ENG-1 Lab 201'
        : matchedSec?.assignedRoomNumber
        ? `${matchedSec.assignedBuilding} ${matchedSec.assignedRoomNumber}`
        : 'ENG-1 Room 101';

    const newCourseItem: CourseOfferingItem = {
      id: `course-${Date.now()}`,
      courseCode: formCode.trim().toUpperCase(),
      courseTitle: formTitle.trim(),
      departmentCode: currentDept !== 'ALL' ? currentDept : matchedSec?.departmentCode || 'CS',
      batchYear: formOption.batchYear,
      yearLabel: formOption.yearLabel,
      semester: formOption.semester,
      sectionName: formSectionName,
      componentType: formComponentType,
      contactHours: formContactHours,
      weeklySessions: formWeeklySessions,
      creditHours: formCreditHours,
      requiredQualification: formRequiredSkill.trim().toUpperCase(),
      assignedRoomNumber: roomToAssign,
      assignedInstructorName: undefined,
    };

    onAddCourse(newCourseItem);
    setSelectedYearSemKey(formOption.key);
    setIsAddModalOpen(false);

    // Reset
    setFormCode('');
    setFormTitle('');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="card-edge-gradient bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0088D9] text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-[#0088D9]" />
            <span>Academic Curriculum & Course Offerings</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {currentDept === 'ALL'
              ? 'University Student Courses'
              : `${currentDept} Department Courses by Year & Semester`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure course components, weekly contact hours, and permanent classroom allocations by academic year and semester.
          </p>
        </div>

        <button
          onClick={() => {
            setFormYearSemKey(selectedYearSemKey);
            if (scopedSections.length > 0 && !scopedSections.some((s) => s.sectionName === formSectionName)) {
              setFormSectionName(scopedSections[0].sectionName);
            }
            setIsAddModalOpen(true);
          }}
          className="btn-primary-gradient flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Course ({activeOption.label})</span>
        </button>
      </div>

      {/* Year & Semester Dropdown Selector Bar */}
      <div className="card-edge-subtle bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <GraduationCap className="w-4 h-4 text-[#0088D9]" />
            <span>Academic Year & Semester:</span>
          </div>

          <div className="relative w-full sm:w-80">
            <select
              aria-label="Select Year and Semester"
              value={selectedYearSemKey}
              onChange={(e) => setSelectedYearSemKey(e.target.value)}
              className="w-full appearance-none bg-[#f4f6f9] hover:bg-white border border-slate-200 hover:border-[#3C8DBC] rounded-xl pl-3.5 pr-9 py-2 text-xs font-bold text-[#0073B7] focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 transition-all cursor-pointer shadow-2xs"
            >
              {YEAR_SEMESTER_OPTIONS.map((opt) => {
                const count = deptCourses.filter(
                  (c) => c.yearLabel === opt.yearLabel && c.semester === opt.semester
                ).length;
                return (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} ({count} {count === 1 ? 'course' : 'courses'})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="w-4 h-4 text-[#0088D9] pointer-events-none absolute right-3 top-2.5" />
          </div>
        </div>

        {/* Cohort Metadata & Totals */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <span className="badge-primary-soft px-2.5 py-1 rounded-lg font-semibold">
            {activeOption.desc}
          </span>
          <div>
            Offerings:{' '}
            <strong className="text-[#0088D9] font-bold">
              {yearSemesterCourses.length} {yearSemesterCourses.length === 1 ? 'course' : 'courses'}
            </strong>
          </div>
          <div>
            Weekly Contact Load:{' '}
            <strong className="text-[#3C8DBC] font-bold">
              {yearSemesterCourses.reduce((acc, c) => acc + c.contactHours, 0).toFixed(1)} hrs
            </strong>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {yearSemesterCourses.length === 0 ? (
          <div className="card-edge-gradient bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">
              No courses entered yet for {activeOption.label}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Click the "Enter Course ({activeOption.label})" button above to add course offerings for this term.
            </p>
          </div>
        ) : (
          yearSemesterCourses.map((crs) => (
            <div
              key={crs.id}
              className="card-edge-gradient bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#0088D9]/50 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Left: Code, Title, Section */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge-primary-soft font-mono text-sm font-bold px-2.5 py-0.5 rounded-lg">
                    {crs.courseCode}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{crs.courseTitle}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f4f6f9] text-slate-700 font-semibold border border-slate-200">
                    {crs.sectionName}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#D2D6DE]/50 text-slate-700 font-semibold">
                    {crs.yearLabel} • Sem {crs.semester}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0088D9]" />
                    <span className="font-medium text-slate-700">{crs.assignedRoomNumber}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#3C8DBC]" />
                    <span>
                      {crs.contactHours} hrs/week ({crs.weeklySessions} session{crs.weeklySessions > 1 ? 's' : ''})
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    Credit: <strong className="text-slate-800">{crs.creditHours} hrs</strong>
                  </span>
                  <span>•</span>
                  <span className="capitalize font-medium text-slate-700">
                    {crs.componentType === 'COMPUTER_LAB' ? 'Computer Lab' : 'Lecture'}
                  </span>
                </div>
              </div>

              {/* Right: Faculty & Qualification */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Assigned Faculty:
                  </span>
                  {crs.assignedInstructorName ? (
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#00A65A] flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{crs.assignedInstructorName}</span>
                      </span>
                      {crs.allowedInstructorSlots && crs.allowedInstructorSlots.length > 0 && (
                        <span className="mt-0.5 inline-flex items-center space-x-1 text-[10px] font-semibold text-[#0073B7]">
                          <ShieldCheck className="w-3 h-3 text-[#00A65A]" />
                          <span>{crs.allowedInstructorSlots.length} conflict-free slots granted</span>
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-amber-600 italic font-semibold">Pending Assignment</span>
                  )}
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-3">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">
                    Required Skill:
                  </span>
                  <span className="badge-primary-soft font-mono text-xs font-bold px-2 py-0.5 rounded-md">
                    {crs.requiredQualification}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ENTER COURSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="card-edge-gradient bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="p-2 rounded-xl badge-primary-soft">
                <BookOpen className="w-5 h-5 text-[#0088D9]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Enter Course Offering
                </h3>
                <p className="text-xs text-slate-500">
                  Register curriculum course, academic year & semester, and room allocation.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitCourse} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Target Year & Semester:
                </label>
                <select
                  value={formYearSemKey}
                  onChange={(e) => setFormYearSemKey(e.target.value)}
                  className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-[#0073B7] focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-bold"
                >
                  {YEAR_SEMESTER_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-201"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Data Structures & Algorithms"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Section:</label>
                  <select
                    value={formSectionName}
                    onChange={(e) => setFormSectionName(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-semibold"
                  >
                    {(scopedSections.length > 0 ? scopedSections : sections).map((s) => (
                      <option key={s.id} value={s.sectionName}>
                        {s.sectionName} (Room {s.assignedRoomNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Component Type:</label>
                  <select
                    value={formComponentType}
                    onChange={(e) => setFormComponentType(e.target.value as RoomCategory)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-semibold"
                  >
                    <option value="REGULAR_CLASSROOM">Regular Lecture (Fixed Classroom)</option>
                    <option value="COMPUTER_LAB">Computer Lab (Dedicated Lab 201)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Weekly Hours:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={formContactHours}
                    onChange={(e) => setFormContactHours(parseFloat(e.target.value) || 3)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Sessions / Week:</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formWeeklySessions}
                    onChange={(e) => setFormWeeklySessions(parseInt(e.target.value) || 3)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-[#0088D9] focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Credit Units:</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formCreditHours}
                    onChange={(e) => setFormCreditHours(parseFloat(e.target.value) || 3)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Required Instructor Qualification:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ALGORITHMS or SYSTEMS"
                  value={formRequiredSkill}
                  onChange={(e) => setFormRequiredSkill(e.target.value)}
                  className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D2D6DE]/60 hover:bg-[#D2D6DE] text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Confirm Offering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
