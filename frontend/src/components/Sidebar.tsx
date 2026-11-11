import {
  Calendar,
  BookOpen,
  Users,
  GitPullRequest,
  Gauge,
  Sparkles,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ActiveNavTab, User } from '../types';
import hawassaLogo from '../assets/hawassa-logo.png';

export interface NavItemConfig {
  id: ActiveNavTab;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'timetable',
    label: 'Weekly Matrix',
    subtitle: 'Schedule grid & constraint solver',
    icon: Calendar,
  },
  {
    id: 'courses',
    label: 'Courses by Year',
    subtitle: 'Year & semester curriculum',
    icon: BookOpen,
  },
  {
    id: 'faculty',
    label: 'Faculty Directory',
    subtitle: 'Instructors & specializations',
    icon: Users,
  },
  {
    id: 'coordination',
    label: 'Coordination Hub',
    subtitle: 'Cross-department instructor requests',
    icon: GitPullRequest,
  },
  {
    id: 'workload',
    label: 'Workload Gauges',
    subtitle: 'Weekly capacity & escrow holds',
    icon: Gauge,
  },
  {
    id: 'allocations',
    label: 'Matching Engine',
    subtitle: 'Automated internal pairing',
    icon: Sparkles,
  },
];

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  pendingRequestsCount: number;
  currentUser: User;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingRequestsCount,
  currentUser,
  isMobileOpen,
  onCloseMobile,
}) => {
  const handleNavClick = (tab: ActiveNavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/90 shadow-xs select-none">
      {/* Brand Header */}
      <div className="px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <img
            src={hawassaLogo}
            alt="Hawassa University Logo"
            className="w-11 h-11 rounded-full object-contain bg-white border border-slate-200/90 shadow-xs p-0.5 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                scheduleY
              </span>
            </div>
            <span className="inline-block text-[10px] px-2 py-0.2 rounded-full badge-primary-soft font-bold mt-0.5">
              Hawassa University
            </span>
          </div>
        </div>

        {/* Mobile drawer close button */}
        <button
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#f4f6f9] cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="h-[2.5px] w-full bg-gradient-to-r from-[#0088D9] via-[#3C8DBC] to-[#00C0EF]" />

      {/* Section Heading */}
      <div className="px-4 pt-5 pb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </span>
      </div>

      {/* Vertical Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const showBadge = item.id === 'coordination' && pendingRequestsCount > 0;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs font-semibold transition-all cursor-pointer group ${
                isActive
                  ? 'tab-primary-active'
                  : 'text-slate-600 hover:text-[#0088D9] hover:bg-[#f4f6f9]'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-[#3C8DBC] group-hover:text-[#0088D9]'
                  }`}
                />
                <div className="min-w-0">
                  <div className="truncate font-bold">{item.label}</div>
                  <div
                    className={`text-[10px] truncate font-normal ${
                      isActive ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {showBadge && (
                <span
                  className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${
                    isActive
                      ? 'bg-white text-[#0088D9]'
                      : 'bg-[#00C0EF] text-white'
                  }`}
                >
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Academic Term & Identity Status Card */}
      <div className="p-3 border-t border-slate-100 bg-[#f8fafc] space-y-2">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl badge-success-soft text-[11px] font-semibold">
          <span className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00A65A]" />
            <span>Fall 2026 Active</span>
          </span>
          <span className="w-2 h-2 rounded-full bg-[#00A65A]" />
        </div>

        <div className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/80 text-[11px] text-slate-600">
          <div className="font-bold text-slate-800 truncate">{currentUser.fullName}</div>
          <div className="text-[10px] text-slate-500">
            {currentUser.role === 'UNIVERSITY_ADMIN'
              ? 'University Registrar (Admin)'
              : `${currentUser.departmentCode} Department Scope`}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Left Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:sticky lg:top-0 lg:h-screen flex-shrink-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-150">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
