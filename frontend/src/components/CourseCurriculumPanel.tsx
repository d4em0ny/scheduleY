import { useState } from 'react';
import type { CourseOfferingItem, StudentSection, RoomCategory } from '../types';
import {
  BookOpen,
  GraduationCap,
  Plus,
  Clock,
  MapPin,
  UserCheck,
} from 'lucide-react';

interface CourseCurriculumPanelProps {
  courses: CourseOfferingItem[];
  sections: StudentSection[];
  currentDept: string;
  onAddCourse: (newCourse: CourseOfferingItem) => void;
}

type YearTab = 'Year 1' | 'Year 2' | 'Year 3' | 'Year 4';

const YEAR_TABS: { label: YearTab; batch: number; desc: string }[] = [
  { label: 'Year 1', batch: 2024, desc: 'Freshmen Cohort (2024 Batch)' },
  { label: 'Year 2', batch: 2023, desc: 'Sophomore Cohort (2023 Batch)' },
  { label: 'Year 3', batch: 2022, desc: 'Junior Cohort (2022 Batch)' },
  { label: 'Year 4', batch: 2021, desc: 'Senior Cohort (2021 Batch)' },
];

export const CourseCurriculumPanel: React.FC<CourseCurriculumPanelProps> = ({
  courses,
  sections,
  currentDept,
  onAddCourse,
}) => {
  const [selectedYear, setSelectedYear] = useState<YearTab>('Year 1');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [formYear, setFormYear] = useState<YearTab>(selectedYear);
  const [formCode, setFormCode] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCreditHours, setFormCreditHours] = useState(3.0);
  const [formContactHours, setFormContactHours] = useState(3.0);
  const [formSessions, setFormSessions] = useState(2);
  const [formComponentType, setFormComponentType] = useState<RoomCategory>('REGULAR_CLASSROOM');
  const [formQual, setFormQual] = useState('SYSTEMS');
  const [formSectionName, setFormSectionName] = useState('');

  // Department filter
  const deptCourses = courses.filter(
    (c) => currentDept === 'ALL' || c.departmentCode === currentDept
  );

  // Filter by selected student year
  const yearCourses = deptCourses.filter((c) => c.yearLabel === selectedYear);

  // Scoped sections for active department and year
  const activeBatchYear = YEAR_TABS.find((y) => y.label === selectedYear)?.batch || 2024;
  const yearSections = sections.filter(
    (s) =>
      (currentDept === 'ALL' || s.departmentCode === currentDept) &&
      s.batchYear === activeBatchYear
  );

  const handleSubmitNewCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode || !formTitle) return;

    const targetYearObj = YEAR_TABS.find((y) => y.label === formYear);
    const batchYear = targetYearObj ? targetYearObj.batch : 2024;

    // Target section
    const matchingSection = sections.find(
      (s) =>
        (currentDept === 'ALL' || s.departmentCode === currentDept) &&
        s.batchYear === batchYear
    );

    const targetSectionName =
      formSectionName ||
      (matchingSection ? matchingSection.sectionName : `${currentDept !== 'ALL' ? currentDept : 'CS'}-${formYear} Sec A`);
    const assignedRoom = matchingSection
      ? `ENG-1 ${matchingSection.assignedRoomNumber}`
      : 'ENG-1 Room 101';

    const newCourseItem: CourseOfferingItem = {
      id: `crs-${Date.now()}`,
      departmentCode: currentDept !== 'ALL' ? currentDept : 'CS',
      courseCode: formCode.trim().toUpperCase(),
      courseTitle: formTitle.trim(),
      creditHours: formCreditHours,
      contactHours: formContactHours,
      weeklySessions: formSessions,
      componentType: formComponentType,
      batchYear: batchYear,
      yearLabel: formYear,
      sectionName: targetSectionName,
      assignedRoomNumber: assignedRoom,
      requiredQualification: formQual.trim().toUpperCase(),
    };

    onAddCourse(newCourseItem);
    setIsAddModalOpen(false);

    // Reset
    setFormCode('');
    setFormTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4" />
            <span>Academic Curriculum & Course Offerings</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {currentDept === 'ALL' ? 'University Student Courses' : `${currentDept} Department Courses by Year`}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure course components, weekly contact hours, and permanent lecture room allocations by student year.
          </p>
        </div>

        <button
          onClick={() => {
            setFormYear(selectedYear);
            setIsAddModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enter Course for {selectedYear}</span>
        </button>
      </div>

      {/* Year Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl">
        {YEAR_TABS.map((yt) => {
          const isSelected = selectedYear === yt.label;
          const count = deptCourses.filter((c) => c.yearLabel === yt.label).length;

          return (
            <button
              key={yt.label}
              onClick={() => setSelectedYear(yt.label)}
              className={`flex-1 sm:flex-none flex items-center justify-between sm:justify-center space-x-2.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <GraduationCap className="w-4 h-4" />
                <span>{yt.label}</span>
              </div>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-indigo-800/80 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Cohort Summary Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Target Student Cohort:</span>
          <span className="font-bold text-slate-200">
            {YEAR_TABS.find((y) => y.label === selectedYear)?.desc}
          </span>
        </div>

        <div className="flex items-center space-x-4 text-slate-400">
          <div>
            Total Offerings: <strong className="text-indigo-400">{yearCourses.length} courses</strong>
          </div>
          <div>
            Total Weekly Contact:{' '}
            <strong className="text-cyan-400">
              {yearCourses.reduce((acc, c) => acc + c.contactHours, 0).toFixed(1)} hrs
            </strong>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div className="space-y-3">
        {yearCourses.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300">No courses entered yet for {selectedYear}</p>
            <p className="text-xs text-slate-500 mt-1">
              Click the "Enter Course for {selectedYear}" button above to add course offerings for this student cohort.
            </p>
          </div>
        ) : (
          yearCourses.map((crs) => (
            <div
              key={crs.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Left: Code, Title, Section */}
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2.5">
                  <span className="font-mono text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700/60">
                    {crs.courseCode}
                  </span>
                  <span className="font-bold text-slate-100 text-sm">{crs.courseTitle}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20">
                    {crs.sectionName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{crs.assignedRoomNumber}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {crs.contactHours} hrs/week ({crs.weeklySessions} session{crs.weeklySessions > 1 ? 's' : ''})
                    </span>
                  </div>
                  <span>•</span>
                  <span>
                    Credit: <strong className="text-slate-300">{crs.creditHours} hrs</strong>
                  </span>
                  <span>•</span>
                  <span className="capitalize text-slate-300">
                    {crs.componentType === 'COMPUTER_LAB' ? 'Computer Lab' : 'Lecture'}
                  </span>
                </div>
              </div>

              {/* Right: Faculty & Qualification */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Faculty:</span>
                  {crs.assignedInstructorName ? (
                    <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>{crs.assignedInstructorName}</span>
                    </span>
                  ) : (
                    <span className="text-amber-400 italic font-medium">Pending Assignment</span>
                  )}
                </div>

                <div className="sm:border-l sm:border-slate-800 sm:pl-3">
                  <span className="text-[10px] text-slate-500 block uppercase font-semibold">Required Tag:</span>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Enter Course Offering for {formYear}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Specify course details, contact hours, and target student cohort
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewCourse} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Student Year / Cohort:</label>
                  <select
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value as YearTab)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    {YEAR_TABS.map((yt) => (
                      <option key={yt.label} value={yt.label}>
                        {yt.label} ({yt.desc})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Room Category:</label>
                  <select
                    value={formComponentType}
                    onChange={(e) => setFormComponentType(e.target.value as RoomCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="REGULAR_CLASSROOM">Lecture (Assigned Section Room)</option>
                    <option value="COMPUTER_LAB">Computer Lab (Lab 201)</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="SEMINAR_ROOM">Seminar Room</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Target Student Section:</label>
                <select
                  value={formSectionName}
                  onChange={(e) => setFormSectionName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  <option value="">Auto-Assign to First Section</option>
                  {yearSections.map((s) => (
                    <option key={s.id} value={s.sectionName}>
                      {s.sectionName} (Permanent Room {s.assignedRoomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-205"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Course Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Architecture & Design"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Credit Hours:</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    step="0.5"
                    required
                    value={formCreditHours}
                    onChange={(e) => setFormCreditHours(parseFloat(e.target.value) || 3)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Weekly Contact Hrs:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    required
                    value={formContactHours}
                    onChange={(e) => setFormContactHours(parseFloat(e.target.value) || 3)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold text-indigo-300"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Sessions / Week:</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    required
                    value={formSessions}
                    onChange={(e) => setFormSessions(parseInt(e.target.value) || 2)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Required Instructor Specialization Tag:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SYSTEMS, ARCHITECTURE, ALGORITHMS"
                  value={formQual}
                  onChange={(e) => setFormQual(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  Save Course Offering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
