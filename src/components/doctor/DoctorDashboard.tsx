import React, { useState } from "react";
import { 
  Stethoscope, 
  User, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Pill, 
  FileText, 
  Lock, 
  Sparkles, 
  Plus, 
  Trash2, 
  Send, 
  Activity, 
  Thermometer, 
  Heart,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Printer,
  UserPlus,
  Users,
  Receipt
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";
import type { QueueItem, MedicationItem } from "../../types";
import { PrescriptionPrintModal, type PrescriptionPrintData } from "./PrescriptionPrintModal";
import { ClinicQueue } from "../queue/ClinicQueue";
import { AddDoctorModal } from "./AddDoctorModal";
import { DoctorMedicationBilling } from "./DoctorMedicationBilling";

const COMMON_MEDS = [
  { name: "Amlodipine 5mg Tablets (30s)", dosage: "1 tablet daily", instructions: "For blood pressure", basePriceZar: 110 },
  { name: "Metformin 500mg (60s)", dosage: "1 tablet twice daily", instructions: "Take with food for diabetes", basePriceZar: 95 },
  { name: "Salbutamol 100mcg Inhaler", dosage: "2 puffs PRN", instructions: "Inhale when wheezing or tight", basePriceZar: 140 },
  { name: "Paracetamol 500mg (20s)", dosage: "2 tablets 6-hourly PRN", instructions: "Max 8 tabs in 24h for pain/fever", basePriceZar: 45 },
  { name: "Amoxicillin 500mg (21s)", dosage: "1 capsule 8-hourly", instructions: "Complete 7-day course with water", basePriceZar: 130 },
  { name: "Cetirizine 10mg (30s)", dosage: "1 tablet at night", instructions: "Non-drowsy antihistamine for allergies", basePriceZar: 60 }
];

const COMMON_DIAGNOSES = [
  "Essential Hypertension (I10)",
  "Type 2 Diabetes Mellitus (E11)",
  "Acute Bronchitis (J20)",
  "Upper Respiratory Tract Infection (J06)",
  "Asthma with Acute Exacerbation (J45)",
  "Tension Headache / Migraine (G43)"
];

export const DoctorDashboard: React.FC = () => {
  const { 
    state, 
    selectedDoctorId, 
    setSelectedDoctorId, 
    callPatientToRoom, 
    completeConsultation,
    setShowEncryptionModal 
  } = useClinic();

  const currentDoctor = state?.doctors.find(d => d.id === selectedDoctorId) || state?.doctors[0];
  
  // Find current patient in consultation with this doctor
  const activeConsultationItem = state?.queue.find(
    q => q.status === "in_consultation" && (q.doctorAssignedId === currentDoctor?.id || q.roomNumber === currentDoctor?.room)
  );

  const activePatient = activeConsultationItem ? state?.patients.find(p => p.id === activeConsultationItem.patientId) : null;

  // Consultation Form State
  const [diagnosis, setDiagnosis] = useState("");
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [bp, setBp] = useState("130/85");
  const [heartRate, setHeartRate] = useState("76");
  const [temp, setTemp] = useState("36.8");
  const [spO2, setSpO2] = useState("98");
  const [medications, setMedications] = useState<Array<{ name: string; dosage: string; instructions: string; basePriceZar: number; quantity: number }>>([
    { name: "Paracetamol 500mg (20s)", dosage: "2 tablets 6-hourly", instructions: "Take for pain/fever", basePriceZar: 45, quantity: 1 }
  ]);

  // AI Assistant in Doctor View
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  // Filter queue for patients waiting
  const waitingPatients = state?.queue.filter(
    q => (q.status === "checked_in" || q.status === "booked") && 
         (!q.doctorAssignedId || q.doctorAssignedId === currentDoctor?.id)
  ) || [];

  // Filter today's doctor prescriptions
  const doctorPrescriptions = state?.prescriptions.filter(
    p => !currentDoctor || p.doctorId === currentDoctor.id || p.doctorName === currentDoctor.name
  ) || [];

  // Prescription print modal state
  const [printModalData, setPrintModalData] = useState<PrescriptionPrintData | null>(null);
  const [leftTab, setLeftTab] = useState<"queue" | "prescriptions" | "roster">("queue");
  const [doctorViewMode, setDoctorViewMode] = useState<"consultation" | "queue" | "billing">("consultation");
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);

  const handleOpenActivePrintPreview = () => {
    if (!activeConsultationItem || !activePatient || !currentDoctor) return;
    setPrintModalData({
      ticketNumber: activeConsultationItem.ticketNumber,
      date: new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }),
      doctor: {
        name: currentDoctor.name,
        specialty: currentDoctor.specialty,
        room: currentDoctor.room,
        practiceNumber: "PR-0842918",
        hpcsaNumber: "MP-0719442"
      },
      patient: {
        fullName: activePatient.fullName,
        age: activePatient.age,
        phone: activePatient.phone,
        idNumber: activePatient.idNumber,
        allergies: activePatient.allergies,
        chronicConditions: activePatient.chronicConditions
      },
      vitals: {
        bp,
        heartRate,
        temp,
        spO2
      },
      diagnosis: diagnosis || "Clinical Review & Prescription",
      clinicalNotes,
      medications: medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        instructions: m.instructions,
        basePriceZar: m.basePriceZar,
        quantity: m.quantity || 1,
        repeats: 0
      })),
      medicationSubtotalZar: medicationSubtotal,
      clinicBundleFeeZar: bundledFee,
      totalPatientPaymentZar: totalPatientCost
    });
  };

  const handlePrintExistingPrescription = (rx: any) => {
    const pat = state?.patients.find(p => p.id === rx.patientId);
    const queueMatch = state?.queue.find(q => q.id === rx.queueItemId);
    setPrintModalData({
      ticketNumber: queueMatch?.ticketNumber || rx.queueItemId?.slice(-5) || rx.id.slice(-5),
      date: new Date(rx.date).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }),
      doctor: {
        name: rx.doctorName || currentDoctor?.name || "Dr. Clinician",
        specialty: currentDoctor?.specialty || "General Practitioner",
        room: currentDoctor?.room || "Room 1",
        practiceNumber: "PR-0842918",
        hpcsaNumber: "MP-0719442"
      },
      patient: {
        fullName: rx.patientName,
        age: pat?.age,
        phone: pat?.phone,
        idNumber: pat?.idNumber,
        allergies: pat?.allergies,
        chronicConditions: pat?.chronicConditions
      },
      diagnosis: rx.diagnosis || "General Consultation",
      clinicalNotes: rx.decryptedClinicalNotes,
      medications: rx.medications || [],
      medicationSubtotalZar: rx.medicationSubtotalZar,
      clinicBundleFeeZar: rx.clinicBundleFeeZar,
      totalPatientPaymentZar: rx.totalPatientPaymentZar
    });
  };

  const handleCallPatient = async (ticketId: string) => {
    if (!currentDoctor) return;
    await callPatientToRoom(ticketId, currentDoctor.id, currentDoctor.room);
  };

  const handleAddMedication = (med: typeof COMMON_MEDS[0]) => {
    setMedications(prev => [...prev, { ...med, quantity: 1 }]);
  };

  const handleRemoveMedication = (idx: number) => {
    setMedications(prev => prev.filter((_, i) => i !== idx));
  };

  const handleComplete = async () => {
    if (!activeConsultationItem || !currentDoctor) return;
    await completeConsultation({
      queueItemId: activeConsultationItem.id,
      doctorId: currentDoctor.id,
      diagnosis: diagnosis || "Clinical Review & Prescription",
      clinicalNotes: clinicalNotes || `Patient reviewed in ${currentDoctor.room}. Vitals: BP ${bp}, HR ${heartRate}, Temp ${temp}C, SpO2 ${spO2}%. Treatment plan agreed.`,
      medications
    });

    // Reset local form
    setDiagnosis("");
    setClinicalNotes("");
    setMedications([]);
    setAiResult(null);
  };

  const runAiAssist = async (mode: "summary" | "interactions" | "instructions") => {
    if (!activePatient) return;
    setAiLoading(true);
    let prompt = "";
    if (mode === "summary") {
      prompt = `Provide a concise 3-bullet clinical summary of this patient's medical history, allergies, and chronic conditions for Dr. ${currentDoctor?.name}: Patient ${activePatient.fullName}, Age ${activePatient.age}, Allergies: ${activePatient.allergies.join(", ")}, Chronic: ${activePatient.chronicConditions.join(", ")}, Previous notes: ${activePatient.decryptedNotes}`;
    } else if (mode === "interactions") {
      prompt = `Perform a safety check: Does this patient have any contraindications or allergy risks with the prescribed medications (${medications.map(m => m.name).join(", ")}) given their allergies (${activePatient.allergies.join(", ")}) and conditions (${activePatient.chronicConditions.join(", ")})?`;
    } else {
      prompt = `Draft clear, patient-friendly home care and medication instructions in plain language for ${activePatient.fullName} diagnosed with ${diagnosis || 'upper respiratory symptoms'}, noting when to seek urgent emergency care.`;
    }

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, contextRole: "doctor", patientId: activePatient.id }),
      });
      const data = await res.json();
      setAiResult(data.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  // Medication calculations
  const medicationSubtotal = medications.reduce((acc, m) => acc + (m.basePriceZar * m.quantity), 0);
  const bundledFee = 50;
  const totalPatientCost = medicationSubtotal + bundledFee;

  return (
    <div className="space-y-6">
      {/* Doctor Room Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">{currentDoctor?.name}</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                {currentDoctor?.room}
              </span>
            </div>
            <p className="text-xs text-slate-500">{currentDoctor?.specialty} • {currentDoctor?.consultationsToday} seen today</p>
          </div>
        </div>

        {/* Doctor controls: View Mode toggle and Doctor selector */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setDoctorViewMode("consultation")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                doctorViewMode === "consultation"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Room Workspace</span>
            </button>
            <button
              type="button"
              onClick={() => setDoctorViewMode("queue")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                doctorViewMode === "queue"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Clinic Queue ({waitingPatients.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setDoctorViewMode("billing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                doctorViewMode === "billing"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Medication & Bill ({doctorPrescriptions.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-teal-600 cursor-pointer"
            >
              {state?.doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} - {doc.room}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddDoctorModal(true)}
              className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              title="Appoint and add a new doctor or clinician"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Doctor</span>
            </button>
          </div>
        </div>
      </div>

      {doctorViewMode === "queue" ? (
        <ClinicQueue
          filterDoctorId={currentDoctor?.id}
          viewContext="doctor"
          onPatientCalled={() => setDoctorViewMode("consultation")}
        />
      ) : doctorViewMode === "billing" ? (
        <DoctorMedicationBilling
          currentDoctor={currentDoctor}
          onOpenConsultation={() => setDoctorViewMode("consultation")}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Waiting Queue & Prescriptions for Doctor */}
        <div className="space-y-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLeftTab("queue")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                leftTab === "queue"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Queue ({waitingPatients.length})
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("prescriptions")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                leftTab === "prescriptions"
                  ? "bg-white text-teal-800 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-teal-600" />
              <span>Rx ({doctorPrescriptions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("roster")}
              className={`flex-1 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                leftTab === "roster"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>Doctors ({state?.doctors.length || 0})</span>
            </button>
          </div>

          {leftTab === "queue" ? (
            <div className="space-y-2.5">
              {waitingPatients.length > 0 ? (
                waitingPatients.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.priority === "urgent"
                        ? "bg-rose-50/50 border-rose-200 hover:border-rose-300"
                        : "bg-white border-slate-200 hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-slate-900">{item.ticketNumber}</span>
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            item.priority === "urgent" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 mt-0.5">{item.patientName}</h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{item.reasonForVisit}</p>
                      </div>

                      <button
                        onClick={() => handleCallPatient(item.id)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <span>Call</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Wait: ~{item.estimatedWaitMinutes}m
                      </span>
                      <span className={item.status === "checked_in" ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        {item.status === "checked_in" ? "Checked in lobby" : "Booked online"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  No waiting patients assigned to this room right now.
                </div>
              )}

              <button
                type="button"
                onClick={() => setDoctorViewMode("queue")}
                className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <Clock className="w-3.5 h-3.5 text-teal-600" />
                <span>Open Full Triage & Wait Matrix</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setDoctorViewMode("billing")}
                className="w-full p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-700" />
                  <span>Open Medication & Bill Manager</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
              </button>

              {doctorPrescriptions.length > 0 ? (
                doctorPrescriptions.map((rx) => (
                  <div
                    key={rx.id}
                    className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-bold text-xs text-slate-900 block">{rx.patientName}</span>
                        <p className="text-[11px] text-slate-600 line-clamp-1">{rx.diagnosis || "Consultation & Prescription"}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDoctorViewMode("billing")}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="View itemized bill and dispensary receipt"
                        >
                          <Receipt className="w-3 h-3" />
                          <span>Bill</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintExistingPrescription(rx)}
                          className="px-2 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Print clean prescription sheet"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Rx</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span>{rx.medications?.length || 0} meds • R{rx.totalPatientPaymentZar}.00</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(rx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  No prescriptions issued today by this room yet. Complete a consultation to issue and print.
                </div>
              )}
            </div>
          )}

          {leftTab === "roster" && (
            <div className="space-y-2.5">
              {/* Quick Add Doctor Banner in Roster */}
              <button
                type="button"
                onClick={() => setShowAddDoctorModal(true)}
                className="w-full p-3 rounded-2xl border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/50 hover:bg-teal-50 text-teal-800 transition-all flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-teal-700" />
                <span>+ Appoint & Add New Doctor</span>
              </button>

              {state?.doctors.map((doc) => {
                const isSelected = doc.id === currentDoctor?.id;
                const docWaitingCount = state.queue.filter(
                  q => (q.status === "checked_in" || q.status === "booked") && q.doctorAssignedId === doc.id
                ).length;

                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoctorId(doc.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-50/60 border-teal-500 ring-1 ring-teal-500/30"
                        : "bg-white border-slate-200 hover:border-teal-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                          {isSelected && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-600 text-white">
                              Current Room
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-teal-700 font-semibold mt-0.5">{doc.room}</div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">{doc.specialty}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded block ${
                          doc.currentPatientTicket
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {doc.currentPatientTicket ? `Consulting #${doc.currentPatientTicket}` : "Ready"}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {doc.consultationsToday} seen • {docWaitingCount} queued
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Center & Right Column: Active Consultation Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {activeConsultationItem && activePatient ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
              {/* Active Consultation Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      In Consultation Room
                    </span>
                    <span className="font-mono text-sm font-bold text-slate-900">
                      #{activeConsultationItem.ticketNumber}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">{activePatient.fullName}</h3>
                  <p className="text-xs text-slate-500">
                    Age {activePatient.age} • Phone {activePatient.phone} • ID: {activePatient.idNumber}
                  </p>
                </div>

                {/* Patient Allergy Warning Tag */}
                {activePatient.allergies.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-bold block text-[11px] uppercase tracking-wide">Allergy Alert:</span>
                      <span className="font-semibold">{activePatient.allergies.join(", ")}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Vital Signs Bar */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Patient Vitals
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-teal-600" /> Blood Pressure
                    </span>
                    <input
                      type="text"
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-600" /> Heart Rate (bpm)
                    </span>
                    <input
                      type="text"
                      value={heartRate}
                      onChange={(e) => setHeartRate(e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Thermometer className="w-3 h-3 text-amber-600" /> Temp (°C)
                    </span>
                    <input
                      type="text"
                      value={temp}
                      onChange={(e) => setTemp(e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-blue-600" /> SpO2 (%)
                    </span>
                    <input
                      type="text"
                      value={spO2}
                      onChange={(e) => setSpO2(e.target.value)}
                      className="w-full text-sm font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-teal-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Diagnosis Field & Quick ICD-10 Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-800 block">Primary Diagnosis / ICD-10</label>
                <input
                  type="text"
                  placeholder="e.g. Essential Hypertension (I10) or Acute Bronchitis"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-600"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DIAGNOSES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiagnosis(d)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 font-medium transition-colors cursor-pointer"
                    >
                      + {d.split("(")[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clinical Notes (AES-256 Encrypted on save) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Encrypted Clinical Notes (POPIA Compliant)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEncryptionModal(true)}
                    className="text-[11px] text-teal-700 hover:underline cursor-pointer"
                  >
                    View AES-256 Storage Architecture
                  </button>
                </div>
                <textarea
                  rows={3}
                  placeholder="Record examination findings, chest auscultation, differential considerations, and follow-up plan..."
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Gemini AI Clinical Assistant Quick Actions */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>Aiva Clinical AI Assistant (Doctor Support)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-medium">
                    Human Oversight Active
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={() => runAiAssist("summary")}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-indigo-600" />}
                    Summarise History & Chronic Status
                  </button>

                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={() => runAiAssist("interactions")}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Check Contraindications & Allergies
                  </button>

                  <button
                    type="button"
                    disabled={aiLoading}
                    onClick={() => runAiAssist("instructions")}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3 h-3 text-teal-600" />
                    Draft Home Care Instructions
                  </button>
                </div>

                {aiResult && (
                  <div className="p-3 bg-white rounded-xl border border-indigo-200 text-xs text-slate-800 space-y-1.5">
                    <span className="font-bold text-indigo-900 text-[11px] block">Aiva Clinical Response:</span>
                    <p className="whitespace-pre-line leading-relaxed">{aiResult}</p>
                    <button
                      type="button"
                      onClick={() => setClinicalNotes((prev) => prev ? `${prev}\n\n[Clinical AI Note]:\n${aiResult}` : `[Clinical AI Note]:\n${aiResult}`)}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 pt-1 cursor-pointer block"
                    >
                      + Append to Clinical Notes
                    </button>
                  </div>
                )}
              </div>

              {/* E-Prescription Medication Builder with Auto-Bundled R50 Surcharge */}
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-teal-600" />
                      E-Prescription & Pharmacy Dispensary List
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      R50 consultation charge is automatically bundled with prescribed medications.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={medications.length === 0}
                    onClick={handleOpenActivePrintPreview}
                    className="self-start sm:self-auto px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Open clean print layout formatted for physical printout"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-700" />
                    <span>Print-Optimized View</span>
                  </button>
                </div>

                {/* Common Clinic Formulations to Pick */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 block">Quick Add From Clinic Formulary:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_MEDS.map((med) => (
                      <button
                        key={med.name}
                        type="button"
                        onClick={() => handleAddMedication(med)}
                        className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-teal-100 hover:text-teal-900 text-slate-700 rounded-lg font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        {med.name.split(" ")[0]} (R{med.basePriceZar})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Prescriptions in builder */}
                <div className="space-y-2">
                  {medications.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>{item.dosage}</span>
                          <span>•</span>
                          <span>{item.instructions}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-bold text-slate-800">R{item.basePriceZar * item.quantity}.00</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMedication(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown Preview with Bundled R50 */}
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 text-xs">
                  <div className="flex justify-between text-amber-900">
                    <span>Medications Subtotal:</span>
                    <span className="font-semibold">R{medicationSubtotal}.00</span>
                  </div>
                  <div className="flex justify-between text-amber-900 font-bold border-b border-amber-200/80 pb-2">
                    <span>Bundled Clinic Consultation Fee:</span>
                    <span className="text-amber-800">R{bundledFee}.00</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm pt-1">
                    <span>Total Patient Checkout Due at Pharmacy:</span>
                    <span className="text-slate-900 text-base">R{totalPatientCost}.00</span>
                  </div>
                </div>

                {/* Action Buttons: Print Physical Copy & Complete Consultation */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    disabled={medications.length === 0}
                    onClick={handleOpenActivePrintPreview}
                    className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs sm:text-sm transition-all border border-slate-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Print clean prescription layout suitable for physical printout"
                  >
                    <Printer className="w-4 h-4 text-slate-700" />
                    <span>Print Physical Copy</span>
                  </button>

                  <button
                    onClick={handleComplete}
                    className="sm:col-span-2 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Complete & Send to Pharmacy (R{totalPatientCost}.00)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                  <Stethoscope className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Room Ready for Next Patient</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Select a patient from your queue on the left and click <strong>"Call"</strong> to begin consultation in {currentDoctor?.room}.
                </p>
                {waitingPatients.length > 0 && (
                  <button
                    onClick={() => handleCallPatient(waitingPatients[0].id)}
                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Call Next Patient (#{waitingPatients[0].ticketNumber})
                  </button>
                )}
              </div>

              {/* Today's Prescriptions Quick Access (When Room is Idle) */}
              {doctorPrescriptions.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
                        <Printer className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">Today's Issued Prescriptions ({doctorPrescriptions.length})</h4>
                        <p className="text-[11px] text-slate-500">Reprint physical prescriptions or manage itemized billing</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDoctorViewMode("billing")}
                      className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Receipt className="w-3.5 h-3.5 text-amber-700" />
                      <span>Open Medication & Bill Manager</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {doctorPrescriptions.map((rx) => (
                      <div 
                        key={rx.id} 
                        className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-teal-300 transition-all space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">{rx.patientName}</span>
                            <p className="text-slate-600 text-[11px] font-medium line-clamp-1">{rx.diagnosis}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDoctorViewMode("billing")}
                              className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="View itemized dispensary bill and receipt"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Bill</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintExistingPrescription(rx)}
                              className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Print</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                          <span>{rx.medications?.length || 0} medications • R{rx.totalPatientPaymentZar}.00</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(rx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Prescription Print-Optimized Modal */}
      {printModalData && (
        <PrescriptionPrintModal
          data={printModalData}
          onClose={() => setPrintModalData(null)}
        />
      )}

      {/* Add Doctor / Clinician Modal */}
      <AddDoctorModal
        isOpen={showAddDoctorModal}
        onClose={() => setShowAddDoctorModal(false)}
        onSuccess={(newDocId) => setSelectedDoctorId(newDocId)}
      />
    </div>
  );
};
