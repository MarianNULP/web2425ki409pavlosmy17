require('dotenv').config();                 // 1️⃣  .env – завантажили ДУЖЕ рано!

const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const passport   = require('passport');
const jwt        = require('jsonwebtoken');

const { encrypt, hash, verifyHash } = require('./utils/crypto');
const User       = require('./models/User');

// ─── PASSPORT STRATEGIES ──────────────────────────────────────────────────────
require('./auth/google');                   // просто імпортуємо файл – він сам реєструє стратегію
// ──────────────────────────────────────────────────────────────────────────────

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MongoDB ────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(()=>console.log('🟢 MongoDB connected'))
  .catch(e => console.error('🔴 Mongo error:', e));

// ─── Серіалізація сесій ─────────────────────────────────────────────────────
app.use(session({
  secret            : process.env.JWT_SECRET,
  resave            : false,
  saveUninitialized : false
}));
app.use(passport.initialize());
app.use(passport.session());

// ─── ПАРСЕРИ │ СТАТИКА ───────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// ─── BASIC ROUTES ───────────────────────────────────────────────────────────
app.get('/get-page', (req, res) => {
  const data = req.query.data || '—';
  res.send(
    `<h1>GET‑сторінка</h1>
     <p>Ви ввели: <strong>${data}</strong></p>
     <p>Час: ${new Date().toLocaleString()}</p>`
  );
});

app.post('/post-page', (req, res) => {
  const data = req.body.data || '—';
  res.send(
    `<h1>POST‑сторінка</h1>
     <p>Ви ввели: <strong>${data}</strong></p>
     <p>Час: ${new Date().toLocaleString()}</p>`
  );
});

// AJAX‑API з поверненням даних
app.get('/api/time', (req, res) =>
  res.json({ ts: Date.now(), youSent: req.query })
);

app.post('/api/echo', (req, res) =>
  res.json({ youSent: req.body, ts: Date.now() })
);

// ─── AUTH (пароль) ──────────────────────────────────────────────────────────
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error:'missing fields' });

    await User.create({
      email,
      passwordPlain : password,
      passwordHash  : await hash(password),
      passwordEnc   : encrypt(password)
    });
    res.json({ ok:true });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error:'user exists' });
    console.error(e);
    res.status(500).json({ error:'server' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ error:'not found' });

  const passOk = password === user.passwordPlain ||
                 await verifyHash(password, user.passwordHash);

  if (!passOk) return res.status(401).json({ error:'bad creds' });

  const token = jwt.sign({ id:user._id }, process.env.JWT_SECRET, { expiresIn:'1h' });
  req.session.userId = user._id;
  res.json({ token });
});

const authJWT = (req,res,next)=>{
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).id;
    next();
  } catch { res.status(401).end(); }
};

app.get('/dashboard', authJWT, (req, res)=>
  res.send(`Вітаю! Ви увійшли як ID ${req.userId}`)
);

// ─── AUTH (Google) ──────────────────────────────────────────────────────────
app.get('/auth/google',
  passport.authenticate('google', { scope:['profile','email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect:'/login' }),
  (_,res)=> res.redirect('/dashboard')
);

// ─── ЗАПУСК ─────────────────────────────────────────────────────────────────
app.listen(PORT, ()=> console.log(`🚀 http://localhost:${PORT}`));
