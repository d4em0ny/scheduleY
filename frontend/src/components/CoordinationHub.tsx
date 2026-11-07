import { useState } from 'react';
import type { InterdeptRequest, Instructor } from '../types';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Send,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface CoordinationHubProps {
  requests: InterdeptRequest[];
  instructors: Instructor[];
  currentDept: string;
  onAcceptOffer: (requestId: string) => void;
  onRejectOffer: (requestId: string) => void;
  onMakeOffer: (requestId: string, instructorId: string, hours: number) => void;
}

export const CoordinationHub: React.FC<CoordinationHubProps> = ({
  requests,
  instructors,
  currentDept,
  onAcceptOffer,
  onRejectOffer,
  onMakeOffer,
}) => {
  const [filterDirection, setFilterDirection] = useState<'incoming' | 'outgoing' | 'all'>('all');
  const [activeOfferModalReq, setActiveOfferModalReq] = useState<InterdeptRequest | null>(null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>('');
  const [offeredHours, setOfferedHours] = useState<number>(3);

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

        <div className="flex p-1 bg-slate-800 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setFilterDirection('all')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              filterDirection === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Requests ({requests.length})
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
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-12 text-center text-slate-400">
            <GitPullRequest className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300">No interdepartmental requests found</p>
            <p className="text-xs text-slate-500 mt-1">
              Select another filter or create an instructor request.
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
                    <p className="text-slate-400 mt-0.5">{req.sectionName}</p>
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
