import { useState } from 'react';
import { Header } from './components/Header';
import { TimetableGrid } from './components/TimetableGrid';
import { CoordinationHub } from './components/CoordinationHub';
import { WorkloadDashboard } from './components/WorkloadDashboard';
import { InternalAllocationPanel } from './components/InternalAllocationPanel';
import type { User, InterdeptRequest } from './types';
import {
  DEPARTMENTS,
  SECTIONS,
  INITIAL_INSTRUCTORS,
  INITIAL_SESSIONS,
  INITIAL_REQUESTS,
  INITIAL_RECOMMENDATIONS,
  DEMO_USERS,
} from './data/mockData';

export function App() {
  const [currentUser, setCurrentUser] = useState<User>(DEMO_USERS[0]); // Default: Dr. Alan Turing (CS Chair)
  const [selectedDept, setSelectedDept] = useState<string>(DEMO_USERS[0].departmentCode || 'ALL');
  const [activeTab, setActiveTab] = useState<'timetable' | 'coordination' | 'workload' | 'allocations'>('timetable');

  const [instructors, setInstructors] = useState(INITIAL_INSTRUCTORS);
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [sessions] = useState(INITIAL_SESSIONS);
  const [recommendations] = useState(INITIAL_RECOMMENDATIONS);

  // Switch User Profile and adapt department scope
  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    if (user.departmentCode) {
      setSelectedDept(user.departmentCode);
    } else {
      setSelectedDept('ALL');
    }
  };

  // Handle Offer Acceptance
  const handleAcceptOffer = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId && r.currentOffer) {
          // Release hold on instructor and commit the workload
          setInstructors((insts) =>
            insts.map((inst) => {
              if (inst.id === r.currentOffer?.instructorId) {
                return {
                  ...inst,
                  heldHours: Math.max(0, inst.heldHours - r.currentOffer.offeredHours),
                  committedHours: inst.committedHours + r.currentOffer.offeredHours,
                };
              }
              return inst;
            })
          );
          return { ...r, status: 'ACCEPTED' };
        }
        return r;
      })
    );
  };

  // Handle Offer Rejection
  const handleRejectOffer = (requestId: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId && r.currentOffer) {
          // Release hold on instructor back to available capacity
          setInstructors((insts) =>
            insts.map((inst) => {
              if (inst.id === r.currentOffer?.instructorId) {
                return {
                  ...inst,
                  heldHours: Math.max(0, inst.heldHours - r.currentOffer.offeredHours),
                };
              }
              return inst;
            })
          );
          return { ...r, status: 'REJECTED' };
        }
        return r;
      })
    );
  };

  // Handle Supplying Dept Making an Offer
  const handleMakeOffer = (requestId: string, instructorId: string, hours: number) => {
    const targetInst = instructors.find((i) => i.id === instructorId);
    if (!targetInst) return;

    // Place hold on instructor capacity
    setInstructors((prev) =>
      prev.map((i) => {
        if (i.id === instructorId) {
          return { ...i, heldHours: i.heldHours + hours };
        }
        return i;
      })
    );

    // Update request with offer
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          return {
            ...r,
            status: 'OFFERED',
            currentOffer: {
              id: `off-${Date.now()}`,
              instructorId: targetInst.id,
              instructorName: targetInst.name,
              offeredHours: hours,
              expiresAt: '2026-11-12 18:00',
              isActiveHold: true,
            },
          };
        }
        return r;
      })
    );
  };

  // Handle New Interdepartmental Request creation
  const handleCreateRequest = (newReq: InterdeptRequest) => {
    setRequests((prev) => [newReq, ...prev]);
  };

  // Handle Internal Allocation Commit
  const handleCommitAllocation = (offeringId: string) => {
    const rec = recommendations.find((r) => r.offeringId === offeringId);
    if (!rec || !rec.recommendedInstructorId) return;

    setInstructors((prev) =>
      prev.map((i) => {
        if (i.id === rec.recommendedInstructorId) {
          return {
            ...i,
            committedHours: i.committedHours + rec.requiredHours,
          };
        }
        return i;
      })
    );
  };

  const pendingRequestsCount = requests.filter(
    (r) =>
      (selectedDept === 'ALL' || r.supplyingDept === selectedDept || r.requestingDept === selectedDept) &&
      (r.status === 'SUBMITTED' || r.status === 'OFFERED')
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Header
        departments={DEPARTMENTS}
        selectedDept={selectedDept}
        onSelectDept={setSelectedDept}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingRequestsCount={pendingRequestsCount}
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        allUsers={DEMO_USERS}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'timetable' && (
          <TimetableGrid
            sessions={sessions}
            sections={SECTIONS}
            instructors={instructors}
            currentDept={selectedDept}
          />
        )}

        {activeTab === 'coordination' && (
          <CoordinationHub
            requests={requests}
            instructors={instructors}
            currentDept={selectedDept}
            departments={DEPARTMENTS}
            onAcceptOffer={handleAcceptOffer}
            onRejectOffer={handleRejectOffer}
            onMakeOffer={handleMakeOffer}
            onCreateRequest={handleCreateRequest}
          />
        )}

        {activeTab === 'workload' && (
          <WorkloadDashboard
            instructors={instructors}
            currentDept={selectedDept}
          />
        )}

        {activeTab === 'allocations' && (
          <InternalAllocationPanel
            recommendations={recommendations}
            onCommitAllocation={handleCommitAllocation}
            currentDept={selectedDept}
          />
        )}
      </main>

      <footer className="bg-slate-900/60 border-t border-slate-800 text-xs text-slate-500 py-4 text-center">
        <p>
          scheduleY • University Intelligent Scheduling & Resource Allocation System • Department Architecture & Timetabling Core
        </p>
      </footer>
    </div>
  );
}

export default App;
