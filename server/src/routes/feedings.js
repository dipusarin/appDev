const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

const VALID_TYPES = ['breast', 'bottle', 'formula'];

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    amountMl: row.amount_ml,
    durationMin: row.duration_min,
    startedAt: row.started_at,
    notes: row.notes,
    loggedByName: row.loggedByName,
    loggedByUserId: row.user_id,
  };
}

router.post('/', (req, res) => {
  const { type, amountMl, durationMin, startedAt, notes } = req.body || {};
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO feedings (id, baby_id, user_id, type, amount_ml, duration_min, started_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.baby.id,
    req.user.id,
    type,
    amountMl ?? null,
    durationMin ?? null,
    startedAt || new Date().toISOString(),
    notes || null
  );
  const row = db
    .prepare(
      `SELECT f.*, u.name AS loggedByName FROM feedings f
       JOIN users u ON u.id = f.user_id WHERE f.id = ?`
    )
    .get(id);
  res.status(201).json(serialize(row));
});

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare(
      `SELECT f.*, u.name AS loggedByName FROM feedings f
       JOIN users u ON u.id = f.user_id
       WHERE f.baby_id = ? ORDER BY f.started_at DESC LIMIT ?`
    )
    .all(req.baby.id, limit);
  res.json(rows.map(serialize));
});

module.exports = router;
