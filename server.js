// server.js
const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;

const app = express();

// Налаштування сесій (необхідно для Passport)
app.use(session({
  secret: 'your_secret_key', // замініть на секретний ключ
  resave: false,
  saveUninitialized: false
}));

// Ініціалізуємо Passport та сесію
app.use(passport.initialize());
app.use(passport.session());

// Для роботи з POST-запитами (форма)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Роздача статичних файлів з теки public
app.use(express.static('public'));

/* ===================================================================
   Налаштування Passport: серіалізація/десеріалізація користувача
   =================================================================== */

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

/* ===================================================================
   Стратегія аутентифікації Google
   =================================================================== */

passport.use(new GoogleStrategy({
    clientID: 'YOUR_GOOGLE_CLIENT_ID',           // Підставте свій Client ID
    clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',     // Підставте свій Client Secret
    callbackURL: '/auth/google/callback'
  },
  (accessToken, refreshToken, profile, done) => {
    // Тут ви можете зберігати/оновлювати користувацькі дані у базі даних
    console.log('Google profile:', profile);
    return done(null, profile);
  }
));

/* ===================================================================
   Стратегія локальної аутентифікації (login & password)
   =================================================================== */

passport.use(new LocalStrategy((username, password, done) => {
  // Замість цього блоку потрібно реалізувати пошук користувача у базі даних
  // Це приклад для демонстрації. Наприклад, перевірка жорстко зашитих значень:
  if (username === 'admin' && password === 'password') {
    // Створюємо користувача (у реальному застосунку дані повинні зберігатися в базі)
    return done(null, { id: 1, username: 'admin' });
  } else {
    return done(null, false, { message: 'Невірний логін/пароль' });
  }
}));

/* ===================================================================
   Маршрути для аутентифікації
   =================================================================== */

// Маршрут для перевірки, чи користувач аутентифікований
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// =================== Google OAuth ===================

// Коли користувач натискає «Увійти через Google»
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback-URL після авторизації Google
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Успішна аутентифікація, перенаправляємо на головну.
    res.redirect('/');
  }
);

// =================== Локальна аутентифікація ===================

// Форма входу (створіть файл login.html у public або генеруйте HTML тут)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Обробка логіну (POST)
app.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login'
}));

// Роут для виходу
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

/* ===================================================================
   Інші маршрути
   =================================================================== */

// Головна сторінка
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`<h1>Ласкаво просимо, ${req.user.displayName || req.user.username}!</h1>
              <p><a href="/logout">Вихід</a></p>`);
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

// Маршрути для вашого додаткового контенту
app.get('/loadContent', (req, res) => {
  const section = req.query.section;
  if (section === 'about') {
    res.sendFile(path.join(__dirname, 'public', 'partial-about.html'));
  } else if (section === 'project') {
    res.sendFile(path.join(__dirname, 'public', 'partial-project.html'));
  } else {
    res.status(404).send('Section not found');
  }
});

// Запуск сервера
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущено на порті ${PORT}`);
});
