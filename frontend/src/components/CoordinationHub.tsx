import { useState, useMemo } from 'react';
import type {
  InterdeptRequest,
  Instructor,
  Department,
  ScheduledSession,
  CourseOfferingItem,
  TimeSlot,
} from '../types';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Send,
  AlertTriangle,
  Lock,
  Plus,
  CalendarCheck,
  ShieldCheck,
} from 'lucide-react';

interface CoordinationHubProps {
  requests: InterdeptRequest[];
  instructors: Instructor[];
  sessions: ScheduledSession[];
  courses: CourseOfferingItem[];
  currentDept: string;
  departments: Department[];
  onAcceptOffer: (requestId: string) => void;
  onRejectOffer: (requestId: string) => void;
  onMakeOffer: (
    requestId: string,
    instructorId: string,
    hours: number,
    availableSlots: TimeSlot[]
  ) => void;
  onCreateRequest: (newReq: InterdeptRequest) => void;
}

const DAYS = [
  { index: 1, short: 'Mon', name: 'Monday' },
  { index: 2, short: 'Tue', name: 'Tuesday' },
  { index: 3, short: 'Wed', name: 'Wednesday' },
  { index: 4, short: 'Thu', name: 'Thursday' },
  { index: 5, short: 'Fri', name: 'Friday' },
];

const SLOTS = [
  { slot: 1, start: '08:00', end: '09:00', label: '08-09' },
  { slot: 2, start: '09:00', end: '10:00', label: '09-10' },
  { slot: 3, start: '10:00', end: '11:00', label: '10-11' },
  { slot: 4, start: '11:00', end: '12:00', label: '11-12' },
  { slot: 5, start: '14:00', end: '15:00', label: '14-15' },
  { slot: 6, start: '15:00', end: '16:00', label: '15-16' },
  { slot: 7, start: '16:00', end: '17:00', label: '16-17' },
];

function slotKey(dayOfWeek: number, slot: number): string {
  return `${dayOfWeek}-${slot}`;
}

function summarizeDaySlots(daySlots: number[]): string {
  if (daySlots.length === 0) return 'None';
  if (daySlots.length === 7) return 'All Free (08:00–12:00, 14:00–17:00)';

  const sorted = [...daySlots].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  const flushRange = (s: number, e: number) => {
    const startMeta = SLOTS.find((x) => x.slot === s);
    const endMeta = SLOTS.find((x) => x.slot === e);
    if (startMeta && endMeta) {
      ranges.push(`${startMeta.start}–${endMeta.end}`);
    }
  };

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    // Contiguous within same half-day block (do not merge slot 4 -> slot 5 across 12-14 break)
    const sameBlock = (prev <= 4 && curr <= 4) || (prev >= 5 && curr >= 5);
    if (curr === prev + 1 && sameBlock) {
      prev = curr;
    } else {
      flushRange(start, prev);
      start = curr;
      prev = curr;
    }
  }
  flushRange(start, prev);

  return ranges.join(', ');
}

export const CoordinationHub: React.FC<CoordinationHubProps> = ({
  requests,
  instructors,
  sessions,
  courses,
  currentDept,
  departments,
  onAcceptOffer,
  onRejectOffer,
  onMakeOffer,
  onCreateRequest,
}) => {
  const [filterDirection, setFilterDirection] = useState<'incoming' | 'outgoing' | 'all'>('all');

  // Offer Modal state (Supplying Dept provides instructor + conflict-free available slots)
  const [activeOfferModalReq, setActiveOfferModalReq] = useState<InterdeptRequest | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [offeredHours, setOfferedHours] = useState<number>(3);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<Set<string>>(new Set());

  // New Request Modal state (Requesting Dept simply asks an instructor from a department for a course)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reqDept, setReqDept] = useState<string>(currentDept !== 'ALL' ? currentDept : 'CS');
  const [supDept, setSupDept] = useState<string>(
    currentDept === 'CS' ? 'MATH' : currentDept === 'MATH' ? 'CS' : 'CS'
  );
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [courseCode, setCourseCode] = useState<string>('MATH-201');
  const [courseTitle, setCourseTitle] = useState<string>('Discrete Mathematics');
  const [sectionName, setSectionName] = useState<string>('CS-Year 2 Sec A');
  const [remarks, setRemarks] = useState<string>(
    'Requesting an available instructor from your department for this course.'
  );

  const effectiveRequestingDept = currentDept !== 'ALL' ? currentDept : reqDept;

  // Courses belonging to requesting department (for one-click course selection when asking)
  const deptCourses = useMemo(
    () =>
      courses.filter(
        (c) => effectiveRequestingDept === 'ALL' || c.departmentCode === effectiveRequestingDept
      ),
    [courses, effectiveRequestingDept]
  );

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (currentDept === 'ALL') return true;
    if (filterDirection === 'incoming') return r.supplyingDept === currentDept;
    if (filterDirection === 'outgoing') return r.requestingDept === currentDept;
    return r.requestingDept === currentDept || r.supplyingDept === currentDept;
  });

  // Map of busy slots (key: "day-slot" -> session label) for selected instructor in Offer Modal
  const instructorBusyMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!selectedInstructorId) return map;

    for (const sess of sessions) {
      if (sess.instructorId === selectedInstructorId) {
        for (let offset = 0; offset < sess.slotDuration; offset++) {
          const s = sess.startSlot + offset;
          map.set(slotKey(sess.dayOfWeek, s), `${sess.courseCode} (${sess.sectionName})`);
        }
      }
    }
    return map;
  }, [sessions, selectedInstructorId]);

  const computeFreeSlotKeys = (instId: string): Set<string> => {
    const busy = new Set<string>();
    for (const sess of sessions) {
      if (sess.instructorId === instId) {
        for (let offset = 0; offset < sess.slotDuration; offset++) {
          busy.add(slotKey(sess.dayOfWeek, sess.startSlot + offset));
        }
      }
    }
    const free = new Set<string>();
    for (const d of DAYS) {
      for (const s of SLOTS) {
        const key = slotKey(d.index, s.slot);
        if (!busy.has(key)) free.add(key);
      }
    }
    return free;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold badge-success-soft">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00A65A]" />
            <span>Accepted & Assigned</span>
          </span>
        );
      case 'OFFERED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold badge-primary-soft">
            <Clock className="w-3.5 h-3.5 text-[#0088D9]" />
            <span>Instructor Provided</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Declined</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold badge-primary-soft">
            <Clock className="w-3.5 h-3.5 text-[#3C8DBC]" />
            <span>Under Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00C0EF]/12 text-[#0073B7] border border-[#00C0EF]/35">
            <Clock className="w-3.5 h-3.5 text-[#0088D9]" />
            <span>Awaiting Instructor</span>
          </span>
        );
    }
  };

  const handleOpenOfferModal = (req: InterdeptRequest) => {
    setActiveOfferModalReq(req);
    const deptInsts = instructors.filter((i) => i.departmentCode === req.supplyingDept);
    const bestInst = deptInsts[0];

    if (bestInst) {
      setSelectedInstructorId(bestInst.id);
      setSelectedSlotKeys(computeFreeSlotKeys(bestInst.id));
      const availCap = Math.max(
        0,
        bestInst.maxWeeklyWorkload - (bestInst.committedHours + bestInst.heldHours)
      );
      const matchedCourse = courses.find(
        (c) => c.courseCode === req.courseCode && c.sectionName === req.sectionName
      );
      const suggestedHours = Math.min(
        availCap,
        req.requiredHours || matchedCourse?.contactHours || 3.0
      );
      setOfferedHours(Math.max(1, suggestedHours));
    } else {
      setSelectedInstructorId('');
      setSelectedSlotKeys(new Set());
      setOfferedHours(0);
    }
  };

  const handleInstructorChange = (instId: string) => {
    setSelectedInstructorId(instId);
    setSelectedSlotKeys(computeFreeSlotKeys(instId));
    const inst = instructors.find((i) => i.id === instId);
    if (inst && activeOfferModalReq) {
      const availCap = Math.max(0, inst.maxWeeklyWorkload - (inst.committedHours + inst.heldHours));
      const matchedCourse = courses.find(
        (c) =>
          c.courseCode === activeOfferModalReq.courseCode &&
          c.sectionName === activeOfferModalReq.sectionName
      );
      setOfferedHours(Math.max(0.5, Math.min(availCap, matchedCourse?.contactHours || 3.0)));
    }
  };

  const handleToggleSlot = (day: number, slot: number) => {
    const key = slotKey(day, slot);
    if (instructorBusyMap.has(key)) return; // Locked by supplying dept schedule!
    setSelectedSlotKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmitOffer = () => {
    if (!activeOfferModalReq || !selectedInstructorId) return;
    const availableSlots: TimeSlot[] = Array.from(selectedSlotKeys).map((k) => {
      const [d, s] = k.split('-').map(Number);
      return { dayOfWeek: d, slot: s };
    });
    onMakeOffer(activeOfferModalReq.id, selectedInstructorId, offeredHours, availableSlots);
    setActiveOfferModalReq(null);
  };

  const handlePickExistingCourse = (cId: string) => {
    setSelectedCourseId(cId);
    if (!cId) return;
    const crs = courses.find((c) => c.id === cId);
    if (crs) {
      setCourseCode(crs.courseCode);
      setCourseTitle(crs.courseTitle);
      setSectionName(crs.sectionName);
    }
  };

  const handleCreateNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseTitle.trim()) return;

    const matchedCourse = courses.find((c) => c.id === selectedCourseId);

    const newReq: InterdeptRequest = {
      id: `req-${Date.now()}`,
      requestNumber: `REQ-${effectiveRequestingDept}-${Math.floor(100 + Math.random() * 900)}`,
      requestingDept: effectiveRequestingDept,
      supplyingDept: supDept,
      courseCode: courseCode.trim().toUpperCase(),
      courseTitle: courseTitle.trim(),
      sectionName: sectionName.trim() || `${effectiveRequestingDept}-Year 1 Sec A`,
      componentType: matchedCourse?.componentType || 'REGULAR_CLASSROOM',
      status: 'SUBMITTED',
      remarks: remarks.trim(),
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    onCreateRequest(newReq);
    setIsCreateModalOpen(false);
    setFilterDirection('outgoing');
  };

  const selectedInstObj = instructors.find((i) => i.id === selectedInstructorId);
  const remainingCap = selectedInstObj
    ? selectedInstObj.maxWeeklyWorkload - (selectedInstObj.committedHours + selectedInstObj.heldHours)
    : 0;
  const isOverCapacity = offeredHours > remainingCap;

  return (
    <div className="space-y-5">
      {/* Control bar */}
      <div className="card-edge-gradient flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl badge-primary-soft">
            <GitPullRequest className="w-5 h-5 text-[#0088D9]" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Interdepartmental Instructor Coordination
            </h2>
            <p className="text-[11px] text-slate-500">
              Ask another department for an instructor; they provide the faculty member along with conflict-free available schedule hours.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex p-1 bg-[#D2D6DE]/40 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterDirection('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterDirection === 'all'
                  ? 'tab-primary-active'
                  : 'text-slate-600 hover:text-[#0088D9]'
              }`}
            >
              All ({filteredRequests.length})
            </button>
            <button
              onClick={() => setFilterDirection('incoming')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterDirection === 'incoming'
                  ? 'tab-primary-active'
                  : 'text-slate-600 hover:text-[#0088D9]'
              }`}
            >
              Incoming Requests
            </button>
            <button
              onClick={() => setFilterDirection('outgoing')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterDirection === 'outgoing'
                  ? 'tab-primary-active'
                  : 'text-slate-600 hover:text-[#0088D9]'
              }`}
            >
              Sent Requests
            </button>
          </div>

          {/* Ask Instructor Button */}
          <button
            onClick={() => {
              const effectiveReq = currentDept !== 'ALL' ? currentDept : 'CS';
              setReqDept(effectiveReq);
              const other = departments.find((d) => d.code !== effectiveReq);
              if (other) setSupDept(other.code);
              const unassigned = courses.find(
                (c) =>
                  (effectiveReq === 'ALL' || c.departmentCode === effectiveReq) &&
                  !c.assignedInstructorName
              );
              if (unassigned) {
                setSelectedCourseId(unassigned.id);
                setCourseCode(unassigned.courseCode);
                setCourseTitle(unassigned.courseTitle);
                setSectionName(unassigned.sectionName);
              } else {
                setSelectedCourseId('');
              }
              setIsCreateModalOpen(true);
            }}
            className="btn-primary-gradient flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Ask Instructor from Dept</span>
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3.5">
        {filteredRequests.length === 0 ? (
          <div className="card-edge-gradient bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <GitPullRequest className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">No coordination requests found</p>
            <p className="text-xs text-slate-400 mt-1">
              Click "Ask Instructor from Dept" to request teaching faculty from another department.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isIncoming = currentDept !== 'ALL' && req.supplyingDept === currentDept;
            const isOutgoing = currentDept !== 'ALL' && req.requestingDept === currentDept;

            return (
              <div
                key={req.id}
                className="card-edge-gradient bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-[#0088D9]/50 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="badge-primary-soft font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg">
                      {req.requestNumber}
                    </span>
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                      <span className="text-[#0088D9]">{req.requestingDept}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[#3C8DBC]">{req.supplyingDept}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-slate-400">{req.createdAt}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-3 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Course & Section:</span>
                    <p className="font-bold text-slate-900 text-sm">
                      {req.courseCode} • {req.courseTitle}
                    </p>
                    <p className="text-slate-500 mt-0.5">Section: {req.sectionName}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Request Type:</span>
                    <div className="inline-flex items-center space-x-1.5 mt-0.5 px-2.5 py-1 rounded-lg badge-primary-soft font-semibold">
                      <CalendarCheck className="w-3.5 h-3.5 text-[#0088D9]" />
                      <span>Instructor Request from {req.supplyingDept}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Available hours & schedule windows are supplied by {req.supplyingDept}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Department Notes:</span>
                    <p className="text-slate-600 italic bg-[#f4f6f9] p-2 rounded-xl border border-slate-200/80">
                      "{req.remarks || 'No additional remarks'}"
                    </p>
                  </div>
                </div>

                {/* Offer Details & Provided Conflict-Free Available Time Slots */}
                {req.currentOffer && (
                  <div className="card-edge-subtle mt-2 p-3.5 rounded-xl bg-[#f4f6f9] border border-[#3C8DBC]/25 space-y-2.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <ShieldCheck className="w-4 h-4 text-[#00A65A] flex-shrink-0" />
                        <div>
                          <span className="text-slate-600">Provided Instructor: </span>
                          <strong className="text-slate-900 font-bold">
                            {req.currentOffer.instructorName}
                          </strong>{' '}
                          <span className="text-[#0088D9] font-semibold">
                            ({req.currentOffer.offeredHours} hrs weekly workload allocated)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                        <span className="px-2 py-0.5 rounded-md badge-success-soft font-semibold">
                          {req.currentOffer.availableSlots.length} conflict-free slots granted
                        </span>
                      </div>
                    </div>

                    {/* Day-by-Day Free Schedule Windows */}
                    <div className="pt-2 border-t border-slate-200/80">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Instructor Available Schedule Windows (Guaranteed Zero Conflict with {req.supplyingDept}):
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-1.5">
                        {DAYS.map((d) => {
                          const daySlots = req.currentOffer!.availableSlots
                            .filter((s) => s.dayOfWeek === d.index)
                            .map((s) => s.slot);
                          return (
                            <div
                              key={d.index}
                              className="bg-white border border-slate-200/80 rounded-lg px-2 py-1.5 text-[11px]"
                            >
                              <span className="font-bold text-[#0088D9] block">{d.short}</span>
                              <span className="text-slate-600 font-mono text-[10px] leading-tight block">
                                {summarizeDaySlots(daySlots)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                  {(isIncoming || currentDept === 'ALL') &&
                    (req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => handleOpenOfferModal(req)}
                        className="btn-primary-gradient px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Provide Instructor & Available Hours</span>
                      </button>
                    )}

                  {(isOutgoing || currentDept === 'ALL') && req.status === 'OFFERED' && (
                    <>
                      <button
                        onClick={() => onRejectOffer(req.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#D2D6DE]/50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => onAcceptOffer(req.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#00A65A] hover:bg-[#008f4d] text-white transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Instructor & Available Hours</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ASK INSTRUCTOR MODAL (Simplified: Ask Instructor from Department for a Course — NO Class Hour or Instructor Name required) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="card-edge-gradient bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl badge-primary-soft">
                  <GitPullRequest className="w-5 h-5 text-[#0088D9]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Ask Instructor from Another Department
                  </h3>
                  <p className="text-xs text-slate-500">
                    Select the supplying department and course. They will assign an instructor with conflict-free available hours.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewRequest} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Requesting Department:
                  </label>
                  {currentDept !== 'ALL' ? (
                    <div className="p-2.5 rounded-xl badge-primary-soft font-bold flex items-center justify-between">
                      <span>{currentDept} (Scope Locked)</span>
                      <Lock className="w-3.5 h-3.5 text-[#0088D9]" />
                    </div>
                  ) : (
                    <select
                      value={reqDept}
                      onChange={(e) => setReqDept(e.target.value)}
                      className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-semibold"
                    >
                      {departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Ask Instructor From Dept:
                  </label>
                  <select
                    value={supDept}
                    onChange={(e) => setSupDept(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-[#0088D9] focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-bold"
                  >
                    {departments
                      .filter((d) => d.code !== effectiveRequestingDept)
                      .map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} - {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Pick from department's curriculum */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Pick Department Course (Optional Quick Fill):
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handlePickExistingCourse(e.target.value)}
                  className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-medium"
                >
                  <option value="">— Custom / Enter course details below —</option>
                  {deptCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.courseCode} • {c.courseTitle} ({c.sectionName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH-201"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Title:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Discrete Math"
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Target Section:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-Year 2 Sec A"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Notes for Supplying Department (Optional):
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Requesting an instructor for CS Year 2 Section A."
                  className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  No hours or instructor name needed — {supDept} provides their available slots.
                </span>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D2D6DE]/60 hover:bg-[#D2D6DE] text-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask {supDept} for Instructor</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVIDE INSTRUCTOR + AVAILABLE HOURS MODAL (Supplying Dept) */}
      {activeOfferModalReq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="card-edge-gradient bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Provide Instructor & Available Hours to {activeOfferModalReq.requestingDept}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  For <strong>{activeOfferModalReq.courseCode}</strong> ({activeOfferModalReq.courseTitle}) • Section{' '}
                  <strong>{activeOfferModalReq.sectionName}</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveOfferModalReq(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Select {activeOfferModalReq.supplyingDept} Instructor:
                  </label>
                  <select
                    value={selectedInstructorId}
                    onChange={(e) => handleInstructorChange(e.target.value)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2.5 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35"
                  >
                    {instructors
                      .filter((i) => i.departmentCode === activeOfferModalReq.supplyingDept)
                      .map((inst) => {
                        const avail = inst.maxWeeklyWorkload - (inst.committedHours + inst.heldHours);
                        return (
                          <option key={inst.id} value={inst.id}>
                            {inst.name} ({avail.toFixed(1)}h workload free)
                          </option>
                        );
                      })}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Workload Hours Allocated ({remainingCap.toFixed(1)}h available):
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    max={Math.max(0.5, remainingCap)}
                    value={offeredHours}
                    onChange={(e) => setOfferedHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#f4f6f9] border border-slate-200 rounded-xl p-2.5 text-[#0088D9] font-bold focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35"
                  />
                </div>
              </div>

              {/* Interactive Weekly Availability Picker excluding Supplying Dept busy slots */}
              <div className="bg-[#f4f6f9] border border-slate-200 rounded-xl p-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Conflict-Free Available Time Slots to Share with {activeOfferModalReq.requestingDept}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Slots occupied by {activeOfferModalReq.supplyingDept} classes are automatically locked to prevent conflicts.
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSlotKeys(computeFreeSlotKeys(selectedInstructorId))}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-[#0088D9] hover:bg-slate-50 cursor-pointer"
                    >
                      Select All Free
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSlotKeys(new Set())}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr>
                        <th className="p-1 text-left text-slate-500 font-bold">Time</th>
                        {DAYS.map((d) => (
                          <th key={d.index} className="p-1 text-center text-slate-700 font-bold">
                            {d.short}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map((sl) => (
                        <tr key={sl.slot} className={sl.slot === 5 ? 'border-t-2 border-slate-300' : ''}>
                          <td className="p-1 font-mono text-slate-500 whitespace-nowrap">
                            {sl.label}
                          </td>
                          {DAYS.map((d) => {
                            const key = slotKey(d.index, sl.slot);
                            const busyLabel = instructorBusyMap.get(key);
                            const isSelected = selectedSlotKeys.has(key);

                            return (
                              <td key={d.index} className="p-0.5 text-center">
                                {busyLabel ? (
                                  <div
                                    title={`Busy in home department: ${busyLabel}`}
                                    className="px-1.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 font-semibold truncate max-w-[95px] mx-auto cursor-not-allowed"
                                  >
                                    🔒 Busy
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleSlot(d.index, sl.slot)}
                                    className={`w-full px-1.5 py-1 rounded font-semibold border transition-all cursor-pointer ${
                                      isSelected
                                        ? 'badge-success-soft shadow-2xs font-bold'
                                        : 'bg-white text-slate-400 border-slate-200 hover:border-[#0088D9]/40'
                                    }`}
                                  >
                                    {isSelected ? '✓ Free' : 'Off'}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                  <span>
                    Busy in {activeOfferModalReq.supplyingDept}:{' '}
                    <strong className="text-rose-700">{instructorBusyMap.size} slots locked</strong>
                  </span>
                  <span>
                    Shared Available Windows:{' '}
                    <strong className="text-[#00A65A]">{selectedSlotKeys.size} slots</strong>
                  </span>
                </div>
              </div>

              {isOverCapacity && (
                <div className="flex items-center space-x-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Cannot allocate {offeredHours}h: exceeds instructor remaining workload capacity ({remainingCap.toFixed(1)}h).
                  </span>
                </div>
              )}

              {selectedSlotKeys.size === 0 && (
                <div className="flex items-center space-x-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Please select at least one available time slot for the requesting department.</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setActiveOfferModalReq(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D2D6DE]/60 hover:bg-[#D2D6DE] text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isOverCapacity || offeredHours <= 0 || selectedSlotKeys.size === 0}
                onClick={handleSubmitOffer}
                className="btn-primary-gradient px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer"
              >
                Lock Hours & Provide Instructor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
