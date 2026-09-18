const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

const VALID_TYPES = ['wet', 'dirty', 'both'];

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    loggedAt: row.logged_at,
    notes: row.notes,
    loggedByName: row.loggedByName,
    loggedByUserId: row.user_id,
  };
}

router.post('/', (req, res) => {
  const { type, loggedAt, notes } = req.body || {};
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO diapers (id, baby_id, user_id, type, logged_at, notes)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(id, req.baby.id, req.user.id, type, loggedAt || new Date().toISOString(), notes || null);
  const row = db
    .prepare(
      `SELECT d.*, u.name AS loggedByName FROM diapers d
       JOIN users u ON u.id = d.user_id WHERE d.id = ?`
    )
    .get(id);
  res.status(201).json(serialize(row));
});

router.get('/', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = db
    .prepare(
      `SELECT d.*, u.name AS loggedByName FROM diapers d
       JOIN users u ON u.id = d.user_id
       WHERE d.baby_id = ? ORDER BY d.logged_at DESC LIMIT ?`
    )
    .all(req.baby.id, limit);
  res.json(rows.map(serialize));
});

module.exports = router;
