/* PostPilot — contact form API endpoint (Vercel serverless)
   Receives POST { name, email, subject, message }
   Sends email via Resend to hallo@postpilotapp.nl          */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const SUBJECT_LABELS = {
  support:      'Vraag of support',
  'founder-deal': 'Founder Deal',
  pers:         'Pers & samenwerking',
  overig:       'Overig',
  // /investeren — drie sporen
  investeren:   'Investeren in PostPilot',
  bouwen:       'Mee bouwen aan PostPilot',
  groei:        'Groei-marketing voor PostPilot',
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = async function handler(req, res) {
  /* CORS — only same origin needs this; belt-and-suspenders */
  res.setHeader('Access-Control-Allow-Origin', 'https://www.postpilotapp.nl');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, subject, message, website } = req.body ?? {};

  /* Honeypot — bots vullen 'website' in, mensen niet. Stil 200 OK terug. */
  if (typeof website === 'string' && website.trim().length > 0) {
    return res.status(200).json({ ok: true });
  }

  /* ── Validation ── */
  if (!name?.trim() || !email?.trim() || !subject || !message?.trim()) {
    return res.status(400).json({ error: 'Vul alle velden in.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Geen geldig e-mailadres.' });
  }
  if (!SUBJECT_LABELS[subject]) {
    return res.status(400).json({ error: 'Onbekend onderwerp.' });
  }

  const subjectLabel = SUBJECT_LABELS[subject];
  const safeName    = escapeHtml(name.trim());
  const safeEmail   = escapeHtml(email.trim());
  const safeMessage = escapeHtml(message.trim()).replace(/\n/g, '<br>');

  try {
    await resend.emails.send({
      from:    'PostPilot <noreply@postpilotapp.nl>',
      to:      'hallo@postpilotapp.nl',
      replyTo: email.trim(),
      subject: `[Contact] ${subjectLabel} — ${name.trim()}`,
      html: `
        <div style="font-family: -apple-system, 'Geist', sans-serif; max-width: 600px; margin: 0 auto; color: #0E1014;">

          <!-- Header -->
          <div style="background: #0E1014; padding: 24px 32px; display: flex; align-items: center; gap: 12px;">
            <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="5" fill="#E8A640"/>
              <rect x="10" y="8" width="22" height="13" fill="#0E1014"/>
              <rect x="10" y="21" width="7" height="11" fill="#0E1014"/>
              <rect x="14" y="11" width="14" height="6" fill="#E8A640"/>
            </svg>
            <span style="font-family: monospace; font-size: 11px; color: rgba(247,244,237,0.55); letter-spacing: 0.16em; text-transform: uppercase;">
              POSTPILOT &nbsp;·&nbsp; NIEUW CONTACTBERICHT
            </span>
          </div>

          <!-- Body -->
          <div style="background: #F7F4ED; padding: 32px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14,16,20,0.10); font-family: monospace; font-size: 11px; color: rgba(14,16,20,0.45); text-transform: uppercase; letter-spacing: 0.1em; width: 150px; vertical-align: top;">Naam</td>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14,16,20,0.10); font-size: 15px;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14,16,20,0.10); font-family: monospace; font-size: 11px; color: rgba(14,16,20,0.45); text-transform: uppercase; letter-spacing: 0.1em; vertical-align: top;">E-mail</td>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14,16,20,0.10); font-size: 15px;"><a href="mailto:${safeEmail}" style="color: #0E1014;">${safeEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14,16,20,0.10); font-family: monospace; font-size: 11px; color: rgba(14,16,20,0.45); text-transform: uppercase; letter-spacing: 0.1em; vertical-align: top;">Onderwerp</td>
                <td style="padding: 10px 0; border-bottom: 1px solid rgba(14,16,20,0.10); font-size: 15px; font-weight: 600;">${subjectLabel}</td>
              </tr>
              <tr>
                <td style="padding: 14px 0 6px; font-family: monospace; font-size: 11px; color: rgba(14,16,20,0.45); text-transform: uppercase; letter-spacing: 0.1em;" colspan="2">Bericht</td>
              </tr>
              <tr>
                <td colspan="2" style="font-size: 15px; line-height: 1.7; color: #0E1014;">${safeMessage}</td>
              </tr>
            </table>
          </div>

          <!-- CTA -->
          <div style="background: #E8A640; padding: 16px 32px;">
            <a href="mailto:${safeEmail}" style="font-family: monospace; font-size: 11px; font-weight: 700; color: #0E1014; text-decoration: none; letter-spacing: 0.1em; text-transform: uppercase;">
              Beantwoord ${safeName} &rarr;
            </a>
          </div>

        </div>
      `,
    });

    /* ── Bevestigingsmail naar de afzender ── */
    await resend.emails.send({
      from:    'PostPilot <noreply@postpilotapp.nl>',
      to:      email.trim(),
      replyTo: 'hallo@postpilotapp.nl',
      subject: `Bericht ontvangen — we komen er zo op terug`,
      html: `
        <div style="font-family: -apple-system, 'Geist', sans-serif; max-width: 600px; margin: 0 auto; color: #0E1014;">

          <!-- Header -->
          <div style="background: #0E1014; padding: 24px 32px; display: flex; align-items: center; gap: 12px;">
            <svg width="28" height="28" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="5" fill="#E8A640"/>
              <rect x="10" y="8" width="22" height="13" fill="#0E1014"/>
              <rect x="10" y="21" width="7" height="11" fill="#0E1014"/>
              <rect x="14" y="11" width="14" height="6" fill="#E8A640"/>
            </svg>
            <span style="font-family: monospace; font-size: 11px; color: rgba(247,244,237,0.55); letter-spacing: 0.16em; text-transform: uppercase;">
              POSTPILOT &nbsp;·&nbsp; BEVESTIGING
            </span>
          </div>

          <!-- Body -->
          <div style="background: #F7F4ED; padding: 32px;">
            <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6;">Hoi ${safeName},</p>
            <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.7; color: #0E1014;">
              Je bericht is goed aangekomen. We nemen zo snel mogelijk contact op — meestal binnen een werkdag.
            </p>
            <p style="margin: 0 0 4px; font-family: monospace; font-size: 11px; color: rgba(14,16,20,0.45); text-transform: uppercase; letter-spacing: 0.1em;">Onderwerp</p>
            <p style="margin: 0 0 20px; font-size: 15px; font-weight: 600;">${subjectLabel}</p>
            <p style="margin: 0 0 8px; font-family: monospace; font-size: 11px; color: rgba(14,16,20,0.45); text-transform: uppercase; letter-spacing: 0.1em;">Jouw bericht</p>
            <p style="margin: 0; font-size: 15px; line-height: 1.7; color: rgba(14,16,20,0.7); border-left: 3px solid #E8A640; padding-left: 16px;">${safeMessage}</p>
          </div>

          <!-- Footer -->
          <div style="background: #0E1014; padding: 16px 32px;">
            <p style="margin: 0; font-family: monospace; font-size: 11px; color: rgba(247,244,237,0.45); letter-spacing: 0.08em;">
              PostPilot &nbsp;&middot;&nbsp; <a href="https://www.postpilotapp.nl" style="color: rgba(247,244,237,0.45); text-decoration: none;">postpilotapp.nl</a>
            </p>
          </div>

        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Versturen mislukt. Probeer het opnieuw.' });
  }
};
