import React, { useState } from "react";
import { 
  Receipt, 
  Pill, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Printer, 
  FileText, 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  Calendar,
  User,
  Check,
  CreditCard
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";
import type { Prescription, Doctor } from "../../types";
import { PrescriptionPrintModal, type PrescriptionPrintData } from "./PrescriptionPrintModal";

interface DoctorMedicationBillingProps {
  currentDoctor: Doctor | undefined;
  onOpenConsultation?: () => void;
}

export const DoctorMedicationBilling: React.FC<DoctorMedicationBillingProps> = ({
  currentDoctor,
  onOpenConsultation
}) => {
  const { state, dispenseAndSettle } = useClinic();
  
  const [filterScope, setFilterScope] = useState<"my_room" | "all">("my_room");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "settled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [printModalData, setPrintModalData] = useState<PrescriptionPrintData | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  // Filter prescriptions
  const allPrescriptions = state?.prescriptions || [];
  
  const filteredPrescriptions = allPrescriptions.filter((p) => {
    // Doctor room filter
    if (filterScope === "my_room" && currentDoctor) {
      const matchDoc = p.doctorId === currentDoctor.id || p.doctorName === currentDoctor.name;
      if (!matchDoc) return false;
    }

    // Status filter
    if (statusFilter !== "all" && p.paymentStatus !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPatient = p.patientName.toLowerCase().includes(q);
      const matchDiagnosis = (p.diagnosis || "").toLowerCase().includes(q);
      const matchMed = p.medications.some(m => m.name.toLowerCase().includes(q));
      const matchTicket = (p.queueItemId || "").toLowerCase().includes(q);
      if (!matchPatient && !matchDiagnosis && !matchMed && !matchTicket) return false;
    }

    return true;
  });

  // Calculate selected prescription or fallback to first
  const activePrescription: Prescription | undefined = 
    filteredPrescriptions.find(p => p.id === selectedPrescriptionId) || 
    filteredPrescriptions[0];

  // Financial aggregates
  const totalBilledZar = filteredPrescriptions.reduce((sum, p) => sum + (p.totalPatientPaymentZar || 0), 0);
  const totalMedicationSubtotalZar = filteredPrescriptions.reduce((sum, p) => sum + (p.medicationSubtotalZar || 0), 0);
  const totalBundledFeesZar = filteredPrescriptions.reduce((sum, p) => sum + (p.clinicBundleFeeZar || 50), 0);
  const settledCount = filteredPrescriptions.filter(p => p.paymentStatus === "settled").length;
  const pendingCount = filteredPrescriptions.filter(p => p.paymentStatus === "pending").length;

  // Handle print receipt
  const handlePrintReceipt = () => {
    window.print();
  };

  // Handle open print modal for formal HPCSA prescription
  const handleOpenPrintRx = (p: Prescription) => {
    const matchedPatient = state?.patients.find(pt => pt.id === p.patientId);
    const matchedQueue = state?.queue.find(q => q.id === p.queueItemId);

    setPrintModalData({
      ticketNumber: matchedQueue?.ticketNumber || "Q-RX",
      date: new Date(p.date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }),
      doctor: {
        name: p.doctorName,
        specialty: currentDoctor?.specialty || "General Practice",
        room: currentDoctor?.room || "Room 1",
        practiceNumber: "PR-0842918",
        hpcsaNumber: "MP-0719442"
      },
      patient: {
        fullName: p.patientName,
        age: matchedPatient?.age || 35,
        phone: matchedPatient?.phone,
        idNumber: matchedPatient?.idNumber,
        allergies: matchedPatient?.allergies,
        chronicConditions: matchedPatient?.chronicConditions
      },
      vitals: matchedQueue?.vitalSigns ? {
        bp: matchedQueue.vitalSigns.bloodPressure,
        heartRate: matchedQueue.vitalSigns.heartRate ? `${matchedQueue.vitalSigns.heartRate} bpm` : undefined,
        temp: matchedQueue.vitalSigns.temperature ? `${matchedQueue.vitalSigns.temperature} °C` : undefined,
        spO2: matchedQueue.vitalSigns.spO2 ? `${matchedQueue.vitalSigns.spO2}%` : undefined
      } : undefined,
      diagnosis: p.diagnosis,
      clinicalNotes: p.decryptedClinicalNotes,
      medications: p.medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        instructions: m.instructions,
        basePriceZar: m.basePriceZar,
        quantity: m.quantity
      })),
      medicationSubtotalZar: p.medicationSubtotalZar,
      clinicBundleFeeZar: p.clinicBundleFeeZar,
      totalPatientPaymentZar: p.totalPatientPaymentZar
    });
  };

  // Handle settle payment
  const handleSettle = async (prescriptionId: string) => {
    setIsSettling(true);
    await dispenseAndSettle(prescriptionId);
    setIsSettling(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Doctor Medication & Billing Manager</h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  R50 Bundled Care Model
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage pharmacological prescriptions, itemized dispensary receipts, and bundled consultation fee settlements.
              </p>
            </div>
          </div>

          {/* Quick Scope Switcher & Consultation Shortcut */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterScope("my_room")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterScope === "my_room"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {currentDoctor?.room || "My Room"}
              </button>
              <button
                type="button"
                onClick={() => setFilterScope("all")}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterScope === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Clinic Rooms
              </button>
            </div>

            {onOpenConsultation && (
              <button
                type="button"
                onClick={onOpenConsultation}
                className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Return to Room</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Prescriptions Billed</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">R{totalBilledZar}.00</span>
              <span className="text-xs text-slate-400 font-medium">({filteredPrescriptions.length} visits)</span>
            </div>
            <p className="text-[11px] text-slate-500">Gross revenue generated</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Medications Subtotal</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-teal-800">R{totalMedicationSubtotalZar}.00</span>
            </div>
            <p className="text-[11px] text-slate-500">Base pharmacy stock items</p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-amber-900 uppercase tracking-wider block">Bundled R50 Visit Fees</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-950">R{totalBundledFeesZar}.00</span>
              <span className="text-xs text-amber-800 font-medium">({filteredPrescriptions.length} × R50)</span>
            </div>
            <p className="text-[11px] text-amber-800">Direct clinic appointment revenue</p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Settlement Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {settledCount} Settled
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                {pendingCount} Pending
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Dispensary checkout reconciliation</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: Ledger on Left, Official Receipt on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Bills & Prescription Ledger (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Search and Status Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search patient, ticket, or medication..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="flex items-center justify-between text-xs gap-1">
              <span className="text-slate-400 text-[11px] font-medium">Status:</span>
              <div className="flex items-center gap-1">
                {(["all", "pending", "settled"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === st
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {st === "all" ? "All" : st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* List of Prescriptions / Bills */}
          <div className="space-y-3">
            {filteredPrescriptions.length > 0 ? (
              filteredPrescriptions.map((rx) => {
                const isSelected = activePrescription?.id === rx.id;
                const isSettled = rx.paymentStatus === "settled";

                return (
                  <div
                    key={rx.id}
                    onClick={() => setSelectedPrescriptionId(rx.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-teal-500 shadow-md ring-2 ring-teal-500/20"
                        : "bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                            {rx.queueItemId ? `#${rx.queueItemId.slice(-4).toUpperCase()}` : "#RX"}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900">{rx.patientName}</h4>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1 font-medium">
                          {rx.diagnosis || "General Consultation"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-black text-slate-900 block">
                          R{rx.totalPatientPaymentZar}.00
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${
                          isSettled
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {isSettled ? "Settled" : "Pending Pickup"}
                        </span>
                      </div>
                    </div>

                    {/* Medications Mini-pill List */}
                    <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                        <Pill className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">
                          {rx.medications.map(m => m.name.split(" ")[0]).join(", ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(rx.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    {/* Action buttons on card */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPrintRx(rx);
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Rx</span>
                      </button>

                      {!isSettled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSettle(rx.id);
                          }}
                          disabled={isSettling}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Settle R{rx.totalPatientPaymentZar}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2 text-xs text-slate-500">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700">No prescriptions or bills found</p>
                <p className="text-[11px]">
                  {searchQuery ? "Try refining your search terms." : "Complete a patient consultation in your room workspace to issue an itemized bill."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Full Itemized Clinic Dispensary Receipt & Breakdown (7 cols) */}
        <div className="lg:col-span-7">
          {activePrescription ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Clinic Dispensary Receipt</h3>
                    <p className="text-xs text-slate-500">Official Itemized Billing & Consultation Voucher</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Print this dispensary receipt"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    <span>Print Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenPrintRx(activePrescription)}
                    className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Open formal signed HPCSA prescription sheet"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-700" />
                    <span>Print Prescription</span>
                  </button>
                </div>
              </div>

              {/* Consultation & Patient Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">Patient Details:</span>
                  <span className="font-bold text-slate-900 text-sm block">{activePrescription.patientName}</span>
                  <span className="text-slate-500 block">Ticket: #{activePrescription.queueItemId?.slice(-4).toUpperCase() || "RX"}</span>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[11px] text-slate-400 block font-medium">Attending Clinician:</span>
                  <span className="font-bold text-slate-900 text-sm block">{activePrescription.doctorName}</span>
                  <span className="text-slate-500 block">Date: {new Date(activePrescription.date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Clinical Diagnosis:</span>
                  <span className="font-bold text-slate-900">{activePrescription.diagnosis || "Consultation"}</span>
                </div>
              </div>

              {/* Itemized Dispensed Medications Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    Dispensed Medication Items
                  </span>
                  <span className="text-[11px] text-slate-500">{activePrescription.medications.length} items</span>
                </div>

                <div className="space-y-2">
                  {activePrescription.medications.map((m) => (
                    <div 
                      key={m.id} 
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{m.name}</span>
                          <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-200/80 text-slate-700 font-medium">
                            {m.dosage}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block">
                          {m.instructions}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Qty: {m.quantity} × R{m.basePriceZar}.00
                        </span>
                      </div>

                      <span className="font-black text-slate-900 text-sm shrink-0">
                        R{m.basePriceZar * m.quantity}.00
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medication Subtotal */}
              <div className="flex justify-between text-xs text-slate-600 px-1">
                <span>Medications Subtotal:</span>
                <span className="font-bold text-slate-800">R{activePrescription.medicationSubtotalZar}.00</span>
              </div>

              {/* Bundled R50 Healthcare Fee Line Item */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-amber-950">Bundled Clinic Consultation Charge</span>
                    <span className="px-2 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-bold text-[10px]">
                      Transparent R50
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-800 block">
                    Zero upfront consultation fee — bundled directly into pharmacy checkout.
                  </span>
                </div>
                <span className="font-black text-amber-950 text-base shrink-0">
                  R{activePrescription.clinicBundleFeeZar || 50}.00
                </span>
              </div>

              {/* Total Patient Payment Grand Card */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-300 block">
                    Total Patient Bill (Payable at Pharmacy)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Includes medication cost + R50 bundled consultation fee
                  </span>
                </div>
                <span className="text-3xl font-black text-white shrink-0">
                  R{activePrescription.totalPatientPaymentZar}.00
                </span>
              </div>

              {/* Settlement Status & Action Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Payment Status:</span>
                  {activePrescription.paymentStatus === "settled" ? (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      SETTLED & DISPENSED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      PENDING PHARMACY PICKUP
                    </span>
                  )}
                </div>

                {activePrescription.paymentStatus !== "settled" && (
                  <button
                    type="button"
                    disabled={isSettling}
                    onClick={() => handleSettle(activePrescription.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark Paid & Dispensed (R{activePrescription.totalPatientPaymentZar}.00)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Receipt className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Select a Prescription to View Bill & Receipt</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Choose any patient bill from the left ledger to review the itemized breakdown, print the receipt, or mark settlement.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Formal HPCSA Prescription Print Modal */}
      {printModalData && (
        <PrescriptionPrintModal
          data={printModalData}
          onClose={() => setPrintModalData(null)}
        />
      )}
    </div>
  );
};
