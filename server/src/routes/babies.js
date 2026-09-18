const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { loadBabyForFamily } = require('../middleware/babyAccess');
const feedingsRouter = require('./feedings');
const diapersRouter = require('./diapers');

const router = express.Router();
router.use(requireAuth);

function serializeBaby(row) {
  return { id: row.id, name: row.name, birthDate: row.birth_date };
}

router.post('/', (req, res) => {
  const { name, birthDate } = req.body || {};
  if (!name) {
    return res.status(400).json({ error: 'name is required' });
  }
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO babies (id, family_id, name, birth_date) VALUES (?, ?, ?, ?)').run(
    id,
    req.user.familyId,
    name,
    birthDate || null
  );
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(id);
  res.status(201).json(serializeBaby(baby));
});

router.get('/', (req, res) => {
  const babies = db
    .prepare('SELECT * FROM babies WHERE family_id = ? ORDER BY created_at')
    .all(req.user.familyId);
  res.json(babies.map(serializeBaby));
});

router.get('/:babyId/summary', loadBabyForFamily, (req, res) => {
  const lastFeeding = db
    .prepare(
      `SELECT f.*, u.name AS loggedByName FROM feedings f
       JOIN users u ON u.id = f.user_id
       WHERE f.baby_id = ? ORDER BY f.started_at DESC LIMIT 1`
    )
    .get(req.baby.id);
  const lastDiaper = db
    .prepare(
      `SELECT d.*, u.name AS loggedByName FROM diapers d
       JOIN users u ON u.id = d.user_id
       WHERE d.baby_id = ? ORDER BY d.logged_at DESC LIMIT 1`
    )
    .get(req.baby.id);

  res.json({
    baby: serializeBaby(req.baby),
    lastFeeding: lastFeeding
      ? {
          id: lastFeeding.id,
          type: lastFeeding.type,
          amountMl: lastFeeding.amount_ml,
          durationMin: lastFeeding.duration_min,
          startedAt: lastFeeding.started_at,
          notes: lastFeeding.notes,
          loggedByName: lastFeeding.loggedByName,
        }
      : null,
    lastDiaper: lastDiaper
      ? {
          id: lastDiaper.id,
          type: lastDiaper.type,
          loggedAt: lastDiaper.logged_at,
          notes: lastDiaper.notes,
          loggedByName: lastDiaper.loggedByName,
        }
      : null,
  });
});

router.get('/:babyId/timeline', loadBabyForFamily, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  const feedings = db
    .prepare(
      `SELECT f.id, f.type, f.amount_ml AS amountMl, f.duration_min AS durationMin,
              f.started_at AS timestamp, f.notes, u.name AS loggedByName
       FROM feedings f JOIN users u ON u.id = f.user_id
       WHERE f.baby_id = ? ORDER BY f.started_at DESC LIMIT ?`
    )
    .all(req.baby.id, limit)
    .map((row) => ({ ...row, kind: 'feeding' }));

  const diapers = db
    .prepare(
      `SELECT d.id, d.type, d.logged_at AS timestamp, d.notes, u.name AS loggedByName
       FROM diapers d JOIN users u ON u.id = d.user_id
       WHERE d.baby_id = ? ORDER BY d.logged_at DESC LIMIT ?`
    )
    .all(req.baby.id, limit)
    .map((row) => ({ ...row, kind: 'diaper' }));

  const merged = [...feedings, ...diapers]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);

  res.json(merged);
});

router.use('/:babyId/feedings', loadBabyForFamily, feedingsRouter);
router.use('/:babyId/diapers', loadBabyForFamily, diapersRouter);

module.exports = router;
