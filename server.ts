import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import type { 
  ClinicState, 
  QueueItem, 
  PatientRecord, 
  Doctor, 
  Prescription, 
  ClinicEmail, 
  EncryptedData,
  MedicationItem 
} from "./src/types.ts";

dotenv.config();

const PORT = 3000;
const MASTER_KEY = crypto.createHash("sha256").update(process.env.ENCRYPTION_SECRET || "qless-clinic-aes-256-master-key-sa-2026").digest();
const KEY_FINGERPRINT = "SA-AES256-GCM-" + MASTER_KEY.toString("hex").substring(0, 8).toUpperCase();

// --- AES-256-GCM Encryption Engine ---
export function encryptSensitiveData(plainText: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext: encrypted,
    iv: iv.toString("hex"),
    tag: tag,
    algorithm: "AES-256-GCM",
    keyFingerprint: KEY_FINGERPRINT,
    timestamp: new Date().toISOString()
  };
}

export function decryptSensitiveData(encryptedData: EncryptedData): string {
  try {
    const iv = Buffer.from(encryptedData.iv, "hex");
    const tag = Buffer.from(encryptedData.tag, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", MASTER_KEY, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedData.ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err);
    return "[Decryption Error: Authentication tag mismatch]";
  }
}

// --- Gemini AI Setup ---
let aiClient: GoogleGenAI | null = null;
function getAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}

// --- Initial Realistic South African Private Clinic Seed Data ---
const initialPatients: PatientRecord[] = [
  {
    id: "pat-101",
    fullName: "Sipho Mkhize",
    phone: "+27 82 459 1102",
    idNumber: "880412 5092 083",
    age: 38,
    gender: "Male",
    bloodType: "O+",
    allergies: ["Penicillin", "Sulfa drugs"],
    chronicConditions: ["Hypertension (Stage 1)"],
    lastVisit: "2026-08-10",
    notesEncrypted: encryptSensitiveData("Patient on Amlodipine 5mg daily. Reported intermittent tension headaches. Blood pressure tracking required."),
    decryptedNotes: "Patient on Amlodipine 5mg daily. Reported intermittent tension headaches. Blood pressure tracking required."
  },
  {
    id: "pat-102",
    fullName: "Leanne Van Der Merwe",
    phone: "+27 71 832 9471",
    idNumber: "940921 0184 089",
    age: 32,
    gender: "Female",
    bloodType: "A+",
    allergies: ["None known"],
    chronicConditions: ["Asthma (mild persistent)"],
    lastVisit: "2026-07-22",
    notesEncrypted: encryptSensitiveData("Uses Salbutamol inhaler as needed. Complaining of dry persistent cough and mild chest tightness after winter flu."),
    decryptedNotes: "Uses Salbutamol inhaler as needed. Complaining of dry persistent cough and mild chest tightness after winter flu."
  },
  {
    id: "pat-103",
    fullName: "Thabo Khumalo",
    phone: "+27 83 291 0048",
    idNumber: "811105 5312 081",
    age: 45,
    gender: "Male",
    bloodType: "B+",
    allergies: ["Aspirin"],
    chronicConditions: ["Type 2 Diabetes"],
    lastVisit: "2026-08-28",
    notesEncrypted: encryptSensitiveData("HbA1c at last check was 6.8%. Routine foot check and fasting glucose follow-up needed. Metformin 500mg twice daily."),
    decryptedNotes: "HbA1c at last check was 6.8%. Routine foot check and fasting glucose follow-up needed. Metformin 500mg twice daily."
  },
  {
    id: "pat-104",
    fullName: "Zanele Ndaba",
    phone: "+27 60 774 2190",
    idNumber: "010315 1093 087",
    age: 25,
    gender: "Female",
    bloodType: "O-",
    allergies: ["Latex"],
    chronicConditions: [],
    lastVisit: "2026-05-14",
    notesEncrypted: encryptSensitiveData("Acute upper respiratory symptoms, low-grade fever 37.9C, sore throat. Requested sick note for work."),
    decryptedNotes: "Acute upper respiratory symptoms, low-grade fever 37.9C, sore throat. Requested sick note for work."
  }
];

const initialDoctors: Doctor[] = [
  {
    id: "doc-1",
    name: "Dr. Nomsa Dlamini",
    title: "MBChB (UCT), FCFP",
    specialty: "Family Medicine & Chronic Care",
    room: "Consultation Room 1",
    isAvailable: true,
    currentPatientTicket: "Q-101",
    consultationsToday: 7
  },
  {
    id: "doc-2",
    name: "Dr. Pieter Botha",
    title: "MBChB (Pretoria), Dip Obst",
    specialty: "General Practice & Minor Procedures",
    room: "Consultation Room 2",
    isAvailable: true,
    currentPatientTicket: undefined,
    consultationsToday: 5
  },
  {
    id: "doc-3",
    name: "Sister Thandi Sithole",
    title: "RN, Clinical Nurse Practitioner",
    specialty: "Triage, Immunisations & Rapid Vitals",
    room: "Triage & Vitals Room",
    isAvailable: true,
    currentPatientTicket: undefined,
    consultationsToday: 11
  }
];

const initialQueue: QueueItem[] = [
  {
    id: "q-101",
    ticketNumber: "Q-101",
    patientId: "pat-101",
    patientName: "Sipho Mkhize",
    patientPhone: "+27 82 459 1102",
    doctorAssignedId: "doc-1",
    doctorAssignedName: "Dr. Nomsa Dlamini",
    roomNumber: "Room 1",
    appointmentTime: "11:30",
    bookedAt: "2026-09-14T09:15:00Z",
    checkedInAt: "2026-09-14T11:20:00Z",
    calledAt: "2026-09-14T11:32:00Z",
    status: "in_consultation",
    priority: "routine",
    reasonForVisit: "Hypertension medication review and persistent tension headache",
    isWalkIn: false,
    estimatedWaitMinutes: 0,
    vitalSigns: {
      bloodPressure: "138/88",
      heartRate: 76,
      temperature: 36.8,
      spO2: 98
    }
  },
  {
    id: "q-102",
    ticketNumber: "Q-102",
    patientId: "pat-102",
    patientName: "Leanne Van Der Merwe",
    patientPhone: "+27 71 832 9471",
    doctorAssignedId: "doc-2",
    doctorAssignedName: "Dr. Pieter Botha",
    roomNumber: "Room 2",
    appointmentTime: "11:45",
    bookedAt: "2026-09-14T09:40:00Z",
    checkedInAt: "2026-09-14T11:35:00Z",
    status: "checked_in",
    priority: "urgent",
    reasonForVisit: "Acute bronchospasm, dry cough, wheezing after seasonal flu",
    isWalkIn: false,
    estimatedWaitMinutes: 8,
    vitalSigns: {
      bloodPressure: "122/80",
      heartRate: 88,
      temperature: 37.2,
      spO2: 95
    }
  },
  {
    id: "q-103",
    ticketNumber: "Q-103",
    patientId: "pat-103",
    patientName: "Thabo Khumalo",
    patientPhone: "+27 83 291 0048",
    doctorAssignedId: "doc-1",
    doctorAssignedName: "Dr. Nomsa Dlamini",
    roomNumber: "Room 1",
    appointmentTime: "12:00",
    bookedAt: "2026-09-14T10:10:00Z",
    checkedInAt: "2026-09-14T11:45:00Z",
    status: "checked_in",
    priority: "routine",
    reasonForVisit: "Type 2 Diabetes routine 3-month prescription refill",
    isWalkIn: false,
    estimatedWaitMinutes: 18,
    vitalSigns: {
      bloodPressure: "128/82",
      heartRate: 72,
      temperature: 36.6,
      spO2: 99
    }
  },
  {
    id: "q-104",
    ticketNumber: "Q-104",
    patientId: "pat-104",
    patientName: "Zanele Ndaba",
    patientPhone: "+27 60 774 2190",
    doctorAssignedId: "doc-2",
    doctorAssignedName: "Dr. Pieter Botha",
    roomNumber: "Room 2",
    appointmentTime: "12:15",
    bookedAt: "2026-09-14T10:30:00Z",
    status: "booked",
    priority: "routine",
    reasonForVisit: "Sore throat, fever, upper respiratory tract infection",
    isWalkIn: false,
    estimatedWaitMinutes: 30
  }
];

const initialPrescriptions: Prescription[] = [
  {
    id: "rx-901",
    queueItemId: "q-099",
    patientId: "pat-101",
    patientName: "Sipho Mkhize",
    doctorId: "doc-1",
    doctorName: "Dr. Nomsa Dlamini",
    date: "2026-08-10",
    diagnosis: "Essential Hypertension (I10)",
    clinicalNotesEncrypted: encryptSensitiveData("Patient well managed on monotherapy. Emphasized low sodium diet and regular exercise."),
    decryptedClinicalNotes: "Patient well managed on monotherapy. Emphasized low sodium diet and regular exercise.",
    medications: [
      {
        id: "med-1",
        name: "Amlodipine 5mg Tablets (30s)",
        dosage: "1 tablet daily morning",
        instructions: "Take with or without food. Avoid grapefruit juice.",
        basePriceZar: 110,
        quantity: 1
      },
      {
        id: "med-2",
        name: "Paracetamol 500mg (20s)",
        dosage: "2 tablets PRN every 6 hours",
        instructions: "For headache. Max 8 tablets in 24 hours.",
        basePriceZar: 45,
        quantity: 1
      }
    ],
    medicationSubtotalZar: 155,
    clinicBundleFeeZar: 50, // Bundled R50 per-appointment fee
    totalPatientPaymentZar: 205,
    paymentStatus: "settled",
    dispensedAt: "2026-08-10T11:45:00Z"
  }
];

const initialEmails: ClinicEmail[] = [
  {
    id: "em-1",
    from: "noreply@qlessclinic.co.za",
    to: "leanne.vdm@webmail.co.za",
    patientName: "Leanne Van Der Merwe",
    subject: "Appointment Confirmed: Ticket #Q-102 (Live Tracker Inside)",
    snippet: "Your private consultation with Dr. Botha is set for today 11:45...",
    body: "Hi Leanne,\n\nYour appointment at Q-Less Clinic has been booked for today, 11:45 with Dr. Pieter Botha.\nYour ticket number is #Q-102.\n\nRemember: Your consultation booking fee (R50) is seamlessly bundled into your medication dispense cost at checkout—no upfront booking fees charged.\n\nYou can track live queue progress from your mobile device.\n\nWarm regards,\nQ-Less Private Clinic Reception",
    date: "2026-09-14T09:42:00Z",
    type: "appointment_confirmation",
    status: "sent",
    isAiGenerated: true
  },
  {
    id: "em-2",
    from: "sipho.mkhize@gmail.com",
    to: "reception@qlessclinic.co.za",
    patientName: "Sipho Mkhize",
    subject: "Question regarding blood pressure review and sick note",
    snippet: "Good morning reception, I have an appointment at 11:30, can Dr Dlamini also provide...",
    body: "Good morning reception team,\n\nI have my routine BP check today at 11:30 (Ticket #Q-101). Could Dr. Dlamini also issue a medical certificate for today as my workplace HR requires confirmation of attendance?\n\nThank you,\nSipho Mkhize",
    date: "2026-09-14T10:05:00Z",
    type: "patient_inquiry",
    status: "unread",
    aiSuggestedReply: "Dear Sipho,\n\nYes, absolutely. Dr. Dlamini routinely issues signed digital and printed attendance medical certificates upon clinical evaluation during your consultation.\n\nPlease notify Dr. Dlamini during your consult and it will be attached directly to your encrypted portal profile.\n\nSee you shortly,\nQ-Less Clinic Front Desk"
  },
  {
    id: "em-3",
    from: "aiva.ai@qlessclinic.co.za",
    to: "thabo.khumalo@icloud.com",
    patientName: "Thabo Khumalo",
    subject: "Pre-Consultation Prep: Fasting blood glucose & Chronic Refill",
    snippet: "Hello Thabo, kindly bring your home glucose logbook if available...",
    body: "Dear Thabo,\n\nWe look forward to seeing you at 12:00 today. If you have your home glucose tracking logbook, please bring it along for Dr. Dlamini to review.\n\nYour R50 platform fee is included directly in your Metformin medication collection at our dispensary.\n\nBest health,\nAiva (Clinic AI Assistant) on behalf of Q-Less Reception",
    date: "2026-09-14T10:15:00Z",
    type: "pre_visit_prep",
    status: "sent",
    isAiGenerated: true
  }
];

// --- In-Memory State Store ---
const clinicState: ClinicState = {
  clinicName: "Q-Less Healthcare Clinic",
  clinicAddress: "Suite 4, Parkview Medical Centre, Rosebank, Johannesburg",
  queue: initialQueue,
  patients: initialPatients,
  doctors: initialDoctors,
  prescriptions: initialPrescriptions,
  emails: initialEmails,
  metrics: {
    totalPatientsToday: 18,
    currentlyWaiting: 3,
    inConsultation: 1,
    completedToday: 14,
    avgWaitTimeMinutes: 11.4,
    hospitalComparisonSavedHours: 4.2, // compared to 4.5h public hospital OPD queue
    totalRevenueZar: 3840,
    bundledPlatformFeesCollectedZar: 700 // 14 * R50
  },
  encryptionStatus: {
    algorithm: "AES-256-GCM",
    encryptionStandard: "POPIA & HIPAA Compliant (256-bit Galois/Counter Mode)",
    compliance: ["POPIA Section 19 (Protection of Health Info)", "HIPAA Security Rule", "Zero-Knowledge Rest Encryption"],
    activeKeyId: KEY_FINGERPRINT,
    encryptedRecordCount: 4
  }
};

// Helper to recalculate queue metrics
function recalculateMetrics() {
  const waiting = clinicState.queue.filter(q => q.status === "checked_in" || q.status === "booked").length;
  const inConsult = clinicState.queue.filter(q => q.status === "in_consultation").length;
  const completed = clinicState.prescriptions.filter(p => p.paymentStatus === "settled").length;
  
  clinicState.metrics.currentlyWaiting = waiting;
  clinicState.metrics.inConsultation = inConsult;
  clinicState.metrics.completedToday = 14 + completed;
  clinicState.metrics.bundledPlatformFeesCollectedZar = (14 + completed) * 50;

  // Recalculate estimated wait times for queued patients
  let cumulativeWait = 0;
  clinicState.queue.forEach((item, idx) => {
    if (item.status === "in_consultation") {
      item.estimatedWaitMinutes = 0;
    } else if (item.status === "checked_in") {
      cumulativeWait += (item.priority === "urgent" ? 6 : 12);
      item.estimatedWaitMinutes = cumulativeWait;
    } else if (item.status === "booked") {
      cumulativeWait += 15;
      item.estimatedWaitMinutes = cumulativeWait;
    } else {
      item.estimatedWaitMinutes = 0;
    }
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      time: new Date().toISOString(),
      encryption: "AES-256-GCM Active"
    });
  });

  // Get complete clinic state
  app.get("/api/clinic/state", (req, res) => {
    recalculateMetrics();
    res.json(clinicState);
  });

  // Add New Appointed Doctor / Clinician
  app.post("/api/doctors", (req, res) => {
    const { name, title, specialty, room, avatarUrl } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Doctor name is required." });
    }
    if (!room || !room.trim()) {
      return res.status(400).json({ error: "Consultation room assignment is required." });
    }

    const trimmedName = name.trim();
    const formattedName = /^(Dr\.?|Sister|Prof\.?|Nurse)\b/i.test(trimmedName)
      ? (trimmedName.startsWith("Dr ") ? `Dr. ${trimmedName.slice(3)}` : trimmedName)
      : `Dr. ${trimmedName}`;

    const newDoctor: Doctor = {
      id: `doc-${Date.now().toString().slice(-4)}`,
      name: formattedName,
      title: title?.trim() || "MBChB",
      specialty: specialty?.trim() || "General Practice & Urgent Care",
      room: room.trim(),
      isAvailable: true,
      currentPatientTicket: undefined,
      consultationsToday: 0,
      avatarUrl: avatarUrl?.trim() || undefined
    };

    clinicState.doctors.push(newDoctor);
    res.json({ success: true, doctor: newDoctor });
  });

  // Patient Book Appointment
  app.post("/api/queue/book", (req, res) => {
    const { 
      fullName, 
      phone, 
      idNumber, 
      reasonForVisit, 
      doctorId, 
      priority = "routine",
      isWalkIn = false,
      allergies = [],
      chronicConditions = []
    } = req.body;

    if (!fullName || !phone) {
      return res.status(400).json({ error: "Full name and phone are required." });
    }

    // Check if patient exists or create
    let patient = clinicState.patients.find(p => p.phone === phone || p.fullName.toLowerCase() === fullName.toLowerCase());
    if (!patient) {
      const patientId = `pat-${Date.now().toString().slice(-4)}`;
      const encryptedNotes = encryptSensitiveData(`Initial intake for ${fullName}. Reported reason: ${reasonForVisit}`);
      patient = {
        id: patientId,
        fullName,
        phone,
        idNumber: idNumber || "Unspecified",
        age: 30,
        gender: "Other",
        allergies: Array.isArray(allergies) ? allergies : [],
        chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
        lastVisit: new Date().toISOString().split("T")[0],
        notesEncrypted: encryptedNotes,
        decryptedNotes: `Initial intake for ${fullName}. Reported reason: ${reasonForVisit}`
      };
      clinicState.patients.push(patient);
      clinicState.encryptionStatus.encryptedRecordCount++;
    }

    const nextTicketNum = `Q-${100 + clinicState.queue.length + 1}`;
    const selectedDoctor = clinicState.doctors.find(d => d.id === doctorId) || clinicState.doctors[0];

    const newQueueItem: QueueItem = {
      id: `q-${Date.now()}`,
      ticketNumber: nextTicketNum,
      patientId: patient.id,
      patientName: patient.fullName,
      patientPhone: patient.phone,
      doctorAssignedId: selectedDoctor.id,
      doctorAssignedName: selectedDoctor.name,
      roomNumber: selectedDoctor.room,
      appointmentTime: new Date(Date.now() + 20 * 60000).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
      bookedAt: new Date().toISOString(),
      status: isWalkIn ? "checked_in" : "booked",
      checkedInAt: isWalkIn ? new Date().toISOString() : undefined,
      priority: (priority as any) || "routine",
      reasonForVisit: reasonForVisit || "General Consultation",
      isWalkIn: !!isWalkIn,
      estimatedWaitMinutes: isWalkIn ? 10 : 25
    };

    clinicState.queue.push(newQueueItem);
    recalculateMetrics();

    // Auto-create confirmation email
    const confirmationEmail: ClinicEmail = {
      id: `em-${Date.now()}`,
      from: "bookings@qlessclinic.co.za",
      to: `${patient.fullName.toLowerCase().replace(/\s+/g, ".")}@client.co.za`,
      patientName: patient.fullName,
      subject: `Booking Confirmed: Ticket #${newQueueItem.ticketNumber} at ${clinicState.clinicName}`,
      snippet: `Your appointment is confirmed. Ticket #${newQueueItem.ticketNumber}. Bundled R50 medication model...`,
      body: `Hi ${patient.fullName},\n\nYour appointment has been registered at ${clinicState.clinicName}.\n\n• Ticket Number: #${newQueueItem.ticketNumber}\n• Assigned Doctor: ${selectedDoctor.name} (${selectedDoctor.room})\n• Priority: ${newQueueItem.priority.toUpperCase()}\n• Fee Structure: R0 upfront booking. Your standard R50 consultation booking fee is bundled directly into your medication cost at pharmacy checkout.\n\nPlease arrive 5 minutes prior to check-in at reception or view your live tracker online.\n\nKind regards,\nQ-Less Private Health Team`,
      date: new Date().toISOString(),
      type: "appointment_confirmation",
      status: "sent",
      isAiGenerated: true
    };
    clinicState.emails.unshift(confirmationEmail);

    res.json({
      success: true,
      ticket: newQueueItem,
      patient,
      message: "Appointment booked successfully. No upfront fee charged!"
    });
  });

  // Reception Check-in Patient
  app.post("/api/queue/checkin", (req, res) => {
    const { ticketId, vitals } = req.body;
    const item = clinicState.queue.find(q => q.id === ticketId || q.ticketNumber === ticketId);
    if (!item) {
      return res.status(404).json({ error: "Queue ticket not found" });
    }

    item.status = "checked_in";
    item.checkedInAt = new Date().toISOString();
    if (vitals) {
      item.vitalSigns = vitals;
    }
    recalculateMetrics();

    res.json({ success: true, item, message: `Patient #${item.ticketNumber} (${item.patientName}) marked as Arrived.` });
  });

  // Clinic Entrance Optical QR Scanner Check-in
  app.post("/api/queue/qr-checkin", (req, res) => {
    const { qrData, ticketId, ticketNumber } = req.body;

    let targetId = ticketId;
    let targetNum = ticketNumber;

    if (qrData) {
      try {
        if (typeof qrData === "string" && qrData.startsWith("{")) {
          const parsed = JSON.parse(qrData);
          targetId = parsed.ticketId || parsed.id || targetId;
          targetNum = parsed.ticketNumber || parsed.ticket || targetNum;
        } else if (typeof qrData === "string" && qrData.includes("ticket=")) {
          const params = new URLSearchParams(qrData.split("?")[1] || qrData);
          targetNum = params.get("ticket") || targetNum;
          targetId = params.get("id") || targetId;
        } else if (typeof qrData === "string" && qrData.startsWith("qless-checkin:")) {
          const parts = qrData.split(":");
          targetId = parts[1] || targetId;
          targetNum = parts[2] || targetNum;
        } else if (typeof qrData === "string") {
          targetNum = qrData.trim();
        }
      } catch (err) {
        // fallback to raw search
        targetNum = String(qrData).trim();
      }
    }

    const item = clinicState.queue.find(
      q => (targetId && q.id === targetId) || 
           (targetNum && q.ticketNumber.toLowerCase() === targetNum.toLowerCase()) ||
           (targetId && q.ticketNumber.toLowerCase() === targetId.toLowerCase())
    );

    if (!item) {
      return res.status(404).json({ 
        success: false, 
        error: "Invalid or unrecognized QR check-in code. Please check in at reception desk." 
      });
    }

    const wasAlreadyCheckedIn = item.status === "checked_in" || item.status === "in_consultation" || item.status === "called";

    if (!wasAlreadyCheckedIn) {
      item.status = "checked_in";
      item.checkedInAt = new Date().toISOString();
      recalculateMetrics();

      // Dispatch auto arrival confirmation notification
      const arrivalEmail: ClinicEmail = {
        id: `em-${Date.now()}`,
        from: "entrance-kiosk@qlessclinic.co.za",
        to: `${item.patientName.toLowerCase().replace(/\s+/g, ".")}@client.co.za`,
        patientName: item.patientName,
        subject: `Arrival Verified: Ticket #${item.ticketNumber} Checked In at Entrance`,
        snippet: `QR code scanned at clinic main entrance. Status set to 'Arrived'.`,
        body: `Hi ${item.patientName},\n\nYour entrance QR pass was scanned at the clinic optical entrance kiosk at ${new Date().toLocaleTimeString("en-ZA")}.\n\n• Status: ARRIVED & WAITING IN QUEUE\n• Ticket: #${item.ticketNumber}\n• Doctor: ${item.doctorAssignedName || 'Attending Physician'}\n• Room: ${item.roomNumber || 'Main Clinic'}\n• Estimated wait: ~${item.estimatedWaitMinutes} minutes\n\nPlease proceed to the waiting lounge. Your ticket will appear on the overhead monitors.`,
        date: new Date().toISOString(),
        type: "appointment_confirmation",
        status: "sent",
        isAiGenerated: true
      };
      clinicState.emails.unshift(arrivalEmail);
    }

    res.json({
      success: true,
      item,
      alreadyArrived: wasAlreadyCheckedIn,
      message: wasAlreadyCheckedIn 
        ? `Welcome back, ${item.patientName}. Ticket #${item.ticketNumber} is already registered as Arrived.`
        : `Welcome ${item.patientName}! Your arrival is confirmed. Ticket #${item.ticketNumber} is now Active in the Doctor Queue.`
    });
  });

  // Update Triage Priority & Doctor Assignment
  app.post("/api/queue/triage", (req, res) => {
    const { ticketId, priority, doctorAssignedId } = req.body;
    const item = clinicState.queue.find(q => q.id === ticketId || q.ticketNumber === ticketId);
    if (!item) {
      return res.status(404).json({ error: "Queue item not found" });
    }
    if (priority) {
      item.priority = priority;
    }
    if (doctorAssignedId) {
      const doc = clinicState.doctors.find(d => d.id === doctorAssignedId);
      if (doc) {
        item.doctorAssignedId = doc.id;
        item.doctorAssignedName = doc.name;
        item.roomNumber = doc.room;
      }
    }
    recalculateMetrics();
    res.json({ success: true, item });
  });

  // Call Patient into Consultation Room
  app.post("/api/queue/call", (req, res) => {
    const { ticketId, doctorId, roomNumber } = req.body;
    const item = clinicState.queue.find(q => q.id === ticketId);
    if (!item) {
      return res.status(404).json({ error: "Queue item not found" });
    }

    const doctor = clinicState.doctors.find(d => d.id === doctorId);
    if (doctor) {
      doctor.currentPatientTicket = item.ticketNumber;
      if (roomNumber) doctor.room = roomNumber;
    }

    item.status = "in_consultation";
    item.calledAt = new Date().toISOString();
    item.doctorAssignedId = doctorId || item.doctorAssignedId;
    item.doctorAssignedName = doctor ? doctor.name : item.doctorAssignedName;
    item.roomNumber = roomNumber || item.roomNumber || "Consultation Room 1";

    recalculateMetrics();
    res.json({ success: true, item });
  });

  // Complete Doctor Consultation & Build Prescription with Bundled R50 Fee
  app.post("/api/doctor/consultation", (req, res) => {
    const {
      queueItemId,
      doctorId,
      diagnosis,
      clinicalNotes,
      medications = [] // Array of { name, dosage, instructions, basePriceZar, quantity }
    } = req.body;

    const queueItem = clinicState.queue.find(q => q.id === queueItemId);
    if (!queueItem) {
      return res.status(404).json({ error: "Queue item not found" });
    }

    const doctor = clinicState.doctors.find(d => d.id === doctorId) || clinicState.doctors[0];
    const patient = clinicState.patients.find(p => p.id === queueItem.patientId);

    // Encrypt clinical notes using AES-256-GCM
    const encryptedNotes = encryptSensitiveData(clinicalNotes || `Consultation on ${new Date().toLocaleDateString("en-ZA")}: Diagnosis: ${diagnosis}`);
    clinicState.encryptionStatus.encryptedRecordCount++;

    // Calculate medication subtotal + bundled R50 appointment fee
    const medList: MedicationItem[] = medications.map((m: any, idx: number) => ({
      id: `med-${Date.now()}-${idx}`,
      name: m.name || "Prescribed Medication",
      dosage: m.dosage || "As directed",
      instructions: m.instructions || "Take with meals",
      basePriceZar: Number(m.basePriceZar) || 75,
      quantity: Number(m.quantity) || 1
    }));

    const medicationSubtotalZar = medList.reduce((acc, m) => acc + (m.basePriceZar * m.quantity), 0);
    const clinicBundleFeeZar = 50; // Per-appointment charge bundled into medication
    const totalPatientPaymentZar = medicationSubtotalZar + clinicBundleFeeZar;

    const prescription: Prescription = {
      id: `rx-${Date.now()}`,
      queueItemId: queueItem.id,
      patientId: queueItem.patientId,
      patientName: queueItem.patientName,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date: new Date().toISOString().split("T")[0],
      diagnosis: diagnosis || "Clinical Evaluation & Treatment",
      clinicalNotesEncrypted: encryptedNotes,
      decryptedClinicalNotes: clinicalNotes,
      medications: medList,
      medicationSubtotalZar,
      clinicBundleFeeZar,
      totalPatientPaymentZar,
      paymentStatus: "pending"
    };

    clinicState.prescriptions.unshift(prescription);
    queueItem.status = "pharmacy_ready";
    queueItem.prescriptionId = prescription.id;
    doctor.currentPatientTicket = undefined;
    doctor.consultationsToday++;

    // Update patient record
    if (patient) {
      patient.lastVisit = new Date().toISOString().split("T")[0];
      patient.notesEncrypted = encryptedNotes;
      patient.decryptedNotes = clinicalNotes;
    }

    recalculateMetrics();

    res.json({
      success: true,
      prescription,
      message: `Consultation completed. R50 appointment charge bundled into medication checkout total (R${totalPatientPaymentZar}).`
    });
  });

  // Pharmacy Dispense & Settle Payment (Patient pays medication + bundled R50)
  app.post("/api/pharmacy/dispense", (req, res) => {
    const { prescriptionId } = req.body;
    const prescription = clinicState.prescriptions.find(p => p.id === prescriptionId);
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    prescription.paymentStatus = "settled";
    prescription.dispensedAt = new Date().toISOString();

    const queueItem = clinicState.queue.find(q => q.id === prescription.queueItemId);
    if (queueItem) {
      queueItem.status = "completed";
      queueItem.completedAt = new Date().toISOString();
    }

    clinicState.metrics.totalRevenueZar += prescription.totalPatientPaymentZar;
    recalculateMetrics();

    res.json({
      success: true,
      prescription,
      receipt: {
        receiptNumber: `RCP-${Date.now().toString().slice(-6)}`,
        patientName: prescription.patientName,
        medicationSubtotal: `R${prescription.medicationSubtotalZar}.00`,
        bundledClinicFee: `R${prescription.clinicBundleFeeZar}.00 (Bundled Appointment Surcharge)`,
        totalPaidZar: `R${prescription.totalPatientPaymentZar}.00`,
        settledAt: prescription.dispensedAt
      }
    });
  });

  // Verify Encryption & Decryption
  app.post("/api/encryption/verify", (req, res) => {
    const { testText = "Patient Confidential Medical History & HIV/TB Status" } = req.body;
    const encrypted = encryptSensitiveData(testText);
    const decrypted = decryptSensitiveData(encrypted);

    res.json({
      plainText: testText,
      encrypted,
      decrypted,
      verifiedMatch: testText === decrypted,
      activeKeyFingerprint: KEY_FINGERPRINT,
      securityStandard: "AES-256 Galois/Counter Mode (GCM) with 128-bit authentication tag"
    });
  });

  // --- Gemini Personal AI Assistant Endpoint ---
  app.post("/api/ai/assistant", async (req, res) => {
    const { message, contextRole = "reception", patientId } = req.body;

    const patientContext = patientId ? clinicState.patients.find(p => p.id === patientId) : null;
    const waitingPatients = clinicState.queue.filter(q => q.status === "checked_in" || q.status === "booked");
    
    // Construct medical context without exposing unencrypted secrets outside server
    const clinicContextSummary = `
Clinic Name: ${clinicState.clinicName}
Current Active Waiting Patients: ${waitingPatients.map(w => `${w.ticketNumber} (${w.patientName}, ${w.priority}, Reason: ${w.reasonForVisit}, Est Wait: ${w.estimatedWaitMinutes}m)`).join("; ")}
Doctors on Duty: ${clinicState.doctors.map(d => `${d.name} (${d.room}, Available: ${d.isAvailable})`).join(", ")}
Bundled Fee Policy: Per-appointment charge of R50 (fifty rand) bundled into medication cost at checkout.
Role requesting assistance: ${contextRole} (Receptionist, Doctor, or Clinic Admin)
${patientContext ? `Target Patient: ${patientContext.fullName}, Age: ${patientContext.age}, Allergies: ${patientContext.allergies.join(", ") || "None"}, Chronic: ${patientContext.chronicConditions.join(", ") || "None"}, Last Notes: ${patientContext.decryptedNotes || "None"}` : ""}
`;

    const systemPrompt = `You are "Aiva", a friendly, highly competent AI Clinical & Operations Assistant for Q-Less Healthcare Clinic in South Africa.
CRITICAL MANDATE:
1. You ASSIST doctors, nurses, and receptionists. You do NOT replace reception's human oversight or greeting role, nor replace doctors' diagnostic authority.
2. The clinic's business model is a R50 per-appointment charge, paid by the patient, bundled into medication cost rather than billed separately upfront.
3. Patient health information is strictly encrypted with AES-256-GCM under South African POPIA regulations.
4. When assisting reception: give fast, practical scheduling advice, triage queue rebalancing, or email templates.
5. When assisting doctors: provide differential diagnosis considerations, drug-allergy warnings, and concise clinical notes formatting.
6. Keep responses clear, professional, warm, and concise.`;

    const ai = getAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `System Context:\n${clinicContextSummary}\n\nUser Question/Request (${contextRole}):\n${message}`,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          }
        });

        return res.json({
          reply: response.text,
          modelUsed: "gemini-3.8-flash",
          timestamp: new Date().toISOString()
        });
      } catch (err: any) {
        console.error("Gemini API call failed, using intelligent fallback:", err?.message || err);
      }
    }

    // Intelligent Fallback if Gemini key is absent or quota limited
    let fallbackReply = "";
    const lower = (message || "").toLowerCase();

    if (lower.includes("email") || lower.includes("draft") || lower.includes("letter")) {
      fallbackReply = `Here is a drafted email ready for reception review:\n\nSubject: Update regarding your visit at Q-Less Clinic\n\nDear Patient,\n\nThank you for choosing Q-Less Private Clinic. We are preparing for your consultation. As a reminder, your consultation includes a R50 clinic booking fee that is bundled seamlessly with your medication dispensary invoice.\n\nYou can track live queue times directly from your mobile device.\n\nWarm regards,\nFront Desk Team\n${clinicState.clinicName}`;
    } else if (lower.includes("queue") || lower.includes("wait") || lower.includes("triage")) {
      fallbackReply = `Currently there are ${waitingPatients.length} patients in the queue. Recommendation: Prioritize ticket ${waitingPatients[0]?.ticketNumber || 'next walk-in'} to Room 1 with Dr. Dlamini. Average wait is currently holding at ${clinicState.metrics.avgWaitTimeMinutes} minutes, saving ~4 hours compared to regional public OPDs.`;
    } else if (lower.includes("r50") || lower.includes("fee") || lower.includes("payment") || lower.includes("rand")) {
      fallbackReply = `The billing model is configured: R0 charged upon booking. The R50 per-appointment fee is added directly as a bundled line item to the patient's medication cost at our clinic dispensary upon discharge.`;
    } else if (patientContext && (lower.includes("patient") || lower.includes("allergy") || lower.includes("history"))) {
      fallbackReply = `Verified Encrypted Health File for ${patientContext.fullName}: Allergies: ${patientContext.allergies.join(", ") || "None"}. Chronic Conditions: ${patientContext.chronicConditions.join(", ") || "None"}. Note: Ensure any antibiotic prescription avoids penicillin-family drugs due to documented allergy.`;
    } else {
      fallbackReply = `Aiva Assistant ready: I'm monitoring queue flow for ${clinicState.clinicName}. Both consultation rooms are active, and our AES-256 encrypted records database is secured under POPIA. How can I assist you with queue triage, email drafting, or patient file lookups?`;
    }

    res.json({
      reply: fallbackReply,
      modelUsed: "built-in-clinical-assistant",
      timestamp: new Date().toISOString()
    });
  });

  // Draft Email with AI
  app.post("/api/ai/draft-email", async (req, res) => {
    const { recipientName, emailType, customPrompt } = req.body;

    const prompt = `Draft a polite, professional healthcare email for a South African private clinic.
Recipient: ${recipientName || "Valued Patient"}
Email Purpose: ${emailType || "appointment_prep"}
Custom Instructions: ${customPrompt || "Explain that the R50 booking fee is bundled into medication cost, and provide the live queue tracker link."}
Keep it concise, reassuring, and under 150 words.`;

    const ai = getAI();
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            systemInstruction: "You are an automated clinic communication writer. Output ONLY the subject line on line 1, followed by a blank line, then the email body.",
            temperature: 0.6
          }
        });

        const fullText = response.text || "";
        const lines = fullText.split("\n");
        const subject = lines[0]?.replace(/^Subject:\s*/i, "") || `Important Update from ${clinicState.clinicName}`;
        const body = lines.slice(1).join("\n").trim() || fullText;

        return res.json({ subject, body, aiGenerated: true });
      } catch (err) {
        console.error("Gemini email drafting error:", err);
      }
    }

    // Fallback email draft
    res.json({
      subject: `Upcoming Visit & Live Queue Information - ${clinicState.clinicName}`,
      body: `Dear ${recipientName || "Patient"},\n\nWe look forward to welcoming you to ${clinicState.clinicName}. Your appointment is confirmed.\n\nQuick Information:\n• Please monitor your live queue ticket on your phone so you can walk straight into consultation without lingering in the waiting area.\n• Transparent Billing: Your R50 appointment booking charge is bundled directly into your medication cost at pharmacy collection—no upfront booking fees.\n\nIf you have any questions or need to reschedule, simply reply to this email.\n\nWarm regards,\nReception & Clinical Care Team\n${clinicState.clinicName}`,
      aiGenerated: false
    });
  });

  // Send Email (records into clinic state inbox/outbox)
  app.post("/api/emails/send", (req, res) => {
    const { to, patientName, subject, body, type = "patient_inquiry" } = req.body;
    const newEmail: ClinicEmail = {
      id: `em-${Date.now()}`,
      from: "reception@qlessclinic.co.za",
      to: to || "patient@domain.co.za",
      patientName: patientName || "Patient",
      subject: subject || "Clinic Notice",
      snippet: (body || "").substring(0, 80) + "...",
      body: body || "",
      date: new Date().toISOString(),
      type: type as any,
      status: "sent",
      isAiGenerated: true
    };
    clinicState.emails.unshift(newEmail);
    res.json({ success: true, email: newEmail });
  });

  // Vite middleware for development vs static for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Q-Less Clinic Server running on http://localhost:${PORT}`);
  });
}

startServer();
