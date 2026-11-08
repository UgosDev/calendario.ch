import nodemailer from 'nodemailer';

const host = process.env.INFOMANIAK_SMTP_HOST || 'mail.infomaniak.com';
const port = parseInt(process.env.INFOMANIAK_SMTP_PORT || '587', 10);
const user = process.env.INFOMANIAK_SMTP_USER;
const pass = process.env.INFOMANIAK_SMTP_PASS;
const fromEmail = process.env.INFOMANIAK_MAIL_FROM || 'notifiche@calendario.ch';

let transporter = null;

if (user && pass) {
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

function generateIcsBuffer(booking, slotName, ownerName) {
  const pad = (n) => String(n).padStart(2, '0');
  const [y, m, d] = booking.date.split('-');
  const sh = pad(Math.floor(booking.start_min / 60));
  const sm = pad(booking.start_min % 60);
  const eh = pad(Math.floor(booking.end_min / 60));
  const em = pad(booking.end_min % 60);

  const startIso = `${y}${m}${d}T${sh}${sm}00`;
  const endIso = `${y}${m}${d}T${eh}${em}00`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//calendario.ch//Infrastruttura Elvetica Infomaniak//IT',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:bk-${booking.id}@calendario.ch`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;TZID=Europe/Zurich:${startIso}`,
    `DTEND;TZID=Europe/Zurich:${endIso}`,
    `SUMMARY:${slotName} — ${ownerName}`,
    `DESCRIPTION:Appuntamento confermato su calendario.ch.\\nCliente: ${booking.client_name}\\nNote: ${booking.client_note || 'Nessuna'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return Buffer.from(ics, 'utf-8');
}

export async function sendBookingNotifications({ booking, slotName, ownerName, ownerEmail }) {
  const pad = (n) => String(n).padStart(2, '0');
  const timeFormatted = `${pad(Math.floor(booking.start_min / 60))}:${pad(booking.start_min % 60)}`;
  const icsAttachment = {
    filename: `appuntamento-${booking.date}.ics`,
    content: generateIcsBuffer(booking, slotName, ownerName),
    contentType: 'text/calendar; charset=utf-8; method=REQUEST'
  };

  const clientMailOptions = {
    from: `calendario.ch <${fromEmail}>`,
    to: booking.client_email,
    subject: `Conferma: ${slotName} con ${ownerName} (${booking.date} alle ${timeFormatted})`,
    text: `Gentile ${booking.client_name},\n\nIl tuo appuntamento per "${slotName}" con ${ownerName} è confermato per il ${booking.date} alle ore ${timeFormatted}.\n\nIn allegato trovi l'invito .ics da aggiungere al tuo calendario.\n\nCordiali saluti,\ncalendario.ch (Infrastruttura Sovrana Svizzera)`,
    attachments: [icsAttachment]
  };

  const ownerMailOptions = ownerEmail ? {
    from: `calendario.ch <${fromEmail}>`,
    to: ownerEmail,
    subject: `Nuova Prenotazione: ${booking.client_name} - ${slotName} (${booking.date} alle ${timeFormatted})`,
    text: `Hai ricevuto una nuova prenotazione da ${booking.client_name} (${booking.client_email}${booking.client_phone ? ', Tel: ' + booking.client_phone : ''}).\n\nData: ${booking.date} alle ${timeFormatted}\nNota: ${booking.client_note || 'Nessuna'}\n\ncalendario.ch • Ecosistema UnHub & Infomaniak`,
    attachments: [icsAttachment]
  } : null;

  if (!transporter) {
    console.log('[Infomaniak Mailer (Dev/Simulazione)] Email inviate in memoria:');
    console.log(`-> Cliente (${booking.client_email}): Appuntamento confermato ${booking.date} ore ${timeFormatted}`);
    if (ownerEmail) {
      console.log(`-> Proprietario (${ownerEmail}): Nuova prenotazione da ${booking.client_name}`);
    }
    return { delivered: false, simulated: true };
  }

  try {
    const p1 = transporter.sendMail(clientMailOptions);
    const p2 = ownerMailOptions ? transporter.sendMail(ownerMailOptions) : Promise.resolve();
    await Promise.all([p1, p2]);
    return { delivered: true, simulated: false };
  } catch (err) {
    console.error('[Infomaniak Mailer] Errore invio SMTP:', err.message);
    return { delivered: false, error: err.message };
  }
}
