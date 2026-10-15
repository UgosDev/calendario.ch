import { BookingRequest, CalendarEvent } from './types';

function formatDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function generateIcsContent(booking: BookingRequest): string {
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hours, minutes] = booking.timeSlot.split(':').map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + (booking.durationMinutes || 45) * 60000);

  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const nowStr = formatDate(new Date());

  const locationStr =
    booking.meetingLocation === 'office'
      ? 'Via Lugano 1A, 6934 Bioggio (Sede MT Financial Consulting)'
      : booking.meetingLocation === 'video'
      ? 'Videochiamata protetta (link inviato via email)'
      : 'Al domicilio del cliente';

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//calendario.ch//Scheduling & Agenda Privata Elvetica//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:calendario-${booking.id}@calendario.ch`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${booking.serviceName} con ${booking.professionalName}`,
    `DESCRIPTION:Appuntamento confermato tramite calendario.ch.\\n\\nConsulente: ${booking.professionalName}\\nCliente: ${booking.clientName}\\nTelefono: ${booking.clientPhone}\\nNote: ${booking.clientNotes || 'Nessuna'}`,
    `LOCATION:${locationStr}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT60M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria appuntamento tra 1 ora',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function generateEventIcs(event: CalendarEvent): string {
  const [year, month, day] = event.date.split('-').map(Number);
  const [startH, startM] = event.startTime.split(':').map(Number);
  const [endH, endM] = event.endTime.split(':').map(Number);

  const start = new Date(year, month - 1, day, startH, startM);
  const end = new Date(year, month - 1, day, endH, endM);

  const startStr = formatDate(start);
  const endStr = formatDate(end);
  const nowStr = formatDate(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//calendario.ch//Agenda Privata//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@calendario.ch`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    event.location ? `LOCATION:${event.location}` : '',
    event.meetUrl ? `URL:${event.meetUrl}` : '',
    event.isPrivate ? 'CLASS:PRIVATE' : 'CLASS:PUBLIC',
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Promemoria imminente',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.join('\r\n');
}

export function generateMultiEventIcs(events: CalendarEvent[], calendarName: string = 'calendario.ch'): string {
  const nowStr = formatDate(new Date());

  const vevents = events.map((event) => {
    const [year, month, day] = event.date.split('-').map(Number);
    const [startH, startM] = event.startTime.split(':').map(Number);
    const [endH, endM] = event.endTime.split(':').map(Number);

    const start = new Date(year, month - 1, day, startH, startM);
    const end = new Date(year, month - 1, day, endH, endM);

    const startStr = formatDate(start);
    const endStr = formatDate(end);

    return [
      'BEGIN:VEVENT',
      `UID:${event.id}@calendario.ch`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
      event.location ? `LOCATION:${event.location}` : '',
      event.meetUrl ? `URL:${event.meetUrl}` : '',
      event.isPrivate ? 'CLASS:PRIVATE' : 'CLASS:PUBLIC',
      'STATUS:CONFIRMED',
      'END:VEVENT',
    ].filter(Boolean).join('\r\n');
  });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//calendario.ch//Agenda Privata//IT',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...vevents,
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(data: BookingRequest | CalendarEvent | CalendarEvent[] | any) {
  let content = '';
  let filename = 'calendario.ics';

  if (Array.isArray(data)) {
    content = generateMultiEventIcs(data, 'Agenda calendario.ch');
    filename = `agenda-calendario-${new Date().toISOString().split('T')[0]}.ics`;
  } else if ('serviceId' in data) {
    content = generateIcsContent(data as BookingRequest);
    filename = `appuntamento-${(data as BookingRequest).professionalHandle}-${data.date}.ics`;
  } else if ('category' in data) {
    content = generateEventIcs(data as CalendarEvent);
    filename = `impegno-${(data as CalendarEvent).date}.ics`;
  } else if ('title' in data && 'startDateStr' in data) {
    // Custom wrapper support
    const fakeEvt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: data.title,
      description: data.description || '',
      date: data.startDateStr,
      startTime: data.startTimeStr || '10:00',
      endTime: '11:00',
      category: 'work',
      location: data.location || '',
      isPrivate: false,
      blocksBooking: true,
    };
    content = generateEventIcs(fakeEvt);
    filename = `evento-${data.startDateStr}.ics`;
  }

  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// RFC 5545 iCalendar Parser for user file uploads
export function parseIcsContent(icsText: string): Partial<CalendarEvent>[] {
  const events: Partial<CalendarEvent>[] = [];
  const veventBlocks = icsText.split('BEGIN:VEVENT');

  for (let i = 1; i < veventBlocks.length; i++) {
    const block = veventBlocks[i].split('END:VEVENT')[0];
    const lines = block.split(/\r\n|\n|\r/);

    let summary = 'Impegno Importato';
    let description = '';
    let location = '';
    let dtstart = '';
    let dtend = '';
    let isPrivate = false;

    for (const line of lines) {
      if (line.startsWith('SUMMARY:')) {
        summary = line.substring(8).trim().replace(/\\,/g, ',').replace(/\\;/g, ';');
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.substring(12).trim().replace(/\\n/g, '\n').replace(/\\,/g, ',');
      } else if (line.startsWith('LOCATION:')) {
        location = line.substring(9).trim().replace(/\\,/g, ',');
      } else if (line.startsWith('CLASS:PRIVATE')) {
        isPrivate = true;
      } else if (line.includes('DTSTART')) {
        const parts = line.split(':');
        if (parts.length > 1) dtstart = parts[1].trim();
      } else if (line.includes('DTEND')) {
        const parts = line.split(':');
        if (parts.length > 1) dtend = parts[1].trim();
      }
    }

    if (dtstart) {
      // Parse YYYYMMDDTHHMMSS or YYYYMMDD
      const year = dtstart.substring(0, 4);
      const month = dtstart.substring(4, 6);
      const day = dtstart.substring(6, 8);
      const dateStr = `${year}-${month}-${day}`;

      let startH = '09:00';
      if (dtstart.includes('T')) {
        const timePart = dtstart.split('T')[1];
        startH = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
      }

      let endH = '10:00';
      if (dtend && dtend.includes('T')) {
        const timePart = dtend.split('T')[1];
        endH = `${timePart.substring(0, 2)}:${timePart.substring(2, 4)}`;
      }

      events.push({
        id: `imported-${Date.now()}-${i}`,
        title: summary,
        description,
        location,
        date: dateStr,
        startTime: startH,
        endTime: endH,
        category: 'work',
        isPrivate,
        blocksBooking: true,
      });
    }
  }

  return events;
}
