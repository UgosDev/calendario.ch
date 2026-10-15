export type ViewMode = 'landing' | 'booking' | 'dashboard' | 'embed';

export interface BookingService {
  id: string;
  title: string;
  durationMinutes: number;
  priceChf: number; // 0 for free
  description: string;
  isTwintAccepted?: boolean;
  category?: 'privati' | 'aziende' | 'frontalieri';
}

export type MeetingLocation = 'office' | 'video' | 'client_address';

export interface TimeSlot {
  time: string; // e.g. "09:00"
  available: boolean;
}

export interface DayAvailability {
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}

export interface BookingRequest {
  id: string;
  serviceId: string;
  serviceName: string;
  professionalHandle: string;
  professionalName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // "09:45"
  durationMinutes: number;
  priceChf: number;
  meetingLocation: MeetingLocation;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes?: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  isPaidWithTwint: boolean;
  twintRef?: string;
  createdAt: string;
}

export interface ProfessionalProfile {
  handle: string; // e.g. "pietro-pirola"
  name: string;
  role: string;
  company: string;
  bio: string;
  avatarUrl?: string;
  address: string;
  canton: string;
  finmaNumber?: string;
  services: BookingService[];
  meetingLocations: MeetingLocation[];
  officeAddressDetails: string;
  verifiedUsso: boolean;
}
