import React, { useState, useMemo } from "react";
import { 
  Search, 
  Users, 
  X, 
  Check, 
  Ticket, 
  Clock, 
  Phone, 
  CreditCard, 
  ShieldCheck, 
  AlertTriangle, 
  CalendarPlus, 
  Stethoscope, 
  ChevronRight,
  Filter,
  CheckCircle2,
  HeartPulse,
  Sparkles
} from "lucide-react";
import type { PatientRecord, QueueItem } from "../../types";

interface PatientSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: PatientRecord[];
  queue: QueueItem[];
  selectedPatientId: string | null;
  onSelectPatient: (patientId: string) => void;
  onBookForPatient?: (patient: PatientRecord) => void;
}

export const PatientSwitcherModal: React.FC<PatientSwitcherModalProps> = ({
  isOpen,
  onClose,
  patients,
  queue,
  selectedPatientId,
  onSelectPatient,
  onBookForPatient,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in_queue" | "waiting" | "consultation">("all");

  // Map of patientId -> active queue ticket
  const patientTicketMap = useMemo(() => {
    const map = new Map<string, QueueItem>();
    queue.forEach(item => {
      // Priority to latest/active status
      if (!map.has(item.patientId) || item.status === "in_consultation" || item.status === "called") {
        map.set(item.patientId, item);
      }
    });
    return map;
  }, [queue]);

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const ticket = patientTicketMap.get(patient.id);

      // Filter by type
      if (filterType === "in_queue" && !ticket) return false;
      if (filterType === "waiting" && (!ticket || (ticket.status !== "checked_in" && ticket.status !== "booked"))) return false;
      if (filterType === "consultation" && (!ticket || ticket.status !== "in_consultation")) return false;

      // Filter by search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = patient.fullName.toLowerCase().includes(q);
      const phoneMatch = patient.phone.toLowerCase().includes(q);
      const idMatch = patient.idNumber.toLowerCase().includes(q);
      const ticketMatch = ticket ? ticket.ticketNumber.toLowerCase().includes(q) : false;
      const reasonMatch = ticket ? ticket.reasonForVisit.toLowerCase().includes(q) : false;
      const conditionMatch = patient.chronicConditions.some(c => c.toLowerCase().includes(q));
      const allergyMatch = patient.allergies.some(a => a.toLowerCase().includes(q));

      return nameMatch || phoneMatch || idMatch || ticketMatch || reasonMatch || conditionMatch || allergyMatch;
    });
  }, [patients, patientTicketMap, filterType, searchQuery]);

  if (!isOpen) return null;

  const getStatusBadge = (ticket?: QueueItem) => {
    if (!ticket) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <ShieldCheck className="w-3 h-3 text-slate-400" />
          Profile Only
        </span>
      );
    }

    switch (ticket.status) {
      case "in_consultation":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            In Consultation • {ticket.roomNumber || "Room"}
          </span>
        );
      case "called":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Called to Room {ticket.roomNumber}
          </span>
        );
      case "checked_in":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Waiting in Lounge (~{ticket.estimatedWaitMinutes}m)
          </span>
        );
      case "pharmacy_ready":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
            <Sparkles className="w-3 h-3 text-purple-600" />
            Pharmacy Pickup
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed Today
          </span>
        );
      case "booked":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
            <Ticket className="w-3 h-3 text-teal-600" />
            Booked (Awaiting Check-In)
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>Select Patient Profile</span>
                <span className="text-xs px-2 py-0.5 bg-teal-100 text-teal-800 font-bold rounded-full">
                  {patients.length} Registered
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Switch patient to view their active queue ticket, QR pass, POPIA records, and prescriptions.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-9 h-9 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, ticket # (e.g. Q-101), ID, or condition..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-hidden transition-all"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === "all"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All Patients ({patients.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("in_queue")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === "in_queue"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              In Queue Today ({patientTicketMap.size})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("consultation")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === "consultation"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              In Consultation
            </button>
            <button
              type="button"
              onClick={() => setFilterType("waiting")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                filterType === "waiting"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Waiting in Lounge
            </button>
          </div>
        </div>

        {/* Patients Grid List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <Users className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No patients matched your search</p>
              <p className="text-xs text-slate-400">
                Try searching for another name, ticket number, or clear your search query.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPatients.map((patient) => {
                const ticket = patientTicketMap.get(patient.id);
                const isSelected = patient.id === selectedPatientId;

                return (
                  <div
                    key={patient.id}
                    onClick={() => {
                      onSelectPatient(patient.id);
                      onClose();
                    }}
                    className={`relative p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isSelected
                        ? "bg-teal-50/50 border-teal-500 ring-2 ring-teal-500/30 shadow-xs"
                        : "bg-white border-slate-200 hover:border-teal-300 hover:bg-slate-50/70 hover:shadow-xs"
                    }`}
                  >
                    {/* Top Row: Avatar + Name + Selected Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            isSelected
                              ? "bg-teal-600 text-white ring-2 ring-teal-300"
                              : ticket?.priority === "urgent"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}
                        >
                          {getInitials(patient.fullName)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm leading-snug">
                              {patient.fullName}
                            </h4>
                            {isSelected && (
                              <span className="px-1.5 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-bold flex items-center gap-0.5">
                                <Check className="w-2.5 h-2.5" />
                                Active
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 block mt-0.5">
                            {patient.age} yrs • {patient.gender} • Blood: {patient.bloodType || "O+"}
                          </span>
                        </div>
                      </div>

                      {/* Ticket Badge if available */}
                      {ticket && (
                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs tracking-tight">
                            {ticket.ticketNumber}
                          </span>
                          {ticket.priority === "urgent" && (
                            <span className="block text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-0.5">
                              Urgent
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle Info: Queue Status & Reason or Chronic tags */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between gap-2">
                        {getStatusBadge(ticket)}
                        <span className="text-[11px] text-slate-400 font-mono truncate">
                          ID: {patient.idNumber ? patient.idNumber.slice(0, 6) + "..." : "Protected"}
                        </span>
                      </div>

                      {ticket ? (
                        <div className="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                          <span className="font-semibold text-slate-800">Visit Reason: </span>
                          <span className="truncate">{ticket.reasonForVisit}</span>
                          {ticket.doctorAssignedName && (
                            <span className="block text-[11px] text-teal-700 mt-0.5">
                              Assigned: {ticket.doctorAssignedName}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50/80 rounded-xl p-2 border border-slate-100">
                          <span>Last Visit: {patient.lastVisit || "Recent"}</span>
                          {onBookForPatient && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onBookForPatient(patient);
                                onClose();
                              }}
                              className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer"
                            >
                              <CalendarPlus className="w-3.5 h-3.5" />
                              Book Visit
                            </button>
                          )}
                        </div>
                      )}

                      {/* Medical Alerts (Allergies / Chronic) */}
                      <div className="flex flex-wrap gap-1 pt-0.5 text-[11px]">
                        {patient.allergies?.length > 0 && patient.allergies[0] !== "None known" && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-medium">
                            Allergy: {patient.allergies.join(", ")}
                          </span>
                        )}
                        {patient.chronicConditions?.map((c, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </span>
                      <span className={`font-semibold flex items-center gap-0.5 ${
                        isSelected ? "text-teal-700 font-bold" : "text-slate-600"
                      }`}>
                        {isSelected ? "Currently Selected" : "Select Patient"}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Encrypted local POPIA cache connected</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
