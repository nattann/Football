(function () {
  const form = document.getElementById('field-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const payload = {
      name: document.getElementById('field-name').value,
      location: document.getElementById('location').value,
      surface: document.getElementById('surface').value,
      lights: document.getElementById('lights').checked,
      contact_email: document.getElementById('contact-email').value,
      contact_phone: document.getElementById('contact-phone').value,
      open_time: document.getElementById('open-time').value || null,
      close_time: document.getElementById('close-time').value || null
    };

    try {
      const res = await fetch('/.netlify/functions/create-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server error');
      }

      alert(`Thanks — ${payload.name} has been registered.`);
      window.location.href = '../index.html';

    } catch (err) {
      console.error(err);
      alert('Network or server error. Check console logs.');
    }
  });
})();
