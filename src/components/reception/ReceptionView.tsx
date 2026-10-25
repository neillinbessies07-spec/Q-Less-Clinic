import React, { useState } from "react";
import { 
  Building2, 
  UserPlus, 
  CheckCircle2, 
  Clock, 
  Pill, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  ChevronRight, 
  Printer, 
  HeartHandshake,
  Receipt,
  RotateCcw
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";
import { ClinicQueue } from "../queue/ClinicQueue";

export const ReceptionView: React.FC = () => {
  const { 
    state, 
    checkInPatient, 
    callPatientToRoom, 
    dispenseAndSettle, 
    bookAppointment,
    setShowEncryptionModal 
  } = useClinic();

  const [activeTab, setActiveTab] = useState<"queue" | "intake" | "dispensary" | "analytics">("queue");
  const [searchTerm, setSearchTerm] = useState("");

  // Quick Walk-in Intake State
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInIdNumber, setWalkInIdNumber] = useState("");
  const [walkInReason, setWalkInReason] = useState("");
  const [walkInDoctorId, setWalkInDoctorId] = useState("doc-1");
  const [walkInPriority, setWalkInPriority] = useState<"routine" | "urgent">("routine");
  const [isSubmittingWalkIn, setIsSubmittingWalkIn] = useState(false);

  // Check-in vitals modal / fast values
  const [vitalsModalTicket, setVitalsModalTicket] = useState<string | null>(null);
  const [intakeBp, setIntakeBp] = useState("120/80");
  const [intakePulse, setIntakePulse] = useState("72");

  const filteredQueue = state?.queue.filter(q => 
    q.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.patientPhone.includes(searchTerm)
  ) || [];

  const pendingDispensary = state?.prescriptions.filter(p => p.paymentStatus === "pending") || [];
  const settledDispensary = state?.prescriptions.filter(p => p.paymentStatus === "settled") || [];

  const handleWalkInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone) return;
    setIsSubmittingWalkIn(true);

    await bookAppointment({
      fullName: walkInName,
      phone: walkInPhone,
      idNumber: walkInIdNumber,
      reasonForVisit: walkInReason,
      doctorId: walkInDoctorId,
      priority: walkInPriority,
      isWalkIn: true
    });

    setIsSubmittingWalkIn(false);
    setWalkInName("");
    setWalkInPhone("");
    setWalkInIdNumber("");
    setWalkInReason("");
    setActiveTab("queue");
  };

  const handleQuickCheckin = async (ticketId: string) => {
    await checkInPatient(ticketId, { bloodPressure: intakeBp, heartRate: Number(intakePulse) });
    setVitalsModalTicket(null);
  };

  return (
    <div className="space-y-6">
      {/* Clinic Front Desk Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "queue"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Active Queue ({state?.queue.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("intake")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "intake"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Rapid Walk-in Intake</span>
          </button>

          <button
            onClick={() => setActiveTab("dispensary")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "dispensary"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Pill className="w-4 h-4 text-amber-400" />
            <span>Dispensary & Payments ({pendingDispensary.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Operations & Bundled Fees</span>
          </button>
        </div>

        {/* Rapid walk-in intake shortcut button in sub-navigation */}
        <button
          onClick={() => setActiveTab("intake")}
          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register Walk-in</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE REAL-TIME CLINIC QUEUE */}
      {activeTab === "queue" && (
        <ClinicQueue viewContext="reception" />
      )}

      {/* TAB 2: RAPID WALK-IN INTAKE */}
      {activeTab === "intake" && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-semibold text-xs uppercase tracking-wider mb-1">
              <UserPlus className="w-4 h-4" />
              Reception Desk Deskpad
            </div>
            <h2 className="text-xl font-bold text-slate-900">Rapid Walk-In Patient Intake</h2>
            <p className="text-xs text-slate-500 mt-1">
              Takes 10 seconds. Automatically assigns electronic queue ticket. R0 charged now; R50 bundled into medication.
            </p>
          </div>

          <form onSubmit={handleWalkInSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kagiso Motsepe"
                  value={walkInName}
                  onChange={(e) => setWalkInName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Phone (+27) *</label>
                <input
                  type="tel"
                  required
                  placeholder="+27 72 984 1120"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SA National ID / Passport</label>
                <input
                  type="text"
                  placeholder="850619 5082 084"
                  value={walkInIdNumber}
                  onChange={(e) => setWalkInIdNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign to Doctor / Room</label>
                <select
                  value={walkInDoctorId}
                  onChange={(e) => setWalkInDoctorId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white focus:outline-none focus:border-teal-600"
                >
                  {state?.doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.room}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint / Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acute bronchitis, laceration dressing, hypertension review"
                value={walkInReason}
                onChange={(e) => setWalkInReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Triage Priority</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setWalkInPriority("routine")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer ${
                    walkInPriority === "routine"
                      ? "bg-teal-50 border-teal-600 text-teal-800"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Standard Walk-in
                </button>
                <button
                  type="button"
                  onClick={() => setWalkInPriority("urgent")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border cursor-pointer ${
                    walkInPriority === "urgent"
                      ? "bg-rose-50 border-rose-600 text-rose-800"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  Urgent Priority Triage
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              <span className="font-bold block">No Reception Cash Collection Needed:</span>
              <p className="text-amber-800 mt-0.5">
                Patient enters the waiting area immediately. The R50 per-appointment fee is settled at the dispensary when picking up medication.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmittingWalkIn}
              className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmittingWalkIn ? "Registering..." : "Register Walk-in & Issue Electronic Ticket"}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: DISPENSARY & PHARMACY CHECKOUT WITH BUNDLED R50 */}
      {activeTab === "dispensary" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinic Dispensary & Pharmacy Cashier</h3>
              <p className="text-xs text-slate-500">
                Prescriptions ready for patient collection with the R50 per-appointment booking fee bundled into the total.
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              {pendingDispensary.length} Pending Settlement
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDispensary.length > 0 ? (
              pendingDispensary.map((rx) => (
                <div key={rx.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-mono text-slate-400 block">{rx.id}</span>
                      <h4 className="text-base font-bold text-slate-900">{rx.patientName}</h4>
                      <p className="text-xs text-slate-500">Dr. {rx.doctorName} • {rx.diagnosis}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                      Awaiting Collection
                    </span>
                  </div>

                  {/* Items */}
                  <div className="space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Medications:</span>
                    {rx.medications.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                        <div>
                          <span className="font-semibold text-slate-800">{m.name}</span>
                          <span className="text-[10px] text-slate-500 block">{m.dosage}</span>
                        </div>
                        <span className="font-bold text-slate-900">R{m.basePriceZar * m.quantity}.00</span>
                      </div>
                    ))}
                  </div>

                  {/* Bundled Fee Breakdown */}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-xs text-amber-950">
                    <div className="flex justify-between">
                      <span>Medications Subtotal:</span>
                      <span className="font-medium">R{rx.medicationSubtotalZar}.00</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span>Bundled Clinic Appointment Fee:</span>
                      <span>R{rx.clinicBundleFeeZar}.00</span>
                    </div>
                    <div className="flex justify-between font-black text-slate-900 text-sm pt-1 border-t border-amber-200/80">
                      <span>Total Due from Patient:</span>
                      <span>R{rx.totalPatientPaymentZar}.00</span>
                    </div>
                  </div>

                  <button
                    onClick={() => dispenseAndSettle(rx.id)}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Dispense Medication & Settle Payment (R{rx.totalPatientPaymentZar}.00)
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-2 p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2 text-xs text-slate-400">
                <Pill className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">All Prescriptions Dispensed & Settled</p>
                <p>New prescriptions completed by doctors will appear here instantly.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CLINIC OPERATIONS & BUNDLED FINANCIALS */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Platform Revenue (R50 Fees)
              </span>
              <span className="text-3xl font-black text-teal-700">
                R{state?.metrics.bundledPlatformFeesCollectedZar || 700}
              </span>
              <p className="text-xs text-slate-500">
                {state?.metrics.completedToday} appointments completed × R50 bundled fee.
              </p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Total Pharmacy Settlements
              </span>
              <span className="text-3xl font-black text-slate-900">
                R{state?.metrics.totalRevenueZar || 3840}
              </span>
              <p className="text-xs text-slate-500">
                Includes medication dispensing + bundled clinic booking surcharge.
              </p>
            </div>

            <div className="p-5 bg-white rounded-3xl border border-slate-200 space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Patient Time Saved vs Hospital
              </span>
              <span className="text-3xl font-black text-emerald-600">
                ~{state?.metrics.hospitalComparisonSavedHours || 4.2} Hours
              </span>
              <p className="text-xs text-slate-500">
                Saved per patient compared to provincial public hospital 4.5hr queues.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-3xl border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              POPIA & AES-256 Storage Integrity Audit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every consultation record, diagnosis, and patient identification number stored in the clinic's database is encrypted using Galois/Counter Mode (GCM) with 256-bit keys. The active master key fingerprint is registered on the server and complies with the South African Protection of Personal Information Act (POPIA).
            </p>
            <button
              onClick={() => setShowEncryptionModal(true)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Open Technical Encryption Inspector
            </button>
          </div>
        </div>
      )}

      {/* Quick Vitals Check-in Modal */}
      {vitalsModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900">Reception Lobby Check-in</h3>
            <p className="text-xs text-slate-500">Record quick baseline vitals before queuing the patient:</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={intakeBp}
                  onChange={(e) => setIntakeBp(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={intakePulse}
                  onChange={(e) => setIntakePulse(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setVitalsModalTicket(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleQuickCheckin(vitalsModalTicket)}
                className="px-4 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg cursor-pointer"
              >
                Confirm Lobby Arrival
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
