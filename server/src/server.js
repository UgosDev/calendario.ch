import express from 'express';
import cors from 'cors';
import { db } from './db.js';
import { sendBookingNotifications } from './mailer.js';

const app = express();
const PORT = process.env.PORT || 8081;

// Reverse proxy Infomaniak dc4-a
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// ── 1. GET /api/public/:handle ──
// Lettura pubblica conforme nLPD (restituisce solo slot attivi e intervalli occupati anonimi)
app.get('/api/public/:handle', (req, res) => {
  const handle = req.params.handle.toLowerCase();

  const owner = db.prepare('SELECT handle, name, canton, email FROM owners WHERE handle = ?').get(handle);
  if (!owner) {
    return res.status(404).json({ error: `Nessun calendario trovato per @${handle}` });
  }

  const slotRows = db.prepare('SELECT * FROM slot_types WHERE owner_handle = ? AND active = 1').all(handle);
  const slotTypes = slotRows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    duration: r.duration,
    days: JSON.parse(r.days_json),
    from: r.from_time,
    to: r.to_time,
    buffer: r.buffer_min,
    horizon: r.horizon_days,
    notice: r.notice_hours,
    confirm: r.confirm_mode,
    place: r.place,
    priceChf: r.price_chf,
    active: true,
    showInCal: true
  }));

  // Intervalli occupati (busy_intervals + prenotazioni già confermate)
  const busyRows = db.prepare('SELECT date, start_min, end_min FROM busy_intervals WHERE owner_handle = ?').all(handle);
  const bookingRows = db.prepare(
    "SELECT date, start_min, end_min FROM bookings WHERE owner_handle = ? AND status != 'cancelled'"
  ).all(handle);

  const busyIntervals = [
    ...busyRows.map((b) => ({ date: b.date, start: b.start_min, end: b.end_min })),
    ...bookingRows.map((b) => ({ date: b.date, start: b.start_min, end: b.end_min }))
  ];

  return res.json({
    owner: {
      name: owner.name,
      handle: owner.handle,
      canton: owner.canton
    },
    slotTypes,
    busyIntervals
  });
});

// ── 2. POST /api/public/:handle/book ──
// Creazione prenotazione lato server con controllo atomico dei conflitti (anti-double-booking)
app.post('/api/public/:handle/book', async (req, res) => {
  const handle = req.params.handle.toLowerCase();
  const { typeId, date, start, name, email, phone, note } = req.body;

  if (!typeId || !date || start === undefined || !name || !email) {
    return res.status(400).json({ error: 'Campi obbligatori mancanti' });
  }

  const owner = db.prepare('SELECT * FROM owners WHERE handle = ?').get(handle);
  if (!owner) {
    return res.status(404).json({ error: 'Proprietario non trovato' });
  }

  const slot = db.prepare('SELECT * FROM slot_types WHERE id = ? AND owner_handle = ?').get(typeId, handle);
  if (!slot) {
    return res.status(404).json({ error: 'Tipo di slot non valido' });
  }

  const end = start + slot.duration;

  // Verifica conflitti atomica (busy_intervals o bookings attivi nello stesso intervallo)
  const overlapBusy = db.prepare(
    'SELECT id FROM busy_intervals WHERE owner_handle = ? AND date = ? AND NOT (end_min <= ? OR start_min >= ?)'
  ).get(handle, date, start, end);

  if (overlapBusy) {
    return res.status(409).json({ error: 'Conflitto: orario occupato da un impegno del proprietario' });
  }

  const overlapBooking = db.prepare(
    "SELECT id FROM bookings WHERE owner_handle = ? AND date = ? AND status != 'cancelled' AND NOT (end_min <= ? OR start_min >= ?)"
  ).get(handle, date, start, end);

  if (overlapBooking) {
    return res.status(409).json({ error: 'Conflitto: orario già prenotato da un altro cliente' });
  }

  const bookingId = `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const now = Date.now();
  const status = slot.confirm_mode === 'manual' ? 'pending' : 'confirmed';

  db.prepare(`
    INSERT INTO bookings (
      id, owner_handle, type_id, date, start_min, end_min,
      client_name, client_email, client_phone, client_note,
      status, price_chf, is_paid, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    bookingId, handle, typeId, date, start, end,
    name.trim(), email.trim(), phone ? phone.trim() : null, note ? note.trim() : null,
    status, slot.price_chf || 0, slot.price_chf ? 0 : 1, now
  );

  const newBooking = {
    id: bookingId,
    typeId,
    date,
    start,
    end,
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : undefined,
    note: note ? note.trim() : undefined,
    status,
    priceChf: slot.price_chf || 0,
    isPaid: !slot.price_chf,
    created: new Date(now).toISOString()
  };

  // Notifiche email transazionali via Infomaniak Mail
  sendBookingNotifications({
    booking: {
      id: bookingId,
      date,
      start_min: start,
      end_min: end,
      client_name: name.trim(),
      client_email: email.trim(),
      client_phone: phone ? phone.trim() : null,
      client_note: note ? note.trim() : null
    },
    slotName: slot.name,
    ownerName: owner.name,
    ownerEmail: owner.email
  }).catch((err) => console.error('[Server] Errore notifica email:', err));

  return res.status(201).json({ success: true, booking: newBooking });
});

// ── 3. POST /api/owner/sync ──
// Il proprietario sincronizza la configurazione slot e scarica le nuove prenotazioni
app.post('/api/owner/sync', (req, res) => {
  const { handle, slotTypes, busyIntervals, ownerName, ownerEmail, canton } = req.body;
  if (!handle) return res.status(400).json({ error: 'Handle obbligatorio' });

  const h = handle.toLowerCase();
  const now = Date.now();

  // Upsert owner
  db.prepare(`
    INSERT INTO owners (handle, name, email, canton, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(handle) DO UPDATE SET
      name = coalesce(excluded.name, owners.name),
      email = coalesce(excluded.email, owners.email),
      canton = coalesce(excluded.canton, owners.canton),
      updated_at = excluded.updated_at
  `).run(h, ownerName || h, ownerEmail || null, canton || 'TI', now);

  // Aggiorna slot_types se passati
  if (Array.isArray(slotTypes)) {
    db.prepare('DELETE FROM slot_types WHERE owner_handle = ?').run(h);
    const insertSlot = db.prepare(`
      INSERT INTO slot_types (
        id, owner_handle, name, slug, duration, days_json, from_time, to_time,
        buffer_min, horizon_days, notice_hours, confirm_mode, place, price_chf, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of slotTypes) {
      insertSlot.run(
        s.id, h, s.name, s.slug, s.duration, JSON.stringify(s.days || [1,2,3,4,5]),
        s.from || '09:00', s.to || '17:30', s.buffer || 15, s.horizon || 30,
        s.notice || 24, s.confirm || 'auto', s.place || 'video', s.priceChf || 0,
        s.active ? 1 : 0
      );
    }
  }

  // Aggiorna busy_intervals
  if (Array.isArray(busyIntervals)) {
    db.prepare('DELETE FROM busy_intervals WHERE owner_handle = ?').run(h);
    const insertBusy = db.prepare(`
      INSERT INTO busy_intervals (id, owner_handle, date, start_min, end_min)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (let i = 0; i < busyIntervals.length; i++) {
      const b = busyIntervals[i];
      insertBusy.run(`busy-${h}-${i}-${Date.now()}`, h, b.date, b.start, b.end);
    }
  }

  // Restituisce tutte le prenotazioni del proprietario
  const rows = db.prepare('SELECT * FROM bookings WHERE owner_handle = ? ORDER BY date DESC, start_min ASC').all(h);
  const bookings = rows.map((r) => ({
    id: r.id,
    typeId: r.type_id,
    date: r.date,
    start: r.start_min,
    end: r.end_min,
    name: r.client_name,
    email: r.client_email,
    phone: r.client_phone || undefined,
    note: r.client_note || undefined,
    status: r.status,
    priceChf: r.price_chf,
    isPaid: Boolean(r.is_paid),
    created: new Date(r.created_at).toISOString()
  }));

  return res.json({ success: true, bookings });
});

// ── 4. GET /api/health ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'calendario.ch API (Infomaniak dc4-a)',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🇨🇭 [calendario.ch server] Attivo su porta ${PORT} (Infomaniak dc4-a)`);
});
