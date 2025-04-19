require('dotenv').config();                 // читати .env
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const session = require('express-session');
const { encrypt, hash } = require('./utils/crypto');
const User = require('./models/User');
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { verifyHash } = require('./utils/crypto');

mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('🟢 MongoDB connected'))
  .catch(e => console.error('🔴 Mongo error:', e));

app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false, saveUninitialized: false
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

app.get('/get-page', (_, res) =>
  res.sendFile(__dirname + '/public/index.html')
);

app.post('/post-page', (req, res) =>
  res.send(`<h1>POST‑сторінка</h1><p>${new Date().toLocaleString()}</p>`)
);

// AJAX‑ендпоїнти
app.get('/api/time', (_, res) => res.json({ ts: Date.now() }));
app.post('/api/echo', (req, res) => res.json({ youSent: req.body, ts: Date.now() }));

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));


router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    // простенька перевірка
    if (!email || !password) return res.status(400).json({ error:'missing fields' });

    await User.create({
      email,
      passwordPlain: password,       // 1️⃣
      passwordHash : await hash(password),  // 2️⃣
      passwordEnc  : encrypt(password)      // 3️⃣
    });

    res.json({ ok:true });
  } catch (e) {
    if (e.code === 11000)               // дубль email
      return res.status(409).json({ error:'user exists' });
    res.status(500).json({ error:'server' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error:'not found' });

  const passOk =
        password === user.passwordPlain     // ① простий рядок
     || await verifyHash(password, user.passwordHash); // ② bcrypt

  if (!passOk) return res.status(401).json({ error:'bad creds' });

  // JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn:'1h' });
  req.session.userId = user._id;           // сесія
  res.json({ token });
});

function auth(req, res, next) {
  if (req.session.userId) return next();   // сесія
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    return next();
  } catch { return res.status(401).json({ error:'unauth' }); }
}

function auth(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    return next();
  } catch { return res.status(401).end(); }
}

app.get('/dashboard', auth, (_, res) =>
  res.send('Вітаю! Ви увійшли як ID '+_.userId)
);


