document.addEventListener('DOMContentLoaded', () => {
  const btnAbout = document.getElementById('btnAbout');
  const btnProject = document.getElementById('btnProject');
  const contentArea = document.getElementById('contentArea');
  const contactForm = document.getElementById('contactForm');
  const formResponse = document.getElementById('formResponse');

  // Завантаження "Про мене" (About) через AJAX (GET)
  btnAbout.addEventListener('click', () => {
    console.log("Натиснули кнопку About");
    fetch('/loadContent?section=about')
      .then(response => {
        console.log("Статус запиту:", response.status);
        return response.text();
      })
      .then(data => {
        console.log("Отримали дані:", data);
        contentArea.innerHTML = data; // Підставляємо отриманий HTML
      })
      .catch(err => {
        contentArea.innerHTML = "Помилка завантаження розділу.";
        console.error(err);
      });
  });

  // Завантаження "Проєкт" (Project) через AJAX (GET)
  btnProject.addEventListener('click', () => {
    console.log("Натиснули кнопку Project");
    fetch('/loadContent?section=project')
      .then(response => {
        console.log("Статус запиту:", response.status);
        return response.text();
      })
      .then(data => {
        console.log("Отримали дані:", data);
        contentArea.innerHTML = data;
      })
      .catch(err => {
        contentArea.innerHTML = "Помилка завантаження розділу.";
        console.error(err);
      });
  });

  // Обробка сабміту форми (POST)
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault(); // Відмінити стандартну поведінку відправки
    console.log("Надіслали форму");

    const formData = new FormData(contactForm);
    const plainData = Object.fromEntries(formData.entries());

    fetch('/form-submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(plainData)
    })
      .then(response => response.text())
      .then(data => {
        console.log("Відповідь від сервера:", data);
        formResponse.textContent = data;
        contactForm.reset();
      })
      .catch(err => {
        formResponse.textContent = "Помилка відправки даних.";
        console.error(err);
      });
  });
});
