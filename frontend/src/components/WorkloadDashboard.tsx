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
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Faculty Monitored</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{filteredInstructors.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">Across active departments</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Committed Load</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totalCommitted.toFixed(1)} hrs</div>
          <p className="text-[11px] text-slate-500 mt-1">Confirmed course offerings</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Active Holds in Escrow</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{totalHeld.toFixed(1)} hrs</div>
          <p className="text-[11px] text-slate-500 mt-1">Pending interdepartmental offers</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Overall Utilization</span>
            <Gauge className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{utilizationRate.toFixed(1)}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Of university capacity limit</p>
        </div>
      </div>

      {/* Faculty Workload Gauge Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>University-Wide Faculty Workload Registry</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict concurrency control prevents over-allocation beyond individual permitted weekly limits.
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-4 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span>Committed</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              <span>Held in Escrow</span>
            </span>
            <span className="flex items-center space-x-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-xs bg-slate-700" />
              <span>Available</span>
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
                className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 shadow-sm hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{inst.name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-semibold text-indigo-400">{inst.departmentCode}</span>
                      <span>•</span>
                      <span>{inst.email}</span>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                      isNearCapacity
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {isNearCapacity ? 'Near Cap' : 'Capacity Safe'}
                  </span>
                </div>

                {/* Multi-segment Progress Bar */}
                <div className="my-3">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-300">
                      Total Allocated: {totalUsed.toFixed(1)} / {inst.maxWeeklyWorkload} hrs
                    </span>
                    <span className="text-cyan-400">{remaining.toFixed(1)} hrs free</span>
                  </div>

                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
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
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
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
