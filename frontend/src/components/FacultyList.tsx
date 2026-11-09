import { useState } from 'react';
import type { Instructor, Department } from '../types';
import {
  Users,
  Search,
  Plus,
  Mail,
  Clock,
} from 'lucide-react';

interface FacultyListProps {
  instructors: Instructor[];
  currentDept: string;
  departments: Department[];
  onAddInstructor: (newInst: Instructor) => void;
}

export const FacultyList: React.FC<FacultyListProps> = ({
  instructors,
  currentDept,
  departments,
  onAddInstructor,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [deptCode, setDeptCode] = useState(currentDept !== 'ALL' ? currentDept : 'CS');
  const [maxWorkload, setMaxWorkload] = useState(12.0);
  const [qualificationTags, setQualificationTags] = useState('ALGORITHMS, AI');

  // Filter instructors by department
  const deptFiltered = instructors.filter(
    (i) => currentDept === 'ALL' || i.departmentCode === currentDept
  );

  // Collect all unique qualification tags in active scope
  const allTags = Array.from(new Set(deptFiltered.flatMap((i) => i.qualifications)));

  // Filter by search query and tag
  const filteredInstructors = deptFiltered.filter((i) => {
    const matchesSearch =
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'ALL' || i.qualifications.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleSubmitNewInstructor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !employeeId) return;

    const tags = qualificationTags
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    const newInst: Instructor = {
      id: `inst-${Date.now()}`,
      departmentCode: currentDept !== 'ALL' ? currentDept : deptCode,
      employeeId: employeeId.trim().toUpperCase(),
      name: `Dr. ${firstName.trim()} ${lastName.trim()}`,
      email: email.trim().toLowerCase() || `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`,
      maxWeeklyWorkload: maxWorkload,
      committedHours: 0,
      heldHours: 0,
      qualifications: tags.length > 0 ? tags : ['GENERAL'],
    };

    onAddInstructor(newInst);
    setIsAddModalOpen(false);
    // Reset form
    setFirstName('');
    setLastName('');
    setEmployeeId('');
    setEmail('');
  };

  return (
    <div className="space-y-6">
      {/* Control / Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Academic Faculty Registry</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {currentDept === 'ALL' ? 'University Faculty Directory' : `${currentDept} Department Instructors`}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage teaching faculty, verified specialization qualifications, and university-wide workload quotas.
          </p>
        </div>

        <button
          onClick={() => {
            if (currentDept !== 'ALL') setDeptCode(currentDept);
            setIsAddModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by faculty name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Qualification Tags Filter */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-400 mr-1 hidden lg:inline">Specialization:</span>
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              selectedTag === 'ALL'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            All ({deptFiltered.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedTag === tag
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Instructors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInstructors.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="font-semibold text-slate-300">No instructors found matching criteria</p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or add a new faculty member using the button above.
            </p>
          </div>
        ) : (
          filteredInstructors.map((inst) => {
            const totalAssigned = inst.committedHours + inst.heldHours;
            const remaining = Math.max(0, inst.maxWeeklyWorkload - totalAssigned);
            const utilPercent = (totalAssigned / inst.maxWeeklyWorkload) * 100;

            const isHighLoad = utilPercent >= 75 && utilPercent < 100;
            const isFull = utilPercent >= 100;

            return (
              <div
                key={inst.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top info & avatar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                        {inst.name
                          .replace('Dr. ', '')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-white">{inst.name}</h3>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-0.5">
                          <span className="font-mono text-[11px] text-slate-300 font-semibold px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700/60">
                            {inst.employeeId}
                          </span>
                          <span>•</span>
                          <span className="text-cyan-400 font-medium">{inst.departmentCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    {isFull ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        At Capacity
                      </span>
                    ) : isHighLoad ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        High Load
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mt-3 flex items-center space-x-2 text-xs text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{inst.email}</span>
                  </div>

                  {/* Qualifications */}
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Qualified Specializations
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {inst.qualifications.map((q) => (
                        <span
                          key={q}
                          className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono text-[10px] font-semibold"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Workload Gauge Summary */}
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-400 font-medium">Workload Utilization:</span>
                    <span className="font-bold text-slate-200">
                      {totalAssigned.toFixed(1)} / {inst.maxWeeklyWorkload} hrs ({utilPercent.toFixed(0)}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all"
                      style={{ width: `${(inst.committedHours / inst.maxWeeklyWorkload) * 100}%` }}
                      title={`Committed: ${inst.committedHours}h`}
                    />
                    <div
                      className="bg-amber-400 h-full transition-all"
                      style={{ width: `${(inst.heldHours / inst.maxWeeklyWorkload) * 100}%` }}
                      title={`Active Escrow Holds: ${inst.heldHours}h`}
                    />
                  </div>

                  {/* Details row */}
                  <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2">
                    <span>
                      Headroom: <strong className={remaining > 0 ? 'text-cyan-400' : 'text-rose-400'}>{remaining.toFixed(1)}h</strong>
                    </span>
                    {inst.heldHours > 0 && (
                      <span className="text-amber-400 font-medium flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{inst.heldHours}h hold</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ADD FACULTY MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-100">Add Academic Faculty Member</h3>
                  <p className="text-xs text-slate-400">Register instructor and configure teaching capacity</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewInstructor} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">First Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Margaret"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Last Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hamilton"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Employee ID:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-004"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Email Address:</label>
                  <input
                    type="email"
                    placeholder="e.g. margaret.hamilton@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Department:</label>
                  {currentDept !== 'ALL' ? (
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-indigo-500/30 text-indigo-300 font-semibold">
                      {currentDept} (Scope Locked)
                    </div>
                  ) : (
                    <select
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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
                  <label className="block text-slate-400 font-medium mb-1">Max Weekly Hours:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    required
                    value={maxWorkload}
                    onChange={(e) => setMaxWorkload(parseFloat(e.target.value) || 12)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold text-indigo-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Specialization Qualification Tags (comma-separated):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOFTWARE_ENG, SYSTEMS, COMPILERS"
                  value={qualificationTags}
                  onChange={(e) => setQualificationTags(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all"
                >
                  Save & Register Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
