const express = require('express');
const path = require('path');

const app = express();

// Дозволяємо віддавати статичні файли з папки public
app.use(express.static('public'));

// Дозволяємо зчитування даних з форм (urlencoded + json)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/favicon.ico', (req, res) => {
  res.sendStatus(204);  // Відправляємо статус 204 (No Content)
});


// Головний маршрут, який повертає index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Обробка POST-запиту з форми з ім'ям, email, повідомленням
app.post('/form-submit', (req, res) => {
  const { name, email, message } = req.body;
  // Тут могла б бути логіка збереження в базу даних, тощо
  // Для прикладу: просто відправимо у відповідь текст
  res.send(`Дякуємо, ${name}! Ваше повідомлення: "${message}". Ми зв'яжемося з вами за адресою ${email}.`);
});

// Маршрут, що повертає partial-контент залежно від параметра section (GET-запит)
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

