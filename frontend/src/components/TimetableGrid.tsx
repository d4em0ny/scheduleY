import { Fragment, useState, useEffect } from 'react';
import type { ScheduledSession, StudentSection, Instructor } from '../types';
import {
  Clock,
  MapPin,
  User,
  Zap,
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

// Assignable teaching slots:
// Morning block: Slots 1-4 (08:00 - 12:00)
// Excluded window: 12:00 - 14:00 (Cut from time grid; unassignable break)
// Afternoon block: Slots 5-7 (14:00 - 17:00)
const PERIODS = [
  { slot: 1, time: '08:00 - 09:00', start: '08:00', end: '09:00' },
  { slot: 2, time: '09:00 - 10:00', start: '09:00', end: '10:00' },
  { slot: 3, time: '10:00 - 11:00', start: '10:00', end: '11:00' },
  { slot: 4, time: '11:00 - 12:00', start: '11:00', end: '12:00' },
  { slot: 5, time: '14:00 - 15:00', start: '14:00', end: '15:00' },
  { slot: 6, time: '15:00 - 16:00', start: '15:00', end: '16:00' },
  { slot: 7, time: '16:00 - 17:00', start: '16:00', end: '17:00' },
];

function getSessionTimeLabel(startSlot: number, duration: number): string {
  const startP = PERIODS.find((p) => p.slot === startSlot);
  const maxBlockSlot = startSlot <= 4 ? 4 : 7;
  const endSlot = Math.min(startSlot + duration - 1, maxBlockSlot);
  const endP = PERIODS.find((p) => p.slot === endSlot);
  if (!startP || !endP) return '';
  return `${startP.start} - ${endP.end}`;
}

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
          wrapper: 'card-edge-subtle bg-white border border-emerald-200/90 text-slate-900 hover:border-emerald-400',
          badge: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Lab',
          borderDivider: 'border-emerald-100',
        };
      case 'SCIENCE_LAB':
        return {
          wrapper: 'card-edge-subtle bg-white border border-teal-200/90 text-slate-900 hover:border-teal-400',
          badge: 'bg-teal-50 text-teal-800 border border-teal-200',
          dot: 'bg-teal-500',
          label: 'Sci Lab',
          borderDivider: 'border-teal-100',
        };
      case 'SEMINAR_ROOM':
        return {
          wrapper: 'card-edge-subtle bg-white border border-amber-200/90 text-slate-900 hover:border-amber-400',
          badge: 'bg-amber-50 text-amber-800 border border-amber-200',
          dot: 'bg-amber-500',
          label: 'Seminar',
          borderDivider: 'border-amber-100',
        };
      default:
        return {
          wrapper: 'card-edge-subtle bg-white border border-[#0e0447]/20 text-slate-900 hover:border-[#0e0447]/50',
          badge: 'badge-navy-gradient',
          dot: 'bg-[#0e0447]',
          label: 'Lecture',
          borderDivider: 'border-[#0e0447]/15',
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Filter and Action Bar */}
      <div className="card-edge-gradient bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-[#f5f5f7] rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterMode('section')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterMode === 'section'
                  ? 'tab-navy-active'
                  : 'text-slate-600 hover:text-[#0e0447]'
              }`}
            >
              By Student Section
            </button>
            <button
              onClick={() => setFilterMode('instructor')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterMode === 'instructor'
                  ? 'tab-navy-active'
                  : 'text-slate-600 hover:text-[#0e0447]'
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
              className="bg-[#f8f9fa] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 cursor-pointer"
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
              className="bg-[#f8f9fa] border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0e0447]/30 cursor-pointer"
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
              className="btn-navy-gradient w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Solving Schedule Constraints...' : '⚡ Generate Schedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Solver Metrics Banner */}
      {generationMetrics && (
        <div className="card-edge-subtle bg-gradient-to-r from-emerald-50/70 via-white to-[#f5f5f7] border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900">Constraint Solver Complete</span>
                <span className="px-2 py-0.2 rounded-full font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {generationMetrics.solverStatus}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Processed in {generationMetrics.solveDurationMs}ms • Scheduled{' '}
                {generationMetrics.sessionCount} teaching blocks without conflicts.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-slate-600 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/80">
            <div>
              Satisfaction:{' '}
              <strong className="text-emerald-700 font-bold">
                {(generationMetrics.satisfaction * 100).toFixed(1)}%
              </strong>
            </div>
            <span>•</span>
            <div>
              Hard Conflicts:{' '}
              <strong className="text-emerald-700 font-bold">
                {generationMetrics.hardConflicts}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Context Badge */}
      <div className="flex items-center justify-between text-xs text-slate-600 px-1">
        {filterMode === 'section' && activeSectionObj && (
          <div className="card-edge-subtle flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-[#0e0447]" />
            <span>
              Fixed Permanent Classroom:{' '}
              <strong className="text-slate-900">
                {activeSectionObj.assignedBuilding} {activeSectionObj.assignedRoomNumber}
              </strong>
            </span>
            <span className="text-[10px] badge-navy-gradient px-2 py-0.5 rounded-full font-semibold">
              Permanent Invariant
            </span>
          </div>
        )}

        {filterMode === 'instructor' && activeInstructorObj && (
          <div className="card-edge-subtle flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <User className="w-3.5 h-3.5 text-[#0e0447]" />
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

      {/* Main Timetable Matrix */}
      <div className="card-edge-gradient bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-[#f5f5f7]">
                <th className="py-3 px-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 w-28 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#0e0447]" />
                    <span>Time Slot</span>
                  </div>
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.index}
                    className="py-3 px-4 text-xs font-bold text-slate-800 uppercase tracking-wider border-r border-slate-200 last:border-r-0 text-center"
                  >
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {PERIODS.map((period) => (
                <Fragment key={period.slot}>
                  <tr className="hover:bg-slate-50/40 transition-colors">
                    {/* Period Slot Label */}
                    <td className="py-3 px-3 border-r border-slate-200 bg-[#f8f9fb] text-xs">
                      <div className="font-bold text-slate-800 text-center">Slot {period.slot}</div>
                      <div className="text-[11px] text-slate-500 font-mono text-center whitespace-nowrap">
                        {period.time}
                      </div>
                    </td>

                    {/* Day Columns */}
                    {DAYS.map((day) => {
                      const sessionInSlot = filteredSessions.find(
                        (s) =>
                          s.dayOfWeek === day.index &&
                          period.slot >= s.startSlot &&
                          period.slot < s.startSlot + s.slotDuration
                      );

                      const isSessionStart = sessionInSlot && sessionInSlot.startSlot === period.slot;
                      if (sessionInSlot && !isSessionStart) {
                        const maxBlockEnd = sessionInSlot.startSlot <= 4 ? 4 : 7;
                        if (period.slot <= maxBlockEnd) {
                          return null; // Spanned by starting slot cell's rowSpan
                        }
                      }

                      const maxBlockEnd = sessionInSlot ? (sessionInSlot.startSlot <= 4 ? 4 : 7) : 7;
                      const effectiveRowSpan = sessionInSlot
                        ? Math.min(sessionInSlot.slotDuration, maxBlockEnd - sessionInSlot.startSlot + 1)
                        : 1;

                      const style = sessionInSlot ? getComponentCardStyle(sessionInSlot.componentType) : null;

                      return (
                        <td
                          key={day.index}
                          rowSpan={isSessionStart && effectiveRowSpan > 1 ? effectiveRowSpan : undefined}
                          className="p-1.5 border-r border-slate-200 last:border-r-0 align-top min-h-[110px]"
                        >
                          {isSessionStart && sessionInSlot && style && (
                            <div
                              className={`p-2.5 rounded-xl border shadow-xs transition-all flex flex-col justify-between h-full ${
                                effectiveRowSpan > 1 ? 'min-h-[210px]' : 'min-h-[96px]'
                              } ${style.wrapper}`}
                            >
                              {/* Course Code & Component Pill */}
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono font-bold text-xs text-[#0e0447] tracking-tight">
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

                                {sessionInSlot.slotDuration > 1 && (
                                  <div className="mt-1 inline-flex items-center space-x-1 text-[10px] font-mono font-semibold text-slate-500">
                                    <Clock className="w-2.5 h-2.5 text-[#0e0447]" />
                                    <span>{getSessionTimeLabel(sessionInSlot.startSlot, effectiveRowSpan)}</span>
                                  </div>
                                )}
                              </div>

                              {/* Lecturer & Classroom - Grouped Together */}
                              <div className={`mt-2 pt-1.5 border-t ${style.borderDivider} text-[11px] space-y-1`}>
                                {/* Lecturer Name */}
                                <div className="flex items-center space-x-1.5 text-slate-700 font-medium">
                                  <User className="w-3 h-3 text-[#0e0447] flex-shrink-0" />
                                  <span className="truncate">{sessionInSlot.instructorName}</span>
                                </div>

                                {/* Classroom Number */}
                                <div className="flex items-center space-x-1.5 text-slate-600">
                                  <MapPin className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  <span className="font-bold text-slate-900">{sessionInSlot.roomNumber}</span>
                                </div>

                                {/* Target Section (shown when filtered by instructor) */}
                                {filterMode === 'instructor' && (
                                  <div className="text-[10px] font-semibold text-[#0e0447] bg-white/70 px-1.5 py-0.5 rounded border border-[#0e0447]/20">
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

                  {/* Cut-out Midday Break Indicator (12:00 - 14:00 Unassignable) */}
                  {period.slot === 4 && (
                    <tr className="bg-[#f5f5f7] border-y border-[#0e0447]/20">
                      <td colSpan={6} className="py-1.5 px-4 text-center">
                        <div className="inline-flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-[#0e0447]/70">
                          <Clock className="w-3 h-3 text-[#0e0447]/60" />
                          <span>12:00 – 14:00 • Break Excluded (No Classes Assigned)</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
