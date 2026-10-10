// Vercel Serverless Function. The API key must be set in Vercel environment variables.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'POST');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') return res.status(415).json({ error: 'Use application/json.' });
  if (Number(req.headers['content-length'] || 0) > 12000) return res.status(413).json({ error: 'Feedback is too long.' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Invalid request.' });
  if (body.website) return res.status(200).json({ success: true }); // spam honeypot
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (name.length < 1 || name.length > 100 || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      message.length < 10 || message.length > 5000) {
    return res.status(400).json({ error: 'Please enter a valid name, email and feedback (at least 10 characters).' });
  }
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is missing');
    return res.status(503).json({ error: 'Feedback service is not configured yet.' });
  }
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Pizzapoly Feedback <feedback@polytan.games>',
        to: ['admin@polytan.games'],
        reply_to: email,
        subject: 'New Pizzapoly Feedback',
        text: `Name: ${name}\nEmail: ${email}\n\nFeedback:\n${message}`
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!result.ok) {
      console.error('Email provider error:', result.status, (await result.text()).slice(0, 250));
      return res.status(502).json({ error: 'Unable to send feedback right now. Please try again later.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Feedback delivery failed:', error.message);
    return res.status(502).json({ error: 'Unable to send feedback right now. Please try again later.' });
  }
};
