const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { generateUniqueInviteCode } = require('../utils/inviteCode');
const { requireAuth, signToken } = require('../middleware/auth');

const router = express.Router();

function publicUser(row) {
  return { id: row.id, email: row.email, name: row.name, familyId: row.family_id };
}

router.post('/register', (req, res) => {
  const { email, password, name, familyName, inviteCode } = req.body || {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'email, password and name are required' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT 1 FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' });
  }

  let family;
  if (inviteCode) {
    family = db
      .prepare('SELECT * FROM families WHERE invite_code = ?')
      .get(String(inviteCode).trim().toUpperCase());
    if (!family) {
      return res.status(400).json({ error: 'Invalid invite code' });
    }
  } else {
    const familyId = crypto.randomUUID();
    const code = generateUniqueInviteCode(db);
    db.prepare('INSERT INTO families (id, name, invite_code) VALUES (?, ?, ?)').run(
      familyId,
      familyName || `${name}'s Family`,
      code
    );
    family = db.prepare('SELECT * FROM families WHERE id = ?').get(familyId);
  }

  const userId = crypto.randomUUID();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(
    'INSERT INTO users (id, email, password_hash, name, family_id) VALUES (?, ?, ?, ?, ?)'
  ).run(userId, normalizedEmail, passwordHash, name, family.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const token = signToken(userId);
  res.status(201).json({
    token,
    user: publicUser(user),
    family: { id: family.id, name: family.name, inviteCode: family.invite_code },
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(user.family_id);
  const token = signToken(user.id);
  res.json({
    token,
    user: publicUser(user),
    family: { id: family.id, name: family.name, inviteCode: family.invite_code },
  });
});

router.get('/me', requireAuth, (req, res) => {
  const family = db.prepare('SELECT * FROM families WHERE id = ?').get(req.user.familyId);
  const members = db
    .prepare('SELECT id, name, email FROM users WHERE family_id = ? ORDER BY created_at')
    .all(req.user.familyId);
  const babies = db
    .prepare('SELECT id, name, birth_date AS birthDate FROM babies WHERE family_id = ? ORDER BY created_at')
    .all(req.user.familyId);
  res.json({
    user: req.user,
    family: { id: family.id, name: family.name, inviteCode: family.invite_code },
    members,
    babies,
  });
});

module.exports = router;
