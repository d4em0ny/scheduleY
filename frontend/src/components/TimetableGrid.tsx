import { useState } from 'react';
import type { ScheduledSession, StudentSection, Instructor } from '../types';
import { Clock, MapPin, User, BookOpen, Layers } from 'lucide-react';

interface TimetableGridProps {
  sessions: ScheduledSession[];
  sections: StudentSection[];
  instructors: Instructor[];
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
}) => {
  const [filterMode, setFilterMode] = useState<'section' | 'instructor'>('section');
  const [selectedSection, setSelectedSection] = useState<string>(sections[0]?.sectionName || '');
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(instructors[0]?.id || '');

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
      {/* Top Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
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

          {filterMode === 'section' ? (
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.sectionName}>
                  {sec.sectionName} ({sec.studentCount} students)
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedInstructorId}
              onChange={(e) => setSelectedInstructorId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name} ({inst.departmentCode} • {inst.maxWeeklyWorkload}h cap)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Invariant badge / metadata */}
        <div className="flex items-center space-x-3 text-xs text-slate-400">
          {filterMode === 'section' && activeSectionObj && (
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>
                Fixed Assigned Classroom:{' '}
                <strong className="text-slate-200">
                  {activeSectionObj.assignedBuilding} {activeSectionObj.assignedRoomNumber}
                </strong>
              </span>
            </div>
          )}

          {filterMode === 'instructor' && activeInstructorObj && (
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Assigned Load:{' '}
                <strong className="text-slate-200">
                  {activeInstructorObj.committedHours} / {activeInstructorObj.maxWeeklyWorkload} hrs
                </strong>
              </span>
            </div>
          )}

          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Total Sessions: <strong className="text-slate-200">{filteredSessions.length}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Timetable Weekly Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="py-3 px-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-28 border-r border-slate-800/80">
                  Time Slot
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day.index}
                    className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider border-r border-slate-800/80 last:border-r-0"
                  >
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {PERIODS.map((period) => (
                <tr key={period.slot} className="hover:bg-slate-800/20 transition-colors">
                  {/* Period Time Column */}
                  <td className="py-3 px-3 border-r border-slate-800/80 bg-slate-950/40 text-xs">
                    <div className="font-semibold text-slate-300">Period {period.slot}</div>
                    <div className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{period.time}</span>
                    </div>
                  </td>

                  {/* Day Columns */}
                  {DAYS.map((day) => {
                    // Find sessions starting at this day & slot
                    const sessionAtSlot = filteredSessions.find(
                      (s) => s.dayOfWeek === day.index && s.startSlot === period.slot
                    );

                    // Check if this slot is covered by a multi-slot session starting earlier
                    const isCoveredByPreceding = filteredSessions.some(
                      (s) =>
                        s.dayOfWeek === day.index &&
                        period.slot > s.startSlot &&
                        period.slot < s.startSlot + s.slotDuration
                    );

                    if (isCoveredByPreceding) {
                      return null; // Omit td because rowSpan on preceding session covers it
                    }

                    if (sessionAtSlot) {
                      const badge = getComponentBadge(sessionAtSlot.componentType);

                      return (
                        <td
                          key={day.index}
                          rowSpan={sessionAtSlot.slotDuration}
                          className="p-2 border-r border-slate-800/80 last:border-r-0 align-top"
                        >
                          <div
                            className={`h-full rounded-lg p-2.5 border transition-all shadow-md hover:shadow-lg ${badge.bg}`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="font-bold text-xs tracking-tight text-white flex items-center space-x-1">
                                <BookOpen className="w-3 h-3 text-indigo-400" />
                                <span>{sessionAtSlot.courseCode}</span>
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium border flex items-center space-x-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                <span>{badge.label}</span>
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-slate-200 line-clamp-1 mb-2">
                              {sessionAtSlot.courseTitle}
                            </p>

                            <div className="space-y-1 text-[11px] text-slate-400">
                              <div className="flex items-center space-x-1.5">
                                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate">{sessionAtSlot.roomNumber}</span>
                              </div>
                              <div className="flex items-center space-x-1.5">
                                <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                <span className="truncate text-slate-300 font-medium">
                                  {filterMode === 'section'
                                    ? sessionAtSlot.instructorName
                                    : sessionAtSlot.sectionName}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                      );
                    }

                    // Empty slot
                    return (
                      <td
                        key={day.index}
                        className="p-2 border-r border-slate-800/80 last:border-r-0 text-center text-slate-700 hover:bg-slate-800/30 transition-colors"
                      >
                        <span className="text-xs select-none opacity-40">—</span>
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
