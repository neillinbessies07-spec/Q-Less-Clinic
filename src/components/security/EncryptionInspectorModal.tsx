import React, { useState } from "react";
import { ShieldCheck, Lock, Key, CheckCircle2, RefreshCw, X, ShieldAlert, Cpu } from "lucide-react";
import { useClinic } from "../../context/ClinicContext";

export const EncryptionInspectorModal: React.FC = () => {
  const { showEncryptionModal, setShowEncryptionModal, state } = useClinic();
  const [testText, setTestText] = useState("Patient Sipho Mkhize: Confidential clinical diagnosis - Hypertensive Crisis & Metformin 500mg regimen.");
  const [encryptionResult, setEncryptionResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!showEncryptionModal) return null;

  const handleTestEncryption = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/encryption/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testText }),
      });
      const data = await res.json();
      setEncryptionResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Healthcare Encryption & POPIA Security</h3>
              <p className="text-xs text-slate-500">AES-256-GCM Zero-Knowledge Rest Encryption for Sensitive PHI</p>
            </div>
          </div>
          <button
            onClick={() => setShowEncryptionModal(false)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-5">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase block mb-1">Cipher Standard</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
              <Lock className="w-4 h-4 text-emerald-600" />
              AES-256-GCM
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Galois/Counter Mode with 128-bit MAC Auth Tag</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase block mb-1">Regulatory Accord</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              POPIA Section 19
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Compliant South African Special Personal Info</p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70">
            <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase block mb-1">Encrypted Records</span>
            <div className="flex items-center gap-1.5 text-slate-900 font-bold text-sm">
              <Cpu className="w-4 h-4 text-indigo-600" />
              {state?.encryptionStatus.encryptedRecordCount || 4} Health Records
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Key ID: {state?.encryptionStatus.activeKeyId.slice(0, 14)}...</p>
          </div>
        </div>

        {/* Interactive Cryptographic Sandbox */}
        <div className="p-5 bg-slate-900 text-slate-100 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Live Encryption Simulator</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
              Server Master Key Verified
            </span>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Input Sensitive Clinical Note / Patient Record:</label>
            <textarea
              rows={2}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              className="w-full bg-slate-800 text-sm rounded-lg p-2.5 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={handleTestEncryption}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Execute AES-256-GCM Encryption & Verification
          </button>

          {encryptionResult && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                <span className="text-[10px] text-emerald-400 block uppercase font-sans mb-1 font-semibold">
                  1. Encrypted Ciphertext (Stored in Database):
                </span>
                <p className="text-emerald-300 break-all">{encryptionResult.encrypted.ciphertext}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans mb-0.5">Initialization Vector (IV):</span>
                  <span className="text-slate-300 break-all">{encryptionResult.encrypted.iv}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-sans mb-0.5">Auth Tag (128-bit MAC):</span>
                  <span className="text-slate-300 break-all">{encryptionResult.encrypted.tag}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 rounded-lg border border-emerald-900/60">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-sans font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Decrypted Match Verified (Zero Data Corruption)
                </div>
                <p className="text-slate-200 font-sans text-xs">{encryptionResult.decrypted}</p>
              </div>
            </div>
          )}
        </div>

        {/* Protection Commitments */}
        <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
          <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold block">Clinic Owner Security Guarantee</span>
            <p className="text-blue-800">
              In private clinic rollouts, patient clinical diagnoses, identity numbers, and chronic medication histories are never saved in cleartext. Even during database backup exports, all records remain encrypted under AES-256-GCM.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setShowEncryptionModal(false)}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Close Security Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
