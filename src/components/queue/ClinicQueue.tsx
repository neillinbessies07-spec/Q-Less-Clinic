import React, { useState, useEffect, useMemo } from "react";
import { 
  Clock, 
  AlertTriangle, 
  Flame, 
  Stethoscope, 
  Building2, 
  UserCheck, 
  CheckCircle2, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Activity, 
  ShieldAlert, 
  Phone, 
  ChevronRight, 
  Calendar, 
  RefreshCw, 
  Sparkles, 
  User, 
  AlertCircle,
  Timer,
  Volume2,
  SlidersHorizontal,
  X
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";
import type { QueueItem, TriagePriority, QueueStatus, Doctor } from "../../types";

interface ClinicQueueProps {
  /** Optional restriction if embedded inside DoctorDashboard */
  filterDoctorId?: string;
  /** Optional mode if used specifically in doctor or receptionist view */
  viewContext?: "doctor" | "reception" | "standalone";
  /** Optional callback when a doctor calls a patient directly from queue */
  onPatientCalled?: (ticket: QueueItem) => void;
  /** Optional custom class name */
  className?: string;
}

export const ClinicQueue: React.FC<ClinicQueueProps> = ({
  filterDoctorId,
  viewContext = "standalone",
  onPatientCalled,
  className = ""
}) => {
  const { 
    state, 
    refreshClinicState, 
    callPatientToRoom, 
    checkInPatient, 
    updateTriage 
  } = useClinic();

  // Live timer tick every 10 seconds to update wait times continuously
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "waiting" | "in_consultation" | "booked">("all");
  const [triageFilter, setTriageFilter] = useState<"all" | "emergency_urgent" | "emergency" | "urgent" | "routine">("all");
  const [selectedDoctor, setSelectedDoctor] = useState<string>(filterDoctorId || "all");
  const [sortBy, setSortBy] = useState<"triage_priority" | "wait_time_desc" | "appointment_time">("triage_priority");

  // Interactive Quick Triage / Edit Modal state
  const [selectedPatientForTriage, setSelectedPatientForTriage] = useState<QueueItem | null>(null);
  const [editingPriority, setEditingPriority] = useState<TriagePriority>("routine");
  const [editingDoctorId, setEditingDoctorId] = useState<string>("");
  const [editingBp, setEditingBp] = useState("");
  const [editingPulse, setEditingPulse] = useState("");
  const [editingTemp, setEditingTemp] = useState("");
  const [isUpdatingTriage, setIsUpdatingTriage] = useState(false);

  // Quick Check-in Modal
  const [checkinTicket, setCheckinTicket] = useState<QueueItem | null>(null);
  const [checkinBp, setCheckinBp] = useState("120/80");
  const [checkinHr, setCheckinHr] = useState("74");
  const [checkinTemp, setCheckinTemp] = useState("36.8");
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);

  // Sync selected doctor if filterDoctorId changes
  useEffect(() => {
    if (filterDoctorId) setSelectedDoctor(filterDoctorId);
  }, [filterDoctorId]);

  // Doctors list
  const doctors: Doctor[] = state?.doctors || [];

  // Find linked patient record helper
  const getPatientRecord = (patientId: string) => {
    return state?.patients.find(p => p.id === patientId);
  };

  // Helper: Calculate exact elapsed wait time in minutes
  const getWaitDurationMinutes = (item: QueueItem): number => {
    const baseTimeStr = item.checkedInAt || item.bookedAt;
    if (!baseTimeStr) return item.estimatedWaitMinutes || 0;
    const baseDate = new Date(baseTimeStr);
    const diffMs = currentTime.getTime() - baseDate.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Helper: Calculate active consultation duration
  const getConsultDurationMinutes = (item: QueueItem): number => {
    if (!item.calledAt) return 0;
    const calledDate = new Date(item.calledAt);
    const diffMs = currentTime.getTime() - calledDate.getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // Helper: Calculate dynamic consultation window
  // e.g. "11:15 – 11:30 AM" or "In Progress"
  const getConsultationWindow = (item: QueueItem, indexInFiltered: number): { windowText: string; etaText: string; isImminent: boolean } => {
    if (item.status === "in_consultation") {
      const elapsed = getConsultDurationMinutes(item);
      return {
        windowText: `In Room ${item.roomNumber || ""}`,
        etaText: `${elapsed}m in consult`,
        isImminent: true
      };
    }

    // Estimate based on item.estimatedWaitMinutes or calculated position
    const waitMins = Math.max(5, item.estimatedWaitMinutes || (indexInFiltered + 1) * 12);
    const estStartDate = new Date(currentTime.getTime() + waitMins * 60000);
    const estEndDate = new Date(estStartDate.getTime() + 15 * 60000);

    const formatTime = (d: Date) => 
      d.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

    const isImminent = waitMins <= 10;
    return {
      windowText: `${formatTime(estStartDate)} – ${formatTime(estEndDate)}`,
      etaText: waitMins <= 3 ? "Next in line" : `~${waitMins} min wait`,
      isImminent
    };
  };

  // Filtered & Sorted Queue
  const processedQueue = useMemo(() => {
    if (!state?.queue) return [];

    return state.queue
      .filter((item) => {
        // Search query (name, ticket #, phone)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.patientName.toLowerCase().includes(q);
          const matchTicket = item.ticketNumber.toLowerCase().includes(q);
          const matchPhone = item.patientPhone.includes(q);
          const matchReason = item.reasonForVisit.toLowerCase().includes(q);
          if (!matchName && !matchTicket && !matchPhone && !matchReason) return false;
        }

        // Status filter
        if (statusFilter === "waiting" && item.status !== "checked_in") return false;
        if (statusFilter === "in_consultation" && item.status !== "in_consultation") return false;
        if (statusFilter === "booked" && item.status !== "booked") return false;
        if (statusFilter === "all" && (item.status === "completed" || item.status === "cancelled")) return false;

        // Triage filter
        if (triageFilter === "emergency_urgent" && item.priority !== "emergency" && item.priority !== "urgent") return false;
        if (triageFilter === "emergency" && item.priority !== "emergency") return false;
        if (triageFilter === "urgent" && item.priority !== "urgent") return false;
        if (triageFilter === "routine" && item.priority !== "routine") return false;

        // Doctor filter
        if (selectedDoctor !== "all" && item.doctorAssignedId !== selectedDoctor) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "triage_priority") {
          // Priority hierarchy: Emergency (3) -> Urgent (2) -> Routine (1)
          const priorityScore = (p: TriagePriority) => (p === "emergency" ? 3 : p === "urgent" ? 2 : 1);
          const scoreDiff = priorityScore(b.priority) - priorityScore(a.priority);
          if (scoreDiff !== 0) return scoreDiff;

          // If same priority, in_consultation first, then checked_in, then booked
          const statusScore = (s: QueueStatus) => (s === "in_consultation" ? 3 : s === "checked_in" ? 2 : 1);
          const statusDiff = statusScore(b.status) - statusScore(a.status);
          if (statusDiff !== 0) return statusDiff;

          // Then longest wait time first
          return getWaitDurationMinutes(b) - getWaitDurationMinutes(a);
        }

        if (sortBy === "wait_time_desc") {
          return getWaitDurationMinutes(b) - getWaitDurationMinutes(a);
        }

        if (sortBy === "appointment_time") {
          return a.appointmentTime.localeCompare(b.appointmentTime);
        }

        return 0;
      });
  }, [state?.queue, searchQuery, statusFilter, triageFilter, selectedDoctor, sortBy, currentTime]);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    if (!state?.queue) {
      return { totalWaiting: 0, inConsult: 0, emergencyUrgentCount: 0, avgWaitMins: 11, overdueCount: 0 };
    }

    const waitingItems = state.queue.filter(q => q.status === "checked_in");
    const inConsultItems = state.queue.filter(q => q.status === "in_consultation");
    const emergencyUrgent = state.queue.filter(q => (q.priority === "emergency" || q.priority === "urgent") && q.status !== "completed");
    
    const waitTimes = waitingItems.map(q => getWaitDurationMinutes(q));
    const avgWait = waitTimes.length > 0 ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : (state.metrics.avgWaitTimeMinutes || 12);
    const overdueCount = waitingItems.filter(q => getWaitDurationMinutes(q) > 25).length;

    return {
      totalWaiting: waitingItems.length,
      inConsult: inConsultItems.length,
      emergencyUrgentCount: emergencyUrgent.length,
      avgWaitMins: avgWait,
      overdueCount
    };
  }, [state?.queue, currentTime]);

  // Handle Call to Room
  const handleCallPatientAction = async (ticket: QueueItem) => {
    const docId = filterDoctorId || ticket.doctorAssignedId || doctors[0]?.id || "doc-1";
    const doc = doctors.find(d => d.id === docId);
    const room = doc ? doc.room : (ticket.roomNumber || "Consultation Room 1");
    
    await callPatientToRoom(ticket.id, docId, room);
    if (onPatientCalled) {
      onPatientCalled(ticket);
    }
  };

  // Open Quick Triage Drawer / Modal
  const handleOpenTriageModal = (item: QueueItem) => {
    setSelectedPatientForTriage(item);
    setEditingPriority(item.priority);
    setEditingDoctorId(item.doctorAssignedId || doctors[0]?.id || "doc-1");
    setEditingBp(item.vitalSigns?.bloodPressure || "");
    setEditingPulse(item.vitalSigns?.heartRate ? String(item.vitalSigns.heartRate) : "");
    setEditingTemp(item.vitalSigns?.temperature ? String(item.vitalSigns.temperature) : "");
  };

  // Save Triage Updates
  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForTriage) return;
    setIsUpdatingTriage(true);
    await updateTriage(selectedPatientForTriage.id, editingPriority, editingDoctorId);
    setIsUpdatingTriage(false);
    setSelectedPatientForTriage(null);
  };

  // Submit Quick Check-in
  const handleConfirmCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinTicket) return;
    setIsSubmittingCheckin(true);
    await checkInPatient(checkinTicket.id, {
      bloodPressure: checkinBp,
      heartRate: Number(checkinHr) || 72,
      temperature: Number(checkinTemp) || 36.8
    });
    setIsSubmittingCheckin(false);
    setCheckinTicket(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header / Live Queue Status & Metrics */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Real-Time Clinic Queue</h2>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Active wait tracking, clinical triage priority, and estimated consultation windows
              </p>
            </div>
          </div>

          {/* Quick Refresh & Auto-Sync Notification */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => refreshClinicState()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh queue state now"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Waiting in Lobby */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Lobby Waiting</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{metrics.totalWaiting}</span>
              <span className="text-[11px] text-slate-500 font-medium">patients</span>
            </div>
            <div className="text-[10px] text-teal-700 font-medium">Checked in & triaged</div>
          </div>

          {/* In Consultation Rooms */}
          <div className="p-3.5 rounded-2xl bg-teal-50/60 border border-teal-200/60 space-y-1">
            <span className="text-[11px] font-semibold text-teal-800 block">In Consultation</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black text-teal-900">{metrics.inConsult}</span>
              <span className="text-[11px] text-teal-700 font-medium">active</span>
            </div>
            <div className="text-[10px] text-teal-600 font-medium">Doctors in session</div>
          </div>

          {/* Average Wait Time */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 block">Average Wait</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{metrics.avgWaitMins}</span>
              <span className="text-[11px] text-slate-600 font-semibold">min</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-medium">Target: &lt; 15 min</div>
          </div>

          {/* Priority / Urgent Attention */}
          <div className={`p-3.5 rounded-2xl border space-y-1 ${
            metrics.emergencyUrgentCount > 0 
              ? "bg-amber-50/80 border-amber-300 text-amber-900" 
              : "bg-slate-50 border-slate-200/80 text-slate-900"
          }`}>
            <span className="text-[11px] font-semibold block text-slate-600">Urgent Cases</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl sm:text-2xl font-black ${metrics.emergencyUrgentCount > 0 ? "text-amber-900" : "text-slate-900"}`}>
                {metrics.emergencyUrgentCount}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">high priority</span>
            </div>
            <div className="text-[10px] text-amber-700 font-medium">
              {metrics.overdueCount > 0 ? `${metrics.overdueCount} patient >25m wait` : "Queue flowing normally"}
            </div>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by patient name, ticket (#Q-101), phone, or condition..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Status: All Active ({state?.queue.filter(q => q.status !== 'completed').length || 0})</option>
              <option value="waiting">Lobby Waiting Only</option>
              <option value="in_consultation">In Consultation Only</option>
              <option value="booked">Booked (Arriving)</option>
            </select>

            {/* Triage Filter */}
            <select
              value={triageFilter}
              onChange={(e) => setTriageFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="all">Triage: All Levels</option>
              <option value="emergency_urgent">Emergency & Urgent Only</option>
              <option value="urgent">Urgent Only</option>
              <option value="routine">Routine Only</option>
            </select>

            {/* Doctor Filter (unless locked by prop) */}
            {!filterDoctorId && (
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
              >
                <option value="all">All Doctors & Rooms</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.name} ({doc.room})</option>
                ))}
              </select>
            )}

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              <option value="triage_priority">Sort: Triage Priority First</option>
              <option value="wait_time_desc">Sort: Longest Wait Time</option>
              <option value="appointment_time">Sort: Scheduled Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Occupancy Cards Strip (Visual Overview for Doctors & Receptionists) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {doctors.map((doc) => {
          const currentPatient = state?.queue.find(
            q => q.doctorAssignedId === doc.id && q.status === "in_consultation"
          );
          const nextInLine = state?.queue.find(
            q => q.doctorAssignedId === doc.id && q.status === "checked_in"
          );
          const totalQueueForDoc = state?.queue.filter(
            q => q.doctorAssignedId === doc.id && (q.status === "checked_in" || q.status === "booked")
          ).length || 0;

          return (
            <div 
              key={doc.id}
              className={`p-4 rounded-3xl border transition-all ${
                currentPatient
                  ? "bg-teal-50/40 border-teal-200/80 shadow-xs"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block">
                    {doc.room}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-[11px] text-slate-500">{doc.specialty}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  currentPatient
                    ? "bg-teal-600 text-white animate-pulse"
                    : "bg-slate-100 text-slate-600"
                }`}>
                  {currentPatient ? "Consulting" : "Available"}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-2 text-xs">
                {currentPatient ? (
                  <div className="p-2.5 rounded-xl bg-white border border-teal-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500">Current Patient:</span>
                      <span className="text-[10px] font-mono font-bold text-teal-800">#{currentPatient.ticketNumber}</span>
                    </div>
                    <p className="font-bold text-slate-900 truncate">{currentPatient.patientName}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>In room: {getConsultDurationMinutes(currentPatient)}m</span>
                      <span className="text-teal-700 font-medium">Diagnosis in progress</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-center text-[11px]">
                    Room ready for next patient
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                  <span>Queue behind room: <strong>{totalQueueForDoc}</strong></span>
                  {nextInLine && (
                    <span className="text-slate-700 font-medium">Next: #{nextInLine.ticketNumber} ({nextInLine.patientName.split(" ")[0]})</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Queue List Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Queued Patients ({processedQueue.length})</h3>
            {statusFilter !== "all" && (
              <span className="text-xs text-slate-500">• Filtering by {statusFilter}</span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            Click any row to adjust triage priority or vitals
          </span>
        </div>

        {processedQueue.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">No Patients in Selected Filter</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All patients in this view have either been seen or do not match your current search and triage criteria.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {processedQueue.map((item, idx) => {
              const patientRec = getPatientRecord(item.patientId);
              const waitMins = getWaitDurationMinutes(item);
              const consultWindow = getConsultationWindow(item, idx);
              const isOverdue = waitMins > 25 && item.status === "checked_in";

              // Triage Styling
              const isEmergency = item.priority === "emergency";
              const isUrgent = item.priority === "urgent";

              return (
                <div 
                  key={item.id}
                  className={`p-4 sm:p-5 transition-all hover:bg-slate-50/80 ${
                    item.status === "in_consultation"
                      ? "bg-teal-50/30"
                      : isEmergency
                      ? "bg-rose-50/40"
                      : isUrgent
                      ? "bg-amber-50/30"
                      : "bg-white"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Details: Ticket #, Triage Badge, Patient Name & Reason */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Ticket Badge */}
                        <span className="px-2.5 py-1 rounded-xl font-mono font-bold text-xs bg-slate-900 text-white">
                          #{item.ticketNumber}
                        </span>

                        {/* Triage Priority Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isEmergency
                            ? "bg-rose-600 text-white animate-pulse"
                            : isUrgent
                            ? "bg-amber-500 text-white"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}>
                          {isEmergency ? (
                            <>
                              <Flame className="w-3 h-3" />
                              <span>Emergency (L1)</span>
                            </>
                          ) : isUrgent ? (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              <span>Urgent (L2)</span>
                            </>
                          ) : (
                            <span>Routine (L3)</span>
                          )}
                        </span>

                        {/* Status Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "in_consultation"
                            ? "bg-teal-100 text-teal-800 border border-teal-300"
                            : item.status === "checked_in"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {item.status === "in_consultation"
                            ? "In Consultation"
                            : item.status === "checked_in"
                            ? "Arrived & Waiting"
                            : "Booked (Expected)"}
                        </span>

                        {/* Walk-in or Online */}
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.isWalkIn ? "Walk-in" : "Online Booked"}
                        </span>
                      </div>

                      {/* Patient Name & Chief Complaint */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-bold text-slate-900">
                            {item.patientName}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {item.patientPhone}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          <strong className="text-slate-700">Reason:</strong> {item.reasonForVisit}
                        </p>
                      </div>

                      {/* Vitals & Clinical Flags */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {item.vitalSigns?.bloodPressure ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-700 flex items-center gap-1">
                            <Activity className="w-3 h-3 text-teal-600" />
                            <span>BP: {item.vitalSigns.bloodPressure}</span>
                          </span>
                        ) : null}

                        {item.vitalSigns?.heartRate ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-700">
                            HR: {item.vitalSigns.heartRate} bpm
                          </span>
                        ) : null}

                        {item.vitalSigns?.temperature ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded-lg text-[11px] font-medium text-slate-700">
                            Temp: {item.vitalSigns.temperature}°C
                          </span>
                        ) : null}

                        {/* Known Allergies Alert */}
                        {patientRec && patientRec.allergies && patientRec.allergies.length > 0 && (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-[11px] font-semibold flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            <span>Allergy: {patientRec.allergies.join(", ")}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Details: Wait Duration & Estimated Window Forecast */}
                    <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 lg:w-72 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 text-xs">
                      {/* Real-time Wait Timer */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Current Wait
                        </span>
                        <div className="flex items-center gap-1">
                          <Timer className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-600" : "text-slate-600"}`} />
                          <span className={`font-bold ${isOverdue ? "text-rose-700 font-black" : "text-slate-900"}`}>
                            {item.status === "in_consultation" ? `${getConsultDurationMinutes(item)}m in room` : `${waitMins} min`}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {item.checkedInAt 
                            ? `Since ${new Date(item.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                            : `Appt: ${item.appointmentTime}`}
                        </span>
                      </div>

                      {/* Estimated Consultation Window */}
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                          Est. Consult Window
                        </span>
                        <span className="font-bold text-teal-900 block truncate">
                          {consultWindow.windowText}
                        </span>
                        <span className={`text-[10px] font-semibold ${consultWindow.isImminent ? "text-teal-700" : "text-slate-500"}`}>
                          {consultWindow.etaText}
                        </span>
                      </div>
                    </div>

                    {/* Right Details: Doctor Assignment & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-2.5 lg:w-48 shrink-0">
                      <div className="text-left lg:text-right">
                        <span className="text-[10px] text-slate-400 block">Assigned Doctor</span>
                        <span className="text-xs font-bold text-slate-900 block">
                          {item.doctorAssignedName || "Dr. Nomsa Dlamini"}
                        </span>
                        <span className="text-[11px] text-teal-700 font-medium block">
                          {item.roomNumber || "Consultation Room 1"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        {/* Quick Triage / Adjust Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenTriageModal(item)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          title="Update triage priority or vitals"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>

                        {/* Status Actions */}
                        {item.status === "booked" ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCheckinTicket(item);
                              setCheckinBp("120/80");
                              setCheckinHr("74");
                              setCheckinTemp("36.8");
                            }}
                            className="flex-1 sm:flex-none px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Check-in</span>
                          </button>
                        ) : item.status === "checked_in" ? (
                          <button
                            type="button"
                            onClick={() => handleCallPatientAction(item)}
                            className="flex-1 sm:flex-none px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Call to Room</span>
                          </button>
                        ) : item.status === "in_consultation" ? (
                          <span className="px-3 py-1 bg-teal-100 text-teal-800 font-bold text-xs rounded-xl flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>In Consult</span>
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Interactive Triage & Priority Adjustment */}
      {selectedPatientForTriage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-900 text-white rounded-md">
                  #{selectedPatientForTriage.ticketNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Adjust Clinical Triage: {selectedPatientForTriage.patientName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPatientForTriage(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTriage} className="space-y-4 text-xs">
              {/* Reason for visit reference */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-semibold text-slate-500 uppercase">Reason for Visit</span>
                <p className="font-bold text-slate-900">{selectedPatientForTriage.reasonForVisit}</p>
                <p className="text-[11px] text-slate-500">Wait duration: {getWaitDurationMinutes(selectedPatientForTriage)} minutes</p>
              </div>

              {/* Triage Priority Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Triage Level (South African SATS Protocol)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingPriority("emergency")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editingPriority === "emergency"
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-900"
                    }`}
                  >
                    <Flame className="w-4 h-4 mx-auto mb-1" />
                    <span>Emergency (L1)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPriority("urgent")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editingPriority === "urgent"
                        ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:text-amber-900"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 mx-auto mb-1" />
                    <span>Urgent (L2)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingPriority("routine")}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      editingPriority === "routine"
                        ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-teal-50 hover:text-teal-900"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
                    <span>Routine (L3)</span>
                  </button>
                </div>
              </div>

              {/* Assigned Doctor & Room */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Reassign Consultation Doctor & Room</label>
                <select
                  value={editingDoctorId}
                  onChange={(e) => setEditingDoctorId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:ring-2 focus:ring-teal-500"
                >
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} — {d.room} ({d.specialty})
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPatientForTriage(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingTriage}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingTriage ? "Updating..." : "Save Triage Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fast Check-in with Vitals */}
      {checkinTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-teal-600 text-white rounded-md">
                  #{checkinTicket.ticketNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Check-in: {checkinTicket.patientName}
                </h3>
              </div>
              <button
                onClick={() => setCheckinTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCheckin} className="space-y-4 text-xs">
              <p className="text-slate-500">
                Record intake vitals to place patient in the active doctor queue.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Blood Pressure</label>
                  <input
                    type="text"
                    value={checkinBp}
                    onChange={(e) => setCheckinBp(e.target.value)}
                    placeholder="120/80"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Heart Rate (bpm)</label>
                  <input
                    type="number"
                    value={checkinHr}
                    onChange={(e) => setCheckinHr(e.target.value)}
                    placeholder="72"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Temperature (°C)</label>
                <input
                  type="text"
                  value={checkinTemp}
                  onChange={(e) => setCheckinTemp(e.target.value)}
                  placeholder="36.8"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckinTicket(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheckin}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCheckin ? "Checking in..." : "Confirm & Place in Queue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
