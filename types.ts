export type ViewMode = 'landing' | 'booking' | 'dashboard' | 'calendar' | 'embed';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

export type EventCategory = 'client' | 'work' | 'personal' | 'focus' | 'travel';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "10:00"
  endTime: string; // "11:30"
  category: EventCategory;
  location?: string;
  meetUrl?: string;
  isPrivate: boolean; // Hidden from details when exported or viewed by guests
  blocksBooking: boolean; // Disables slot on public booking widget
  bookingId?: string; // Reference to client booking if applicable
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  createdAt?: string;
}

export interface CalendarCategoryInfo {
  id: EventCategory;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
}

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
