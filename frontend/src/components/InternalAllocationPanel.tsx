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
      <div className="bg-gradient-to-r from-indigo-900/60 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Automated Internal Matching</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Department Course-Faculty Allocation Engine
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Automatically pairs departmental course offerings with qualified instructors while
            enforcing workload caps and balancing teaching load distribution.
          </p>
        </div>

        <button
          onClick={handleRunOptimizer}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Solving Optimal Match...' : 'Run Allocation Engine'}</span>
        </button>
      </div>

      {/* Recommendations Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-200">
            Pending Recommendations for {currentDept === 'ALL' ? 'University-Wide' : currentDept} ({filteredList.length})
          </h3>
          <span className="text-xs text-slate-400">
            Chair review required before official commitment
          </span>
        </div>

        {filteredList.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-10 text-center text-slate-400">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-400" />
            <p className="font-semibold text-slate-200">No Pending Course Allocations</p>
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
              className={`bg-slate-900 border rounded-xl p-5 shadow-md transition-all ${
                isCommitted ? 'border-emerald-500/40 bg-slate-900/40' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Course offering details */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-white">{rec.courseCode}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-300 font-medium">{rec.courseTitle}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {rec.sectionName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span>Type: <strong className="text-slate-300">{rec.componentType}</strong></span>
                    <span>•</span>
                    <span>Weekly Teaching Load: <strong className="text-indigo-400">{rec.requiredHours} hrs</strong></span>
                  </div>
                </div>

                {/* Match result & action */}
                <div className="flex items-center space-x-4">
                  {rec.recommendedInstructorName ? (
                    <div className="flex items-center space-x-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      <UserCheck className="w-5 h-5 text-emerald-400" />
                      <div className="text-xs">
                        <span className="text-slate-400 block text-[10px]">Algorithm Selection:</span>
                        <span className="font-bold text-slate-200">{rec.recommendedInstructorName}</span>
                        {rec.utilizationAfter && (
                          <span className="text-[10px] text-cyan-400 block">
                            Projected Load: {(rec.utilizationAfter * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-rose-400 font-medium">No available qualified instructor</span>
                  )}

                  {isCommitted ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Committed</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleCommit(rec.offeringId)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approve & Commit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
};
