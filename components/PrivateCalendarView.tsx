import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  CalendarEvent,
  CalendarViewType,
  EventCategory,
  ProfessionalProfile,
  BookingRequest,
  ChecklistItem,
  AvailabilitySettings,
  CalendarContextMode,
  DailyPersonalTask,
  SwissDeadline,
  FamilyMember,
  CantonalSchoolHoliday,
  WasteCollectionItem,
  SwissWeekendForecast,
} from '../types';
import { 
  CALENDAR_CATEGORIES, 
  SWISS_DEADLINES, 
  INITIAL_PERSONAL_TASKS,
  FAMILY_MEMBERS,
  CANTONAL_SCHOOL_HOLIDAYS,
  WASTE_COLLECTION_SCHEDULE,
  SWISS_WEEKEND_FORECASTS,
} from '../mockData';
import { downloadIcsFile, parseIcsContent } from '../icsGenerator';
import {
  Calendar,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldCheck,
  Trash2,
  Video,
  MapPin,
  User,
  Mail,
  Phone,
  Share2,
  Download,
  Upload,
  Check,
  X,
  ExternalLink,
  Briefcase,
  Sparkles,
  CalendarDays,
  Layers,
  ArrowRight,
  Info,
  Search,
  Sliders,
  CheckSquare,
  Square,
  FileText,
  PieChart,
  Coffee,
  AlertCircle,
  Home,
  Heart,
  Flag,
  Users,
  Sun,
  Package,
  Leaf,
  Wine,
  Trash,
  QrCode,
  Smartphone,
} from 'lucide-react';

interface PrivateCalendarViewProps {
  profile: ProfessionalProfile;
  events: CalendarEvent[];
  bookings: BookingRequest[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (eventId: string) => void;
  onOpenPublicBooking: () => void;
  onOpenEmbedModal: () => void;
}

export const PrivateCalendarView: React.FC<PrivateCalendarViewProps> = ({
  profile,
  events,
  bookings,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onOpenPublicBooking,
  onOpenEmbedModal,
}) => {
  // Calendar navigation state (defaults to October 2026 to align with mock records)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(9); // 0-indexed (9 = Ottobre)
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-19');
  const [viewType, setViewType] = useState<CalendarViewType>('week');

  // Master Context Switch: 'personal' (Famiglia & Vita Privata) vs 'work' (Lavoro & Clienti) vs 'all' (Tutto)
  const [contextMode, setContextMode] = useState<CalendarContextMode>('personal');

  // Personal To-Do Tasks State
  const [personalTasks, setPersonalTasks] = useState<DailyPersonalTask[]>(INITIAL_PERSONAL_TASKS);
  const [newTaskInput, setNewTaskInput] = useState<string>('');

  // Filter categories state
  const [activeCategories, setActiveCategories] = useState<Record<EventCategory, boolean>>({
    family: true,
    health: true,
    home_finance: true,
    leisure: true,
    personal: true,
    holiday: true,
    client: true,
    work: true,
    focus: true,
    travel: true,
  });

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [showSearchModal, setShowSearchModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Availability & Buffer Settings
  const [availabilityRules, setAvailabilityRules] = useState<AvailabilitySettings>({
    bufferMinutes: 15,
    startHour: '08:30',
    endHour: '18:00',
    workDays: [1, 2, 3, 4, 5],
    maxDailyBookings: 6,
  });

  // Form state for new / edit event
  const [formId, setFormId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDate, setFormDate] = useState<string>('2026-10-19');
  const [formStartTime, setFormStartTime] = useState<string>('10:00');
  const [formEndTime, setFormEndTime] = useState<string>('11:00');
  const [formCategory, setFormCategory] = useState<EventCategory>('family');
  const [formLocation, setFormLocation] = useState<string>('');
  const [formMeetUrl, setFormMeetUrl] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIsPrivate, setFormIsPrivate] = useState<boolean>(true);
  const [formBlocksBooking, setFormBlocksBooking] = useState<boolean>(true);
  const [formChecklist, setFormChecklist] = useState<ChecklistItem[]>([]);
  const [formFamilyMemberId, setFormFamilyMemberId] = useState<string>('me');

  // Family Members & Cantonal State
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>('all');
  const [selectedCanton, setSelectedCanton] = useState<string>('TI');
  const [showFamilyShareModal, setShowFamilyShareModal] = useState<boolean>(false);
  const [familyInviteEmail, setFamilyInviteEmail] = useState<string>('');
  const [familyInviteSent, setFamilyInviteSent] = useState<boolean>(false);

  // Copy pill notification & file import input ref
  const [copiedLink, setCopiedLink] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const weekdayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
  const weekdayShort = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  // Hours displayed in day and week views
  const HOURS = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00'
  ];

  // Helper to get category info
  const getCatInfo = (cat: EventCategory) => {
    return CALENDAR_CATEGORIES.find((c) => c.id === cat) || CALENDAR_CATEGORIES[0];
  };

  // Keyboard Shortcuts (T: Today, W: Week, M: Month, D: Day, A: Agenda, C: Create, K: Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        if (e.key === 'Escape') {
          setShowSearchModal(false);
          setShowCreateModal(false);
          setShowDetailModal(false);
          setShowRulesModal(false);
          setShowSyncModal(false);
          setShowFamilyShareModal(false);
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      } else if (e.key === '/') {
        e.preventDefault();
        setShowSearchModal(true);
      } else if (e.key.toLowerCase() === 't') {
        handleToday();
      } else if (e.key.toLowerCase() === 'w') {
        setViewType('week');
      } else if (e.key.toLowerCase() === 'm') {
        setViewType('month');
      } else if (e.key.toLowerCase() === 'd') {
        setViewType('day');
      } else if (e.key.toLowerCase() === 'a') {
        setViewType('agenda');
      } else if (e.key.toLowerCase() === 'c' || e.key.toLowerCase() === 'n') {
        openCreateModal();
      } else if (e.key === 'Escape') {
        setShowSearchModal(false);
        setShowCreateModal(false);
        setShowDetailModal(false);
        setShowRulesModal(false);
        setShowSyncModal(false);
        setShowFamilyShareModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDate]);

  // Filtered events based on active category checkboxes, contextMode, and selected family member
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (!activeCategories[e.category]) return false;
      const cat = getCatInfo(e.category);
      if (contextMode === 'personal' && cat.group === 'work') return false;
      if (contextMode === 'work' && cat.group === 'personal') return false;
      if (selectedFamilyMember !== 'all') {
        if (e.familyMemberId && e.familyMemberId !== selectedFamilyMember) {
          return false;
        }
      }
      return true;
    });
  }, [events, activeCategories, contextMode, selectedFamilyMember]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.clientName && e.clientName.toLowerCase().includes(q)) ||
        (e.location && e.location.toLowerCase().includes(q)) ||
        e.category.toLowerCase().includes(q)
    );
  }, [events, searchQuery]);

  // Navigate dates
  const handlePrev = () => {
    if (viewType === 'month') {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - (viewType === 'week' ? 7 : 1));
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDate(newDateStr);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  };

  const handleNext = () => {
    if (viewType === 'month') {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + (viewType === 'week' ? 7 : 1));
      const newDateStr = d.toISOString().split('T')[0];
      setSelectedDate(newDateStr);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
    }
  };

  const handleToday = () => {
    setSelectedDate('2026-10-19');
    setCurrentMonth(9);
    setCurrentYear(2026);
  };

  // Calculate days of current week (Monday to Sunday) based on selectedDate
  const currentWeekDays = useMemo(() => {
    const cur = new Date(selectedDate);
    const dayOfWeek = cur.getDay(); // 0 is Sunday, 1 is Monday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(cur);
    monday.setDate(cur.getDate() + mondayOffset);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        dateStr,
        dayNum: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        shortName: weekdayShort[i],
        fullName: weekdayNames[i],
        isToday: dateStr === '2026-10-19',
        isSelected: dateStr === selectedDate,
      });
    }
    return days;
  }, [selectedDate]);

  // Calculate days for current month grid
  const monthCalendarDays = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;

    const list = [];
    for (let i = 0; i < startOffset; i++) {
      list.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const formattedD = String(d).padStart(2, '0');
      const formattedM = String(currentMonth + 1).padStart(2, '0');
      const dateStr = `${currentYear}-${formattedM}-${formattedD}`;
      list.push({
        dayNum: d,
        dateStr,
        isToday: dateStr === '2026-10-19',
        isSelected: dateStr === selectedDate,
      });
    }
    return list;
  }, [currentYear, currentMonth, selectedDate]);

  // Open modal to create event
  const openCreateModal = (dateStr?: string, timeStr?: string) => {
    setFormId(null);
    setFormTitle('');
    setFormDate(dateStr || selectedDate);
    setFormStartTime(timeStr || '10:00');
    const [h, m] = (timeStr || '10:00').split(':').map(Number);
    const endH = String(Math.min(23, h + 1)).padStart(2, '0');
    setFormEndTime(`${endH}:${String(m).padStart(2, '0')}`);
    setFormCategory(contextMode === 'work' ? 'work' : 'family');
    setFormLocation('');
    setFormMeetUrl('');
    setFormDescription('');
    setFormIsPrivate(true);
    setFormBlocksBooking(true);
    setFormChecklist([]);
    setFormFamilyMemberId(selectedFamilyMember !== 'all' ? selectedFamilyMember : 'me');
    setShowCreateModal(true);
  };

  // Open modal to edit existing event
  const openEditModal = (evt: CalendarEvent) => {
    setFormId(evt.id);
    setFormTitle(evt.title);
    setFormDate(evt.date);
    setFormStartTime(evt.startTime);
    setFormEndTime(evt.endTime);
    setFormCategory(evt.category);
    setFormLocation(evt.location || '');
    setFormMeetUrl(evt.meetUrl || '');
    setFormDescription(evt.description || '');
    setFormIsPrivate(evt.isPrivate);
    setFormBlocksBooking(evt.blocksBooking);
    setFormChecklist(evt.checklist || []);
    setFormFamilyMemberId(evt.familyMemberId || 'me');
    setShowDetailModal(false);
    setShowCreateModal(true);
  };

  // Open detail view for an event
  const openDetailModal = (evt: CalendarEvent) => {
    setSelectedEvent(evt);
    setShowDetailModal(true);
  };

  // Save event (Create or Update)
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (formId) {
      const updated: CalendarEvent = {
        id: formId,
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        location: formLocation,
        meetUrl: formMeetUrl,
        description: formDescription,
        isPrivate: formIsPrivate,
        blocksBooking: formBlocksBooking,
        checklist: formChecklist,
        familyMemberId: formFamilyMemberId || undefined,
      };
      onUpdateEvent(updated);
    } else {
      const newEvent: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        location: formLocation,
        meetUrl: formMeetUrl,
        description: formDescription,
        isPrivate: formIsPrivate,
        blocksBooking: formBlocksBooking,
        checklist: formChecklist,
        familyMemberId: formFamilyMemberId || undefined,
        createdAt: new Date().toISOString(),
      };
      onAddEvent(newEvent);
    }

    setShowCreateModal(false);
  };

  // Personal To-Do handlers
  const togglePersonalTask = (taskId: string) => {
    setPersonalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleCreateTask = (text: string) => {
    if (!text.trim()) return;
    const newTask: DailyPersonalTask = {
      id: `task-${Date.now()}`,
      title: text.trim(),
      date: selectedDate,
      completed: false,
      priority: 'medium',
      category: 'home',
    };
    setPersonalTasks((prev) => [newTask, ...prev]);
    setNewTaskInput('');
  };

  // Toggle checklist item status in Detail Modal
  const toggleDetailChecklist = (itemIndex: number) => {
    if (!selectedEvent) return;
    const currentList = selectedEvent.checklist ? [...selectedEvent.checklist] : [];
    if (currentList[itemIndex]) {
      currentList[itemIndex] = {
        ...currentList[itemIndex],
        done: !currentList[itemIndex].done,
      };
      const updated: CalendarEvent = {
        ...selectedEvent,
        checklist: currentList,
      };
      setSelectedEvent(updated);
      onUpdateEvent(updated);
    }
  };

  // Copy public link
  const handleCopyLink = () => {
    const url = `https://calendario.ch/${profile.handle}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Export full calendar as ICS
  const handleExportFullCalendar = () => {
    if (events.length === 0) return;
    downloadIcsFile(events);
  };

  // Handle ICS File Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseIcsContent(text);
        if (parsed.length > 0) {
          parsed.forEach((p) => {
            onAddEvent(p as CalendarEvent);
          });
          setImportNotice(`Importati con successo ${parsed.length} impegni nel calendario!`);
          setTimeout(() => setImportNotice(null), 4000);
        } else {
          setImportNotice('Nessun evento valido trovato nel file .ics selezionato.');
          setTimeout(() => setImportNotice(null), 4000);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Hidden file input for ICS upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".ics,text/calendar"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Import feedback banner */}
      {importNotice && (
        <div className="mb-4 p-3.5 rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-xs flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-400" />
            <span>{importNotice}</span>
          </div>
          <button onClick={() => setImportNotice(null)} className="text-neutral-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Bar: Master Mode Switcher (Personale vs Lavoro vs Tutto) */}
      <div className="mb-6 p-4 sm:p-5 rounded-3xl border border-neutral-900 bg-neutral-950/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center font-bold shadow-md shrink-0">
            {contextMode === 'personal' ? <Home size={18} /> : contextMode === 'work' ? <Briefcase size={18} /> : <Layers size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                {contextMode === 'personal'
                  ? 'Il Tuo Calendario Personale & Famiglia'
                  : contextMode === 'work'
                  ? 'Agenda Professionale & Studio'
                  : 'Panoramica Completa Vita & Lavoro'}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                <ShieldCheck size={11} />
                <span>Zero Profilazione · Server Zurigo</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {contextMode === 'personal'
                ? 'Sport, visite mediche, scuola dei figli, scadenze svizzere e tempo libero al sicuro in Svizzera.'
                : contextMode === 'work'
                ? 'Consulenze, appuntamenti clienti, riunioni interne e slot orari sincronizzati con il tuo booking pubblico.'
                : 'La perfetta armonia tra impegni privati e lavoro: la tua vita personale protegge i tuoi orari lavorativi.'}
            </p>
          </div>
        </div>

        {/* Master Context Mode Pill Tabs */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
            <button
              onClick={() => setContextMode('personal')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                contextMode === 'personal'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Home size={13} />
              <span>Personale & Casa</span>
            </button>
            <button
              onClick={() => setContextMode('work')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                contextMode === 'work'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Briefcase size={13} />
              <span>Lavoro & Clienti</span>
            </button>
            <button
              onClick={() => setContextMode('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
                contextMode === 'all'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers size={13} />
              <span>Tutto Insieme</span>
            </button>
          </div>

          {/* Quick Actions */}
          <button
            onClick={() => setShowSearchModal(true)}
            className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-300 hover:text-white transition-colors"
            title="Cerca in agenda (⌘K o /)"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => openCreateModal()}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus size={15} />
            <span>Nuovo Impegno</span>
          </button>
        </div>
      </div>

      {/* BARRA FAMIGLIA & CANTONI (Attiva in modalità Personale o Tutto) */}
      {(contextMode === 'personal' || contextMode === 'all') && (
        <div className="mb-6 p-4 rounded-2xl border border-neutral-900 bg-neutral-950/70 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Family Member Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5 mr-1">
              <Users size={14} className="text-pink-400" />
              <span>Famiglia:</span>
            </span>
            <button
              onClick={() => setSelectedFamilyMember('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedFamilyMember === 'all'
                  ? 'bg-white text-black shadow-sm'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Tutti (4)
            </button>
            {FAMILY_MEMBERS.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelectedFamilyMember(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs transition-all flex items-center gap-2 ${
                  selectedFamilyMember === m.id
                    ? 'bg-neutral-800 text-white font-bold border border-neutral-600 shadow-sm'
                    : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></span>
                <span>{m.name}</span>
                <span className="text-[10px] text-neutral-500 font-normal hidden sm:inline">({m.role.split('·')[0].trim()})</span>
              </button>
            ))}
          </div>

          {/* Canton & Family Share Trigger */}
          <div className="flex items-center gap-2.5 self-end md:self-center">
            {/* Canton Selector */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
              <span className="text-[11px] font-mono text-neutral-400">Cantone:</span>
              <select
                value={selectedCanton}
                onChange={(e) => setSelectedCanton(e.target.value)}
                className="bg-transparent text-white font-semibold outline-none cursor-pointer text-xs"
              >
                <option value="TI" className="bg-black text-white">🇨🇭 TI · Ticino</option>
                <option value="GR" className="bg-black text-white">🇨🇭 GR · Grigioni</option>
                <option value="ZH" className="bg-black text-white">🇨🇭 ZH · Zurigo</option>
                <option value="VD" className="bg-black text-white">🇨🇭 VD · Vaud</option>
                <option value="GE" className="bg-black text-white">🇨🇭 GE · Ginevra</option>
              </select>
            </div>

            <button
              onClick={() => setShowFamilyShareModal(true)}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-200 hover:text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Smartphone size={13} className="text-emerald-400" />
              <span>Condividi con Famiglia</span>
            </button>
          </div>
        </div>
      )}

      {/* Cantonal School Holiday Banner */}
      {selectedCanton === 'TI' && (contextMode === 'personal' || contextMode === 'all') && (
        <div className="mb-6 p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between text-xs animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <CalendarDays size={14} />
            </span>
            <div>
              <span className="font-bold text-white">Vacanze d’Autunno DECS Canton Ticino: </span>
              <span className="text-neutral-300">24 Ottobre – 01 Novembre 2026</span>
              <span className="text-neutral-500 ml-2 hidden sm:inline">(Scuole dell’obbligo e licei cantonali chiusi)</span>
            </div>
          </div>
          <span className="hidden sm:inline font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
            Tra 5 giorni
          </span>
        </div>
      )}

      {/* Main Grid: Sidebar + Calendar Canvas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Sidebar */}
        <aside className="lg:col-span-3 space-y-5">
          {/* Mini Month Picker */}
          <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a]">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-900">
              <span className="text-xs font-bold text-white">
                {monthNames[currentMonth]} {currentYear}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase text-neutral-500 mb-2">
              {weekdayShort.map((w) => (
                <span key={w}>{w[0]}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {monthCalendarDays.map((item, idx) => {
                if (!item) return <div key={`mini-empty-${idx}`} className="h-6"></div>;
                const isSelected = selectedDate === item.dateStr;
                const hasEvents = events.some((e) => e.date === item.dateStr);

                return (
                  <button
                    key={item.dateStr}
                    onClick={() => {
                      setSelectedDate(item.dateStr);
                    }}
                    className={`h-6 rounded-md text-[11px] font-medium transition-all relative flex items-center justify-center ${
                      isSelected
                        ? 'bg-white text-black font-bold'
                        : item.isToday
                        ? 'text-white border border-neutral-700 bg-neutral-900'
                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    <span>{item.dayNum}</span>
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-neutral-400"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* WIDGET PERSONALE 1: Cose da Fare Oggi (To-Do Personali) */}
          {(contextMode === 'personal' || contextMode === 'all') && (
            <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckSquare size={13} className="text-emerald-400" />
                  <span>Attività & To-Do di Giornata</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">
                  {personalTasks.filter((t) => t.completed).length}/{personalTasks.length}
                </span>
              </div>

              <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                {personalTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => togglePersonalTask(task.id)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/70 hover:bg-neutral-900 border border-neutral-900/80 transition-colors cursor-pointer text-xs"
                  >
                    {task.completed ? (
                      <CheckSquare size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Square size={14} className="text-neutral-500 shrink-0" />
                    )}
                    <span
                      className={`truncate text-[11px] ${
                        task.completed ? 'line-through text-neutral-500' : 'text-neutral-200'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add task inline */}
              <div className="flex items-center gap-1.5 pt-1">
                <input
                  type="text"
                  value={newTaskInput}
                  onChange={(e) => setNewTaskInput(e.target.value)}
                  placeholder="Aggiungi promemoria..."
                  className="flex-1 px-2.5 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-white outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateTask(newTaskInput);
                    }
                  }}
                />
                <button
                  onClick={() => handleCreateTask(newTaskInput)}
                  className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          )}

          {/* WIDGET PERSONALE 2: Scadenze Svizzere & Civiche */}
          {(contextMode === 'personal' || contextMode === 'all') && (
            <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flag size={13} className="text-red-500" />
                  <span>Scadenze Elvetiche & Civiche 🇨🇭</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Ufficiali</span>
              </div>

              <div className="space-y-2">
                {SWISS_DEADLINES.slice(0, 3).map((dl) => (
                  <div
                    key={dl.id}
                    className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-900 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-white truncate max-w-[150px]">
                        {dl.title}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-900/60 font-semibold shrink-0">
                        {dl.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {dl.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WIDGET PERSONALE 3: Raccolta Rifiuti Comunale & Ecocentro */}
          {(contextMode === 'personal' || contextMode === 'all') && (
            <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Package size={13} className="text-amber-400" />
                  <span>Rifiuti Comunali & Ecocentro</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">Bioggio/Lugano</span>
              </div>

              <div className="space-y-1.5">
                {WASTE_COLLECTION_SCHEDULE.map((w) => (
                  <div
                    key={w.id}
                    className="p-2 rounded-xl bg-neutral-950 border border-neutral-900 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white text-[11px]">{w.title}</div>
                      <div className="text-[10px] text-neutral-400">{w.dayOfWeek}</div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-800">
                      {w.badge.split('·')[0].trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WIDGET PERSONALE 4: MeteoSvizzera Previsioni Weekend */}
          {(contextMode === 'personal' || contextMode === 'all') && (
            <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sun size={13} className="text-amber-400" />
                  <span>Meteo Weekend Svizzera</span>
                </div>
                <span className="text-[10px] font-mono text-neutral-500">MeteoSvizzera</span>
              </div>

              <div className="space-y-2">
                {SWISS_WEEKEND_FORECASTS.map((fc, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-900 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white text-[11px]">{fc.location}</span>
                      <span className="font-mono text-[10px] text-amber-400">{fc.temp}</span>
                    </div>
                    <div className="text-[10px] text-neutral-300 font-medium">{fc.day} · {fc.condition}</div>
                    <div className="text-[10px] text-neutral-500 italic">{fc.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Calendars & Category Filters */}
          <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                {contextMode === 'personal' ? 'I Miei Calendari Personali' : 'I Miei Calendari'}
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                {filteredEvents.length} impegni
              </span>
            </div>

            <div className="space-y-1.5">
              {CALENDAR_CATEGORIES.filter((cat) => {
                if (contextMode === 'personal') return cat.group === 'personal' || cat.group === 'civic';
                if (contextMode === 'work') return cat.group === 'work';
                return true;
              }).map((cat) => {
                const isActive = activeCategories[cat.id];
                const count = events.filter((e) => e.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    onClick={() =>
                      setActiveCategories((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                    }
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                      isActive
                        ? 'bg-neutral-900/60 text-white border border-neutral-800'
                        : 'text-neutral-500 hover:bg-neutral-900/30 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      ></span>
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-950">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Sync Feeds / Webcal Reassurance */}
            <div className="pt-3 border-t border-neutral-900/80 flex items-center justify-between text-[11px] text-neutral-400">
              <button
                onClick={() => setShowSyncModal(true)}
                className="hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <Share2 size={12} />
                <span>Sincronizza iPhone / Mac</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <Upload size={12} />
                <span>Carica .ics</span>
              </button>
            </div>
          </div>

          {/* WIDGET PROFESSIONALE: Link Pubblico & Regole (Solo se in modalità work o all) */}
          {(contextMode === 'work' || contextMode === 'all') && (
            <div className="p-4 rounded-2xl border border-neutral-900 bg-[#0a0a0a] space-y-3">
              <div className="text-xs font-bold text-white flex items-center justify-between">
                <span>Vetrina Pubblica & Booking</span>
                <button
                  onClick={onOpenPublicBooking}
                  className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                >
                  <span>Apri</span>
                  <ExternalLink size={11} />
                </button>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-neutral-300 truncate">
                  calendario.ch/{profile.handle}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-medium transition-colors shrink-0"
                >
                  {copiedLink ? 'Copiato!' : 'Copia'}
                </button>
              </div>
              <div className="text-[11px] text-neutral-400 flex items-center justify-between pt-1">
                <span>Buffer Incontri:</span>
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="font-mono text-white underline hover:text-neutral-200"
                >
                  {availabilityRules.bufferMinutes} min
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Main Calendar Viewport */}
        <section className="lg:col-span-9 rounded-3xl border border-neutral-800 bg-[#0a0a0a] shadow-2xl overflow-hidden flex flex-col">
          {/* Calendar Header Bar */}
          <div className="p-4 sm:p-5 border-b border-neutral-900 bg-neutral-950/70 flex flex-wrap items-center justify-between gap-4">
            {/* Left Nav */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-xs font-medium text-white transition-all hover:bg-neutral-800"
              >
                Oggi
              </button>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 rounded-lg border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="text-sm sm:text-base font-bold text-white tracking-tight ml-1">
                {viewType === 'week' ? (
                  <span>
                    {currentWeekDays[0].dayNum} {monthNames[currentWeekDays[0].month]} – {currentWeekDays[6].dayNum} {monthNames[currentWeekDays[6].month]} {currentYear}
                  </span>
                ) : viewType === 'day' ? (
                  <span>
                    {new Date(selectedDate).getDate()} {monthNames[new Date(selectedDate).getMonth()]} {currentYear}
                  </span>
                ) : (
                  <span>
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                )}
              </div>
            </div>

            {/* View Selector Tabs */}
            <div className="flex items-center p-1 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs">
              <button
                onClick={() => setViewType('month')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'month'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Mese
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'week'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Settimana
              </button>
              <button
                onClick={() => setViewType('day')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'day'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Giorno
              </button>
              <button
                onClick={() => setViewType('agenda')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  viewType === 'agenda'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Agenda
              </button>
            </div>
          </div>

          {/* VIEW: SETTIMANA (WEEK VIEW) */}
          {viewType === 'week' && (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Week Header Row */}
                <div className="grid grid-cols-8 border-b border-neutral-900 bg-neutral-950/40 text-center sticky top-0 z-20">
                  <div className="p-3 text-[11px] font-mono text-neutral-500 border-r border-neutral-900">
                    Ora
                  </div>
                  {currentWeekDays.map((d) => (
                    <div
                      key={d.dateStr}
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`p-3 border-r border-neutral-900 last:border-r-0 cursor-pointer transition-colors ${
                        d.isSelected
                          ? 'bg-neutral-900/60'
                          : 'hover:bg-neutral-900/30'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase text-neutral-500">
                        {d.shortName}
                      </div>
                      <div
                        className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full ${
                          d.isToday
                            ? 'bg-white text-black'
                            : d.isSelected
                            ? 'text-white'
                            : 'text-neutral-300'
                        }`}
                      >
                        {d.dayNum}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots Table */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="grid grid-cols-8 border-b border-neutral-900/60 min-h-[64px]"
                    >
                      {/* Hour Label */}
                      <div className="p-2 text-[11px] font-mono text-neutral-500 border-r border-neutral-900/80 text-right pr-3 select-none">
                        {hour}
                      </div>

                      {/* Day Columns */}
                      {currentWeekDays.map((d) => {
                        const dayEvents = filteredEvents.filter((e) => {
                          if (e.date !== d.dateStr) return false;
                          const startH = parseInt(e.startTime.split(':')[0], 10);
                          const curH = parseInt(hour.split(':')[0], 10);
                          return startH === curH;
                        });

                        return (
                          <div
                            key={`${d.dateStr}-${hour}`}
                            onClick={() => openCreateModal(d.dateStr, hour)}
                            className="p-1 border-r border-neutral-900/60 last:border-r-0 relative group hover:bg-neutral-900/30 transition-colors cursor-pointer"
                          >
                            {dayEvents.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={14} className="text-neutral-600" />
                              </div>
                            )}

                            {dayEvents.map((evt) => {
                              const cat = getCatInfo(evt.category);
                              return (
                                <div
                                  key={evt.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetailModal(evt);
                                  }}
                                  className={`mb-1 p-2 rounded-xl text-left border text-xs shadow-md transition-all hover:scale-[1.02] cursor-pointer ${
                                    cat.badgeBg
                                  } border-l-4 ${cat.badgeBorder}`}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-mono text-[10px] font-bold opacity-80">
                                      {evt.startTime} - {evt.endTime}
                                    </span>
                                    {evt.isPrivate && (
                                      <Lock size={10} className="text-amber-400 shrink-0" title="Impegno Riservato" />
                                    )}
                                  </div>
                                  <div className="font-semibold text-neutral-100 truncate mt-0.5">
                                    {evt.title}
                                  </div>
                                  {evt.location && (
                                    <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1 mt-0.5">
                                      <MapPin size={10} />
                                      <span>{evt.location}</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MESE (MONTH VIEW) */}
          {viewType === 'month' && (
            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-7 gap-px bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-900">
                {weekdayNames.map((w) => (
                  <div key={w} className="p-2.5 bg-neutral-950 text-center text-xs font-mono uppercase text-neutral-400 font-semibold">
                    {w.slice(0, 3)}
                  </div>
                ))}

                {monthCalendarDays.map((item, idx) => {
                  if (!item) {
                    return <div key={`month-empty-${idx}`} className="bg-[#0a0a0a] min-h-[105px]"></div>;
                  }

                  const dayEvts = filteredEvents.filter((e) => e.date === item.dateStr);

                  return (
                    <div
                      key={item.dateStr}
                      onClick={() => {
                        setSelectedDate(item.dateStr);
                        openCreateModal(item.dateStr);
                      }}
                      className={`bg-[#0a0a0a] p-2 min-h-[105px] border-t border-neutral-900/60 hover:bg-neutral-900/40 transition-colors cursor-pointer flex flex-col justify-between group`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                            item.isToday
                              ? 'bg-white text-black'
                              : item.isSelected
                              ? 'text-white border border-neutral-700'
                              : 'text-neutral-400'
                          }`}
                        >
                          {item.dayNum}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCreateModal(item.dateStr);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-opacity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="space-y-1 mt-1 max-h-[75px] overflow-y-auto custom-scrollbar">
                        {dayEvts.slice(0, 2).map((evt) => {
                          const cat = getCatInfo(evt.category);
                          return (
                            <div
                              key={evt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDetailModal(evt);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] truncate border-l-2 font-medium ${cat.badgeBg} ${cat.badgeBorder}`}
                              title={evt.title}
                            >
                              <span>{evt.startTime} </span>
                              <span>{evt.title}</span>
                            </div>
                          );
                        })}
                        {dayEvts.length > 2 && (
                          <div className="text-[9px] font-mono text-neutral-500 pl-1">
                            +{dayEvts.length - 2} altri
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: GIORNO (DAY VIEW) */}
          {viewType === 'day' && (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {new Date(selectedDate).toLocaleDateString('it-CH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {filteredEvents.filter((e) => e.date === selectedDate).length} impegni in programma per oggi
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal(selectedDate)}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Aggiungi Slot</span>
                </button>
              </div>

              <div className="space-y-3">
                {HOURS.map((hour) => {
                  const hourEvents = filteredEvents.filter((e) => {
                    if (e.date !== selectedDate) return false;
                    return parseInt(e.startTime.split(':')[0], 10) === parseInt(hour.split(':')[0], 10);
                  });

                  return (
                    <div
                      key={hour}
                      onClick={() => openCreateModal(selectedDate, hour)}
                      className="flex items-start gap-4 p-3 rounded-2xl border border-neutral-900 hover:border-neutral-800 bg-neutral-950/40 hover:bg-neutral-900/30 transition-all cursor-pointer group"
                    >
                      <div className="w-16 font-mono text-xs text-neutral-500 pt-1 shrink-0">
                        {hour}
                      </div>

                      <div className="flex-1 space-y-2">
                        {hourEvents.length === 0 ? (
                          <div className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors py-1 flex items-center gap-1">
                            <Plus size={12} className="opacity-0 group-hover:opacity-100" />
                            <span>Orario libero</span>
                          </div>
                        ) : (
                          hourEvents.map((evt) => {
                            const cat = getCatInfo(evt.category);
                            return (
                              <div
                                key={evt.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailModal(evt);
                                }}
                                className={`p-4 rounded-2xl border shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${cat.badgeBg} border-l-4 ${cat.badgeBorder}`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold">
                                      {evt.startTime} – {evt.endTime}
                                    </span>
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-900/80 text-neutral-300">
                                      {cat.label}
                                    </span>
                                    {evt.isPrivate && (
                                      <span className="text-[10px] text-amber-400 flex items-center gap-1">
                                        <Lock size={11} />
                                        <span>Riservato</span>
                                      </span>
                                    )}
                                  </div>
                                  <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                                  {evt.description && (
                                    <p className="text-xs text-neutral-400 max-w-xl">
                                      {evt.description}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 pt-1">
                                    {evt.location && (
                                      <span className="flex items-center gap-1">
                                        <MapPin size={12} />
                                        <span>{evt.location}</span>
                                      </span>
                                    )}
                                    {evt.meetUrl && (
                                      <a
                                        href={evt.meetUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-white hover:underline flex items-center gap-1 font-medium"
                                      >
                                        <Video size={12} />
                                        <span>Apri Videochiamata</span>
                                      </a>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDetailModal(evt);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium border border-neutral-700 self-start sm:self-center"
                                >
                                  Dettagli
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: AGENDA (CHRONOLOGICAL LIST) */}
          {viewType === 'agenda' && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="pb-3 border-b border-neutral-900 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Elenco Cronologico Impegni</h3>
                  <p className="text-xs text-neutral-400">
                    Tutti gli appuntamenti, le riunioni e i momenti personali ordinati nel tempo
                  </p>
                </div>
                <button
                  onClick={() => openCreateModal()}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Nuovo Impegno</span>
                </button>
              </div>

              <div className="space-y-4">
                {filteredEvents
                  .slice()
                  .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
                  .map((evt) => {
                    const cat = getCatInfo(evt.category);
                    return (
                      <div
                        key={evt.id}
                        onClick={() => openDetailModal(evt)}
                        className={`p-4 rounded-2xl border bg-neutral-950/70 hover:bg-neutral-900/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 ${cat.badgeBorder}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 text-center shrink-0 min-w-[70px]">
                            <div className="text-[10px] font-mono uppercase text-neutral-400">
                              {new Date(evt.date).toLocaleDateString('it-CH', { month: 'short' })}
                            </div>
                            <div className="text-xl font-black text-white">
                              {new Date(evt.date).getDate()}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-500">
                              {new Date(evt.date).toLocaleDateString('it-CH', { weekday: 'short' })}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-neutral-300">
                                {evt.startTime} – {evt.endTime}
                              </span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                                {cat.label}
                              </span>
                              {evt.isPrivate && (
                                <span className="text-[10px] text-amber-400 flex items-center gap-1 font-medium">
                                  <Lock size={11} />
                                  <span>Riservato</span>
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-white">{evt.title}</h4>
                            {evt.description && (
                              <p className="text-xs text-neutral-400 line-clamp-1 max-w-xl">
                                {evt.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-neutral-400 pt-0.5">
                              {evt.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin size={11} />
                                  <span>{evt.location}</span>
                                </span>
                              )}
                              {evt.clientName && (
                                <span className="flex items-center gap-1 text-blue-400">
                                  <User size={11} />
                                  <span>Cliente: {evt.clientName}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(evt);
                            }}
                            className="p-2 rounded-xl border border-neutral-800 hover:border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-white transition-colors"
                            title="Modifica"
                          >
                            <CalendarDays size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteEvent(evt.id);
                            }}
                            className="p-2 rounded-xl border border-neutral-800 hover:border-red-900 bg-neutral-900 text-neutral-400 hover:text-red-400 transition-colors"
                            title="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-4 border-t border-neutral-900 bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-500 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>calendario.ch · Server Zurigo (Svizzera) · Standard RFC 5545</span>
            </span>
            <div className="flex items-center gap-4">
              <button
                onClick={handleExportFullCalendar}
                className="hover:text-white transition-colors flex items-center gap-1"
              >
                <Download size={12} />
                <span>Esporta Tutto (.ics)</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: COMMAND BAR & RICERCA RAPIDA (Cmd+K) */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-4 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-neutral-950 border border-neutral-800">
              <Search size={18} className="text-neutral-400" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca impegni personali, famiglia, clienti, luoghi..."
                className="flex-1 bg-transparent border-0 text-white text-sm outline-none placeholder:text-neutral-500"
              />
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-neutral-500 hover:text-white text-xs px-2 py-1 rounded bg-neutral-900"
              >
                ESC
              </button>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {searchQuery.trim() === '' ? (
                <div className="p-4 text-center text-xs text-neutral-500">
                  Digita per cercare tra tutti gli impegni personali, compiti e appuntamenti...
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500">
                  Nessun impegno trovato per "{searchQuery}".
                </div>
              ) : (
                searchResults.map((evt) => {
                  const cat = getCatInfo(evt.category);
                  return (
                    <div
                      key={evt.id}
                      onClick={() => {
                        setShowSearchModal(false);
                        openDetailModal(evt);
                      }}
                      className="p-3 rounded-2xl border border-neutral-900 hover:border-neutral-700 bg-neutral-950/60 hover:bg-neutral-900/80 transition-all cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badgeBg}`}>
                            {cat.label}
                          </span>
                          <span className="font-mono text-xs text-neutral-400">
                            {evt.date} · {evt.startTime}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-white truncate">
                          {evt.title}
                        </div>
                        {evt.location && (
                          <div className="text-[11px] text-neutral-400 truncate">
                            {evt.location}
                          </div>
                        )}
                      </div>
                      <ArrowRight size={14} className="text-neutral-500 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUFFER TIME & REGOLE DISPONIBILITÀ */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Regole di Disponibilità & Buffer</h3>
                  <p className="text-[11px] text-neutral-400">Proteggi i tuoi ritmi lavorativi ed evita il burnout</p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <Coffee size={14} className="text-amber-400" />
                    <span>Pausa Automatica tra Appuntamenti (Buffer Time)</span>
                  </div>
                  <span className="font-mono text-white font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
                    {availabilityRules.bufferMinutes} min
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Aggiunge automaticamente un intervallo di pausa prima e dopo ogni appuntamento per redigere appunti o riposare.
                </p>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[0, 10, 15, 30].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => setAvailabilityRules((r) => ({ ...r, bufferMinutes: mins }))}
                      className={`py-1.5 rounded-xl border text-xs font-mono font-medium transition-all ${
                        availabilityRules.bufferMinutes === mins
                          ? 'border-white bg-white text-black font-bold'
                          : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {mins === 0 ? 'Nessuno' : `+${mins} min`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-400" />
                  <span>Orario di Reperibilità Lavorativo</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-neutral-400 text-[10px] block mb-1">Inizio</label>
                    <input
                      type="time"
                      value={availabilityRules.startHour}
                      onChange={(e) => setAvailabilityRules((r) => ({ ...r, startHour: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 text-[10px] block mb-1">Fine</label>
                    <input
                      type="time"
                      value={availabilityRules.endHour}
                      onChange={(e) => setAvailabilityRules((r) => ({ ...r, endHour: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-black border border-neutral-800 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors shadow-md"
              >
                Salva Regole
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREA / MODIFICA EVENTO */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Calendar size={16} />
                </div>
                <h3 className="text-base font-bold text-white">
                  {formId ? 'Modifica Impegno' : 'Nuovo Impegno in Agenda'}
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Titolo dell'Impegno *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="es. Gita Monte Brè, Visita Pediatra, Allenamento Cornaredo, Bolletta..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none transition-colors"
                />
              </div>

              {/* Date, Start, End Time */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Ora Inizio</label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Ora Fine</label>
                  <input
                    type="time"
                    required
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Categoria</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CALENDAR_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFormCategory(c.id)}
                      className={`p-2 rounded-xl border text-left transition-all flex items-center gap-2 ${
                        formCategory === c.id
                          ? 'border-white bg-neutral-900 text-white font-bold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }}></span>
                      <span className="truncate">{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Family Member Association */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Chi riguarda questo impegno? (Famiglia & Casa)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormFamilyMemberId('')}
                    className={`p-2 rounded-xl border text-center transition-all text-xs ${
                      !formFamilyMemberId
                        ? 'border-white bg-neutral-900 text-white font-bold'
                        : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Tutti
                  </button>
                  {FAMILY_MEMBERS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormFamilyMemberId(m.id)}
                      className={`p-2 rounded-xl border text-center transition-all text-xs flex items-center justify-center gap-1.5 ${
                        formFamilyMemberId === m.id
                          ? 'border-white bg-neutral-900 text-white font-bold'
                          : 'border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }}></span>
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location or Video Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Luogo / Indirizzo</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="es. Lugano, Campo Cornaredo, Clinica Moncucco..."
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-neutral-300 font-semibold mb-1">Link o Contatto (opz.)</label>
                  <input
                    type="text"
                    value={formMeetUrl}
                    onChange={(e) => setFormMeetUrl(e.target.value)}
                    placeholder="https://... o tel"
                    className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Privacy and Availability Toggles */}
              <div className="p-3.5 rounded-2xl border border-neutral-900 bg-neutral-950/90 space-y-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="chk-private"
                    checked={formIsPrivate}
                    onChange={(e) => setFormIsPrivate(e.target.checked)}
                    className="mt-0.5 rounded accent-white"
                  />
                  <div>
                    <label htmlFor="chk-private" className="font-bold text-white cursor-pointer flex items-center gap-1.5">
                      <Lock size={12} className="text-amber-400" />
                      <span>Impegno Privato & Riservato</span>
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      I dettagli restano solo a te. Nessuno vedrà note o titolo.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-neutral-900">
                  <input
                    type="checkbox"
                    id="chk-blocks"
                    checked={formBlocksBooking}
                    onChange={(e) => setFormBlocksBooking(e.target.checked)}
                    className="mt-0.5 rounded accent-white"
                  />
                  <div>
                    <label htmlFor="chk-blocks" className="font-bold text-white cursor-pointer flex items-center gap-1.5">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>Proteggi questo orario da appuntamenti di lavoro</span>
                    </label>
                    <p className="text-[11px] text-neutral-400">
                      Rende questo slot orario "Occupato" sul link pubblico di prenotazione.
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Note & Promemoria
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Dettagli aggiuntivi, cose da portare..."
                  className="w-full px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs outline-none custom-scrollbar"
                ></textarea>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between">
                {formId ? (
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEvent(formId);
                      setShowCreateModal(false);
                    }}
                    className="px-3 py-2 rounded-xl border border-red-900/60 bg-red-950/20 text-red-400 hover:bg-red-950/40 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={13} />
                    <span>Elimina</span>
                  </button>
                ) : (
                  <div></div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs font-medium transition-colors"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    Salva Impegno
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETTAGLI EVENTO */}
      {showDetailModal && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCatInfo(selectedEvent.category).color }}
                ></span>
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  {getCatInfo(selectedEvent.category).label}
                </span>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-white leading-tight">
                {selectedEvent.title}
              </h3>

              <div className="space-y-2 text-xs text-neutral-300 pt-1">
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-neutral-500" />
                  <span>
                    {selectedEvent.date} · <strong>{selectedEvent.startTime} – {selectedEvent.endTime}</strong>
                  </span>
                </div>

                {selectedEvent.location && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-neutral-500" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}

                {selectedEvent.meetUrl && (
                  <div className="flex items-center gap-2">
                    <Video size={14} className="text-neutral-500" />
                    <a
                      href={selectedEvent.meetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-white hover:underline font-semibold"
                    >
                      Partecipa alla Videochiamata
                    </a>
                  </div>
                )}

                {selectedEvent.clientName && (
                  <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-900 space-y-1 mt-2">
                    <div className="text-[10px] uppercase font-bold text-neutral-400">Dati Cliente (Prenotazione Web)</div>
                    <div className="font-bold text-white">{selectedEvent.clientName}</div>
                    {selectedEvent.clientEmail && <div className="text-neutral-400">{selectedEvent.clientEmail}</div>}
                    {selectedEvent.clientPhone && <div className="text-neutral-400">{selectedEvent.clientPhone}</div>}
                  </div>
                )}

                {selectedEvent.description && (
                  <p className="text-xs text-neutral-400 pt-1 leading-relaxed">
                    {selectedEvent.description}
                  </p>
                )}

                {/* Interactive Checklist */}
                {(selectedEvent.checklist || []).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-neutral-900 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-white">
                      <span className="flex items-center gap-1.5">
                        <CheckSquare size={13} className="text-white" />
                        <span>Checklist Attività</span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      {(selectedEvent.checklist || []).map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => toggleDetailChecklist(idx)}
                          className="flex items-center gap-2 p-2 rounded-xl bg-neutral-950/70 border border-neutral-900 hover:border-neutral-800 transition-colors cursor-pointer text-xs"
                        >
                          {item.done ? (
                            <CheckSquare size={14} className="text-emerald-400 shrink-0" />
                          ) : (
                            <Square size={14} className="text-neutral-500 shrink-0" />
                          )}
                          <span className={item.done ? 'line-through text-neutral-500' : 'text-neutral-200'}>
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  {selectedEvent.isPrivate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                      <Lock size={10} />
                      <span>Dettagli Protetti</span>
                    </span>
                  )}
                  {selectedEvent.blocksBooking && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 border border-neutral-800 text-neutral-300">
                      Blocca slot pubblico
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-neutral-900 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  onDeleteEvent(selectedEvent.id);
                  setShowDetailModal(false);
                }}
                className="px-3 py-2 rounded-xl text-neutral-500 hover:text-red-400 hover:bg-red-950/20 text-xs font-medium transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={13} />
                <span>Elimina</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadIcsFile(selectedEvent)}
                  className="px-3 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-900 text-neutral-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="Scarica .ics"
                >
                  <Download size={13} />
                  <span>.ics</span>
                </button>
                <button
                  onClick={() => openEditModal(selectedEvent)}
                  className="px-4 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md"
                >
                  Modifica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WEBCAL / SINCRONIZZAZIONE ESTERNA */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold">
                  <Share2 size={16} />
                </div>
                <h3 className="text-base font-bold text-white">
                  Sincronizzazione Calendario Svizzero
                </h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Calendar size={13} />
                  <span>Abbonamento Webcal (Apple, Google, Outlook, Proton)</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Copia questo link e incollalo nel tuo client preferito (iPhone Calendar, Mac Calendar, Outlook 365, Google Calendar) per sincronizzare automaticamente tutti i tuoi impegni in sola lettura:
                </p>
                <div className="p-2 rounded-xl bg-black border border-neutral-800 flex items-center justify-between gap-2">
                  <code className="font-mono text-[11px] text-neutral-300 truncate">
                    webcal://calendario.ch/feed/{profile.handle}.ics
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`webcal://calendario.ch/feed/${profile.handle}.ics`);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-medium shrink-0"
                  >
                    {copiedLink ? 'Copiato!' : 'Copia'}
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Download size={13} />
                  <span>Esportazione File Standard .ics (RFC 5545)</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Scarica subito l'intero archivio degli appuntamenti in un file compatibile con qualsiasi software di calendario.
                </p>
                <button
                  onClick={handleExportFullCalendar}
                  className="px-3.5 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 font-bold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Scarica Archivio Completo .ics</span>
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-900 space-y-2">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-400" />
                  <span>Conformità nLPD & Sovranità dei Dati</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  I tuoi dati personali risiedono esclusivamente su server elvetici a Zurigo. Zero profilazione pubblicitaria, privacy totale garantita dalla legge svizzera.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSyncModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONDIVIDI CON FAMIGLIA & WEBCAL */}
      {showFamilyShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-[#0a0a0a] text-white p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-bold shadow-md">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Condivisione Calendario Famiglia
                  </h3>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Sincronizzazione cifrata e sovrana a Zurigo
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowFamilyShareModal(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Condividi gli impegni di casa (scuola dei figli, orari sportivi, visite pediatriche, impegni di coppia) senza mai esporre i tuoi dati personali ad algoritmi pubblicitari. Funziona istantaneamente con l'app <strong className="text-white">Calendario Apple su iPhone e Mac</strong>.
            </p>

            {/* Current Family Members */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-neutral-300">
                Membri della Famiglia ({FAMILY_MEMBERS.length}):
              </span>
              <div className="grid grid-cols-2 gap-2">
                {FAMILY_MEMBERS.map((m) => (
                  <div key={m.id} className="p-2.5 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center gap-2.5">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0" 
                      style={{ backgroundColor: m.color, color: '#000000' }}
                    >
                      {m.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{m.name}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{m.role.split('·')[0].trim()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invite Family Member */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-3">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Mail size={13} className="text-cyan-400" />
                <span>Invita partner o figlio (Email o Cellulare +41)</span>
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={familyInviteEmail}
                  onChange={(e) => setFamilyInviteEmail(e.target.value)}
                  placeholder="es. elena@famiglia.ch o +41 79 ..."
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (familyInviteEmail.trim()) {
                      setFamilyInviteSent(true);
                      setTimeout(() => setFamilyInviteSent(false), 3000);
                      setFamilyInviteEmail('');
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-all shrink-0"
                >
                  {familyInviteSent ? 'Inviato!' : 'Invia Invito'}
                </button>
              </div>
              {familyInviteSent && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> Invito famiglia inviato con successo!
                </div>
              )}
            </div>

            {/* Apple Calendar Webcal Link */}
            <div className="p-4 rounded-2xl border border-neutral-800 bg-neutral-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Smartphone size={13} className="text-white" />
                  <span>Abbonamento Webcal per iPhone & Apple Watch</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Aggiornamento Automatico
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-900 font-mono text-[11px] text-neutral-300 break-all select-all flex items-center justify-between gap-2 border border-neutral-800">
                <span>webcal://calendario.ch/family/bernasconi-99214.ics</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText('webcal://calendario.ch/family/bernasconi-99214.ics');
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] shrink-0 font-sans"
                >
                  {copiedLink ? 'Copiato!' : 'Copia Link'}
                </button>
              </div>
              <p className="text-[10px] text-neutral-400">
                Su iOS: aprendo questo link Safari ti chiederà "Vuoi iscriverti a questo calendario?". Gli impegni di casa appariranno subito nell'app di sistema.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFamilyShareModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-white text-xs font-semibold"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
