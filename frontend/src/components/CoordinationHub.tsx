import { useState } from 'react';
import type { InterdeptRequest, Instructor, Department, RoomCategory } from '../types';
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
  Sparkles,
} from 'lucide-react';

interface CoordinationHubProps {
  requests: InterdeptRequest[];
  instructors: Instructor[];
  currentDept: string;
  departments: Department[];
  onAcceptOffer: (requestId: string) => void;
  onRejectOffer: (requestId: string) => void;
  onMakeOffer: (requestId: string, instructorId: string, hours: number) => void;
  onCreateRequest: (newReq: InterdeptRequest) => void;
}

export const CoordinationHub: React.FC<CoordinationHubProps> = ({
  requests,
  instructors,
  currentDept,
  departments,
  onAcceptOffer,
  onRejectOffer,
  onMakeOffer,
  onCreateRequest,
}) => {
  const [filterDirection, setFilterDirection] = useState<'incoming' | 'outgoing' | 'all'>('all');
  const [activeOfferModalReq, setActiveOfferModalReq] = useState<InterdeptRequest | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [offeredHours, setOfferedHours] = useState<number>(3);

  // New Request Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reqDept, setReqDept] = useState<string>(currentDept !== 'ALL' ? currentDept : 'CS');
  const [supDept, setSupDept] = useState<string>(
    (currentDept === 'CS' ? 'MATH' : currentDept === 'MATH' ? 'CS' : 'CS')
  );
  const [courseCode, setCourseCode] = useState<string>('MATH-201');
  const [courseTitle, setCourseTitle] = useState<string>('Discrete Mathematics');
  const [sectionName, setSectionName] = useState<string>('CS-Year 2 Sec A');
  const [componentType, setComponentType] = useState<RoomCategory>('REGULAR_CLASSROOM');
  const [requiredHours, setRequiredHours] = useState<number>(3.0);
  const [requiredQual, setRequiredQual] = useState<string>('DISCRETE_MATH');
  const [remarks, setRemarks] = useState<string>(
    'Requesting experienced faculty for core curriculum section. Morning slots preferred.'
  );

  // Sync requesting dept when currentDept prop changes
  const effectiveRequestingDept = currentDept !== 'ALL' ? currentDept : reqDept;

  // Filter requests
  const filteredRequests = requests.filter((r) => {
    if (currentDept === 'ALL') return true;
    if (filterDirection === 'incoming') return r.supplyingDept === currentDept;
    if (filterDirection === 'outgoing') return r.requestingDept === currentDept;
    return r.requestingDept === currentDept || r.supplyingDept === currentDept;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accepted</span>
          </span>
        );
      case 'OFFERED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Offer Pending</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Submitted</span>
          </span>
        );
    }
  };

  const handleOpenOfferModal = (req: InterdeptRequest) => {
    setActiveOfferModalReq(req);
    // Suggest first instructor matching supplying dept
    const candidates = instructors.filter((i) => i.departmentCode === req.supplyingDept);
    if (candidates.length > 0) {
      setSelectedInstructorId(candidates[0].id);
    }
    setOfferedHours(req.requiredHours);
  };

  const handleSubmitOffer = () => {
    if (!activeOfferModalReq || !selectedInstructorId) return;
    onMakeOffer(activeOfferModalReq.id, selectedInstructorId, offeredHours);
    setActiveOfferModalReq(null);
  };

  const handlePresetSelect = (code: string, title: string, dept: string, qual: string, hours: number) => {
    setCourseCode(code);
    setCourseTitle(title);
    setSupDept(dept);
    setRequiredQual(qual);
    setRequiredHours(hours);
  };

  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveRequestingDept || !supDept || supDept === effectiveRequestingDept) {
      return;
    }

    const newReq: InterdeptRequest = {
      id: `req-${Date.now()}`,
      requestNumber: `REQ-${effectiveRequestingDept}-2026-${String(requests.length + 1).padStart(3, '0')}`,
      requestingDept: effectiveRequestingDept,
      supplyingDept: supDept,
      courseCode: courseCode.trim(),
      courseTitle: courseTitle.trim(),
      componentType: componentType,
      sectionName: sectionName.trim(),
      requiredHours: requiredHours,
      requiredQualification: requiredQual.trim(),
      status: 'SUBMITTED',
      remarks: remarks.trim(),
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    onCreateRequest(newReq);
    setIsCreateModalOpen(false);
    setFilterDirection('outgoing'); // Switch to outgoing view so user immediately sees it
  };

  const selectedInstObj = instructors.find((i) => i.id === selectedInstructorId);
  const remainingCap = selectedInstObj
    ? selectedInstObj.maxWeeklyWorkload - (selectedInstObj.committedHours + selectedInstObj.heldHours)
    : 0;
  const isOverCapacity = offeredHours > remainingCap;

  return (
    <div className="space-y-6">
      {/* Control bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-sm">
        <div className="flex items-center space-x-2">
          <GitPullRequest className="w-5 h-5 text-indigo-400" />
          <h2 className="font-bold text-base text-slate-100">
            Interdepartmental Instructor Coordination Protocol
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700/60 text-xs">
            <button
              onClick={() => setFilterDirection('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterDirection === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Requests ({filteredRequests.length})
            </button>
            <button
              onClick={() => setFilterDirection('incoming')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterDirection === 'incoming'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Incoming Demands
            </button>
            <button
              onClick={() => setFilterDirection('outgoing')}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                filterDirection === 'outgoing'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Our Outgoing Requests
            </button>
          </div>

          {/* Create Request Button */}
          <button
            onClick={() => {
              if (currentDept !== 'ALL') {
                setReqDept(currentDept);
                const other = departments.find((d) => d.code !== currentDept);
                if (other) setSupDept(other.code);
              }
              setIsCreateModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Request Faculty</span>
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center text-slate-400">
            <GitPullRequest className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300">No interdepartmental requests found</p>
            <p className="text-xs text-slate-500 mt-1">
              Select another filter or create an instructor request using the "+ Request Faculty" button.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isIncoming = currentDept !== 'ALL' && req.supplyingDept === currentDept;
            const isOutgoing = currentDept !== 'ALL' && req.requestingDept === currentDept;

            return (
              <div
                key={req.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md hover:border-slate-700/80 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                      {req.requestNumber}
                    </span>
                    <div className="flex items-center space-x-2 text-sm font-semibold text-slate-200">
                      <span className="text-indigo-400">{req.requestingDept}</span>
                      <ArrowRight className="w-4 h-4 text-slate-500" />
                      <span className="text-cyan-400">{req.supplyingDept}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {getStatusBadge(req.status)}
                    <span className="text-xs text-slate-500">{req.createdAt}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Course & Offering</span>
                    <p className="font-bold text-slate-200 text-sm">
                      {req.courseCode} • {req.courseTitle}
                    </p>
                    <p className="text-slate-400 mt-0.5">Section: {req.sectionName} ({req.componentType})</p>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Required Faculty Skill</span>
                    <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono font-semibold">
                      {req.requiredQualification}
                    </div>
                    <p className="text-slate-400 mt-1">{req.requiredHours} Weekly Teaching Hours</p>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Department Remarks</span>
                    <p className="text-slate-300 italic bg-slate-950/40 p-2 rounded border border-slate-800/60">
                      "{req.remarks || 'No additional remarks'}"
                    </p>
                  </div>
                </div>

                {/* Offer Details if present */}
                {req.currentOffer && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-slate-400">Proposed Faculty Offer: </span>
                        <strong className="text-slate-200 font-semibold">
                          {req.currentOffer.instructorName}
                        </strong>{' '}
                        <span className="text-cyan-400">
                          ({req.currentOffer.offeredHours} hrs capacity held in escrow)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hold valid until: {req.currentOffer.expiresAt}</span>
                    </div>
                  </div>
                )}

                {/* Action buttons depending on state and user department role */}
                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-end space-x-3">
                  {/* Supplying department can make offer if SUBMITTED or UNDER_REVIEW */}
                  {(isIncoming || currentDept === 'ALL') &&
                    (req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => handleOpenOfferModal(req)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-sm flex items-center space-x-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Select & Offer Instructor</span>
                      </button>
                    )}

                  {/* Requesting department can accept/reject when OFFERED */}
                  {(isOutgoing || currentDept === 'ALL') && req.status === 'OFFERED' && (
                    <>
                      <button
                        onClick={() => onRejectOffer(req.id)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40 transition-all"
                      >
                        Decline Offer
                      </button>
                      <button
                        onClick={() => onAcceptOffer(req.id)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Offer & Commit Workload</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE NEW REQUEST MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">
                    Submit Faculty Coordination Request
                  </h3>
                  <p className="text-xs text-slate-400">
                    Request teaching capacity from another academic department
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none p-1"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mt-4 p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1 mb-2">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Common Interdepartmental Presets:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handlePresetSelect(
                      'MATH-201',
                      'Discrete Mathematics',
                      'MATH',
                      'DISCRETE_MATH',
                      3.0
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  MATH-201 Discrete Math (MATH)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePresetSelect(
                      'MATH-101',
                      'Calculus for Engineers',
                      'MATH',
                      'CALCULUS',
                      3.0
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  MATH-101 Calculus (MATH)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePresetSelect(
                      'ECE-201',
                      'Digital Logic & Microprocessors',
                      'ECE',
                      'NETWORKS',
                      3.0
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  ECE-201 Digital Logic (ECE)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handlePresetSelect(
                      'CS-101',
                      'Intro to Programming',
                      'CS',
                      'SYSTEMS',
                      2.0
                    )
                  }
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-700 text-[11px] text-slate-300 transition-colors"
                >
                  CS-101 Programming (CS)
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitNewRequest} className="mt-4 space-y-4 text-xs">
              {/* Department routing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Requesting Department:
                  </label>
                  {currentDept !== 'ALL' ? (
                    <div className="p-2.5 rounded-lg bg-slate-800/80 border border-indigo-500/30 font-bold text-indigo-300 flex items-center justify-between">
                      <span>{effectiveRequestingDept}</span>
                      <span className="text-[10px] text-slate-400 font-normal">Your Department</span>
                    </div>
                  ) : (
                    <select
                      value={reqDept}
                      onChange={(e) => setReqDept(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                  <label className="block text-slate-400 font-medium mb-1">
                    Target Supplying Department:
                  </label>
                  <select
                    value={supDept}
                    onChange={(e) => setSupDept(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 font-semibold"
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

              {/* Course information */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. MATH-201"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-400 font-medium mb-1">Course Title:</label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Discrete Mathematics"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              {/* Section, Room Type, Hours */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Student Section:</label>
                  <input
                    type="text"
                    required
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="e.g. CS-Year 2 Sec A"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Room Category:</label>
                  <select
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value as RoomCategory)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  >
                    <option value="REGULAR_CLASSROOM">Regular Classroom</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="COMPUTER_LAB">Computer Lab</option>
                    <option value="SCIENCE_LAB">Science Lab</option>
                    <option value="SEMINAR_ROOM">Seminar Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-medium mb-1">Hours / Week:</label>
                  <input
                    type="number"
                    min="0.5"
                    max="12"
                    step="0.5"
                    required
                    value={requiredHours}
                    onChange={(e) => setRequiredHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold text-indigo-300"
                  />
                </div>
              </div>

              {/* Qualification Tag */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Required Qualification / Specialization Tag:
                </label>
                <input
                  type="text"
                  required
                  value={requiredQual}
                  onChange={(e) => setRequiredQual(e.target.value)}
                  placeholder="e.g. DISCRETE_MATH, AI, COMPILERS, NETWORKS"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Department Remarks & Scheduling Preferences:
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide syllabus requirements, day preferences, or specific notes..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Routing: <span className="text-indigo-400 font-semibold">{effectiveRequestingDept}</span> →{' '}
                  <span className="text-cyan-400 font-semibold">{supDept}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Coordination Request</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {activeOfferModalReq && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-100 mb-1">
              Offer Instructor to {activeOfferModalReq.requestingDept}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              For {activeOfferModalReq.courseCode} ({activeOfferModalReq.requiredHours} hours required)
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Select {activeOfferModalReq.supplyingDept} Instructor:
                </label>
                <select
                  value={selectedInstructorId}
                  onChange={(e) => setSelectedInstructorId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  {instructors
                    .filter((i) => i.departmentCode === activeOfferModalReq.supplyingDept)
                    .map((inst) => {
                      const avail =
                        inst.maxWeeklyWorkload - (inst.committedHours + inst.heldHours);
                      return (
                        <option key={inst.id} value={inst.id}>
                          {inst.name} — Remaining: {avail.toFixed(1)} / {inst.maxWeeklyWorkload}h
                        </option>
                      );
                    })}
                </select>
              </div>

              {selectedInstObj && (
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Workload Limit:</span>
                    <span className="font-bold text-slate-200">
                      {selectedInstObj.maxWeeklyWorkload} hrs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Currently Committed:</span>
                    <span className="text-emerald-400">{selectedInstObj.committedHours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Holds in Escrow:</span>
                    <span className="text-amber-400">{selectedInstObj.heldHours} hrs</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800">
                    <span className="text-slate-300 font-medium">Available Headroom:</span>
                    <span
                      className={`font-bold ${remainingCap > 0 ? 'text-cyan-400' : 'text-rose-400'}`}
                    >
                      {remainingCap.toFixed(1)} hrs
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Offered Hours to Commit:
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={offeredHours}
                  onChange={(e) => setOfferedHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>

              {isOverCapacity && (
                <div className="flex items-center space-x-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    Cannot offer {offeredHours}h: exceeds instructor available capacity (
                    {remainingCap.toFixed(1)}h).
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end space-x-3">
              <button
                onClick={() => setActiveOfferModalReq(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isOverCapacity || offeredHours <= 0}
                onClick={handleSubmitOffer}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-cyan-600/20"
              >
                Lock Capacity & Submit Offer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
