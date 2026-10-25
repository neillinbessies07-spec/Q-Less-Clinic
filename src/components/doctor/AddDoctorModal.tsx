import React, { useState } from "react";
import { 
  X, 
  UserPlus, 
  Stethoscope, 
  Building2, 
  GraduationCap, 
  Check, 
  Sparkles,
  Award
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";

interface AddDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (doctorId: string) => void;
}

const SPECIALTY_PRESETS = [
  "General Practice & Family Medicine",
  "Paediatrics & Child Health",
  "Chronic Disease & Diabetic Care",
  "Women's Health & Prenatal Care",
  "Urgent Care & Minor Procedures",
  "Internal Medicine & Hypertension",
  "Immunisations & Rapid Triage"
];

const QUICK_TEMPLATES = [
  {
    name: "Dr. Kagiso Molefe",
    title: "MBChB (Wits), FCFP (SA)",
    specialty: "Paediatrics & Child Health",
    room: "Consultation Room 3"
  },
  {
    name: "Dr. Anelisa Jacobs",
    title: "MBChB (UCT), Dip Obst",
    specialty: "Women's Health & Prenatal Care",
    room: "Consultation Room 4"
  },
  {
    name: "Dr. Hendrik Van Zyl",
    title: "MBChB (Pretoria), MMed (Int Med)",
    specialty: "Internal Medicine & Hypertension",
    room: "Consultation Room 3"
  },
  {
    name: "Sister Zola Mthembu",
    title: "BCur, Clinical Nurse Practitioner (CNP)",
    specialty: "Immunisations & Rapid Triage",
    room: "Triage Station 2"
  }
];

export const AddDoctorModal: React.FC<AddDoctorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { state, addDoctor } = useClinic();

  // Auto-calculate next room number suggestion
  const existingRooms = state?.doctors.map(d => d.room) || [];
  const nextRoomNum = (state?.doctors.length || 2) + 1;
  const defaultRoomSuggestion = `Consultation Room ${nextRoomNum}`;

  const [name, setName] = useState("");
  const [title, setTitle] = useState("MBChB (SA)");
  const [specialty, setSpecialty] = useState("General Practice & Family Medicine");
  const [room, setRoom] = useState(defaultRoomSuggestion);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: typeof QUICK_TEMPLATES[0]) => {
    setName(tmpl.name);
    setTitle(tmpl.title);
    setSpecialty(tmpl.specialty);
    // Don't collide if room already taken
    if (existingRooms.includes(tmpl.room)) {
      setRoom(defaultRoomSuggestion);
    } else {
      setRoom(tmpl.room);
    }
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Please enter the clinician's full name.");
      return;
    }

    if (!room.trim()) {
      setFormError("Please assign a consultation room.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addDoctor({
        name: name.trim(),
        title: title.trim() || "MBChB",
        specialty: specialty.trim() || "General Practice",
        room: room.trim()
      });

      if (res.success && res.doctor) {
        if (onSuccess) {
          onSuccess(res.doctor.id);
        }
        onClose();
      } else {
        setFormError(res.error || "Failed to add clinician to roster.");
      }
    } catch (err: any) {
      setFormError(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-doctor-modal-title"
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-teal-700 via-teal-800 to-emerald-800 text-white flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-inner">
              <UserPlus className="w-6 h-6 text-teal-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="add-doctor-modal-title" className="text-lg font-bold">Appoint New Clinician</h2>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold tracking-wide uppercase">
                  Roster Expansion
                </span>
              </div>
              <p className="text-xs text-teal-100/90 mt-0.5">
                Register an appointed doctor or nurse practitioner to open additional consultation rooms.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Bar */}
        <div className="px-6 pt-5 pb-3 bg-slate-50/80 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              Quick Onboarding Templates
            </span>
            <span className="text-[11px] text-slate-400">Click to autofill</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {QUICK_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                className="text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-teal-400 hover:bg-teal-50/40 transition-all text-xs cursor-pointer group"
              >
                <div className="font-bold text-slate-900 group-hover:text-teal-700 flex items-center justify-between">
                  <span>{tmpl.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-800 font-semibold">
                    {tmpl.room}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {tmpl.specialty}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {formError}
            </div>
          )}

          {/* Clinician Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                Full Name & Title <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] text-slate-400 font-normal">"Dr." will be prefixed automatically</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Kagiso Molefe or Nomvula Sithole"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Professional Qualifications */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                Qualifications / Degree
              </label>
              <input
                type="text"
                placeholder="e.g. MBChB (Wits), FCFP"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

            {/* Room Assignment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                Consultation Room / Ward <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Consultation Room 3"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Clinical Specialty */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-teal-600" />
              Clinical Specialty & Focus
            </label>
            <input
              type="text"
              placeholder="e.g. Paediatrics & Child Health"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-600 focus:bg-white transition-all mb-2"
            />
            {/* Quick specialty chips */}
            <div className="flex flex-wrap gap-1.5">
              {SPECIALTY_PRESETS.map((spec) => (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSpecialty(spec)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    specialty === spec
                      ? "bg-teal-700 text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Notice box */}
          <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-start gap-2.5 text-xs text-teal-900">
            <Check className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Immediate Live Availability</span>
              <p className="text-[11px] text-teal-800/90 mt-0.5">
                Once appointed, the doctor will appear instantly in the Doctor Dashboard selector, Reception triage dispatch, and Patient booking portal.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-900/10 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Appointing Doctor...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Appoint & Add Doctor</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
