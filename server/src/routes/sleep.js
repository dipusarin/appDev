const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

const VALID_TYPES = ['nap', 'night'];

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    startedAt: row.started_at,
    durationMin: row.duration_min,
    notes: row.notes,
    loggedByName: row.loggedByName,
    loggedByUserId: row.user_id,
  };
}

router.post('/', (req, res) => {
  const { type, startedAt, durationMin, notes } = req.body || {};
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO sleep_logs (id, baby_id, user_id, type, started_at, duration_min, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.baby.id,
    req.user.id,
    type,
    startedAt || new Date().toISOString(),
    durationMin ?? null,
    notes || null
  );
  const row = db
    .prepare(
      `SELECT s.*, u.name AS loggedByName FROM sleep_logs s
       JOIN users u ON u.id = s.user_id WHERE s.id = ?`
    )
    .get(id);
  res.status(201).json(serialize(row));
});

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare(
      `SELECT s.*, u.name AS loggedByName FROM sleep_logs s
       JOIN users u ON u.id = s.user_id
       WHERE s.baby_id = ? ORDER BY s.started_at DESC LIMIT ?`
    )
    .all(req.baby.id, limit);
  res.json(rows.map(serialize));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM sleep_logs WHERE id = ? AND baby_id = ?').get(req.params.id, req.baby.id);
  if (!existing) {
    return res.status(404).json({ error: 'Sleep log not found' });
  }
  const { type, startedAt, durationMin, notes } = req.body || {};
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
  }
  db.prepare(
    `UPDATE sleep_logs SET type = ?, started_at = ?, duration_min = ?, notes = ? WHERE id = ?`
  ).run(
    type ?? existing.type,
    startedAt ?? existing.started_at,
    durationMin !== undefined ? durationMin : existing.duration_min,
    notes !== undefined ? notes : existing.notes,
    existing.id
  );
  const row = db
    .prepare(
      `SELECT s.*, u.name AS loggedByName FROM sleep_logs s
       JOIN users u ON u.id = s.user_id WHERE s.id = ?`
    )
    .get(existing.id);
  res.json(serialize(row));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM sleep_logs WHERE id = ? AND baby_id = ?').get(req.params.id, req.baby.id);
  if (!existing) {
    return res.status(404).json({ error: 'Sleep log not found' });
  }
  db.prepare('DELETE FROM sleep_logs WHERE id = ?').run(existing.id);
  res.status(204).send();
});

module.exports = router;
