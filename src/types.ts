export type QueueStatus = 
  | 'booked' 
  | 'checked_in' 
  | 'called' 
  | 'in_consultation' 
  | 'pharmacy_ready' 
  | 'completed' 
  | 'cancelled';

export type TriagePriority = 'routine' | 'urgent' | 'emergency';

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
  algorithm: 'AES-256-GCM';
  keyFingerprint: string;
  timestamp: string;
}

export interface PatientRecord {
  id: string;
  fullName: string;
  phone: string;
  idNumber: string; // Encrypted in store
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  lastVisit?: string;
  notesEncrypted?: EncryptedData;
  decryptedNotes?: string;
}

export interface QueueItem {
  id: string;
  ticketNumber: string; // e.g. "Q-101"
  patientId: string;
  patientName: string;
  patientPhone: string;
  doctorAssignedId?: string;
  doctorAssignedName?: string;
  roomNumber?: string;
  appointmentTime: string;
  bookedAt: string;
  checkedInAt?: string;
  calledAt?: string;
  completedAt?: string;
  status: QueueStatus;
  priority: TriagePriority;
  reasonForVisit: string;
  isWalkIn: boolean;
  estimatedWaitMinutes: number;
  vitalSigns?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    spO2?: number;
  };
  prescriptionId?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  instructions: string;
  basePriceZar: number; // in South African Rand
  quantity: number;
}

export interface Prescription {
  id: string;
  queueItemId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  diagnosis: string;
  clinicalNotesEncrypted: EncryptedData;
  decryptedClinicalNotes?: string;
  medications: MedicationItem[];
  medicationSubtotalZar: number;
  clinicBundleFeeZar: number; // The R50 per-appointment fee bundled into medication
  totalPatientPaymentZar: number;
  paymentStatus: 'pending' | 'settled';
  dispensedAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  room: string;
  isAvailable: boolean;
  currentPatientTicket?: string;
  consultationsToday: number;
  avatarUrl?: string;
}

export interface ClinicEmail {
  id: string;
  from: string;
  to: string;
  patientName?: string;
  subject: string;
  snippet: string;
  body: string;
  date: string;
  type: 'appointment_confirmation' | 'pre_visit_prep' | 'patient_inquiry' | 'lab_followup' | 'reschedule';
  status: 'unread' | 'read' | 'draft' | 'sent';
  aiSuggestedReply?: string;
  isAiGenerated?: boolean;
}

export interface ClinicMetrics {
  totalPatientsToday: number;
  currentlyWaiting: number;
  inConsultation: number;
  completedToday: number;
  avgWaitTimeMinutes: number;
  hospitalComparisonSavedHours: number; // hospital avg wait (e.g. 4 hours) vs clinic 15 min
  totalRevenueZar: number;
  bundledPlatformFeesCollectedZar: number; // 50 * completed visits
}

export interface ClinicState {
  clinicName: string;
  clinicAddress: string;
  queue: QueueItem[];
  patients: PatientRecord[];
  doctors: Doctor[];
  prescriptions: Prescription[];
  emails: ClinicEmail[];
  metrics: ClinicMetrics;
  encryptionStatus: {
    algorithm: string;
    encryptionStandard: string;
    compliance: string[];
    activeKeyId: string;
    encryptedRecordCount: number;
  };
}
