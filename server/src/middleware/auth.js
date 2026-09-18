const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '30d' });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  const user = db
    .prepare('SELECT id, email, name, family_id AS familyId FROM users WHERE id = ?')
    .get(payload.sub);
  if (!user) {
    return res.status(401).json({ error: 'User no longer exists' });
  }
  req.user = user;
  next();
}

module.exports = { requireAuth, signToken, JWT_SECRET };
