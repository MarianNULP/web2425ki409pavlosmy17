document.addEventListener('DOMContentLoaded', () => {
  const btnAbout = document.getElementById('btnAbout');
  const btnProject = document.getElementById('btnProject');
  const contentArea = document.getElementById('contentArea');
  const contactForm = document.getElementById('contactForm');
  const formResponse = document.getElementById('formResponse');

  // Завантаження "Про мене"
  if (btnAbout) {
    btnAbout.addEventListener('click', () => {
      fetch('/loadContent?section=about')
        .then(response => response.text())
        .then(data => {
          contentArea.innerHTML = data;
        })
        .catch(err => {
          contentArea.innerHTML = "Помилка завантаження розділу.";
          console.error(err);
        });
    });
  }

  // Завантаження "Проєкт"
  if (btnProject) {
    btnProject.addEventListener('click', () => {
      fetch('/loadContent?section=project')
        .then(response => response.text())
        .then(data => {
          contentArea.innerHTML = data;
        })
        .catch(err => {
          contentArea.innerHTML = "Помилка завантаження розділу.";
          console.error(err);
        });
    });
  }

  // Обробка сабміту форми зворотнього зв’язку
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = Object.fromEntries(new FormData(contactForm).entries());

      fetch('/form-submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
        .then(response => response.text())
        .then(data => {
          formResponse.textContent = data;
          contactForm.reset();
        })
        .catch(err => {
          formResponse.textContent = "Помилка відправки даних.";
          console.error(err);
        });
    });
  }
});
