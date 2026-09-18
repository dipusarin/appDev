const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const familiesRouter = require('./routes/families');
const babiesRouter = require('./routes/babies');

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/families', familiesRouter);
app.use('/api/babies', babiesRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Nara Baby API listening on port ${PORT}`);
});
