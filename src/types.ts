
export enum View {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  ONBOARDING = 'ONBOARDING',
  DASHBOARD = 'DASHBOARD',
  SCRIBE = 'SCRIBE'
}

export interface User {
  id: string;
  name: string;
  email: string;
  specialty: string;
  country?: string;
}

export interface TranscriptUtterance {
  speaker: string;  // e.g., "A", "B"
  text: string;
  start: number;    // Start time in milliseconds
  end: number;      // End time in milliseconds
}

export interface PrefilledPatientData {
  name: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  bloodGroup: string;
  nationality?: string;
  language?: string;
}

export interface PatientFile {
  id: string;
  patientId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  fileSize: number;
  recordId?: string;
}

export interface Patient {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  weight?: string;
  height?: string;
  bloodGroup?: string;
  nationality?: string;
  language?: string;
  lastSeen: string;
  consultations: MedicalNote[];
  files?: PatientFile[];
}

export interface MedicalNote {
  id: string;
  patientId: string; // Link back to patient
  date: string;
  type: 'Consultation' | 'Follow-up' | 'Emergency';
  language?: string; // Captured language for persistence
  content: SOAPNote;
  rawTranscript?: string;
  utterances?: TranscriptUtterance[];
  summary?: string; // New feature: separate summary
  keyInsights?: string[]; // New feature: Groq generated insights
  audioUrl?: string; // New feature: link to audio file
  prescription?: Prescription;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  date: string;
  medications: Medication[];
  notes: string;
}

export interface SOAPNote {
  title?: string; // Short generated title (e.g. "Viral Fever Follow-up")
  summary?: string; // Replaces detailed subjective
  subjective?: {
    chiefComplaint: string;
    historyOfPresentIllness: string;
  };
  objective: {
    vitals?: {
      temperature?: string;
      bloodPressure?: string;
      pulse?: string;
      respiratoryRate?: string;
    };
    appearance?: string[];
  };
  assessment: string;
  plan: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
