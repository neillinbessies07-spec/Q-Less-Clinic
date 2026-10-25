import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { 
  QrCode, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Stethoscope, 
  Scan, 
  Sparkles, 
  Download, 
  Printer, 
  Copy, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Maximize2,
  RefreshCw,
  Building2,
  Volume2
} from "lucide-react";
import type { QueueItem } from "../../types";
import { useClinic } from "../../context/ClinicContext";

interface PatientCheckInPassProps {
  ticket: QueueItem;
  onArrived?: () => void;
  compact?: boolean;
}

export const PatientCheckInPass: React.FC<PatientCheckInPassProps> = ({
  ticket,
  onArrived,
  compact = false
}) => {
  const { qrCheckIn, state } = useClinic();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanStep, setScanStep] = useState<"idle" | "scanning" | "verified">("idle");
  const [copied, setCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const passRef = useRef<HTMLDivElement>(null);

  // Generate QR payload
  const qrPayload = JSON.stringify({
    type: "QLESS_CLINIC_CHECKIN",
    ticketId: ticket.id,
    ticketNumber: ticket.ticketNumber,
    patientName: ticket.patientName,
    patientPhone: ticket.patientPhone,
    clinic: state?.clinicName || "Q-Less Healthcare Clinic",
    issuedAt: ticket.bookedAt
  });

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(qrPayload, {
      width: 480,
      margin: 2,
      color: {
        dark: "#042f2e", // deep teal
        light: "#ffffff"
      },
      errorCorrectionLevel: "H"
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error("QR Code generation failed", err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrPayload]);

  const playEntranceChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
      osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5
      osc1.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.36); // C6

      osc2.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.36);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.1);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1.1);
      osc2.stop(audioCtx.currentTime + 1.1);
    } catch (e) {
      console.log("Audio play error", e);
    }
  };

  const handleSimulateScan = async () => {
    setIsSimulatingScan(true);
    setScanStep("scanning");

    // Realistic optical laser reading pause
    setTimeout(async () => {
      playEntranceChime();
      setScanStep("verified");

      const result = await qrCheckIn({
        qrData: qrPayload,
        ticketId: ticket.id,
        ticketNumber: ticket.ticketNumber
      });

      setTimeout(() => {
        setIsSimulatingScan(false);
        setScanStep("idle");
        if (onArrived) onArrived();
      }, 1600);
    }, 1200);
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(ticket.ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isArrived = ticket.status === "checked_in" || ticket.status === "called" || ticket.status === "in_consultation" || ticket.status === "pharmacy_ready" || ticket.status === "completed";

  if (compact) {
    return (
      <div className="bg-gradient-to-br from-teal-900 to-emerald-950 text-white rounded-3xl p-5 border border-teal-800 shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold tracking-wider uppercase border border-teal-500/30 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-teal-300" />
                Entrance QR Fast-Pass
              </span>
              {isArrived ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                  Status: Arrived
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30 animate-pulse">
                  Ready to Scan
                </span>
              )}
            </div>
            <h4 className="text-base font-bold text-white">Scan at Clinic Entrance</h4>
            <p className="text-xs text-teal-200/80 mt-0.5">
              {isArrived
                ? `Checked in as Arrived. Current wait ~${ticket.estimatedWaitMinutes} mins.`
                : "Scan upon walking through the clinic front doors to mark your arrival."}
            </p>
          </div>

          {/* Mini QR Thumbnail */}
          <div className="p-1.5 bg-white rounded-xl shrink-0 shadow-sm">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Check-in QR" className="w-14 h-14 object-contain rounded-lg" />
            ) : (
              <div className="w-14 h-14 bg-slate-100 flex items-center justify-center text-slate-400">
                <QrCode className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {!isArrived && (
          <div className="mt-4 pt-3 border-t border-teal-800/80 flex items-center justify-between gap-3">
            <span className="text-[11px] text-teal-300 font-medium">
              Simulate walking in?
            </span>
            <button
              type="button"
              onClick={handleSimulateScan}
              disabled={isSimulatingScan}
              className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-teal-950 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Simulate Entrance Scan</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Check-In Pass Container */}
      <div 
        ref={passRef}
        className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-xl mx-auto"
      >
        {/* Pass Top Banner */}
        <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-950 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-teal-200" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-widest font-bold text-teal-200 block">
                  {state?.clinicName || "Q-Less Healthcare Clinic"}
                </span>
                <span className="text-xs text-teal-100/80 font-medium">Entrance Fast-Pass & Arrival Gate</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isArrived ? (
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Status: Arrived
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold border border-amber-400/30 flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Ready to Scan
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2 relative z-10 border-t border-white/10">
            <div>
              <span className="text-xs text-teal-300 font-semibold block uppercase tracking-wider">Patient Name</span>
              <h3 className="text-xl font-black tracking-tight text-white mt-0.5">{ticket.patientName}</h3>
              <p className="text-xs text-teal-200/90 font-mono mt-0.5">{ticket.patientPhone}</p>
            </div>

            <div className="sm:text-right">
              <span className="text-xs text-teal-300 font-semibold block uppercase tracking-wider">Assigned Ticket</span>
              <div className="text-3xl font-black tracking-tight text-white font-mono">{ticket.ticketNumber}</div>
            </div>
          </div>
        </div>

        {/* Ticket Perforated Divider */}
        <div className="relative h-6 bg-slate-50 flex items-center justify-between px-2 overflow-hidden">
          <div className="w-5 h-5 -ml-4 rounded-full bg-slate-100 border-r border-slate-200" />
          <div className="w-full border-t-2 border-dashed border-slate-300 mx-3" />
          <div className="w-5 h-5 -mr-4 rounded-full bg-slate-100 border-l border-slate-200" />
        </div>

        {/* QR Code Presentation Area */}
        <div className="p-6 sm:p-8 bg-slate-50/70 text-center space-y-6">
          <div className="inline-block relative">
            {/* Scannable QR Frame with corner brackets */}
            <div className="p-4 bg-white rounded-3xl border-2 border-teal-600/30 shadow-lg relative max-w-[280px] mx-auto">
              {/* Corner Targeting Accents */}
              <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-teal-600 rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-teal-600 rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-teal-600 rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-teal-600 rounded-br-xl" />

              {/* Laser Scanning Animation when Simulating */}
              {isSimulatingScan && (
                <div className="absolute inset-x-4 top-4 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-bounce z-20" />
              )}

              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt={`QR Check-in Code for Ticket #${ticket.ticketNumber}`}
                  className="w-56 h-56 mx-auto object-contain rounded-2xl block" 
                />
              ) : (
                <div className="w-56 h-56 mx-auto flex items-center justify-center bg-slate-100 rounded-2xl">
                  <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
              )}

              {/* Status Watermark / Badge Overlay if Arrived */}
              {isArrived && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-2xs rounded-2xl flex flex-col items-center justify-center p-4 text-white z-10 animate-in fade-in duration-300">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-lg">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="text-base font-bold">Checked In / Arrived</span>
                  <span className="text-xs text-emerald-200 mt-0.5">
                    {ticket.checkedInAt ? new Date(ticket.checkedInAt).toLocaleTimeString("en-ZA") : "Entrance Verified"}
                  </span>
                  <span className="text-[11px] text-emerald-300 mt-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30">
                    Lounge Queue Active
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Instructions Box */}
          <div className="max-w-md mx-auto space-y-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <Scan className="w-4 h-4 text-teal-600" />
              <span>
                {isArrived ? "Arrival Registered at Clinic Doors" : "Scan at Clinic Entrance Optical Kiosk"}
              </span>
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isArrived ? (
                <>
                  Your status has been updated to <strong>'Arrived'</strong> in the live doctor queue. Please proceed to the comfortable waiting lounge. Your ticket <strong>#{ticket.ticketNumber}</strong> will be called by <strong>{ticket.doctorAssignedName || "the clinician"}</strong>.
                </>
              ) : (
                <>
                  Present this unique QR code in front of the scanner kiosk located at the entrance foyer. Your status will automatically change from <em>'Booked'</em> to <strong>'Arrived'</strong>, placing you in queue immediately.
                </>
              )}
            </p>
          </div>

          {/* Meta Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-left max-w-md mx-auto text-xs">
            <div className="p-3 rounded-2xl bg-white border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium block">Consultation Room</span>
              <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                {ticket.roomNumber || "Consultation Room 1"}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium block">Physician on Duty</span>
              <span className="font-bold text-slate-900 flex items-center gap-1 mt-0.5 truncate">
                <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                {ticket.doctorAssignedName || "Attending Physician"}
              </span>
            </div>
          </div>

          {/* Interactive Simulation / Test Scanner Button */}
          <div className="pt-2">
            {!isArrived ? (
              <button
                type="button"
                onClick={handleSimulateScan}
                disabled={isSimulatingScan}
                className="w-full max-w-md mx-auto py-3.5 px-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-teal-900/10 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                {isSimulatingScan ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Optical Kiosk Reading Pass...</span>
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    <span>Simulate Scanning at Clinic Entrance (Auto-Arrive)</span>
                  </>
                )}
              </button>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-md mx-auto flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold">Checked In & Ready for Triage</span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateScan}
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                >
                  Rescan Pass
                </button>
              </div>
            )}
          </div>

          {/* Pass Utility Actions */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-200/80">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>{copied ? "Copied Ticket!" : "Copy Ticket #"}</span>
            </button>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`Qless-Pass-${ticket.ticketNumber}.png`}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Save QR Image</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optical Scanner Simulation Modal */}
      {isSimulatingScan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 max-w-sm w-full p-6 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center mx-auto shadow-inner">
              {scanStep === "scanning" ? (
                <Scan className="w-8 h-8 animate-pulse text-teal-400" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              )}
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-teal-400 block mb-1">
                Clinic Entrance Optical Kiosk
              </span>
              <h3 className="text-lg font-bold">
                {scanStep === "scanning" ? "Scanning QR Code..." : "Arrival Verified!"}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {scanStep === "scanning" 
                  ? "Optical laser reading ticket token at clinic doors..."
                  : `Welcome, ${ticket.patientName}! Status set to 'Arrived' in queue.`}
              </p>
            </div>

            {/* Visual Laser Guide */}
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">TICKET:</span>
              <span className="text-teal-400 font-bold">#{ticket.ticketNumber}</span>
              <span className="text-slate-400">STATUS:</span>
              <span className={scanStep === "verified" ? "text-emerald-400 font-bold" : "text-amber-400"}>
                {scanStep === "verified" ? "ARRIVED" : "PROCESSING"}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Chime sounded • Overhead monitors updated</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
