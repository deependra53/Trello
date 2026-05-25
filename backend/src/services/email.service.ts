import nodemailer, { type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let transporterPromise: Promise<Transporter> | null = null;

async function getTransporter(): Promise<Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    if (env.SMTP_HOST) {
      return nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
      });
    }
    // Dev fallback: ethereal test account
    if (env.NODE_ENV === 'test') {
      // jsonTransport for tests — captured in memory, no network
      return nodemailer.createTransport({ jsonTransport: true });
    }
    const testAccount = await nodemailer.createTestAccount();
    logger.info(
      { user: testAccount.user, web: 'https://ethereal.email/login' },
      'using ethereal SMTP test account',
    );
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
  })();

  return transporterPromise;
}

export interface SendMailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(params: SendMailParams): Promise<void> {
  const transporter = await getTransporter();
  const info = await transporter.sendMail({ from: env.MAIL_FROM, ...params });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) logger.info({ preview }, 'email preview url');
}

// --- Email templates ----------------------------------------------------------

function wrap(title: string, body: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1f2937">
<h1 style="font-size:20px;margin:0 0 16px">${title}</h1>${body}
<p style="margin-top:32px;color:#6b7280;font-size:12px">— TrelloX</p>
</body></html>`;
}

export function sendVerificationEmail(to: string, name: string, token: string): Promise<void> {
  const url = `${env.APP_URL}/verify-email?token=${token}`;
  return sendMail({
    to,
    subject: 'Verify your TrelloX email',
    html: wrap(
      'Welcome to TrelloX',
      `<p>Hi ${name}, please confirm your email to activate your account.</p>
<p><a href="${url}" style="background:#3b82f6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify email</a></p>
<p style="font-size:12px;color:#6b7280">Or copy this link: ${url}</p>`,
    ),
  });
}

export function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const url = `${env.APP_URL}/reset-password?token=${token}`;
  return sendMail({
    to,
    subject: 'Reset your TrelloX password',
    html: wrap(
      'Reset your password',
      `<p>Hi ${name}, you requested a password reset. This link expires in 1 hour.</p>
<p><a href="${url}" style="background:#3b82f6;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset password</a></p>
<p style="font-size:12px;color:#6b7280">If you didn't request this, ignore this email.</p>`,
    ),
  });
}
