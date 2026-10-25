import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClinicProvider, useClinic } from "./context/ClinicContext";
import { Header } from "./components/Header";
import { PatientPortal } from "./components/patient/PatientPortal";
import { DoctorDashboard } from "./components/doctor/DoctorDashboard";
import { ReceptionView } from "./components/reception/ReceptionView";
import { ClinicQueue } from "./components/queue/ClinicQueue";
import { AIAssistantView } from "./components/ai/AIAssistantView";
import { WaitingRoomTV } from "./components/tv/WaitingRoomTV";
import { EncryptionInspectorModal } from "./components/security/EncryptionInspectorModal";
import { 
  Wifi, 
  Battery, 
  Signal, 
  Smartphone, 
  Monitor, 
  ShieldCheck, 
  HeartHandshake, 
  AlertCircle 
} from "lucide-react";

const MainContent: React.FC = () => {
  const { activeRole, rolloutMode, setRolloutMode, toastMessage, setToastMessage, loading, error } = useClinic();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-teal-200 border-t-teal-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-600 tracking-wide">
          Connecting to Q-Less Clinic & AES-256 Vault...
        </p>
      </div>
    );
  }

  const renderActiveView = () => {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeRole}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full"
        >
          {(() => {
            switch (activeRole) {
              case "patient":
                return <PatientPortal />;
              case "doctor":
                return <DoctorDashboard />;
              case "reception":
                return <ReceptionView />;
              case "queue":
                return <ClinicQueue />;
              case "ai_assistant":
                return <AIAssistantView />;
              case "tv_display":
                return <WaitingRoomTV />;
              default:
                return <PatientPortal />;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col">
      <Header />

      {/* Global Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs font-semibold flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs pl-2 border-l border-slate-700 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Container: Mobile Frame vs Desktop */}
      <main className="flex-1 py-6 px-4 sm:px-6">
        {rolloutMode === "mobile" ? (
          <div className="max-w-md mx-auto">
            {/* Mobile Device Frame Header */}
            <div className="bg-slate-900 text-white rounded-t-3xl p-3 px-6 flex items-center justify-between text-[11px] font-mono border-b border-slate-800 shadow-md">
              <span className="font-semibold text-slate-300">09:41</span>
              <div className="flex items-center gap-1 text-[10px] uppercase font-sans text-teal-400 font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile Rollout Preview</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400">
                <Signal className="w-3 h-3" />
                <Wifi className="w-3 h-3" />
                <Battery className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>

            {/* Mobile Viewport Body */}
            <div className="bg-slate-50 border-x border-b border-slate-300 rounded-b-3xl p-4 sm:p-5 shadow-2xl min-h-[750px]">
              {renderActiveView()}
            </div>

            {/* Mobile bottom switch tip */}
            <div className="text-center mt-3">
              <button
                onClick={() => setRolloutMode("desktop")}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Monitor className="w-3.5 h-3.5" />
                Switch to Full Desktop Clinic Workstation
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {renderActiveView()}
          </div>
        )}
      </main>

      {/* Clinic System Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-slate-700">Q-Less Healthcare</span>
            <span>•</span>
            <span>R50 Bundled Medication Model</span>
            <span>•</span>
            <span>Zero Upfront Booking Fee</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              AES-256-GCM Encrypted (POPIA Sec 19)
            </span>
            <span>•</span>
            <span>Free-Tier Serverless Deploy</span>
          </div>
        </div>
      </footer>

      {/* Cryptographic Inspector Modal */}
      <EncryptionInspectorModal />
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <MainContent />
    </ClinicProvider>
  );
}
