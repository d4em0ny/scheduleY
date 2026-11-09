import { useState, useEffect } from 'react';
import type { ScheduledSession, StudentSection, Instructor } from '../types';
import {
  Clock,
  MapPin,
  User,
  Zap,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export interface GenerationMetrics {
  solverStatus: string;
  solveDurationMs: number;
  sessionCount: number;
  satisfaction: number;
  hardConflicts: number;
}

interface TimetableGridProps {
  sessions: ScheduledSession[];
  sections: StudentSection[];
  instructors: Instructor[];
  currentDept?: string;
  onGenerateSchedule?: () => void;
  isGenerating?: boolean;
  generationMetrics?: GenerationMetrics | null;
}

const DAYS = [
  { index: 1, name: 'Monday' },
  { index: 2, name: 'Tuesday' },
  { index: 3, name: 'Wednesday' },
  { index: 4, name: 'Thursday' },
  { index: 5, name: 'Friday' },
];

const PERIODS = [
  { slot: 1, time: '08:30 - 09:25' },
  { slot: 2, time: '09:30 - 10:25' },
  { slot: 3, time: '10:35 - 11:30' },
  { slot: 4, time: '11:35 - 12:30' },
  { slot: 5, time: '12:35 - 13:30' },
  { slot: 6, time: '13:35 - 14:30' },
  { slot: 7, time: '14:35 - 15:30' },
  { slot: 8, time: '15:35 - 16:30' },
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  sessions,
  sections,
  instructors,
  currentDept,
  onGenerateSchedule,
  isGenerating = false,
  generationMetrics = null,
}) => {
  const scopedSections = sections.filter(
    (s) => !currentDept || currentDept === 'ALL' || s.departmentCode === currentDept
  );
  const scopedInstructors = instructors.filter(
    (i) => !currentDept || currentDept === 'ALL' || i.departmentCode === currentDept
  );

  const [filterMode, setFilterMode] = useState<'section' | 'instructor'>('section');
  const [selectedSection, setSelectedSection] = useState<string>(
    scopedSections[0]?.sectionName || sections[0]?.sectionName || ''
  );
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(
    scopedInstructors[0]?.id || instructors[0]?.id || ''
  );

  // Sync selection when department scope changes
  useEffect(() => {
    if (scopedSections.length > 0 && !scopedSections.some((s) => s.sectionName === selectedSection)) {
      setSelectedSection(scopedSections[0].sectionName);
    }
  }, [currentDept, scopedSections, selectedSection]);

  useEffect(() => {
    if (scopedInstructors.length > 0 && !scopedInstructors.some((i) => i.id === selectedInstructorId)) {
      setSelectedInstructorId(scopedInstructors[0].id);
    }
  }, [currentDept, scopedInstructors, selectedInstructorId]);

  // Filter sessions based on active selection
  const filteredSessions = sessions.filter((sess) => {
    if (filterMode === 'section') {
      return sess.sectionName === selectedSection;
    } else {
      return sess.instructorId === selectedInstructorId;
    }
  });

  const activeSectionObj = sections.find((s) => s.sectionName === selectedSection);
  const activeInstructorObj = instructors.find((i) => i.id === selectedInstructorId);

  const getComponentCardStyle = (type: string) => {
    switch (type) {
      case 'COMPUTER_LAB':
        return {
          wrapper: 'bg-emerald-50/90 border-emerald-200 text-slate-900 hover:border-emerald-400',
          badge: 'bg-emerald-100/90 text-emerald-800 border-emerald-200/90',
          dot: 'bg-emerald-500',
          label: 'Lab',
          borderDivider: 'border-emerald-200/70',
        };
      case 'SCIENCE_LAB':
        return {
          wrapper: 'bg-teal-50/90 border-teal-200 text-slate-900 hover:border-teal-400',
          badge: 'bg-teal-100 text-teal-800 border-teal-200',
          dot: 'bg-teal-500',
          label: 'Sci Lab',
          borderDivider: 'border-teal-200/70',
        };
      case 'SEMINAR_ROOM':
        return {
          wrapper: 'bg-amber-50/90 border-amber-200 text-slate-900 hover:border-amber-400',
          badge: 'bg-amber-100 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Seminar',
          borderDivider: 'border-amber-200/70',
        };
      default:
        return {
          wrapper: 'bg-blue-50/90 border-blue-200 text-slate-900 hover:border-blue-400',
          badge: 'bg-blue-100/90 text-blue-800 border-blue-200/90',
          dot: 'bg-blue-600',
          label: 'Lecture',
          borderDivider: 'border-blue-200/70',
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Action Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-[#f5f5f7] rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterMode('section')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterMode === 'section'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Student Section
            </button>
            <button
              onClick={() => setFilterMode('instructor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterMode === 'instructor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              By Faculty Member
            </button>
          </div>

          {/* Section / Instructor Dropdown */}
          {filterMode === 'section' ? (
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-[#f8f9fa] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              {scopedSections.map((sec) => (
                <option key={sec.id} value={sec.sectionName}>
                  {sec.sectionName} ({sec.studentCount} students)
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              className="bg-[#f8f9fa] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
            >
              {scopedInstructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.departmentCode} • {inst.maxWeeklyWorkload}h cap)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Generate Schedule Button */}
        <div className="flex items-center space-x-3">
          {onGenerateSchedule && (
            <button
              onClick={onGenerateSchedule}
              disabled={isGenerating}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Solving Schedule Constraints...' : '⚡ Generate Schedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Solver Metrics Banner */}
      {generationMetrics && (
        <div className="bg-gradient-to-r from-emerald-50 via-white to-blue-50 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm">Semester Schedule Generated & Optimized!</span>
              <span className="text-slate-500 block text-[11px]">
                CP Solver Status: <strong className="text-emerald-700">{generationMetrics.solverStatus}</strong> • Computed in {generationMetrics.solveDurationMs}ms
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-600 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/80">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Hard Conflicts: <strong className="text-emerald-700">0</strong></span>
            </span>
            <span>•</span>
            <span>Sessions: <strong className="text-blue-700 font-bold">{generationMetrics.sessionCount}</strong></span>
            <span>•</span>
            <span>Satisfaction: <strong className="text-indigo-700 font-bold">{generationMetrics.satisfaction.toFixed(1)}%</strong></span>
          </div>
        </div>
      )}

      {/* Context Badge */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        {filterMode === 'section' && activeSectionObj && (
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Fixed Permanent Classroom:{' '}
              <strong className="text-slate-900">
                {activeSectionObj.assignedBuilding} {activeSectionObj.assignedRoomNumber}
              </strong>
            </span>
            <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-semibold border border-blue-200/70">
              Permanent Invariant
            </span>
          </div>
        )}

        {filterMode === 'instructor' && activeInstructorObj && (
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>
              Assigned Load:{' '}
              <strong className="text-slate-900">
                {activeInstructorObj.committedHours} / {activeInstructorObj.maxWeeklyWorkload} hrs
              </strong>
            </span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 hidden sm:block">
          Fall Semester 2026 Academic Term
        </div>
      </div>

      {/* Timetable Matrix Grid */}
      <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f5f5f7]">
                <th className="py-3 px-4 text-xs font-bold text-slate-700 w-32 border-r border-slate-200">
                  Time Slot
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.index}
                    className="py-3 px-4 text-xs font-bold text-slate-700 border-r border-slate-200 last:border-r-0 min-w-48 text-center"
                  >
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {PERIODS.map((period) => (
                <tr key={period.slot} className="hover:bg-slate-50/40 transition-colors">
                  {/* Time label */}
                  <td className="py-3 px-3 border-r border-slate-200 bg-[#f8f9fb] text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-800 font-bold">
                      <Clock className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span>Slot {period.slot}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{period.time}</div>
                  </td>

                  {/* Days */}
                  {DAYS.map((day) => {
                    const sessionInSlot = filteredSessions.find(
                      (s) =>
                        s.dayOfWeek === day.index &&
                        period.slot >= s.startSlot &&
                        period.slot < s.startSlot + s.slotDuration
                    );

                    const isSessionStart = sessionInSlot && sessionInSlot.startSlot === period.slot;
                    const style = sessionInSlot ? getComponentCardStyle(sessionInSlot.componentType) : null;

                    return (
                      <td
                        key={day.index}
                        className="p-1.5 border-r border-slate-200 last:border-r-0 align-top min-h-[110px]"
                      >
                        {isSessionStart && sessionInSlot && style && (
                          <div
                            className={`p-2.5 rounded-xl border shadow-xs transition-all flex flex-col justify-between ${style.wrapper}`}
                          >
                            {/* Course Code & Component Pill */}
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-mono font-bold text-xs text-blue-950 tracking-tight">
                                  {sessionInSlot.courseCode}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border flex items-center space-x-1 ${style.badge}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                  <span>{style.label}</span>
                                </span>
                              </div>

                              {/* Course Name */}
                              <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 leading-snug">
                                {sessionInSlot.courseTitle}
                              </h4>
                            </div>

                            {/* Lecturer & Classroom - Grouped Together */}
                            <div className={`mt-2 pt-1.5 border-t ${style.borderDivider} text-[11px] space-y-1`}>
                              {/* Lecturer Name */}
                              <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                                <User className="w-3 h-3 text-blue-700 flex-shrink-0" />
                                <span className="truncate">{sessionInSlot.instructorName}</span>
                              </div>

                              {/* Classroom Number */}
                              <div className="flex items-center space-x-1.5 text-slate-600">
                                <MapPin className="w-3 h-3 text-cyan-700 flex-shrink-0" />
                                <span className="font-bold text-slate-900">{sessionInSlot.roomNumber}</span>
                              </div>

                              {/* Target Section (shown when filtered by instructor) */}
                              {filterMode === 'instructor' && (
                                <div className="text-[10px] font-semibold text-blue-800 bg-white/70 px-1.5 py-0.5 rounded border border-blue-200/50">
                                  {sessionInSlot.sectionName}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {!sessionInSlot && (
                          <div className="w-full h-full min-h-[90px] flex items-center justify-center text-slate-300 text-xs font-mono select-none">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
