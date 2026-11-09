import { useState } from 'react';
import type { CourseOfferingItem, StudentSection, RoomCategory } from '../types';
import {
  GraduationCap,
  BookOpen,
  Plus,
  MapPin,
  Clock,
  UserCheck,
} from 'lucide-react';

interface CourseCurriculumPanelProps {
  courses: CourseOfferingItem[];
  sections: StudentSection[];
  currentDept: string;
  onAddCourse: (newCourse: CourseOfferingItem) => void;
}

const YEAR_TABS: Array<{ label: 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4'; desc: string }> = [
  { label: 'Year 1', desc: 'Freshmen Cohort (Batch of 2024)' },
  { label: 'Year 2', desc: 'Sophomores Cohort (Batch of 2023)' },
  { label: 'Year 3', desc: 'Juniors Cohort (Batch of 2022)' },
  { label: 'Year 4', desc: 'Graduating Seniors (Batch of 2021)' },
];

export const CourseCurriculumPanel: React.FC<CourseCurriculumPanelProps> = ({
  courses,
  sections,
  currentDept,
  onAddCourse,
}) => {
  const [selectedYear, setSelectedYear] = useState<'Year 1' | 'Year 2' | 'Year 3' | 'Year 4'>('Year 1');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for entering a new course offering
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState<'Year 1' | 'Year 2' | 'Year 3' | 'Year 4'>(selectedYear);
  const [formSectionName, setFormSectionName] = useState('CS-Year 1 Sec A');
  const [formComponentType, setFormComponentType] = useState<RoomCategory>('REGULAR_CLASSROOM');
  const [formContactHours, setFormContactHours] = useState(3.0);
  const [formWeeklySessions, setFormWeeklySessions] = useState(3);
  const [formCreditHours, setFormCreditHours] = useState(3.0);
  const [formRequiredSkill, setFormRequiredSkill] = useState('PROGRAMMING');

  // Filter courses by department scope
  const deptCourses = courses.filter(
    (c) => currentDept === 'ALL' || c.departmentCode === currentDept
  );

  // Filter courses by selected student year
  const yearCourses = deptCourses.filter((c) => c.yearLabel === selectedYear);

  // Handle submit new course offering
  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formTitle) return;

    const matchedSec = sections.find((s) => s.sectionName === formSectionName);
    const roomToAssign =
      formComponentType === 'COMPUTER_LAB'
        ? 'ENG-1 Lab 201'
        : matchedSec?.assignedRoomNumber
        ? `ENG-1 ${matchedSec.assignedRoomNumber}`
        : 'ENG-1 Room 101';

    const batchYearMap: Record<'Year 1' | 'Year 2' | 'Year 3' | 'Year 4', number> = {
      'Year 1': 2024,
      'Year 2': 2023,
      'Year 3': 2022,
      'Year 4': 2021,
    };

    const newCourseItem: CourseOfferingItem = {
      id: `course-${Date.now()}`,
      courseCode: formCode.trim().toUpperCase(),
      courseTitle: formTitle.trim(),
      departmentCode: currentDept !== 'ALL' ? currentDept : 'CS',
      batchYear: batchYearMap[formYear],
      yearLabel: formYear,
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
          <div className="flex items-center space-x-2 text-[#0e0447] text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-[#0e0447]" />
            <span>Academic Curriculum & Course Offerings</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {currentDept === 'ALL' ? 'University Student Courses' : `${currentDept} Department Courses by Year`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure course components, weekly contact hours, and permanent lecture room allocations by student year.
          </p>
        </div>

        <button
          onClick={() => {
            setFormYear(selectedYear);
            setIsAddModalOpen(true);
          }}
          className="btn-navy-gradient flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Course for {selectedYear}</span>
        </button>
      </div>

      {/* Year Tabs */}
      <div className="card-edge-subtle flex flex-wrap items-center gap-2 p-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
        {YEAR_TABS.map((yt) => {
          const isSelected = selectedYear === yt.label;
          const count = deptCourses.filter((c) => c.yearLabel === yt.label).length;

          return (
            <button
              key={yt.label}
              onClick={() => setSelectedYear(yt.label)}
              className={`flex-1 sm:flex-none flex items-center justify-between sm:justify-center space-x-2.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'tab-navy-active shadow-xs'
                  : 'text-slate-600 hover:text-[#0e0447] hover:bg-[#f5f5f7]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span>{yt.label}</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cohort Summary Bar */}
      <div className="card-edge-subtle bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Target Student Cohort:</span>
          <span className="font-bold text-slate-800">
            {YEAR_TABS.find((y) => y.label === selectedYear)?.desc}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-slate-500">
          <div>
            Total Offerings: <strong className="text-[#0e0447] font-bold">{yearCourses.length} courses</strong>
          </div>
          <div>
            Weekly Contact Load:{' '}
            <strong className="text-cyan-700 font-bold">
              {yearCourses.reduce((acc, c) => acc + c.contactHours, 0).toFixed(1)} hrs
            </strong>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {yearCourses.length === 0 ? (
          <div className="card-edge-gradient bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">No courses entered yet for {selectedYear}</p>
            <p className="text-xs text-slate-400 mt-1">
              Click the "Enter Course for {selectedYear}" button above to add course offerings for this student cohort.
            </p>
          </div>
        ) : (
          yearCourses.map((crs) => (
            <div
              key={crs.id}
              className="card-edge-gradient bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#0e0447]/40 hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Left: Code, Title, Section */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2.5">
                  <span className="badge-navy-gradient font-mono text-sm font-bold text-[#0e0447] px-2.5 py-0.5 rounded-lg">
                    {crs.courseCode}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">{crs.courseTitle}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#f5f5f7] text-slate-700 font-semibold border border-slate-200">
                    {crs.sectionName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#0e0447]" />
                    <span className="font-medium text-slate-700">{crs.assignedRoomNumber}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#0e0447]" />
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
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Assigned Faculty:</span>
                  {crs.assignedInstructorName ? (
                    <span className="font-semibold text-emerald-700 flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{crs.assignedInstructorName}</span>
                    </span>
                  ) : (
                    <span className="text-amber-700 italic font-semibold">Pending Assignment</span>
                  )}
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-3">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Required Skill:</span>
                  <span className="badge-navy-gradient font-mono text-xs font-bold px-2 py-0.5 rounded-md text-[#0e0447]">
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
              <div className="p-2 rounded-xl badge-navy-gradient text-[#0e0447]">
                <BookOpen className="w-5 h-5 text-[#0e0447]" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Enter Course Offering for {formYear}
                </h3>
                <p className="text-xs text-slate-500">
                  Register curriculum course, contact hours, and section allocation.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitCourse} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-201"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 font-mono font-bold"
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
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Section:</label>
                  <select
                    value={formSectionName}
                    onChange={(e) => setFormSectionName(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 font-semibold"
                  >
                    {sections.map((s) => (
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
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 font-semibold"
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
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 font-bold"
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
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 font-bold text-[#0e0447]"
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
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 font-bold"
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
                  className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-navy-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
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
