require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User');

const app = express();

// Налаштування view engine для EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Підключення до MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));  // для форм та AJAX
app.use(express.json());                          // для JSON (feedback)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport: серіалізація/десеріалізація
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Passport: Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        username: profile.displayName
      });
    }
    return done(null, user);
  } catch (err) {
    done(err);
  }
}));

// Passport: Local Strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) return done(null, false, { message: 'Невірний логін або пароль' });
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return done(null, false, { message: 'Невірний логін або пароль' });
    return done(null, user);
  } catch (err) {
    done(err);
  }
}));

// Middleware для захищених маршрутів
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
}

// Routes
// Google OAuth маршрути
app.get('/auth/google', passport.authenticate('google', { scope: ['profile','email'] }));
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => res.redirect('/')
);

// Локальна аутентифікація
app.get('/login', (req, res) => res.render('login'));
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

app.get('/register', (req, res) => res.render('register'));
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    if (await User.findOne({ username })) {
      return res.send('Користувач із таким імʼям вже існує');
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.status(500).send('Помилка сервера');
  }
});

// Обробка зворотнього зв'язку (feedback) через AJAX
app.post('/form-submit', (req, res) => {
  const { name, email, message } = req.body;
  console.log('Feedback received:', { name, email, message });
  // Тут можна додати збереження у БД або надсилання листа
  res.send('Дякуємо за ваше повідомлення!');
});

// Logout
app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) console.error(err);
    res.redirect('/');
  });
});

// Головна сторінка
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

// AJAX-контент
app.get('/loadContent', (req, res) => {
  const section = req.query.section;
  const file = section === 'about' ? 'partial-about.html'
               : section === 'project' ? 'partial-project.html'
               : null;
  if (file) {
    res.sendFile(path.join(__dirname, 'public', file));
  } else {
    res.status(404).send('Section not found');
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущено на порті ${PORT}`));
