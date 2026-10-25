import React, { useState } from "react";
import { 
  Sparkles, 
  Mail, 
  Send, 
  FileText, 
  UserCheck, 
  ShieldCheck, 
  Bot, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  AlertCircle,
  HelpCircle,
  Inbox,
  PenSquare
} from "lucide-react";
import { useClinic } from "../../context/ClinicContext";
import type { ClinicEmail } from "../../types";

export const AIAssistantView: React.FC = () => {
  const { state, sendEmail, setShowEncryptionModal } = useClinic();
  const [activeSubTab, setActiveSubTab] = useState<"emails" | "chat" | "patient_files">("emails");

  // Email Automation State
  const [selectedEmail, setSelectedEmail] = useState<ClinicEmail | null>(state?.emails[0] || null);
  const [isDraftingEmail, setIsDraftingEmail] = useState(false);
  const [draftRecipient, setDraftRecipient] = useState("Leanne Van Der Merwe");
  const [draftType, setDraftType] = useState("appointment_prep");
  const [customInstructions, setCustomInstructions] = useState("Remind patient about bringing inhaler and explain the R50 fee bundled in medication.");
  const [generatedSubject, setGeneratedSubject] = useState("");
  const [generatedBody, setGeneratedBody] = useState("");
  const [isDrafting, setIsDrafting] = useState(false);

  // AI Chat Assistant State
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time: string }>>([
    {
      sender: "ai",
      text: "Hello! I am Aiva, your clinic AI operational assistant. I assist reception with email drafting, queue triage, and secure file insights—without replacing your essential front-desk hospitality.",
      time: "10:00"
    }
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // File analysis state
  const [selectedPatientId, setSelectedPatientId] = useState(state?.patients[0]?.id || "");
  const [patientQuery, setPatientQuery] = useState("Summarise chronic conditions and drug allergies");
  const [fileAnalysisResult, setFileAnalysisResult] = useState<string | null>(null);
  const [isFileAnalyzing, setIsFileAnalyzing] = useState(false);

  const handleGenerateEmailDraft = async () => {
    setIsDrafting(true);
    try {
      const res = await fetch("/api/ai/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientName: draftRecipient,
          emailType: draftType,
          customPrompt: customInstructions,
        }),
      });
      const data = await res.json();
      setGeneratedSubject(data.subject);
      setGeneratedBody(data.body);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendDraftedEmail = async () => {
    if (!generatedBody) return;
    await sendEmail({
      to: `${draftRecipient.toLowerCase().replace(/\s+/g, ".")}@client.co.za`,
      patientName: draftRecipient,
      subject: generatedSubject || "Clinic Communication",
      body: generatedBody,
      type: draftType as any,
    });
    setIsDraftingEmail(false);
    setGeneratedSubject("");
    setGeneratedBody("");
  };

  const handleSendChatMessage = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = { sender: "user" as const, text: textToSend, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!presetPrompt) setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend, contextRole: "reception" }),
      });
      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: "ai" as const, text: data.reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  const handleAnalyzePatientFile = async () => {
    setIsFileAnalyzing(true);
    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: patientQuery, contextRole: "reception", patientId: selectedPatientId }),
      });
      const data = await res.json();
      setFileAnalysisResult(data.reply);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFileAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Assistant Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-900 to-slate-900 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold">Aiva Personal Clinic AI Layer</h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                Staff Assistant • Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Automates patient emails, triages files, and assists doctors and reception without replacing human staff.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowEncryptionModal(true)}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold backdrop-blur-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>POPIA Encrypted File Access</span>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSubTab("emails")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSubTab === "emails"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Clinic Email Hub ({state?.emails.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("chat")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSubTab === "chat"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Reception & Doctor AI Chat</span>
        </button>

        <button
          onClick={() => setActiveSubTab("patient_files")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeSubTab === "patient_files"
              ? "bg-indigo-600 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Encrypted File Assistant</span>
        </button>
      </div>

      {/* SUB-TAB 1: CLINIC EMAIL AUTOMATION */}
      {activeSubTab === "emails" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Email List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Clinic Communications
              </span>
              <button
                onClick={() => setIsDraftingEmail(true)}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <PenSquare className="w-3.5 h-3.5" />
                Draft with AI
              </button>
            </div>

            <div className="space-y-2">
              {state?.emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => { setSelectedEmail(email); setIsDraftingEmail(false); }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    selectedEmail?.id === email.id && !isDraftingEmail
                      ? "bg-indigo-50/70 border-indigo-400 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {email.patientName || email.to}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(email.date).toLocaleDateString("en-ZA")}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{email.subject}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{email.snippet}</p>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[10px]">
                    <span className="capitalize text-slate-400">{email.type.replace("_", " ")}</span>
                    {email.isAiGenerated && (
                      <span className="text-indigo-600 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Drafted
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Reader / Draft Composer */}
          <div className="lg:col-span-2">
            {isDraftingEmail ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">Compose Automated Email with AI</h3>
                  </div>
                  <button
                    onClick={() => setIsDraftingEmail(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Patient Recipient</label>
                    <input
                      type="text"
                      value={draftRecipient}
                      onChange={(e) => setDraftRecipient(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Communication Goal</label>
                    <select
                      value={draftType}
                      onChange={(e) => setDraftType(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="appointment_confirmation">Booking Confirmation & Live Tracker Link</option>
                      <option value="pre_visit_prep">Pre-Visit Care (Fasting, Glucose Logs, Inhalers)</option>
                      <option value="chronic_refill">Chronic Medication Dispense Reminder</option>
                      <option value="reschedule">Polite Reschedule Notice</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Custom Clinic Instructions for AI</label>
                  <textarea
                    rows={2}
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g. Mention that R50 consultation booking fee is bundled into medication cost, and include live tracker."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <button
                  type="button"
                  disabled={isDrafting}
                  onClick={handleGenerateEmailDraft}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isDrafting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate AI Draft with Clinic Fee Context
                </button>

                {generatedBody && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Line (Editable)</label>
                      <input
                        type="text"
                        value={generatedSubject}
                        onChange={(e) => setGeneratedSubject(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Draft Body (Reception Human Review Required)
                      </label>
                      <textarea
                        rows={6}
                        value={generatedBody}
                        onChange={(e) => setGeneratedBody(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsDraftingEmail(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSendDraftedEmail}
                        className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Approve & Send Email to Patient
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedEmail ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block">{selectedEmail.id}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedEmail.subject}</h3>
                    <p className="text-xs text-slate-500">
                      To: {selectedEmail.to} ({selectedEmail.patientName}) • {new Date(selectedEmail.date).toLocaleString()}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    selectedEmail.status === "unread" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {selectedEmail.status.toUpperCase()}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
                  {selectedEmail.body}
                </div>

                {/* AI Suggested Response if Patient Inquiry */}
                {selectedEmail.aiSuggestedReply && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Aiva Suggested Reply (Human Approval Needed)</span>
                    </div>
                    <p className="text-xs text-indigo-900 whitespace-pre-line bg-white p-3 rounded-xl border border-indigo-100">
                      {selectedEmail.aiSuggestedReply}
                    </p>
                    <button
                      onClick={() => {
                        setDraftRecipient(selectedEmail.patientName || "Patient");
                        setGeneratedSubject(`Re: ${selectedEmail.subject}`);
                        setGeneratedBody(selectedEmail.aiSuggestedReply || "");
                        setIsDraftingEmail(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Open in Review Composer
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
                Select an email from the inbox to read.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: INTERACTIVE AI CHAT FOR RECEPTION & DOCTORS */}
      {activeSubTab === "chat" && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Clinic Operations & Triage Assistant</h3>
              <p className="text-xs text-slate-500">Ask Aiva about queue rebalancing, fee rules, or doctor capacity</p>
            </div>
            <span className="text-[11px] text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full font-semibold border border-teal-200">
              Assisting Reception
            </span>
          </div>

          {/* Quick Prompt Chips */}
          <div className="flex flex-wrap gap-1.5">
            {[
              "How should we explain the R50 fee bundled in medication to a caller?",
              "Recommend which room to dispatch next walk-in patient to",
              "Check current queue wait time against provincial hospitals",
              "How does AES-256 protect patient records under POPIA?"
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSendChatMessage(preset)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-900 text-slate-600 font-medium transition-colors cursor-pointer"
              >
                "{preset.substring(0, 35)}..."
              </button>
            ))}
          </div>

          {/* Chat Stream */}
          <div className="h-80 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-slate-900 text-white rounded-tr-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 shadow-xs rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                  <span className={`text-[10px] block mt-1.5 ${msg.sender === "user" ? "text-slate-400" : "text-slate-400"}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-400 p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                <span>Aiva is formulating response...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask Aiva a question about the queue, billing, or patient communications..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </form>
        </div>
      )}

      {/* SUB-TAB 3: ENCRYPTED PATIENT FILE INSIGHTS */}
      {activeSubTab === "patient_files" && (
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Secure Patient Record AI Lookup</h3>
              <p className="text-xs text-slate-500">Decrypts record with authorization and formats insights for clinicians</p>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
              AES-256 Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Select Patient File</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
              >
                {state?.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} (ID: {p.idNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Specific Query</label>
              <input
                type="text"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <button
            onClick={handleAnalyzePatientFile}
            disabled={isFileAnalyzing}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {isFileAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Analyze Encrypted File with Aiva
          </button>

          {fileAnalysisResult && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 space-y-2">
              <span className="font-bold text-indigo-950 block text-xs">Clinical File Summary:</span>
              <p className="whitespace-pre-line leading-relaxed">{fileAnalysisResult}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
