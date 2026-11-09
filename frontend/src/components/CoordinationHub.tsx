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
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accepted</span>
          </span>
        );
      case 'OFFERED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Offer Pending</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Submitted</span>
          </span>
        );
    }
  };

  const handleOpenOfferModal = (req: InterdeptRequest) => {
    setActiveOfferModalReq(req);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200/90 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900">
              Interdepartmental Coordination Hub
            </h2>
            <p className="text-[11px] text-slate-500">
              Manage cross-department instructor demands, offers, and capacity escrow holds.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex p-1 bg-[#f5f5f7] rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setFilterDirection('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterDirection === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({filteredRequests.length})
            </button>
            <button
              onClick={() => setFilterDirection('incoming')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterDirection === 'incoming'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Incoming Demands
            </button>
            <button
              onClick={() => setFilterDirection('outgoing')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterDirection === 'outgoing'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Our Requests
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
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs shadow-blue-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Request Faculty</span>
          </button>
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3.5">
        {filteredRequests.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <GitPullRequest className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">No coordination requests found</p>
            <p className="text-xs text-slate-400 mt-1">
              Select another filter or create an instructor request using the "Request Faculty" button.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const isIncoming = currentDept !== 'ALL' && req.supplyingDept === currentDept;
            const isOutgoing = currentDept !== 'ALL' && req.requestingDept === currentDept;

            return (
              <div
                key={req.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                      {req.requestNumber}
                    </span>
                    <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
                      <span className="text-blue-700">{req.requestingDept}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-cyan-700">{req.supplyingDept}</span>
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
                    <p className="text-slate-500 mt-0.5">Section: {req.sectionName} ({req.componentType})</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Required Skill:</span>
                    <div className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 font-mono font-bold">
                      {req.requiredQualification}
                    </div>
                    <p className="text-slate-600 font-semibold mt-1">{req.requiredHours} Weekly Contact Hours</p>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5 font-medium">Department Notes:</span>
                    <p className="text-slate-600 italic bg-[#f8f9fa] p-2 rounded-xl border border-slate-200/80">
                      "{req.remarks || 'No additional remarks'}"
                    </p>
                  </div>
                </div>

                {/* Offer Details if present */}
                {req.currentOffer && (
                  <div className="mt-2 p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4 text-blue-700" />
                      <div>
                        <span className="text-slate-600">Proposed Faculty Offer: </span>
                        <strong className="text-slate-900 font-bold">
                          {req.currentOffer.instructorName}
                        </strong>{' '}
                        <span className="text-blue-800 font-semibold">
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

                {/* Action buttons */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                  {(isIncoming || currentDept === 'ALL') &&
                    (req.status === 'SUBMITTED' || req.status === 'UNDER_REVIEW') && (
                      <button
                        onClick={() => handleOpenOfferModal(req)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Select & Offer Instructor</span>
                      </button>
                    )}

                  {(isOutgoing || currentDept === 'ALL') && req.status === 'OFFERED' && (
                    <>
                      <button
                        onClick={() => onRejectOffer(req.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-300 transition-all cursor-pointer"
                      >
                        Decline Offer
                      </button>
                      <button
                        onClick={() => onAcceptOffer(req.id)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Accept Offer & Commit Load</span>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <GitPullRequest className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Submit Faculty Coordination Request
                  </h3>
                  <p className="text-xs text-slate-500">
                    Request teaching capacity from another academic department
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

            {/* Quick Presets */}
            <div className="mt-4 p-3 bg-[#f8f9fa] rounded-xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-600 flex items-center space-x-1 mb-2">
                <Sparkles className="w-3 h-3 text-blue-600" />
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
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-[11px] text-slate-700 font-medium transition-colors cursor-pointer"
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
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-[11px] text-slate-700 font-medium transition-colors cursor-pointer"
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
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-[11px] text-slate-700 font-medium transition-colors cursor-pointer"
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
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-[11px] text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  CS-101 Programming (CS)
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitNewRequest} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Requesting Department:
                  </label>
                  {currentDept !== 'ALL' ? (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 font-bold text-blue-900 flex items-center justify-between">
                      <span>{effectiveRequestingDept}</span>
                      <span className="text-[10px] text-blue-700 font-normal">Your Department</span>
                    </div>
                  ) : (
                    <select
                      value={reqDept}
                      onChange={(e) => setReqDept(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                    Target Supplying Department:
                  </label>
                  <select
                    value={supDept}
                    onChange={(e) => setSupDept(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-bold"
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

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Course Code:</label>
                  <input
                    type="text"
                    required
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="e.g. MATH-201"
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1">Course Title:</label>
                  <input
                    type="text"
                    required
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    placeholder="e.g. Discrete Mathematics"
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Student Section:</label>
                  <input
                    type="text"
                    required
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="e.g. CS-Year 2 Sec A"
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Room Category:</label>
                  <select
                    value={componentType}
                    onChange={(e) => setComponentType(e.target.value as RoomCategory)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    <option value="REGULAR_CLASSROOM">Regular Classroom</option>
                    <option value="LECTURE_HALL">Lecture Hall</option>
                    <option value="COMPUTER_LAB">Computer Lab</option>
                    <option value="SCIENCE_LAB">Science Lab</option>
                    <option value="SEMINAR_ROOM">Seminar Room</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hours / Week:</label>
                  <input
                    type="number"
                    min="0.5"
                    max="12"
                    step="0.5"
                    required
                    value={requiredHours}
                    onChange={(e) => setRequiredHours(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Required Qualification / Specialization Tag:
                </label>
                <input
                  type="text"
                  required
                  value={requiredQual}
                  onChange={(e) => setRequiredQual(e.target.value)}
                  placeholder="e.g. DISCRETE_MATH, AI, COMPILERS, NETWORKS"
                  className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Department Remarks & Scheduling Preferences:
                </label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Provide syllabus requirements, day preferences, or specific notes..."
                  className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-500">
                  Routing: <span className="text-blue-700 font-bold">{effectiveRequestingDept}</span> →{' '}
                  <span className="text-cyan-700 font-bold">{supDept}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Request</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {activeOfferModalReq && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-1">
              Offer Instructor to {activeOfferModalReq.requestingDept}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              For {activeOfferModalReq.courseCode} ({activeOfferModalReq.requiredHours} hours required)
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Select {activeOfferModalReq.supplyingDept} Instructor:
                </label>
                <select
                  value={selectedInstructorId}
                  onChange={(e) => setSelectedInstructorId(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                <div className="p-3 bg-[#f8f9fa] rounded-xl border border-slate-200 space-y-1.5 text-slate-700">
                  <div className="flex justify-between">
                    <span>Total Workload Limit:</span>
                    <span className="font-bold text-slate-900">
                      {selectedInstObj.maxWeeklyWorkload} hrs
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currently Committed:</span>
                    <span className="text-emerald-700 font-bold">{selectedInstObj.committedHours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Holds in Escrow:</span>
                    <span className="text-amber-700 font-bold">{selectedInstObj.heldHours} hrs</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="font-bold text-slate-800">Available Headroom:</span>
                    <span
                      className={`font-bold ${remainingCap > 0 ? 'text-blue-700' : 'text-rose-600'}`}
                    >
                      {remainingCap.toFixed(1)} hrs
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Offered Hours to Commit:
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={offeredHours}
                  onChange={(e) => setOfferedHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              {isOverCapacity && (
                <div className="flex items-center space-x-2 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isOverCapacity || offeredHours <= 0}
                onClick={handleSubmitOffer}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-xs cursor-pointer"
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
