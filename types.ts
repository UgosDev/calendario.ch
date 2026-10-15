export type ViewMode = 'landing' | 'booking' | 'dashboard' | 'calendar' | 'embed';

export type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';

export type CalendarContextMode = 'personal' | 'work' | 'all';

export type EventCategory = 
  | 'family' 
  | 'health' 
  | 'home_finance' 
  | 'leisure' 
  | 'holiday' 
  | 'personal' 
  | 'client' 
  | 'work' 
  | 'focus' 
  | 'travel';

export interface SwissDeadline {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  canton?: string;
  description: string;
  badge: string;
  category: 'tax' | 'health' | 'civic';
}

export interface DailyPersonalTask {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: 'home' | 'finance' | 'family' | 'health';
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface AvailabilitySettings {
  bufferMinutes: number; // e.g. 15 min between meetings
  startHour: string; // "08:30"
  endHour: string; // "18:00"
  workDays: number[]; // [1, 2, 3, 4, 5] (Mon-Fri)
  maxDailyBookings: number; // e.g. 5
}

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
  checklist?: ChecklistItem[];
  notes?: string;
  familyMemberId?: string; // 'me' | 'partner' | 'sofia' | 'leo'
  canton?: string;
  createdAt?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: string; // 'Io (Marco)' | 'Elena (Partner)' | 'Sofia (Figlia 12a)' | 'Leo (Figlio 8a)'
  avatarBg: string;
  color: string;
  initials: string;
}

export interface CantonalSchoolHoliday {
  id: string;
  canton: string;
  name: string;
  startDate: string;
  endDate: string;
  season: 'autunno' | 'natale' | 'carnevale' | 'primavera' | 'estate';
  description: string;
}

export interface WasteCollectionItem {
  id: string;
  type: 'carta' | 'verde' | 'vetro' | 'multisacco' | 'ingombranti';
  title: string;
  dayOfWeek: string;
  nextDate: string;
  badge: string;
  iconName: string;
}

export interface SwissWeekendForecast {
  location: string;
  day: string;
  condition: string;
  temp: string;
  tip: string;
}

export interface CalendarCategoryInfo {
  id: EventCategory;
  label: string;
  description: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  group: 'personal' | 'work' | 'civic';
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
