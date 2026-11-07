import { Calendar, GitPullRequest, Gauge, Sparkles, Building2, ShieldCheck } from 'lucide-react';
import type { Department } from '../types';

interface HeaderProps {
  departments: Department[];
  selectedDept: string;
  onSelectDept: (deptCode: string) => void;
  activeTab: 'timetable' | 'coordination' | 'workload' | 'allocations';
  onSelectTab: (tab: 'timetable' | 'coordination' | 'workload' | 'allocations') => void;
  pendingRequestsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  departments,
  selectedDept,
  onSelectDept,
  activeTab,
  onSelectTab,
  pendingRequestsCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20">
              Y
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  scheduleY
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                University Intelligent Scheduling & Resource Allocation
              </p>
            </div>
          </div>

          {/* Department Context Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-sm">
              <Building2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-slate-400">Department:</span>
              <select
                value={selectedDept}
                onChange={(e) => onSelectDept(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-800 text-white">University-Wide (Admin)</option>
                {departments.map((d) => (
                  <option key={d.code} value={d.code} className="bg-slate-800 text-white">
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fall 2026 Term Active</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => onSelectTab('timetable')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'timetable'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Weekly Timetable Matrix</span>
          </button>

          <button
            onClick={() => onSelectTab('coordination')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
              activeTab === 'coordination'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Department Coordination</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('workload')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'workload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Faculty Workload Gauges</span>
          </button>

          <button
            onClick={() => onSelectTab('allocations')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'allocations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Internal Allocation Engine</span>
          </button>
        </div>
      </div>
    </header>
  );
};
