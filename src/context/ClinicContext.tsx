import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ClinicState, QueueItem, PatientRecord, Doctor, Prescription, ClinicEmail } from "../types";

interface ClinicContextType {
  state: ClinicState | null;
  loading: boolean;
  error: string | null;
  activeRole: "patient" | "doctor" | "reception" | "queue" | "ai_assistant" | "tv_display";
  setActiveRole: (role: "patient" | "doctor" | "reception" | "queue" | "ai_assistant" | "tv_display") => void;
  rolloutMode: "mobile" | "desktop";
  setRolloutMode: (mode: "mobile" | "desktop") => void;
  selectedDoctorId: string;
  setSelectedDoctorId: (id: string) => void;
  refreshClinicState: () => Promise<void>;
  bookAppointment: (data: {
    fullName: string;
    phone: string;
    idNumber?: string;
    reasonForVisit: string;
    doctorId: string;
    priority?: string;
    isWalkIn?: boolean;
    allergies?: string[];
    chronicConditions?: string[];
  }) => Promise<{ success: boolean; ticket?: QueueItem; message?: string }>;
  checkInPatient: (ticketId: string, vitals?: any) => Promise<boolean>;
  updateTriage: (ticketId: string, priority: string, doctorAssignedId?: string) => Promise<boolean>;
  callPatientToRoom: (ticketId: string, doctorId: string, roomNumber?: string) => Promise<boolean>;
  completeConsultation: (data: {
    queueItemId: string;
    doctorId: string;
    diagnosis: string;
    clinicalNotes: string;
    medications: any[];
  }) => Promise<Prescription | null>;
  dispenseAndSettle: (prescriptionId: string) => Promise<boolean>;
  sendEmail: (email: { to: string; patientName: string; subject: string; body: string; type?: string }) => Promise<boolean>;
  addDoctor: (data: {
    name: string;
    title?: string;
    specialty?: string;
    room: string;
    avatarUrl?: string;
  }) => Promise<{ success: boolean; doctor?: Doctor; error?: string }>;
  qrCheckIn: (data: { qrData?: string; ticketId?: string; ticketNumber?: string }) => Promise<{
    success: boolean;
    item?: QueueItem;
    message?: string;
    alreadyArrived?: boolean;
    error?: string;
  }>;
  activePatientTicket: QueueItem | null;
  setActivePatientTicket: (ticket: QueueItem | null) => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  selectPatient: (patientId: string) => void;
  showEncryptionModal: boolean;
  setShowEncryptionModal: (show: boolean) => void;
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ClinicState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRole, setActiveRole] = useState<"patient" | "doctor" | "reception" | "queue" | "ai_assistant" | "tv_display">("patient");
  const [rolloutMode, setRolloutMode] = useState<"mobile" | "desktop">("desktop");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("doc-1");
  const [activePatientTicket, setActivePatientTicket] = useState<QueueItem | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const selectPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
    if (!state) return;
    const ticket = state.queue.find((q) => q.patientId === patientId);
    setActivePatientTicket(ticket || null);
  }, [state]);

  const handleSetActivePatientTicket = useCallback((ticket: QueueItem | null) => {
    setActivePatientTicket(ticket);
    if (ticket?.patientId) {
      setSelectedPatientId(ticket.patientId);
    }
  }, []);

  const refreshClinicState = useCallback(async () => {
    try {
      const res = await fetch("/api/clinic/state");
      if (!res.ok) throw new Error("Failed to fetch clinic state");
      const data: ClinicState = await res.json();
      setState(data);
      setError(null);

      // Keep patient and ticket synchronization
      if (selectedPatientId) {
        const ticket = data.queue.find((q) => q.patientId === selectedPatientId);
        if (ticket) {
          setActivePatientTicket(ticket);
        } else if (activePatientTicket) {
          const updated = data.queue.find((q) => q.id === activePatientTicket.id || q.ticketNumber === activePatientTicket.ticketNumber);
          if (updated && updated.patientId === selectedPatientId) {
            setActivePatientTicket(updated);
          } else if (!updated) {
            setActivePatientTicket(null);
          }
        }
      } else if (activePatientTicket) {
        const updated = data.queue.find((q) => q.id === activePatientTicket.id || q.ticketNumber === activePatientTicket.ticketNumber);
        if (updated) {
          setActivePatientTicket(updated);
          setSelectedPatientId(updated.patientId);
        }
      } else if (data.queue.length > 0) {
        // Default to first active queue patient
        const currentActive = data.queue.find(q => q.status === "in_consultation" || q.status === "checked_in") || data.queue[0];
        setActivePatientTicket(currentActive);
        setSelectedPatientId(currentActive.patientId);
      } else if (data.patients.length > 0) {
        setSelectedPatientId(data.patients[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load clinic state");
    } finally {
      setLoading(false);
    }
  }, [activePatientTicket, selectedPatientId]);

  useEffect(() => {
    refreshClinicState();
    // Auto-poll state every 12 seconds
    const interval = setInterval(refreshClinicState, 12000);
    return () => clearInterval(interval);
  }, [refreshClinicState]);

  const bookAppointment = async (data: any) => {
    try {
      const res = await fetch("/api/queue/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Booking failed");
      await refreshClinicState();
      setActivePatientTicket(result.ticket);
      showToast(`Ticket #${result.ticket.ticketNumber} registered! (R0 paid now, R50 bundled into medication)`);
      return { success: true, ticket: result.ticket };
    } catch (err: any) {
      showToast(err.message || "Booking failed");
      return { success: false, message: err.message };
    }
  };

  const checkInPatient = async (ticketId: string, vitals?: any) => {
    try {
      const res = await fetch("/api/queue/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, vitals }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Check-in failed");
      await refreshClinicState();
      showToast(`Patient checked in. Placed in live doctor queue.`);
      return true;
    } catch (err: any) {
      showToast(err.message);
      return false;
    }
  };

  const updateTriage = async (ticketId: string, priority: string, doctorAssignedId?: string) => {
    try {
      const res = await fetch("/api/queue/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, priority, doctorAssignedId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Triage update failed");
      await refreshClinicState();
      showToast(`Triage status updated to ${priority.toUpperCase()}!`);
      return true;
    } catch (err: any) {
      showToast(err.message);
      return false;
    }
  };

  const callPatientToRoom = async (ticketId: string, doctorId: string, roomNumber?: string) => {
    try {
      const res = await fetch("/api/queue/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, doctorId, roomNumber }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Call failed");
      await refreshClinicState();
      showToast(`Patient called to ${roomNumber || 'Consultation Room'}!`);
      return true;
    } catch (err: any) {
      showToast(err.message);
      return false;
    }
  };

  const completeConsultation = async (data: any) => {
    try {
      const res = await fetch("/api/doctor/consultation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to complete consultation");
      await refreshClinicState();
      showToast(`Consultation saved! Prescriptions sent to dispensary with bundled R50 fee.`);
      return result.prescription;
    } catch (err: any) {
      showToast(err.message);
      return null;
    }
  };

  const dispenseAndSettle = async (prescriptionId: string) => {
    try {
      const res = await fetch("/api/pharmacy/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Dispensing failed");
      await refreshClinicState();
      showToast(`Medication dispensed & payment settled! R50 booking fee recorded.`);
      return true;
    } catch (err: any) {
      showToast(err.message);
      return false;
    }
  };

  const sendEmail = async (email: any) => {
    try {
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email),
      });
      const result = await res.json();
      if (!res.ok) throw new Error("Failed to send email");
      await refreshClinicState();
      showToast(`Email dispatched to ${email.to}`);
      return true;
    } catch (err: any) {
      showToast(err.message);
      return false;
    }
  };

  const addDoctor = async (doctorData: {
    name: string;
    title?: string;
    specialty?: string;
    room: string;
    avatarUrl?: string;
  }) => {
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctorData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to add doctor");
      await refreshClinicState();
      if (result.doctor?.id) {
        setSelectedDoctorId(result.doctor.id);
      }
      showToast(`${result.doctor.name} added to clinic roster (${result.doctor.room})!`);
      return { success: true, doctor: result.doctor };
    } catch (err: any) {
      showToast(err.message || "Failed to add doctor");
      return { success: false, error: err.message };
    }
  };

  const qrCheckIn = async (data: { qrData?: string; ticketId?: string; ticketNumber?: string }) => {
    try {
      const res = await fetch("/api/queue/qr-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "QR check-in failed");
      await refreshClinicState();
      if (result.item) {
        setActivePatientTicket(result.item);
      }
      showToast(result.message || "Entrance Check-in Verified! Status: Arrived");
      return result;
    } catch (err: any) {
      showToast(err.message || "QR Check-in failed");
      return { success: false, error: err.message };
    }
  };

  return (
    <ClinicContext.Provider
      value={{
        state,
        loading,
        error,
        activeRole,
        setActiveRole,
        rolloutMode,
        setRolloutMode,
        selectedDoctorId,
        setSelectedDoctorId,
        refreshClinicState,
        bookAppointment,
        checkInPatient,
        updateTriage,
        callPatientToRoom,
        completeConsultation,
        dispenseAndSettle,
        sendEmail,
        addDoctor,
        qrCheckIn,
        activePatientTicket,
        setActivePatientTicket: handleSetActivePatientTicket,
        selectedPatientId,
        setSelectedPatientId,
        selectPatient,
        showEncryptionModal,
        setShowEncryptionModal,
        toastMessage,
        setToastMessage: showToast,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error("useClinic must be used within a ClinicProvider");
  }
  return context;
};
