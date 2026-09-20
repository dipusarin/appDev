const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

function serialize(row) {
  return {
    id: row.id,
    startedAt: row.started_at,
    durationMin: row.duration_min,
    notes: row.notes,
    loggedByName: row.loggedByName,
    loggedByUserId: row.user_id,
  };
}

router.post('/', (req, res) => {
  const { startedAt, durationMin, notes } = req.body || {};
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO pumps (id, baby_id, user_id, started_at, duration_min, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.baby.id,
    req.user.id,
    startedAt || new Date().toISOString(),
    durationMin ?? null,
    notes || null
  );
  const row = db
    .prepare(
      `SELECT p.*, u.name AS loggedByName FROM pumps p
       JOIN users u ON u.id = p.user_id WHERE p.id = ?`
    )
    .get(id);
  res.status(201).json(serialize(row));
});

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare(
      `SELECT p.*, u.name AS loggedByName FROM pumps p
       JOIN users u ON u.id = p.user_id
       WHERE p.baby_id = ? ORDER BY p.started_at DESC LIMIT ?`
    )
    .all(req.baby.id, limit);
  res.json(rows.map(serialize));
});

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM pumps WHERE id = ? AND baby_id = ?').get(req.params.id, req.baby.id);
  if (!existing) {
    return res.status(404).json({ error: 'Pump session not found' });
  }
  const { startedAt, durationMin, notes } = req.body || {};
  db.prepare(
    `UPDATE pumps SET started_at = ?, duration_min = ?, notes = ? WHERE id = ?`
  ).run(
    startedAt ?? existing.started_at,
    durationMin !== undefined ? durationMin : existing.duration_min,
    notes !== undefined ? notes : existing.notes,
    existing.id
  );
  const row = db
    .prepare(
      `SELECT p.*, u.name AS loggedByName FROM pumps p
       JOIN users u ON u.id = p.user_id WHERE p.id = ?`
    )
    .get(existing.id);
  res.json(serialize(row));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM pumps WHERE id = ? AND baby_id = ?').get(req.params.id, req.baby.id);
  if (!existing) {
    return res.status(404).json({ error: 'Pump session not found' });
  }
  db.prepare('DELETE FROM pumps WHERE id = ?').run(existing.id);
  res.status(204).send();
});

module.exports = router;
