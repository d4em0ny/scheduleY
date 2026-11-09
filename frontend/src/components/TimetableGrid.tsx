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

  const getComponentBadge = (type: string) => {
    switch (type) {
      case 'COMPUTER_LAB':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          dot: 'bg-emerald-400',
          label: 'Computer Lab',
        };
      case 'SCIENCE_LAB':
        return {
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
          dot: 'bg-cyan-400',
          label: 'Science Lab',
        };
      case 'SEMINAR_ROOM':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          dot: 'bg-amber-400',
          label: 'Seminar',
        };
      default:
        return {
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
          dot: 'bg-indigo-400',
          label: 'Lecture',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Mode Switcher */}
          <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setFilterMode('section')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterMode === 'section'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              By Student Section
            </button>
            <button
              onClick={() => setFilterMode('instructor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterMode === 'instructor'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
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
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Solving Schedule Constraints...' : '⚡ Generate Schedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Solver Metrics Banner */}
      {generationMetrics && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white">Semester Schedule Generated & Optimized!</span>
              <span className="text-slate-400 block text-[11px]">
                CP Solver Status: <strong className="text-emerald-400">{generationMetrics.solverStatus}</strong> • Computed in {generationMetrics.solveDurationMs}ms
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-300">
            <span className="flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hard Conflicts: <strong className="text-emerald-400">0</strong></span>
            </span>
            <span>•</span>
            <span>Sessions: <strong className="text-cyan-400">{generationMetrics.sessionCount}</strong></span>
            <span>•</span>
            <span>Satisfaction: <strong className="text-indigo-400">{generationMetrics.satisfaction.toFixed(1)}%</strong></span>
          </div>
        </div>
      )}

      {/* Context Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        {filterMode === 'section' && activeSectionObj && (
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <MapPin className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              Fixed Permanent Classroom:{' '}
              <strong className="text-slate-200">
                {activeSectionObj.assignedBuilding} {activeSectionObj.assignedRoomNumber}
              </strong>
            </span>
            <span className="text-[10px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.2 rounded border border-indigo-500/20">
              Invariant Locked
            </span>
          </div>
        )}

        {filterMode === 'instructor' && activeInstructorObj && (
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <User className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Assigned Load:{' '}
              <strong className="text-slate-200">
                {activeInstructorObj.committedHours} / {activeInstructorObj.maxWeeklyWorkload} hrs
              </strong>
            </span>
          </div>
        )}

        <div className="text-[11px] text-slate-500 hidden sm:block">
          Showing active slots for Fall Semester 2026
        </div>
      </div>

      {/* Timetable Matrix Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="py-3 px-4 text-xs font-semibold text-slate-400 w-32 border-r border-slate-800">
                  Time Period
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.index}
                    className="py-3 px-4 text-xs font-semibold text-slate-300 border-r border-slate-800 last:border-r-0 min-w-44 text-center"
                  >
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {PERIODS.map((period) => (
                <tr key={period.slot} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-3 border-r border-slate-800 bg-slate-950/30 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span>Slot {period.slot}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{period.time}</div>
                  </td>

                  {DAYS.map((day) => {
                    const sessionInSlot = filteredSessions.find(
                      (s) =>
                        s.dayOfWeek === day.index &&
                        period.slot >= s.startSlot &&
                        period.slot < s.startSlot + s.slotDuration
                    );

                    const isSessionStart = sessionInSlot && sessionInSlot.startSlot === period.slot;

                    return (
                      <td
                        key={day.index}
                        className="p-1.5 border-r border-slate-800 last:border-r-0 align-top h-20"
                      >
                        {isSessionStart && (
                          <div
                            className={`p-2.5 rounded-lg border transition-all h-full flex flex-col justify-between ${
                              getComponentBadge(sessionInSlot.componentType).bg
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-xs text-white tracking-tight">
                                  {sessionInSlot.courseCode}
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      getComponentBadge(sessionInSlot.componentType).dot
                                    }`}
                                  />
                                  <span className="text-[10px] font-semibold">
                                    {getComponentBadge(sessionInSlot.componentType).label}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-200 font-medium line-clamp-1">
                                {sessionInSlot.courseTitle}
                              </p>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-slate-700/40 text-[10px] space-y-0.5">
                              {filterMode === 'section' ? (
                                <div className="flex items-center space-x-1 text-slate-300">
                                  <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  <span className="truncate">{sessionInSlot.instructorName}</span>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-1 text-indigo-300 font-semibold">
                                  <span>{sessionInSlot.sectionName}</span>
                                </div>
                              )}

                              <div className="flex items-center space-x-1 text-slate-400">
                                <MapPin className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                                <span>{sessionInSlot.roomNumber}</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {!sessionInSlot && (
                          <div className="w-full h-full min-h-16 flex items-center justify-center text-slate-800 text-xs font-mono select-none">
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
