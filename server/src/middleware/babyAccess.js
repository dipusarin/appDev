const db = require('../db');

function loadBabyForFamily(req, res, next) {
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby || baby.family_id !== req.user.familyId) {
    return res.status(404).json({ error: 'Baby not found' });
  }
  req.baby = baby;
  next();
}

module.exports = { loadBabyForFamily };
