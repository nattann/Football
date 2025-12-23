(function(){
  const form = document.getElementById('field-form');
  if (!form) return;

  form.addEventListener('submit', async function(e){
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

    try{
      const res = await fetch('/.netlify/functions/create-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(()=>null);
      if (res.ok) {
        // Optionally show a brief confirmation then return to home
        alert('Thanks — ' + payload.name + ' has been registered. You will be redirected to the home page.');
        // Redirect to the site root (home)
        window.location = '../index.html';
      } else {
        alert('Registration failed: ' + (data && data.error) );
      }
    } catch(err){
      console.error(err);
      alert('Network error. Try again.');
    }
  });
})();
