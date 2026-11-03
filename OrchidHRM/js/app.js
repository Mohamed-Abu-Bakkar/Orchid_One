document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('attCheckBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const ring = document.getElementById('ringSub');
      if (ring) ring.textContent = 'Checked in · working';
    });
  }
  const fb = document.getElementById('fbStatus');
  const add = document.querySelector('[onclick="openFeedbackSheet()"]');
  if (add && fb) {
    add.addEventListener('click', (e) => { e.preventDefault(); fb.textContent = 'Feedback submitted (mock).'; });
  }
});
