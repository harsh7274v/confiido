import { NextResponse } from 'next/server';
// @ts-expect-error - nodemailer types
import nodemailer from 'nodemailer';

// Ensure this route runs on node runtime
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, subject, query } = body as { email?: string; subject?: string; query?: string };

    if (!email || !subject || !query) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 });
    }

    const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'confiido.io+support@gmail.com';

    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      // If SMTP is not configured, log and return success to avoid blocking UX.
      console.warn('[support email] SMTP env vars missing; skipping send. Expected SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
      console.info('[support email] Intended message:', { to: SUPPORT_EMAIL, from: email, subject, query });
      return NextResponse.json({ ok: true, skipped: true });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const text = `Support request from Confiido website\n\nFrom: ${email}\nSubject: ${subject}\n\nQuery:\n${query}`;
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height: 1.6;">
        <h2>Support request from Confiido website</h2>
        <p><strong>From:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Query:</strong></p>
        <pre style="white-space: pre-wrap; background:#f8fafc; padding:12px; border-radius:8px;">${query}</pre>
      </div>
    `;

    await transporter.sendMail({
      from: `Confiido Support Bot <${SMTP_USER}>`,
      replyTo: email,
      to: SUPPORT_EMAIL,
      subject: `[Confiido Support] ${subject}`,
      text,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[support email] failed', err);
    return NextResponse.json({ ok: false, error: 'Failed to send support email' }, { status: 500 });
  }
}


