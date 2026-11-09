import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  GitPullRequest,
  Gauge,
  Sparkles,
  Building2,
  ShieldCheck,
  Lock,
  ChevronDown,
  Check,
  UserCheck,
  Users,
  BookOpen,
} from 'lucide-react';
import type { Department, User, ActiveNavTab } from '../types';

interface HeaderProps {
  departments: Department[];
  selectedDept: string;
  onSelectDept: (deptCode: string) => void;
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  pendingRequestsCount: number;
  currentUser: User;
  onSelectUser: (user: User) => void;
  allUsers: User[];
}

export const Header: React.FC<HeaderProps> = ({
  departments,
  selectedDept,
  onSelectDept,
  activeTab,
  onSelectTab,
  pendingRequestsCount,
  currentUser,
  onSelectUser,
  allUsers,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isChair = currentUser.role === 'DEPARTMENT_CHAIR';

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

          {/* Department Context Selector & User Switcher */}
          <div className="flex items-center space-x-3">
            {/* Department Context: Locked if Chair, Selectable if Admin */}
            {isChair ? (
              <div
                className="flex items-center space-x-2 bg-slate-800/90 px-3 py-1.5 rounded-lg border border-indigo-500/40 text-sm shadow-inner"
                title={`Security scope restricted to ${currentUser.departmentCode} department`}
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs text-slate-400 hidden md:inline">Department Scope:</span>
                <span className="font-bold text-indigo-200">{currentUser.departmentCode}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  Locked
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-sm">
                <Building2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 hidden sm:inline">Department:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => onSelectDept(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-800 text-white">
                    University-Wide (Admin)
                  </option>
                  {departments.map((d) => (
                    <option key={d.code} value={d.code} className="bg-slate-800 text-white">
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Term Status Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fall 2026 Term Active</span>
            </div>

            {/* User Account Switcher */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-[11px] shadow-sm">
                  {currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-xs leading-none text-slate-100">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                    {currentUser.role === 'UNIVERSITY_ADMIN'
                      ? 'University Admin'
                      : `${currentUser.departmentCode} Chair`}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switcher Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2 border-b border-slate-800 text-xs text-slate-400">
                    <p className="font-semibold text-slate-200">Switch System Account</p>
                    <p className="text-[11px] text-slate-500">
                      View system from different department chair or admin roles.
                    </p>
                  </div>

                  <div className="py-1">
                    {allUsers.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSelectUser(u);
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600/15 text-indigo-200 font-semibold border-l-2 border-indigo-500'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-xs">
                              {u.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="font-medium text-slate-200">{u.fullName}</div>
                              <div className="text-[11px] text-slate-400">
                                {u.role === 'UNIVERSITY_ADMIN'
                                  ? 'University Registrar (Full Access)'
                                  : `${u.departmentCode} Department Chair`}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3 py-2 mt-1 border-t border-slate-800 bg-slate-950/40 text-[11px] text-slate-400 flex items-center space-x-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Active: {currentUser.fullName} (
                      {currentUser.role === 'UNIVERSITY_ADMIN'
                        ? 'Admin'
                        : `${currentUser.departmentCode} Scoped`}
                      )
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto pb-1 pt-2 border-t border-slate-800/80 scrollbar-none">
          <button
            onClick={() => onSelectTab('timetable')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'timetable'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Weekly Matrix</span>
          </button>

          <button
            onClick={() => onSelectTab('courses')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'courses'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses by Year</span>
          </button>

          <button
            onClick={() => onSelectTab('faculty')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'faculty'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty Directory</span>
          </button>

          <button
            onClick={() => onSelectTab('coordination')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 relative ${
              activeTab === 'coordination'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Coordination Hub</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('workload')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'workload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Workload Gauges</span>
          </button>

          <button
            onClick={() => onSelectTab('allocations')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'allocations'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Matching Engine</span>
          </button>
        </div>
      </div>
    </header>
  );
};
