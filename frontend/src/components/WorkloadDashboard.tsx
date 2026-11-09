import type { Instructor } from '../types';
import { Gauge, Users, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface WorkloadDashboardProps {
  instructors: Instructor[];
  currentDept: string;
}

export const WorkloadDashboard: React.FC<WorkloadDashboardProps> = ({
  instructors,
  currentDept,
}) => {
  const filteredInstructors = instructors.filter(
    (i) => currentDept === 'ALL' || i.departmentCode === currentDept
  );

  const totalCapacity = filteredInstructors.reduce((acc, i) => acc + i.maxWeeklyWorkload, 0);
  const totalCommitted = filteredInstructors.reduce((acc, i) => acc + i.committedHours, 0);
  const totalHeld = filteredInstructors.reduce((acc, i) => acc + i.heldHours, 0);
  const utilizationRate = totalCapacity > 0 ? ((totalCommitted + totalHeld) / totalCapacity) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Faculty Monitored</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{filteredInstructors.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across active departments</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Total Committed Load</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{totalCommitted.toFixed(1)} hrs</div>
          <p className="text-[11px] text-slate-400 mt-1">Confirmed course offerings</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Active Holds in Escrow</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{totalHeld.toFixed(1)} hrs</div>
          <p className="text-[11px] text-slate-400 mt-1">Pending interdepartmental offers</p>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Overall Utilization</span>
            <Gauge className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">{utilizationRate.toFixed(1)}%</div>
          <p className="text-[11px] text-slate-400 mt-1">Of university capacity limit</p>
        </div>
      </div>

      {/* Faculty Workload Gauge Cards */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <span>Faculty Workload & Quota Registry</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict concurrency control prevents over-allocation beyond individual permitted weekly limits.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium">Committed</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="font-medium">Held in Escrow</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="font-medium">Available</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInstructors.map((inst) => {
            const committedPct = (inst.committedHours / inst.maxWeeklyWorkload) * 100;
            const heldPct = (inst.heldHours / inst.maxWeeklyWorkload) * 100;
            const totalUsed = inst.committedHours + inst.heldHours;
            const remaining = Math.max(0, inst.maxWeeklyWorkload - totalUsed);
            const isNearCapacity = totalUsed / inst.maxWeeklyWorkload >= 0.85;

            return (
              <div
                key={inst.id}
                className="bg-[#f8f9fa] border border-slate-200/80 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{inst.name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-blue-600">{inst.departmentCode}</span>
                      <span>•</span>
                      <span>{inst.email}</span>
                    </div>
                  </div>

                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold border ${
                      isNearCapacity
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isNearCapacity ? 'Near Cap' : 'Capacity Safe'}
                  </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="my-3">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700">
                      Total Allocated: {totalUsed.toFixed(1)} / {inst.maxWeeklyWorkload} hrs
                    </span>
                    <span className="text-blue-600 font-medium">{remaining.toFixed(1)} hrs free</span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${committedPct}%` }}
                      className="bg-emerald-500 h-full transition-all duration-500"
                      title={`Committed: ${inst.committedHours}h`}
                    />
                    <div
                      style={{ width: `${heldPct}%` }}
                      className="bg-amber-500 h-full transition-all duration-500"
                      title={`Held: ${inst.heldHours}h`}
                    />
                  </div>
                </div>

                {/* Qualifications tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {inst.qualifications.map((q) => (
                    <span
                      key={q}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white text-slate-700 border border-slate-200 shadow-2xs"
                    >
                      {q}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
