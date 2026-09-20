const express = require('express');
const crypto = require('crypto');
const db = require('../db');

const router = express.Router({ mergeParams: true });

const VALID_TYPES = ['wet', 'dirty', 'dry'];
const VALID_TEXTURES = ['runny', 'mucosy', 'mushy', 'solid', 'pebbles'];
const VALID_COLORS = ['black', 'green', 'yellow', 'brown', 'red', 'gray'];

function serialize(row) {
  return {
    id: row.id,
    type: row.type,
    texture: row.texture,
    color: row.color,
    loggedAt: row.logged_at,
    notes: row.notes,
    loggedByName: row.loggedByName,
    loggedByUserId: row.user_id,
  };
}

router.post('/', (req, res) => {
  const { type, texture, color, loggedAt, notes } = req.body || {};
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
  }
  if (texture !== undefined && texture !== null && !VALID_TEXTURES.includes(texture)) {
    return res.status(400).json({ error: `texture must be one of ${VALID_TEXTURES.join(', ')}` });
  }
  if (color !== undefined && color !== null && !VALID_COLORS.includes(color)) {
    return res.status(400).json({ error: `color must be one of ${VALID_COLORS.join(', ')}` });
  }
  const id = crypto.randomUUID();
  db.prepare(
    `INSERT INTO diapers (id, baby_id, user_id, type, texture, color, logged_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    req.baby.id,
    req.user.id,
    type,
    texture || null,
    color || null,
    loggedAt || new Date().toISOString(),
    notes || null
  );
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

router.patch('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM diapers WHERE id = ? AND baby_id = ?').get(req.params.id, req.baby.id);
  if (!existing) {
    return res.status(404).json({ error: 'Diaper change not found' });
  }
  const { type, texture, color, loggedAt, notes } = req.body || {};
  if (type !== undefined && !VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of ${VALID_TYPES.join(', ')}` });
  }
  if (texture !== undefined && texture !== null && !VALID_TEXTURES.includes(texture)) {
    return res.status(400).json({ error: `texture must be one of ${VALID_TEXTURES.join(', ')}` });
  }
  if (color !== undefined && color !== null && !VALID_COLORS.includes(color)) {
    return res.status(400).json({ error: `color must be one of ${VALID_COLORS.join(', ')}` });
  }
  db.prepare(
    `UPDATE diapers SET
       type = ?, texture = ?, color = ?, logged_at = ?, notes = ?
     WHERE id = ?`
  ).run(
    type ?? existing.type,
    texture !== undefined ? texture : existing.texture,
    color !== undefined ? color : existing.color,
    loggedAt ?? existing.logged_at,
    notes !== undefined ? notes : existing.notes,
    existing.id
  );
  const row = db
    .prepare(
      `SELECT d.*, u.name AS loggedByName FROM diapers d
       JOIN users u ON u.id = d.user_id WHERE d.id = ?`
    )
    .get(existing.id);
  res.json(serialize(row));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM diapers WHERE id = ? AND baby_id = ?').get(req.params.id, req.baby.id);
  if (!existing) {
    return res.status(404).json({ error: 'Diaper change not found' });
  }
  db.prepare('DELETE FROM diapers WHERE id = ?').run(existing.id);
  res.status(204).send();
});

module.exports = router;
