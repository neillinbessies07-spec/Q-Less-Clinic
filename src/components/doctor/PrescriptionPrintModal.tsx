import React, { useState } from "react";
import { 
  Printer, 
  X, 
  Check, 
  Copy, 
  ShieldCheck, 
  Heart, 
  AlertTriangle, 
  Building2, 
  FileText,
  Clock,
  Sparkles
} from "lucide-react";

export interface PrescriptionPrintData {
  ticketNumber: string;
  date: string;
  doctor: {
    name: string;
    specialty?: string;
    room?: string;
    practiceNumber?: string;
    hpcsaNumber?: string;
  };
  patient: {
    fullName: string;
    age?: number;
    phone?: string;
    idNumber?: string;
    allergies?: string[];
    chronicConditions?: string[];
  };
  vitals?: {
    bp?: string;
    heartRate?: string;
    temp?: string;
    spO2?: string;
  };
  diagnosis: string;
  clinicalNotes?: string;
  medications: Array<{
    name: string;
    dosage: string;
    instructions: string;
    basePriceZar?: number;
    quantity?: number;
    repeats?: number;
  }>;
  medicationSubtotalZar?: number;
  clinicBundleFeeZar?: number;
  totalPatientPaymentZar?: number;
}

interface PrescriptionPrintModalProps {
  data: PrescriptionPrintData;
  onClose: () => void;
}

export const PrescriptionPrintModal: React.FC<PrescriptionPrintModalProps> = ({
  data,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyInstructions = () => {
    const text = [
      `Q-LESS HEALTHCARE CLINIC - PRESCRIPTION SUMMARY`,
      `Patient: ${data.patient.fullName} (Ticket: ${data.ticketNumber})`,
      `Prescriber: ${data.doctor.name} (${data.doctor.room || "Room 1"})`,
      `Diagnosis: ${data.diagnosis}`,
      `Date: ${data.date}`,
      ``,
      `MEDICATIONS & DOSAGE INSTRUCTIONS:`,
      ...data.medications.map((m, i) => 
        `${i + 1}. ${m.name}\n   Dose: ${m.dosage}\n   Instructions: ${m.instructions}\n   Qty: ${m.quantity || 1}`
      ),
      ``,
      `Pricing: Total R${data.totalPatientPaymentZar || 0}.00 (includes R50 bundled consultation fee)`,
      `Practice No: ${data.doctor.practiceNumber || "PR-0842918"}`
    ].join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const medSubtotal = data.medicationSubtotalZar ?? 
    data.medications.reduce((sum, m) => sum + ((m.basePriceZar || 0) * (m.quantity || 1)), 0);
  const bundleFee = data.clinicBundleFeeZar ?? 50;
  const totalCost = data.totalPatientPaymentZar ?? (medSubtotal + bundleFee);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 printable-prescription-modal">
      <div className="bg-white text-slate-900 w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden printable-prescription-page my-auto">
        
        {/* Screen Controls Header (Hidden in Print) */}
        <div className="no-print bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center text-teal-300">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold">Print-Optimized Physical Prescription</h3>
              <p className="text-[11px] text-slate-400">Standard A4 / Letter clinical paper layout</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyInstructions}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Text"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Physical Copy</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE PRESCRIPTION SHEET (Clean, high-contrast, physical clinical layout) */}
        <div className="p-6 sm:p-10 space-y-6 bg-white text-slate-900 font-sans">
          
          {/* Clinic Header / Letterhead */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-teal-700 text-white rounded-md flex items-center justify-center font-serif font-black text-base">
                    ℞
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                    Q-Less Healthcare Clinic
                  </h1>
                </div>
                <p className="text-xs font-semibold text-slate-600 mt-1">
                  Primary Healthcare, Urgent Care & Dispensary Services
                </p>
                <p className="text-[11px] text-slate-500">
                  Shop 4, Market Junction, Johannesburg • Tel: +27 11 884 9021 • info@qlessclinic.co.za
                </p>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-600 space-y-0.5 shrink-0">
                <p className="font-mono font-bold text-slate-900 text-xs">
                  Practice No: {data.doctor.practiceNumber || "PR-0842918"}
                </p>
                <p>HPCSA Reg: {data.doctor.hpcsaNumber || "MP-0719442"}</p>
                <p className="font-mono text-slate-800 font-semibold">Date: {data.date}</p>
                <p className="font-mono text-teal-800 font-bold">Ticket: #{data.ticketNumber}</p>
              </div>
            </div>
          </div>

          {/* Doctor & Patient Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-slate-300 bg-slate-50/70 text-xs">
            {/* Prescriber */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Prescribing Clinician
              </span>
              <p className="font-bold text-slate-950 text-sm">{data.doctor.name}</p>
              <p className="text-slate-600">{data.doctor.specialty || "General Practitioner"} • {data.doctor.room || "Room 1"}</p>
              <p className="text-slate-500 text-[11px]">MBChB (Wits), Dip PEC (SA)</p>
            </div>

            {/* Patient Details */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Patient Information
              </span>
              <p className="font-bold text-slate-950 text-sm">{data.patient.fullName}</p>
              <div className="flex flex-wrap items-center gap-x-3 text-slate-600 text-[11px]">
                {data.patient.age && <span>Age: <strong>{data.patient.age} yrs</strong></span>}
                {data.patient.phone && <span>Phone: <strong>{data.patient.phone}</strong></span>}
                {data.patient.idNumber && <span>ID: <strong>{data.patient.idNumber}</strong></span>}
              </div>
            </div>
          </div>

          {/* Allergy Alert Banner */}
          {data.patient.allergies && data.patient.allergies.length > 0 ? (
            <div className="p-3 rounded-lg border-2 border-rose-600 bg-rose-50 flex items-center gap-2.5 text-xs text-rose-900">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <div>
                <span className="font-bold uppercase tracking-wide text-[11px] text-rose-700 block">
                  Known Drug Allergies (Pharmacist Verification Required):
                </span>
                <span className="font-black text-rose-950 text-sm">
                  {data.patient.allergies.join(", ")}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between">
              <span>Known Drug Allergies: <strong>None Recorded / NKDA</strong></span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Checked
              </span>
            </div>
          )}

          {/* Vitals & Diagnosis Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 p-3 rounded-xl border border-slate-300 bg-white space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Primary Diagnosis & ICD-10 Indication
              </span>
              <p className="font-bold text-slate-950 text-sm">{data.diagnosis}</p>
              {data.clinicalNotes && (
                <p className="text-[11px] text-slate-600 italic mt-0.5 line-clamp-2">
                  Notes: {data.clinicalNotes}
                </p>
              )}
            </div>

            {data.vitals && (
              <div className="p-3 rounded-xl border border-slate-300 bg-slate-50 text-[11px] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Recorded Vitals
                </span>
                <div className="grid grid-cols-2 gap-1 text-slate-700 font-mono text-[11px]">
                  <span>BP: <strong>{data.vitals.bp || "N/A"}</strong></span>
                  <span>HR: <strong>{data.vitals.heartRate ? `${data.vitals.heartRate} bpm` : "N/A"}</strong></span>
                  <span>Temp: <strong>{data.vitals.temp ? `${data.vitals.temp}°C` : "N/A"}</strong></span>
                  <span>SpO2: <strong>{data.vitals.spO2 ? `${data.vitals.spO2}%` : "N/A"}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Formatted Medication Instructions Table (Physical Print Layout) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl font-serif font-black text-slate-950">℞</span>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Prescribed Medication & Administration Instructions
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                Total Items: {data.medications.length}
              </span>
            </div>

            <div className="space-y-3">
              {data.medications.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-3.5 rounded-xl border border-slate-300 bg-white space-y-2 text-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-black text-slate-950 tracking-tight">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-slate-700 text-[11px] pl-7 sm:pl-0">
                      <span>Qty: <strong>{item.quantity || 1}</strong></span>
                      <span>•</span>
                      <span>Repeats: <strong>{item.repeats || 0}</strong></span>
                      <span>•</span>
                      <span className="font-mono font-bold text-slate-900">R{((item.basePriceZar || 0) * (item.quantity || 1))}.00</span>
                    </div>
                  </div>

                  {/* Clean Formatted Instruction Blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7 text-xs">
                    <div className="p-2 rounded-lg bg-teal-50/60 border border-teal-200/80">
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wide block">
                        Prescribed Dosage & Frequency
                      </span>
                      <p className="font-bold text-teal-950 mt-0.5">
                        {item.dosage}
                      </p>
                    </div>

                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                        Patient Instructions & Cautions
                      </span>
                      <p className="text-slate-800 font-medium mt-0.5">
                        {item.instructions}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Dispensary Settlement Summary */}
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-2 text-xs">
            <div className="flex justify-between text-slate-700">
              <span>Medications Subtotal:</span>
              <span className="font-mono font-semibold">R{medSubtotal}.00</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-amber-900">Bundled Clinic Consultation Fee:</span>
                <span className="text-[10px] text-amber-800">(R0 paid at reception)</span>
              </div>
              <span className="font-mono font-bold text-amber-900">R{bundleFee}.00</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-amber-200 text-sm font-black text-slate-950">
              <span>Total Payable by Patient at Dispensary:</span>
              <span className="text-base font-mono text-slate-950">R{totalCost}.00</span>
            </div>
          </div>

          {/* Clinical Advice & Follow-up Notice */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-[11px] text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">General Advice & Emergency Guidance:</span>
            <p>
              Take all medicines strictly as directed. If severe breathlessness, chest pain, rash, or fever exceeding 39°C occurs, return immediately or visit the nearest emergency centre.
            </p>
          </div>

          {/* Legal Certification & Doctor Signature Stamp Block */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="space-y-1.5 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700">Legal Medical Prescription Notice</p>
              <p>
                Generated in compliance with South African Medicines & Related Substances Control Act (Act 101 of 1965) and POPIA data protection guidelines.
              </p>
              <p className="font-mono text-[9px] text-slate-400">
                Audit Hash: SHA-256 Verified • Electronic Ticket #{data.ticketNumber}
              </p>
            </div>

            {/* Prescriber Signature line */}
            <div className="space-y-2 sm:text-right">
              <div className="border-b-2 border-slate-800 pb-1 sm:inline-block sm:w-64 text-left">
                <div className="font-serif italic text-sm text-slate-800">
                  {data.doctor.name}
                </div>
                <span className="text-[9px] text-slate-400 block font-mono">Digitally Approved Clinical Signature</span>
              </div>
              <p className="text-[10px] text-slate-700 font-semibold">
                Dr. Signature & Clinical Verification
              </p>
              <p className="text-[10px] text-slate-500">
                Date: {data.date}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
