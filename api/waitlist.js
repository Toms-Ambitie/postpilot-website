// Vercel Serverless Function — slaat een wachtlijst-aanmelding op als Resend-contact.
// Vereist twee environment variables in Vercel:
//   RESEND_API_KEY      — een Resend API key MET 'contacts'-rechten (niet de send-only key)
//   RESEND_AUDIENCE_ID  — de ID van de Resend-audience waar leads in moeten
// Geen npm-dependencies: gebruikt de native fetch van de Node-runtime.

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    if (!body || typeof body !== 'object') body = {};

    const email = String(body.email || '').trim().toLowerCase();
    const source = String(body.source || 'website').slice(0, 80);
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      return res.status(400).json({ ok: false, error: 'Vul een geldig e-mailadres in.' });
    }

    const API_KEY = process.env.RESEND_API_KEY;
    const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;
    if (!API_KEY || !AUDIENCE_ID) {
      console.error('Waitlist niet geconfigureerd: RESEND_API_KEY of RESEND_AUDIENCE_ID ontbreekt.');
      return res.status(503).json({ ok: false, error: 'De wachtlijst is nog niet geconfigureerd.' });
    }

    const resp = await fetch(`https://api.resend.com/audiences/${AUDIENCE_ID}/contacts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, unsubscribed: false, last_name: source }),
    });

    // 2xx = toegevoegd. Een al bestaand contact behandelen we ook als succes.
    if (resp.ok) {
      return res.status(200).json({ ok: true });
    }

    const text = await resp.text();
    if (resp.status === 409 || /already exists|duplicate/i.test(text)) {
      return res.status(200).json({ ok: true, already: true });
    }

    console.error('Resend-fout', resp.status, text);
    return res.status(502).json({ ok: false, error: 'Kon je niet toevoegen. Probeer het later opnieuw.' });
  } catch (err) {
    console.error('Waitlist-functie crashte:', err);
    return res.status(500).json({ ok: false, error: 'Er ging iets mis. Probeer het later opnieuw.' });
  }
};
