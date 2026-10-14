// Static pages supply these messages in their own language; no runtime translation fetch.
const form = document.getElementById('feedback-form');
const messages = JSON.parse(document.getElementById('feedback-messages').textContent);
const button = document.getElementById('submit-feedback');
const status = document.getElementById('form-status');

for (const field of form.querySelectorAll('[required]')) {
  function validate() {
    field.setCustomValidity('');
    const value = field.value.trim();
    if (!value) field.setCustomValidity(messages.required);
    else if (field.type === 'email' && field.validity.typeMismatch) field.setCustomValidity(messages.email);
    else if (field.id === 'message' && value.length < 10) field.setCustomValidity(messages.length);
  }
  field.addEventListener('input', validate);
  field.addEventListener('invalid', validate);
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (button.disabled || !form.reportValidity()) return;
  button.disabled = true;
  button.textContent = messages.sending;
  form.setAttribute('aria-busy', 'true');
  status.textContent = '';
  status.className = 'form-status';
  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('name').value.trim(),
        email: document.getElementById('email').value.trim(),
        message: document.getElementById('message').value.trim(),
        website: document.getElementById('website').value
      }),
      signal: AbortSignal.timeout(15000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.success !== true) {
      throw new Error(response.status === 503 ? messages.unavailable : response.status === 400 ? messages.invalid : messages.error);
    }
    status.textContent = messages.success;
    status.className = 'form-status success';
    form.reset();
  } catch (error) {
    // Translate known service errors; never expose an English backend or network message.
    status.textContent = [messages.unavailable, messages.invalid].includes(error.message) ? error.message : messages.error;
    status.className = 'form-status error';
  } finally {
    button.disabled = false;
    button.textContent = messages.submit;
    form.setAttribute('aria-busy', 'false');
  }
});
