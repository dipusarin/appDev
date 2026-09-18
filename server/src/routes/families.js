const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/me', requireAuth, (req, res) => {
  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(req.user.familyId);
  const members = db
    .prepare('SELECT id, name, email FROM users WHERE family_id = ? ORDER BY created_at')
    .all(req.user.familyId);
  const babies = db
    .prepare('SELECT id, name, birth_date AS birthDate FROM babies WHERE family_id = ? ORDER BY created_at')
    .all(req.user.familyId);
  res.json({
    family: { id: family.id, name: family.name, inviteCode: family.invite_code },
    members,
    babies,
  });
});

router.post('/join', requireAuth, (req, res) => {
  const { inviteCode } = req.body || {};
  if (!inviteCode) {
    return res.status(400).json({ error: 'inviteCode is required' });
  }
  const family = db
    .prepare('SELECT * FROM families WHERE invite_code = ?')
    .get(String(inviteCode).trim().toUpperCase());
  if (!family) {
    return res.status(404).json({ error: 'No family found with that invite code' });
  }
  if (family.id === req.user.familyId) {
    return res.status(400).json({ error: 'You are already in that family' });
  }
  db.prepare('UPDATE users SET family_id = ? WHERE id = ?').run(family.id, req.user.id);
  res.json({ family: { id: family.id, name: family.name, inviteCode: family.invite_code } });
});

module.exports = router;
