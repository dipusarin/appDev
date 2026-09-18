const crypto = require('crypto');

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion

function generateInviteCode(length = 6) {
  let code = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

function generateUniqueInviteCode(db) {
  const existsStmt = db.prepare('SELECT 1 FROM families WHERE invite_code = ?');
  let code;
  do {
    code = generateInviteCode();
  } while (existsStmt.get(code));
  return code;
}

module.exports = { generateInviteCode, generateUniqueInviteCode };
