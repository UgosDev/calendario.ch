import { BookingRequest } from './types';

export function generateIcsContent(booking: BookingRequest): string {
  // Parse date and time
  const [year, month, day] = booking.date.split('-').map(Number);
  const [hours, minutes] = booking.timeSlot.split(':').map(Number);

  const start = new Date(year, month - 1, day, hours, minutes);
  const end = new Date(start.getTime() + booking.durationMinutes * 60000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

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
    'PRODID:-//calendario.ch//Scheduling Elvetico//IT',
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

export function downloadIcsFile(booking: BookingRequest) {
  const content = generateIcsContent(booking);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `appuntamento-${booking.professionalHandle}-${booking.date}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
