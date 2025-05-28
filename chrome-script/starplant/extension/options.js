document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('personal-info-form');
  const status = document.getElementById('status');

  // Load saved info
  chrome.storage.sync.get(['personalInfo'], (data) => {
    if (data.personalInfo) {
      form.name.value = data.personalInfo.name || '';
      form.email.value = data.personalInfo.email || '';
      form.phone.value = data.personalInfo.phone || '';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const personalInfo = {
      name: form.name.value,
      email: form.email.value,
      phone: form.phone.value
    };
    chrome.storage.sync.set({ personalInfo }, () => {
      status.textContent = 'Saved!';
      setTimeout(() => status.textContent = '', 1500);
    });
  });
}); 