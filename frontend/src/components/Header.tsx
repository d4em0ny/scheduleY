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
import hawassaLogo from '../assets/hawassa-logo.png';

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
    <header className="bg-white border-b border-slate-200/90 shadow-xs sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <img
              src={hawassaLogo}
              alt="Hawassa University Logo"
              className="w-11 h-11 rounded-full object-contain bg-white border border-slate-200/90 shadow-xs p-0.5 flex-shrink-0"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  scheduleY
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full badge-primary-soft font-bold">
                  Hawassa University
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                University Intelligent Scheduling & Resource Allocation
              </p>
            </div>
          </div>

          {/* Department Context & Profile Switcher */}
          <div className="flex items-center space-x-3">
            {/* Department Context */}
            {isChair ? (
              <div
                className="flex items-center space-x-2 badge-primary-soft px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs"
                title={`Security scope restricted to ${currentUser.departmentCode} department`}
              >
                <Lock className="w-3.5 h-3.5 text-[#0088D9]" />
                <span className="text-slate-600 hidden md:inline">Scope:</span>
                <span className="font-bold text-[#0088D9]">{currentUser.departmentCode}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#0088D9]/15 text-[#0073B7] font-bold">
                  Locked
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-[#f4f6f9] px-3 py-1.5 rounded-xl border border-slate-200 text-xs">
                <Building2 className="w-4 h-4 text-[#0088D9]" />
                <span className="text-slate-500 hidden sm:inline">Department:</span>
                <select
                  value={selectedDept}
                  onChange={(e) => onSelectDept(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">University-Wide (Admin)</option>
                  {departments.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Term Pill */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl badge-success-soft text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00A65A]" />
              <span>Fall 2026 Active</span>
            </div>

            {/* User Account Switcher */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 bg-[#f4f6f9] hover:bg-[#e9edf2] border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-[#0088D9]/35 cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#0088D9] to-[#3C8DBC] flex items-center justify-center text-white font-bold text-[11px] shadow-xs">
                  {currentUser.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-xs leading-none text-slate-900">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    {currentUser.role === 'UNIVERSITY_ADMIN'
                      ? 'University Admin'
                      : `${currentUser.departmentCode} Chair`}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 card-edge-gradient animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 text-xs text-slate-500">
                    <p className="font-bold text-slate-800">Switch System Account</p>
                    <p className="text-[11px] text-slate-400">
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
                          className={`w-full text-left px-3.5 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#0088D9]/8 text-[#0088D9] font-bold border-l-3 border-[#0088D9]'
                              : 'text-slate-700 hover:bg-[#f4f6f9] hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#D2D6DE]/50 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
                              {u.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{u.fullName}</div>
                              <div className="text-[11px] text-slate-500">
                                {u.role === 'UNIVERSITY_ADMIN'
                                  ? 'Registrar (Full Access)'
                                  : `${u.departmentCode} Department Chair`}
                              </div>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-[#0088D9]" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="px-3.5 py-2 mt-1 border-t border-slate-100 bg-[#f4f6f9] text-[11px] text-slate-500 flex items-center space-x-1.5 rounded-b-2xl">
                    <UserCheck className="w-3.5 h-3.5 text-[#0088D9]" />
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

        {/* Tab Navigation Row */}
        <div className="flex space-x-1.5 overflow-x-auto pb-2 pt-2 border-t border-slate-100 scrollbar-none">
          <button
            onClick={() => onSelectTab('timetable')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'timetable'
                ? 'tab-primary-active'
                : 'text-slate-600 hover:text-[#0088D9] hover:bg-[#f4f6f9]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Weekly Matrix</span>
          </button>

          <button
            onClick={() => onSelectTab('courses')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'courses'
                ? 'tab-primary-active'
                : 'text-slate-600 hover:text-[#0088D9] hover:bg-[#f4f6f9]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Courses by Year</span>
          </button>

          <button
            onClick={() => onSelectTab('faculty')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'faculty'
                ? 'tab-primary-active'
                : 'text-slate-600 hover:text-[#0088D9] hover:bg-[#f4f6f9]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty Directory</span>
          </button>

          <button
            onClick={() => onSelectTab('coordination')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 relative ${
              activeTab === 'coordination'
                ? 'tab-primary-active'
                : 'text-slate-600 hover:text-[#0088D9] hover:bg-[#f4f6f9]'
            }`}
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Coordination Hub</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#00C0EF] text-white">
                {pendingRequestsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('workload')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'workload'
                ? 'tab-primary-active'
                : 'text-slate-600 hover:text-[#0088D9] hover:bg-[#f4f6f9]'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>Workload Gauges</span>
          </button>

          <button
            onClick={() => onSelectTab('allocations')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex-shrink-0 ${
              activeTab === 'allocations'
                ? 'tab-primary-active'
                : 'text-slate-600 hover:text-[#0088D9] hover:bg-[#f4f6f9]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Matching Engine</span>
          </button>
        </div>
      </div>
      <div className="h-[2.5px] w-full bg-gradient-to-r from-[#0088D9] via-[#3C8DBC] to-[#00C0EF]" />
    </header>
  );
};
