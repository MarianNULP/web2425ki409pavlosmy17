const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

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
