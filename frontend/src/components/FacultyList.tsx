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
    <div className="space-y-5">
      {/* Control / Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Academic Faculty Registry</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {currentDept === 'ALL' ? 'University Faculty Directory' : `${currentDept} Department Faculty`}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage departmental teaching faculty, verified specialization qualifications, and university-wide workload quotas.
          </p>
        </div>

        <button
          onClick={() => {
            if (currentDept !== 'ALL') setDeptCode(currentDept);
            setIsAddModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs shadow-blue-600/20 transition-all cursor-pointer flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Faculty Member</span>
        </button>
      </div>

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-slate-200/90 p-3 rounded-2xl shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by faculty name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#f8f9fa] border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* Qualification Tags Filter */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-500 mr-1 hidden lg:inline font-medium">Specialization:</span>
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              selectedTag === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-[#f5f5f7]'
            }`}
          >
            All ({deptFiltered.length})
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 bg-[#f5f5f7]'
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
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-700">No instructors found matching criteria</p>
            <p className="text-xs text-slate-400 mt-1">
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
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top info & avatar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm shadow-xs">
                        {inst.name
                          .replace('Dr. ', '')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{inst.name}</h3>
                        <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono text-[11px] text-blue-900 font-bold px-1.5 py-0.2 rounded bg-blue-50 border border-blue-200">
                            {inst.employeeId}
                          </span>
                          <span>•</span>
                          <span className="text-blue-700 font-bold">{inst.departmentCode}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    {isFull ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        At Capacity
                      </span>
                    ) : isHighLoad ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        High Load
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="mt-3 flex items-center space-x-2 text-xs text-slate-500">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate font-medium">{inst.email}</span>
                  </div>

                  {/* Qualifications */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Verified Specializations
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {inst.qualifications.map((q) => (
                        <span
                          key={q}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200/80 font-mono text-[10px] font-bold"
                        >
                          {q}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Workload Gauge Summary */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-slate-500 font-medium">Workload Utilization:</span>
                    <span className="font-bold text-slate-900">
                      {totalAssigned.toFixed(1)} / {inst.maxWeeklyWorkload} hrs ({utilPercent.toFixed(0)}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-600 h-full transition-all"
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
                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                    <span>
                      Available Headroom:{' '}
                      <strong className={remaining > 0 ? 'text-blue-700 font-bold' : 'text-rose-600 font-bold'}>
                        {remaining.toFixed(1)} hrs
                      </strong>
                    </span>
                    {inst.heldHours > 0 && (
                      <span className="text-amber-700 font-semibold flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{inst.heldHours}h in escrow</span>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Academic Faculty Member</h3>
                  <p className="text-xs text-slate-500">Register instructor and configure teaching capacity</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitNewInstructor} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">First Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Margaret"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Last Name:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hamilton"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Employee ID:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS-004"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address:</label>
                  <input
                    type="email"
                    placeholder="e.g. margaret.hamilton@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Department:</label>
                  {currentDept !== 'ALL' ? (
                    <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 font-bold">
                      {currentDept} (Scope Locked)
                    </div>
                  ) : (
                    <select
                      value={deptCode}
                      onChange={(e) => setDeptCode(e.target.value)}
                      className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
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
                  <label className="block text-slate-700 font-semibold mb-1">Max Weekly Hours:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    step="0.5"
                    required
                    value={maxWorkload}
                    onChange={(e) => setMaxWorkload(parseFloat(e.target.value) || 12)}
                    className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-bold text-blue-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Specialization Qualification Tags (comma-separated):
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOFTWARE_ENG, SYSTEMS, COMPILERS"
                  value={qualificationTags}
                  onChange={(e) => setQualificationTags(e.target.value)}
                  className="w-full bg-[#f8f9fa] border border-slate-200 rounded-xl p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-all cursor-pointer"
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
