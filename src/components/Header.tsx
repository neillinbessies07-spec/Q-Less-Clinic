import React from "react";
import { 
  HeartPulse, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  Clock, 
  User, 
  Stethoscope, 
  Building2, 
  Sparkles, 
  Tv
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";

export const Header: React.FC = () => {
  const { 
    activeRole, 
    setActiveRole, 
    rolloutMode, 
    setRolloutMode, 
    setShowEncryptionModal,
    state 
  } = useClinic();

  const navItems = [
    { id: "patient", label: "Patient Portal", icon: User, badge: "Mobile First" },
    { id: "doctor", label: "Doctor Dashboard", icon: Stethoscope, badge: "Consult & Rx" },
    { id: "reception", label: "Reception & Admin", icon: Building2, badge: "Desk & Intake" },
    { id: "queue", label: "Clinic Queue", icon: Clock, badge: `${state?.metrics.currentlyWaiting || 0} Waiting` },
    { id: "ai_assistant", label: "Aiva AI Assistant", icon: Sparkles, badge: "Emails & Files" },
    { id: "tv_display", label: "Waiting Room TV", icon: Tv, badge: "Live Board" },
  ] as const;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Banner / Clinic Branding & Rollout Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-700/20">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Q-Less Clinic</h1>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/80">
                Private Rollout
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {state?.clinicName || "Smart Private Healthcare Queue & Triage"} • Parkview Medical Centre
            </p>
          </div>
        </div>

        {/* Right Action Tools: Rollout mode, Wait time, Encryption badge */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Queue Speed Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold">Avg Wait: {state?.metrics.avgWaitTimeMinutes || 11} min</span>
            <span className="text-[10px] text-emerald-600 font-normal">(-4.2h vs hospital OPD)</span>
          </div>

          {/* R50 Bundled Notice */}
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200 font-medium">
            <span>R50 Booking:</span>
            <span className="text-amber-700 font-semibold">Bundled into Medication</span>
          </div>

          {/* AES-256 Encryption Status Inspector Trigger */}
          <button
            onClick={() => setShowEncryptionModal(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors cursor-pointer"
            title="Inspect AES-256 POPIA Encryption"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AES-256 Encrypted</span>
          </button>

          {/* Device Rollout Switcher (Mobile vs Desktop) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setRolloutMode("mobile")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                rolloutMode === "mobile"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Mobile rollout preview for phone & nurse tablets"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile Rollout</span>
            </button>
            <button
              onClick={() => setRolloutMode("desktop")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
                rolloutMode === "desktop"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Desktop workstation layout for reception & doctor monitors"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none border-t border-slate-100">
        <nav className="flex items-center gap-1 sm:gap-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeRole === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveRole(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-teal-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-500"}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isActive
                        ? "bg-teal-700/60 text-teal-100"
                        : "bg-slate-200/80 text-slate-600"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
