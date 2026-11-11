import { useState } from 'react';
import type { AllocationRecommendation } from '../types';
import { Sparkles, CheckCircle2, UserCheck, ShieldCheck, Zap } from 'lucide-react';

interface InternalAllocationPanelProps {
  recommendations: AllocationRecommendation[];
  onCommitAllocation: (offeringId: string) => void;
  currentDept: string;
}

export const InternalAllocationPanel: React.FC<InternalAllocationPanelProps> = ({
  recommendations,
  onCommitAllocation,
  currentDept,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [list, setList] = useState(recommendations);

  const handleRunOptimizer = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
    }, 600);
  };

  const handleCommit = (offeringId: string) => {
    onCommitAllocation(offeringId);
    setList((prev) =>
      prev.map((item) =>
        item.offeringId === offeringId ? { ...item, status: 'COMMITTED' } : item
      )
    );
  };

  const filteredList = list.filter(
    (item) => currentDept === 'ALL' || item.courseCode.startsWith(currentDept)
  );

  return (
    <div className="space-y-6">
      {/* Banner / Optimizer trigger */}
      <div className="card-edge-gradient bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#0088D9] text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-[#0088D9]" />
            <span>Automated Internal Matching</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Department Course-Faculty Allocation Engine
          </h2>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Automatically pairs departmental course offerings with qualified instructors while
            enforcing workload caps and balancing teaching load distribution.
          </p>
        </div>

        <button
          onClick={handleRunOptimizer}
          disabled={isRunning}
          className="btn-primary-gradient flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs shadow-xs transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
        >
          <Zap className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Solving Optimal Match...' : 'Run Allocation Engine'}</span>
        </button>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Pending Recommendations for {currentDept === 'ALL' ? 'University-Wide' : currentDept} ({filteredList.length})
          </h3>
          <span className="text-xs text-slate-600 font-medium">
            Chair review required before official commitment
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="card-edge-gradient bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-xs">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[#00A65A]" />
            <p className="font-semibold text-slate-900">No Pending Course Allocations</p>
            <p className="text-xs text-slate-500 mt-1">
              All internal offerings for {currentDept} currently have verified faculty assignments.
            </p>
          </div>
        ) : (
          filteredList.map((rec) => {
            const isCommitted = rec.status === 'COMMITTED';

            return (
              <div
                key={rec.offeringId}
                className={`card-edge-gradient bg-white border rounded-2xl p-5 shadow-xs transition-all ${
                  isCommitted
                    ? 'border-[#00A65A]/45 bg-[#00A65A]/5'
                    : 'border-slate-200/90 hover:border-[#0088D9]/50'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Course offering details */}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-[#0088D9]">{rec.courseCode}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-800 font-medium">{rec.courseTitle}</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-[#f4f6f9] border border-slate-200 text-slate-700 font-mono">
                        {rec.sectionName}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span>Type: <strong className="text-slate-700">{rec.componentType}</strong></span>
                      <span>•</span>
                      <span>Weekly Teaching Load: <strong className="text-[#0088D9]">{rec.requiredHours} hrs</strong></span>
                    </div>
                  </div>

                  {/* Match result & action */}
                  <div className="flex items-center space-x-4">
                    {rec.recommendedInstructorName ? (
                      <div className="card-edge-subtle flex items-center space-x-3 bg-[#f4f6f9] p-3 rounded-xl border border-slate-200">
                        <UserCheck className="w-5 h-5 text-[#00A65A]" />
                        <div className="text-xs">
                          <span className="text-slate-500 block text-[10px]">Algorithm Selection:</span>
                          <span className="font-bold text-slate-900">{rec.recommendedInstructorName}</span>
                          {rec.utilizationAfter && (
                            <span className="text-[10px] text-[#0088D9] block font-medium">
                              Projected Load: {(rec.utilizationAfter * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-rose-500 font-medium">No available qualified instructor</span>
                    )}

                    {isCommitted ? (
                      <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl badge-success-soft text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#00A65A]" />
                        <span>Committed</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCommit(rec.offeringId)}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#00A65A] hover:bg-[#008f4d] text-white shadow-xs transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Approve & Commit</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
