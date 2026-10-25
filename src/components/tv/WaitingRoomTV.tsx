import React, { useState, useEffect } from "react";
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Clock, 
  HeartPulse, 
  CheckCircle2, 
  Building2, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";

export const WaitingRoomTV: React.FC = () => {
  const { state } = useClinic();
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-ZA"));
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-ZA"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nowServingItems = state?.queue.filter(q => q.status === "in_consultation") || [];
  const upNextItems = state?.queue.filter(q => q.status === "checked_in") || [];
  const readyPharmacyItems = state?.queue.filter(q => q.status === "pharmacy_ready") || [];

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch (e) {
      console.log("Audio play error", e);
    }
  };

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8 min-h-[600px] flex flex-col justify-between">
      {/* Top TV Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-900/50">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">{state?.clinicName || "Q-Less Healthcare Clinic"}</h2>
            <p className="text-xs text-teal-400 font-semibold tracking-wide uppercase">
              Live Waiting Lounge Display Board
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              playChime();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>{audioEnabled ? "Calling Chime Active" : "Enable Sound Chime"}</span>
          </button>

          <div className="text-right">
            <span className="font-mono text-2xl sm:text-3xl font-black text-white">{time}</span>
            <span className="text-xs text-slate-400 block font-medium">Johannesburg (SAST)</span>
          </div>
        </div>
      </div>

      {/* Main Board: Now Serving Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* NOW CALLING */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest font-black text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              NOW IN CONSULTATION ROOMS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {nowServingItems.length} Active
            </span>
          </div>

          <div className="space-y-3">
            {nowServingItems.length > 0 ? (
              nowServingItems.map((item) => (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/80 to-slate-900 border-2 border-teal-500/80 shadow-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs uppercase tracking-wider text-teal-300 font-bold block">
                      Ticket Number
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {item.ticketNumber}
                    </span>
                    <span className="text-sm text-slate-300 block font-medium mt-1">
                      {item.patientName}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider text-teal-300 font-bold block">
                      Proceed To:
                    </span>
                    <span className="text-xl sm:text-2xl font-black text-teal-400">
                      {item.roomNumber || "Consultation Room 1"}
                    </span>
                    <span className="text-xs text-slate-400 block mt-0.5">
                      {item.doctorAssignedName}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400 text-sm">
                No patient currently called into consultation. Next ticket calling shortly.
              </div>
            )}
          </div>
        </div>

        {/* UP NEXT & PHARMACY COLLECTION */}
        <div className="space-y-6">
          {/* UP NEXT */}
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest font-black text-amber-400 block">
              UP NEXT IN LOBBY QUEUE
            </span>
            <div className="space-y-2">
              {upNextItems.length > 0 ? (
                upNextItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="font-mono text-xl font-bold text-white">{item.ticketNumber}</span>
                        <span className="text-xs text-slate-400 block">{item.patientName}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-amber-400 font-bold">~{item.estimatedWaitMinutes} mins</span>
                      <span className="text-[11px] text-slate-500 block">{item.doctorAssignedName}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 text-center text-slate-500 text-xs">
                  No patients waiting in queue.
                </div>
              )}
            </div>
          </div>

          {/* READY AT DISPENSARY */}
          {readyPharmacyItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs uppercase tracking-widest font-black text-teal-400 block">
                READY FOR MEDICATION PICKUP (DISPENSARY)
              </span>
              <div className="flex flex-wrap gap-2">
                {readyPharmacyItems.map((item) => (
                  <span
                    key={item.id}
                    className="px-3 py-1.5 rounded-lg bg-teal-950 border border-teal-800 text-teal-200 text-xs font-bold font-mono flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    {item.ticketNumber} ({item.patientName.split(" ")[0]})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Ticker / Clinic Notice */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-teal-400 font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Transparent Healthcare Pricing:</span>
          <span className="text-slate-300 font-normal">
            No upfront booking charge. R50 per-appointment fee bundled into prescribed medication at dispensary checkout.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>AES-256 Encrypted POPIA Compliance</span>
        </div>
      </div>
    </div>
  );
};
