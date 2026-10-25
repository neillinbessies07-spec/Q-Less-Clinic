import React, { useState } from "react";
import { 
  Ticket, 
  Clock, 
  CalendarPlus, 
  FileText, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Stethoscope, 
  ArrowRight,
  Pill,
  MapPin,
  HelpCircle,
  Eye,
  EyeOff,
  QrCode,
  Scan,
  Users,
  ArrowLeftRight,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";
import type { QueueItem, PatientRecord } from "../../types";
import { PatientCheckInPass } from "./PatientCheckInPass";
import { PatientSwitcherModal } from "./PatientSwitcherModal";

export const PatientPortal: React.FC = () => {
  const { 
    state, 
    bookAppointment, 
    activePatientTicket, 
    setActivePatientTicket, 
    selectedPatientId,
    selectPatient,
    setShowEncryptionModal 
  } = useClinic();

  const [activeTab, setActiveTab] = useState<"tracker" | "pass" | "book" | "records">("tracker");
  const [showRawEncrypted, setShowRawEncrypted] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  // Booking Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [reasonForVisit, setReasonForVisit] = useState("");
  const [doctorId, setDoctorId] = useState("doc-1");
  const [priority, setPriority] = useState<"routine" | "urgent">("routine");
  const [allergiesText, setAllergiesText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Patient Resolution (Synchronized between directory & queue)
  const patientRecord: PatientRecord | null = 
    (selectedPatientId ? state?.patients.find(p => p.id === selectedPatientId) : null) ||
    (activePatientTicket ? state?.patients.find(p => p.id === activePatientTicket.patientId) : null) ||
    (state?.patients && state.patients.length > 0 ? state.patients[0] : null);

  // Active Queue Ticket corresponding to current patient
  const currentTicket: QueueItem | null = 
    (patientRecord ? state?.queue.find(q => q.patientId === patientRecord.id) : null) ||
    activePatientTicket || 
    null;

  // Specific prescriptions for this patient
  const patientPrescriptions = state?.prescriptions.filter(
    p => (patientRecord && p.patientId === patientRecord.id) || (currentTicket && p.queueItemId === currentTicket.id)
  ) || [];
  const prescription = patientPrescriptions[0] || null;

  const getInitials = (name?: string) => {
    if (!name) return "PT";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handlePreFillBooking = (patient: PatientRecord) => {
    setFullName(patient.fullName);
    setPhone(patient.phone);
    setIdNumber(patient.idNumber);
    setAllergiesText(patient.allergies.join(", "));
    setActiveTab("book");
  };

  // Calculate position in queue
  const queueItemsBefore = state?.queue.filter(
    q => (q.status === "checked_in" || q.status === "booked") && 
         new Date(q.bookedAt).getTime() < new Date(currentTicket?.bookedAt || 0).getTime()
  ).length || 0;

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;
    setIsSubmitting(true);
    const allergies = allergiesText.split(",").map(a => a.trim()).filter(Boolean);
    
    const result = await bookAppointment({
      fullName,
      phone,
      idNumber,
      reasonForVisit,
      doctorId,
      priority,
      allergies,
      isWalkIn: false
    });

    setIsSubmitting(false);
    if (result.success) {
      setActiveTab("tracker");
      setFullName("");
      setPhone("");
      setIdNumber("");
      setReasonForVisit("");
      setAllergiesText("");
    }
  };

  const getStatusStepIndex = (status?: string) => {
    switch (status) {
      case "booked": return 0;
      case "checked_in": return 1;
      case "called": return 2;
      case "in_consultation": return 3;
      case "pharmacy_ready": return 4;
      case "completed": return 5;
      default: return 0;
    }
  };

  const currentStep = getStatusStepIndex(currentTicket?.status);

  return (
    <div className="space-y-6">
      {/* Active Patient Profile & Switcher Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Patient Details */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {patientRecord ? getInitials(patientRecord.fullName) : "PT"}
              </div>
              <span 
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                  currentTicket?.status === "in_consultation"
                    ? "bg-emerald-500 ring-2 ring-emerald-200"
                    : currentTicket?.status === "called"
                    ? "bg-blue-500 ring-2 ring-blue-200"
                    : currentTicket?.status === "checked_in"
                    ? "bg-amber-500 ring-2 ring-amber-200"
                    : currentTicket
                    ? "bg-teal-500"
                    : "bg-slate-400"
                }`} 
                title={currentTicket ? `Status: ${currentTicket.status}` : "No active queue ticket"}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {patientRecord?.fullName || currentTicket?.patientName || "Select Patient"}
                </h3>
                {currentTicket ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-white shadow-2xs">
                    <Ticket className="w-3 h-3 text-teal-400" />
                    {currentTicket.ticketNumber}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Profile On File (No Active Queue Ticket)
                  </span>
                )}
                {currentTicket?.priority === "urgent" && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                    Urgent
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-1">
                {patientRecord && (
                  <>
                    <span>{patientRecord.age} yrs • {patientRecord.gender}</span>
                    <span>•</span>
                    <span className="font-mono text-[11px] text-slate-600">ID: {patientRecord.idNumber || "Confidential"}</span>
                    <span>•</span>
                    <span className="font-medium text-slate-700">Blood: {patientRecord.bloodType || "O+"}</span>
                  </>
                )}
                {currentTicket?.doctorAssignedName && (
                  <>
                    <span>•</span>
                    <span className="text-teal-700 font-semibold flex items-center gap-1">
                      <Stethoscope className="w-3 h-3" />
                      {currentTicket.doctorAssignedName} {currentTicket.roomNumber ? `(${currentTicket.roomNumber})` : ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Switch Patient Trigger Button */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-sm cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Switch Patient</span>
              <span className="px-1.5 py-0.5 rounded-md bg-teal-800/80 text-teal-100 text-[11px] font-bold">
                {state?.patients.length || 0}
              </span>
            </button>
          </div>
        </div>

        {/* Quick-Switch Patient Horizontal Chips Bar */}
        {state?.patients && state.patients.length > 1 && (
          <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider flex items-center gap-1">
              <ArrowLeftRight className="w-3 h-3" />
              Quick Switch:
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {state.patients.map((pat) => {
                const isCurrent = pat.id === patientRecord?.id;
                const ticket = state.queue.find(q => q.patientId === pat.id);
                return (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => selectPatient(pat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      isCurrent
                        ? "bg-teal-600 text-white font-bold shadow-xs ring-2 ring-teal-400"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${
                      ticket?.status === "in_consultation"
                        ? "bg-emerald-400 animate-pulse"
                        : ticket
                        ? "bg-amber-400"
                        : "bg-slate-400"
                    }`} />
                    <span>{pat.fullName}</span>
                    {ticket && (
                      <span className={`text-[10px] font-mono font-bold px-1 py-0.2 rounded ${
                        isCurrent ? "bg-teal-700 text-teal-100" : "bg-slate-200 text-slate-700"
                      }`}>
                        {ticket.ticketNumber}
                      </span>
                    )}
                  </button>
                );
              })}
              
              <button
                type="button"
                onClick={() => setIsSwitcherOpen(true)}
                className="text-xs text-teal-700 hover:text-teal-900 font-semibold px-2 py-1 rounded-lg hover:bg-teal-50 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>Directory & Search...</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-first Patient Navigation Sub-tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-2 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "tracker"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>Live Queue Ticket</span>
          </button>

          <button
            onClick={() => setActiveTab("pass")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "pass"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Check-In QR Pass</span>
            {currentTicket?.status === "booked" ? (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-bold text-[10px] animate-pulse">
                Scan
              </span>
            ) : currentTicket?.status === "checked_in" ? (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Arrived
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab("book")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "book"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book Visit (R0 Upfront)</span>
          </button>

          <button
            onClick={() => setActiveTab("records")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "records"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Lock className="w-4 h-4 text-emerald-500" />
            <span>Encrypted Records</span>
          </button>
        </div>
      </div>

      {/* R50 Bundled Billing Explainer Banner */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <Pill className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 text-xs">Transparent R50 Healthcare Model</span>
          <p className="text-amber-800 leading-relaxed">
            Unlike public hospitals with 4+ hour waiting backlogs, Q-Less private clinics charge a simple per-appointment fee of <strong>fifty rand (R50)</strong>. This is <strong>bundled directly into your medication cost at pharmacy pickup</strong> rather than charged as an upfront consultation fee!
          </p>
        </div>
      </div>

      {/* TAB 1: LIVE QUEUE TICKET TRACKER */}
      {activeTab === "tracker" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Entrance QR Pass Notice / Thumbnail */}
            {currentTicket && (
              <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 text-white rounded-3xl p-4 sm:p-5 border border-teal-700/80 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 flex items-center justify-center shrink-0">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Entrance Check-In QR Pass</h4>
                      {currentTicket.status === "booked" ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 animate-pulse">
                          Scan to Arrive
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          Arrived in Queue
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-teal-200/80 mt-0.5">
                      {currentTicket.status === "booked"
                        ? "Present this unique QR code at the optical kiosk scanner by the clinic entrance doors to check in as 'Arrived'."
                        : `Arrived and waiting in lounge. Check-in registered at ${currentTicket.checkedInAt ? new Date(currentTicket.checkedInAt).toLocaleTimeString("en-ZA") : 'entrance'}.`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("pass")}
                    className="w-full sm:w-auto px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR Pass</span>
                  </button>
                </div>
              </div>
            )}

            {currentTicket ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header Ticket Bar */}
                <div className="bg-gradient-to-r from-teal-700 to-emerald-700 text-white p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest font-semibold text-teal-200">
                      Private Clinic Electronic Queue Ticket
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-[11px] font-medium backdrop-blur-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                      Live Synchronised
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                    <div>
                      <span className="text-4xl sm:text-5xl font-black tracking-tight">{currentTicket.ticketNumber}</span>
                      <h2 className="text-lg font-semibold text-teal-50 mt-1">{currentTicket.patientName}</h2>
                    </div>

                    <div className="sm:text-right bg-white/10 rounded-2xl p-4 sm:p-3 backdrop-blur-xs border border-white/15">
                      <span className="text-[11px] uppercase tracking-wider text-teal-200 block">Est. Wait Time</span>
                      <div className="flex items-center sm:justify-end gap-1 text-2xl font-bold text-white">
                        <Clock className="w-5 h-5 text-teal-200" />
                        {currentTicket.estimatedWaitMinutes === 0 ? "Now In Room" : `~${currentTicket.estimatedWaitMinutes} mins`}
                      </div>
                      <span className="text-[11px] text-teal-100/90 mt-0.5 block">
                        {queueItemsBefore === 0 ? "You're next in line!" : `${queueItemsBefore} patient(s) ahead of you`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Queue Status Progress Bar */}
                <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-5">
                    Live Visit Progress
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Booked", desc: "R0 Upfront", step: 0 },
                      { label: "Arrived", desc: "Entrance Scanned", step: 1 },
                      { label: "Called", desc: currentTicket.roomNumber || "To Doctor", step: 2 },
                      { label: "Consultation", desc: currentTicket.doctorAssignedName?.split(" ")[1] || "Active", step: 3 },
                      { label: "Pharmacy", desc: "R50 Bundled", step: 4 },
                    ].map((s) => {
                      const isCompleted = currentStep > s.step;
                      const isCurrent = currentStep === s.step;
                      return (
                        <div
                          key={s.step}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isCurrent
                              ? "bg-teal-50 border-teal-500 text-teal-900 shadow-xs ring-2 ring-teal-500/20"
                              : isCompleted
                              ? "bg-emerald-50/60 border-emerald-200 text-emerald-900"
                              : "bg-white border-slate-200 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-center mb-1">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : isCurrent ? (
                              <span className="w-3.5 h-3.5 rounded-full bg-teal-600 animate-ping inline-block" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 inline-block" />
                            )}
                          </div>
                          <span className="text-xs font-bold block">{s.label}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{s.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Appointment Information Details */}
                <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 block font-medium">Assigned Physician</span>
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      {currentTicket.doctorAssignedName}
                    </div>
                    <span className="text-slate-500 block">{currentTicket.roomNumber || "Room 1"}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <span className="text-slate-500 block font-medium">Priority & Symptom</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        currentTicket.priority === "urgent" ? "bg-rose-100 text-rose-800" : "bg-teal-100 text-teal-800"
                      }`}>
                        {currentTicket.priority}
                      </span>
                      <span className="text-slate-700 font-medium truncate">{currentTicket.reasonForVisit}</span>
                    </div>
                    <span className="text-slate-500 block">Appointment Slot: {currentTicket.appointmentTime}</span>
                  </div>
                </div>

                {/* Mobile Friendly Comfort Notice */}
                <div className="p-4 bg-teal-50/60 border-t border-teal-100 flex items-center justify-between text-xs text-teal-950">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>Free to wait in nearby cafe or car. You will be alerted when 5 mins away.</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("records")}
                    className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    Medical File <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4">
                <Ticket className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900">
                  No Active Queue Ticket for {patientRecord?.fullName || "Selected Patient"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {patientRecord?.fullName || "This patient"} has a profile and POPIA encrypted medical records on file, but does not currently have an active appointment or queue ticket today.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {patientRecord && (
                    <button
                      type="button"
                      onClick={() => handlePreFillBooking(patientRecord)}
                      className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      <span>Book Consultation for {patientRecord.fullName.split(" ")[0]}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSwitcherOpen(true)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                    <span>Switch to Another Patient</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Clinic Info & Fast FAQs */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Patient Privacy & POPIA
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                All clinical notes, chronic condition flags, and diagnostic findings are secured with AES-256-GCM encryption on the server before storage.
              </p>
              <button
                onClick={() => setShowEncryptionModal(true)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-slate-600" />
                Verify Cryptographic Badge
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                How the R50 Fee Works
              </h3>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span><strong>R0 Upfront:</strong> Booking a queue spot never requires a credit card or upfront deposit.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span><strong>Bundled at Checkout:</strong> If prescribed medication, the R50 fee is added directly into your pharmacy total.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  <span><strong>Faster Than Hospitals:</strong> Eliminates the 3 to 5 hour administrative wait times found in state facilities.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ENTRANCE CHECK-IN QR PASS */}
      {activeTab === "pass" && (
        <div className="space-y-6">
          {currentTicket ? (
            <PatientCheckInPass 
              ticket={currentTicket} 
              onArrived={() => setActiveTab("tracker")} 
            />
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 max-w-md mx-auto">
              <QrCode className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">
                No Active Pass for {patientRecord?.fullName || "Selected Patient"}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                An entrance check-in QR pass is automatically generated once an appointment or walk-in queue spot is created.
              </p>
              <div className="flex flex-col gap-2 pt-1">
                {patientRecord && (
                  <button
                    type="button"
                    onClick={() => handlePreFillBooking(patientRecord)}
                    className="w-full px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    <span>Book Consultation for {patientRecord.fullName.split(" ")[0]}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsSwitcherOpen(true)}
                  className="w-full px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Switch to Patient with Active Ticket</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BOOK CONSULTATION */}
      {activeTab === "book" && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <CalendarPlus className="w-4 h-4" />
              Rapid Patient Booking
            </div>
            <h2 className="text-xl font-bold text-slate-900">Schedule Private Clinic Consultation</h2>
            <p className="text-xs text-slate-500 mt-1">
              Book your spot in line. Zero upfront fee. Standard R50 booking fee bundled into medication dispensary settlement.
            </p>
          </div>

          <form onSubmit={handleBook} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sipho Mkhize"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (+27) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+27 82 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  SA ID / Passport (Encrypted with AES-256)
                </label>
                <input
                  type="text"
                  placeholder="880412 5092 083"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Doctor / Triage</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                >
                  {state?.doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} ({doc.room}) - {doc.specialty}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit / Symptoms *</label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Severe headache, persistent cough, high blood pressure prescription renewal"
                value={reasonForVisit}
                onChange={(e) => setReasonForVisit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Symptom Urgency</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority("routine")}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer ${
                      priority === "routine"
                        ? "bg-teal-50 border-teal-600 text-teal-800"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Routine Visit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority("urgent")}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer ${
                      priority === "urgent"
                        ? "bg-rose-50 border-rose-600 text-rose-800"
                        : "bg-slate-50 border-slate-200 text-slate-600"
                    }`}
                  >
                    Urgent (Acute)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Known Drug Allergies</label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa drugs (or leave blank)"
                  value={allergiesText}
                  onChange={(e) => setAllergiesText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Price Clarification */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-600 font-medium">Due Now Upon Booking:</span>
              <span className="text-emerald-700 font-bold text-sm">R0.00</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              {isSubmitting ? "Generating Queue Ticket..." : "Confirm Booking & Generate Queue Ticket"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ENCRYPTED RECORDS */}
      {activeTab === "records" && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">Protected Health Information (POPIA)</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Records for {patientRecord?.fullName || currentTicket?.patientName || "Current Patient"}
                </p>
              </div>

              {/* Ciphertext vs Cleartext Toggle */}
              <button
                onClick={() => setShowRawEncrypted(!showRawEncrypted)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                {showRawEncrypted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showRawEncrypted ? "Show Authorized Decrypted View" : "View Raw Encrypted Ciphertext"}
              </button>
            </div>

            {/* Patient Overview Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[11px]">Age & Gender</span>
                <span className="font-bold text-slate-800">{patientRecord?.age || 35} yrs, {patientRecord?.gender || "Male"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[11px]">Blood Group</span>
                <span className="font-bold text-slate-800">{patientRecord?.bloodType || "O+"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[11px]">Allergies</span>
                <span className="font-bold text-rose-700 truncate block">
                  {patientRecord?.allergies?.length ? patientRecord.allergies.join(", ") : "None reported"}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[11px]">Chronic List</span>
                <span className="font-bold text-slate-800 truncate block">
                  {patientRecord?.chronicConditions?.length ? patientRecord.chronicConditions.join(", ") : "None"}
                </span>
              </div>
            </div>

            {/* Clinical Notes Display (Encrypted vs Decrypted) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Clinical Consultation Notes
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  AES-256-GCM
                </span>
              </div>

              {showRawEncrypted ? (
                <div className="p-4 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 space-y-2">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans">
                    Encrypted Payload (Rest Storage):
                  </span>
                  <p className="break-all">{patientRecord?.notesEncrypted?.ciphertext || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}</p>
                  <div className="text-[11px] text-slate-400 flex gap-4 pt-2 border-t border-slate-800">
                    <span>IV: {patientRecord?.notesEncrypted?.iv || "0f81a7b452..."}</span>
                    <span>TAG: {patientRecord?.notesEncrypted?.tag || "29c1d981..."}</span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {patientRecord?.decryptedNotes || "Patient reports manageable symptoms. Regular monitoring prescribed."}
                </div>
              )}
            </div>

            {/* Prescriptions History */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-800 block">
                Prescriptions & Dispensary History ({patientRecord?.fullName || "Patient"})
              </span>
              {patientPrescriptions.length > 0 ? (
                <div className="space-y-3">
                  {patientPrescriptions.map((rx) => (
                    <div key={rx.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rx.diagnosis}</span>
                        <span className="text-slate-500 font-mono">{rx.date}</span>
                      </div>
                      <div className="space-y-1">
                        {rx.medications.map((m) => (
                          <div key={m.id} className="flex items-center justify-between text-slate-600">
                            <span>• {m.name} ({m.dosage})</span>
                            <span className="font-medium text-slate-800">R{m.basePriceZar}.00</span>
                          </div>
                        ))}
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-slate-500">
                        <span>Doctor: {rx.doctorName}</span>
                        <span className="text-emerald-700 font-bold">Total (incl. R50 bundle): R{rx.totalPatientPaymentZar}.00</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                  No previous prescriptions recorded for {patientRecord?.fullName || "this patient"}.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Directory & Search Switcher Modal */}
      {state?.patients && (
        <PatientSwitcherModal
          isOpen={isSwitcherOpen}
          onClose={() => setIsSwitcherOpen(false)}
          patients={state.patients}
          queue={state.queue}
          selectedPatientId={patientRecord?.id || null}
          onSelectPatient={(id) => selectPatient(id)}
          onBookForPatient={handlePreFillBooking}
        />
      )}
    </div>
  );
};
