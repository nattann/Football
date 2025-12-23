// main/schedule.js
// Renders available slots and wires booking buttons; handles booking form submit to start checkout.
(function(){
  // Render available slots
  const slotsList = document.getElementById('slots-list');
  if (!slotsList) return;

  // Fetch upcoming registrations from the server and populate the "Upcoming schedule" list
  (async function loadUpcoming(){
    const ul = document.getElementById('upcoming-list');
    if (!ul) return;
    ul.innerHTML = '<li class="muted">Loading upcoming schedule…</li>';
    try {
      const res = await fetch('/.netlify/functions/get-registrations');
      if (!res.ok) throw new Error('Network response not ok');
      const data = await res.json();
      if (!Array.isArray(data.registrations)) throw new Error('Invalid response');
      if (data.registrations.length === 0){
        ul.innerHTML = '<li class="muted">No upcoming bookings.</li>';
      } else {
        ul.innerHTML = '';
        data.registrations.forEach(r => {
          const li = document.createElement('li');
          const date = new Date(r.scheduled_date).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' });
          const time = r.scheduled_time ? r.scheduled_time.slice(0,5) : '';
          li.textContent = `${date} — ${r.name} — ${time} (${r.status})`;
          ul.appendChild(li);
        });
      }
    } catch(err){
      console.error('Could not load registrations', err);
      if (ul) ul.innerHTML = '<li class="muted">Unable to load schedule.</li>';
    }
  })();

  const times = ['09:00','12:00','16:00','19:00'];
  const prices = { '09:00': 10.00, '12:00': 12.50, '16:00': 15.00, '19:00': 20.00 };

  // fields will be loaded from the backend (registered fields)
  let fields = [];

  function addDays(date, days){ const d = new Date(date); d.setDate(d.getDate()+days); return d; }
  function toIsoDate(d){ return d.toISOString().slice(0,10); }
  function fmtDate(d){ return d.toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' }); }

  const today = new Date();
  const slots = [];
  for(let i=1;i<=10;i++){ // next 10 days
    const day = addDays(today,i);
    for(const f of fields){
      for(const t of times){
        slots.push({ dateIso: toIsoDate(day), dateLabel: fmtDate(day), time: t, field: f, price: prices[t] });
      }
    }
  }

  // Keep a master list and render with filters
  const allSlots = slots.slice();

  function renderSlots(list){
    slotsList.innerHTML = '';
    if (!list || list.length === 0){
      const p = document.createElement('div');
      p.className = 'muted';
      p.textContent = 'No matching slots.';
      slotsList.appendChild(p);
      return;
    }

    list.forEach((s)=>{
      const el = document.createElement('div');
      el.className = 'slot-row';
      el.style.display = 'flex';
      el.style.justifyContent = 'space-between';
      el.style.alignItems = 'center';
      el.style.padding = '0.5rem 0';
      el.style.borderBottom = '1px dashed rgba(12,44,84,0.04)';

      const left = document.createElement('div');
      left.innerHTML = `<strong>${s.field}</strong><div class="muted">${s.dateLabel} · ${s.time}</div>`;

      const right = document.createElement('div');
      right.style.display = 'flex';
      right.style.gap = '0.6rem';
      right.style.alignItems = 'center';

      const price = document.createElement('div');
      price.textContent = `$${s.price.toFixed(2)}`;
      price.className = 'muted';

      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.type = 'button';
      btn.textContent = 'Book';
      btn.addEventListener('click', ()=>{
        // Prefill booking form
        const dateEl = document.getElementById('date');
        const timeEl = document.getElementById('time');
        const amountEl = document.getElementById('amount');
        const fieldEl = document.getElementById('field');
        if (dateEl) dateEl.value = s.dateIso;
        if (timeEl) timeEl.value = s.time;
        if (amountEl) amountEl.value = s.price.toFixed(2);
        if (fieldEl) fieldEl.value = s.field || '';
        // scroll to register section and focus name
        const register = document.getElementById('register');
        if (register) register.scrollIntoView({behavior:'smooth', block:'start'});
        const nameEl = document.getElementById('name');
        if (nameEl) nameEl.focus();
      });

      right.appendChild(price);
      right.appendChild(btn);

      el.appendChild(left);
      el.appendChild(right);

      slotsList.appendChild(el);
    });
  }

  // Do not pre-select any filters — show prompt until the user searches.

  // Booking form submit handler (starts Checkout)
  const bookingForm = document.getElementById('booking-form');
  if (bookingForm){
    bookingForm.addEventListener('submit', async function(e){
      e.preventDefault();
      const name = document.getElementById('name')?.value || '';
      const email = document.getElementById('email')?.value || '';
      const date = document.getElementById('date')?.value || '';
      const time = document.getElementById('time')?.value || '';
      const amount = Math.round((parseFloat(document.getElementById('amount')?.value || '10') * 100));

      try {
        const field = document.getElementById('field')?.value || '';
        const res = await fetch('/.netlify/functions/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, date, time, price_cents: amount, field })
        });
        const data = await res.json();
        if (data && data.url) {
          window.location = data.url;
        } else {
          alert('Unable to start checkout. Try again.');
          console.error(data);
        }
      } catch(err){
        console.error(err);
        alert('Network error. Please try again.');
      }
    });
  }

  // --- Filters UI wiring ---
  const filterField = document.getElementById('filter-field');
  const filterTime = document.getElementById('filter-time');
  const filterDate = document.getElementById('filter-date');
  const filterClear = document.getElementById('filter-clear');

  if (filterField){
    // populate initial default option; real field list will be loaded from server
    filterField.innerHTML = '';
    const chooseOpt = document.createElement('option'); chooseOpt.value='none'; chooseOpt.textContent='Choose field'; filterField.appendChild(chooseOpt);
    // load actual fields from server
    (async function loadFields(){
      try{
        const res = await fetch('/.netlify/functions/get-fields');
        if (!res.ok) throw new Error('Network');
        const data = await res.json();
        if (Array.isArray(data.fields) && data.fields.length){
          fields = data.fields.map(f => f.name);
          // append options
          data.fields.forEach(fitem => {
            const o = document.createElement('option'); o.value = fitem.name; o.textContent = fitem.name; filterField.appendChild(o);
          });
        }
      } catch(err){
        console.error('Could not load fields', err);
        // fallback: leave only the default option
      }
    })();
  }
  if (filterTime){
    filterTime.innerHTML = '';
    const chooseOpt = document.createElement('option'); chooseOpt.value='none'; chooseOpt.textContent='Choose time'; filterTime.appendChild(chooseOpt);
    times.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; filterTime.appendChild(o); });
  }

  function applyFilters(){
    const f = filterField?.value || 'none';
    const t = filterTime?.value || 'none';
    const d = filterDate?.value || '';
    // If nothing selected (both filters 'none' and date empty) show a prompt instead of all slots
    if ((f === 'none' || f === '') && (t === 'none' || t === '') && !d){
      slotsList.innerHTML = '';
      const p = document.createElement('div'); p.className = 'muted'; p.textContent = 'Select a field, time or date to view available slots.'; slotsList.appendChild(p);
      return;
    }

    const filtered = allSlots.filter(s => {
      if (f !== 'none' && f !== '' && s.field !== f) return false;
      if (t !== 'none' && t !== '' && s.time !== t) return false;
      if (d && s.dateIso !== d) return false;
      return true;
    });
    renderSlots(filtered);
  }

  if (filterField) filterField.addEventListener('change', applyFilters);
  if (filterTime) filterTime.addEventListener('change', applyFilters);
  if (filterDate) filterDate.addEventListener('change', applyFilters);
  if (filterClear) filterClear.addEventListener('click', ()=>{ if (filterField) filterField.value='none'; if (filterTime) filterTime.value='none'; if (filterDate) filterDate.value = ''; applyFilters(); });

  // initial state: run applyFilters to show the empty-prompt (no slots) until the user selects filters
  applyFilters();
})();
