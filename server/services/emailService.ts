import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface VerificationEmailOptions {
  to: string;
  name: string;
  code: string;
  universityName?: string;
}

export interface EmailSendResult {
  success: boolean;
  provider: 'resend' | 'brevo' | 'gmail' | 'smtp' | 'ethereal' | 'none';
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

let cachedTransporter: Transporter | null = null;
let cachedEtherealTransporter: Transporter | null = null;

/**
 * Generates a responsive, Gmail-compatible HTML email template for UniMart OTP verification.
 */
export function generateVerificationEmailHtml(options: VerificationEmailOptions): string {
  const { name, code, universityName = 'Your University' } = options;
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>UniMart Email Verification</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 15px 40px 15px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #0d9488 100%); padding: 36px 30px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; width: 44px; height: 44px; line-height: 44px; background: rgba(255, 255, 255, 0.2); border-radius: 12px; font-size: 22px; color: #ffffff; text-align: center; border: 1px solid rgba(255, 255, 255, 0.35);">
                      🎓
                    </div>
                    <h1 style="color: #ffffff; margin: 12px 0 4px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">UniMart</h1>
                    <p style="color: #a7f3d0; margin: 0; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px;">University Community Marketplace</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN BODY -->
          <tr>
            <td style="padding: 36px 32px 28px 32px; color: #1e293b;">
              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">Verify Your University Email</h2>
              
              <p style="margin: 0 0 14px 0; font-size: 15px; line-height: 24px; color: #334155;">
                Hello <strong>${escapeHtml(name)}</strong>,
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 22px; color: #475569;">
                Welcome to <strong>UniMart</strong> for <strong>${escapeHtml(universityName)}</strong>. To verify your student account and access campus marketplace features, please enter the 6-digit verification code below:
              </p>

              <!-- OTP CODE BOX -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 28px 0 28px 0;">
                <tr>
                  <td align="center" style="background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 24px 20px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #047857; font-weight: 700; margin-bottom: 8px;">
                      Your Verification Code
                    </div>
                    <div style="font-family: 'Courier New', Courier, monospace; font-size: 40px; font-weight: 800; letter-spacing: 10px; color: #065f46; line-height: 48px;">
                      ${code}
                    </div>
                    <div style="margin-top: 10px; font-size: 12px; color: #059669; font-weight: 600;">
                      ⏱️ Expires in 15 minutes
                    </div>
                  </td>
                </tr>
              </table>

              <!-- INSTRUCTIONS -->
              <p style="margin: 0 0 18px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                Enter this six-digit code in the UniMart verification modal. Once verified, you will be able to buy, sell, exchange textbooks, offer campus services, and connect securely with fellow students and faculty.
              </p>

              <!-- SECURITY NOTICE -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0 0 0; background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td width="24" valign="top" style="font-size: 18px; line-height: 20px;">🔒</td>
                        <td style="padding-left: 10px; font-size: 12px; line-height: 18px; color: #92400e;">
                          <strong>Security Notice:</strong> Never share this code with anyone. UniMart administrators or staff will never ask for your verification code.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                If you did not request this account or sign up on UniMart, please ignore this email. No account will be activated without this code.
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">
                UniMart &bull; Verified Campus Student Marketplace
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${currentYear} UniMart Campus Community. Built exclusively for university students and teachers.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Escapes HTML characters for safe template rendering.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Dispatches verification email via Resend REST API.
 */
async function sendViaResend(options: VerificationEmailOptions): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, provider: 'resend', error: 'Missing RESEND_API_KEY.' };
  }

  const from = process.env.RESEND_FROM || process.env.EMAIL_FROM || 'UniMart <onboarding@resend.dev>';
  const subject = `UniMart Verification Code: ${options.code}`;
  const html = generateVerificationEmailHtml(options);
  const text = `Your UniMart verification code is: ${options.code}. This code expires in 15 minutes. Never share this code with anyone.`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject,
        html,
        text,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as any;

    if (!res.ok) {
      const errMsg = data?.message || data?.error?.message || `Resend API returned status ${res.status}`;
      return { success: false, provider: 'resend', error: errMsg };
    }

    return {
      success: true,
      provider: 'resend',
      messageId: data.id || 'resend-ok',
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'resend',
      error: err.message || 'Network error reaching Resend API.',
    };
  }
}

/**
 * Dispatches verification email via Brevo REST API.
 */
async function sendViaBrevo(options: VerificationEmailOptions): Promise<EmailSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return { success: false, provider: 'brevo', error: 'Missing BREVO_API_KEY.' };
  }

  const rawSender = (process.env.BREVO_FROM || process.env.EMAIL_FROM || 'no-reply@unimart.edu').trim();
  const angleMatch = rawSender.match(/^(.*?)\s*<([^>]+)>$/);
  const senderName = angleMatch && angleMatch[1].trim() ? angleMatch[1].trim().replace(/^["']|["']$/g, '') : 'UniMart Support';
  const senderEmail = angleMatch ? angleMatch[2].trim() : rawSender;
  const subject = `UniMart Verification Code: ${options.code}`;
  const html = generateVerificationEmailHtml(options);
  const text = `Your UniMart verification code is: ${options.code}. This code expires in 15 minutes. Never share this code with anyone.`;

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: options.to, name: options.name }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as any;

    if (!res.ok) {
      const errMsg = data?.message || `Brevo API returned status ${res.status}`;
      return { success: false, provider: 'brevo', error: errMsg };
    }

    return {
      success: true,
      provider: 'brevo',
      messageId: data.messageId || 'brevo-ok',
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'brevo',
      error: err.message || 'Network error reaching Brevo API.',
    };
  }
}

/**
 * Gets or initializes a Nodemailer transporter for Gmail or Custom SMTP.
 */
function getSmtpTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');

  if (gmailUser && gmailPass) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: { user, pass },
    });
    return cachedTransporter;
  }

  return null;
}

/**
 * Dispatches verification email via Nodemailer SMTP (Gmail or custom SMTP).
 */
async function sendViaSmtp(options: VerificationEmailOptions): Promise<EmailSendResult> {
  const transporter = getSmtpTransporter();
  if (!transporter) {
    return { success: false, provider: 'smtp', error: 'SMTP transporter not configured.' };
  }

  const isGmail = !!(process.env.GMAIL_USER || (process.env.SMTP_HOST && process.env.SMTP_HOST.includes('gmail')));
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM || (isGmail ? process.env.GMAIL_USER : 'UniMart <no-reply@unimart.edu>');
  const subject = `UniMart Verification Code: ${options.code}`;
  const html = generateVerificationEmailHtml(options);
  const text = `Your UniMart verification code is: ${options.code}. This code expires in 15 minutes. Never share this code with anyone.`;

  try {
    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject,
      text,
      html,
    });

    return {
      success: true,
      provider: isGmail ? 'gmail' : 'smtp',
      messageId: info.messageId,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: isGmail ? 'gmail' : 'smtp',
      error: err.message || 'Failed to dispatch email via SMTP.',
    };
  }
}

/**
 * Ethereal test inbox fallback for local development when no credentials are provided.
 */
async function sendViaEthereal(options: VerificationEmailOptions): Promise<EmailSendResult> {
  try {
    if (!cachedEtherealTransporter) {
      const testAccount = await nodemailer.createTestAccount();
      cachedEtherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    const html = generateVerificationEmailHtml(options);
    const text = `Your UniMart verification code is: ${options.code}. This code expires in 15 minutes.`;

    const info = await cachedEtherealTransporter.sendMail({
      from: '"UniMart Support" <no-reply@unimart.edu>',
      to: options.to,
      subject: `UniMart Verification Code: ${options.code}`,
      text,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    return {
      success: true,
      provider: 'ethereal',
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      provider: 'ethereal',
      error: err.message || 'Failed to dispatch email via Ethereal test account.',
    };
  }
}

/**
 * Primary dispatch function: chooses the configured provider with strict priority:
 * 1. Resend API
 * 2. Brevo API
 * 3. Gmail SMTP / Custom SMTP
 * 4. Ethereal Test SMTP (Development only fallback)
 * 5. Rejection (Production without configured provider)
 */
export async function sendVerificationEmail(options: VerificationEmailOptions): Promise<EmailSendResult> {
  const isProduction = process.env.NODE_ENV === 'production';

  // Basic email syntax validation
  if (!options.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(options.to)) {
    return {
      success: false,
      provider: 'none',
      error: `Invalid recipient email address: "${options.to}".`,
    };
  }

  // 1. Resend API
  if (process.env.RESEND_API_KEY) {
    const res = await sendViaResend(options);
    if (res.success) {
      if (!isProduction) {
        console.log(`[EmailService] Sent OTP email to ${options.to} via Resend. Message ID: ${res.messageId}`);
      }
      return res;
    }
    console.error('[EmailService] Resend delivery failed:', res.error);
    return res;
  }

  // 2. Brevo API
  if (process.env.BREVO_API_KEY) {
    const res = await sendViaBrevo(options);
    if (res.success) {
      if (!isProduction) {
        console.log(`[EmailService] Sent OTP email to ${options.to} via Brevo. Message ID: ${res.messageId}`);
      }
      return res;
    }
    console.error('[EmailService] Brevo delivery failed:', res.error);
    return res;
  }

  // 3. Gmail or Custom SMTP
  if (
    (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  ) {
    const res = await sendViaSmtp(options);
    if (res.success) {
      if (!isProduction) {
        console.log(`[EmailService] Sent OTP email to ${options.to} via SMTP (${res.provider}). Message ID: ${res.messageId}`);
      }
      return res;
    }
    console.error(`[EmailService] SMTP (${res.provider}) delivery failed:`, res.error);
    return res;
  }

  // 4. Production guard: In production, missing credentials must be explicitly rejected
  if (isProduction) {
    const err = 'No email provider configured. Please set RESEND_API_KEY, GMAIL_USER/GMAIL_APP_PASSWORD, or SMTP_HOST/USER/PASS in production environment variables.';
    console.error(`[EmailService] [FATAL] ${err}`);
    return {
      success: false,
      provider: 'none',
      error: err,
    };
  }

  // 5. Development fallback: Ethereal test account with live web preview
  console.warn(
    `[EmailService] No live SMTP or API credentials configured in .env. Falling back to Ethereal test inbox for development. Real emails will NOT land in Gmail until you provide GMAIL_USER/GMAIL_APP_PASSWORD or RESEND_API_KEY.`
  );
  const etherealRes = await sendViaEthereal(options);
  if (etherealRes.previewUrl) {
    console.log(`[EmailService] [DEVELOPMENT] View delivered email in browser at: ${etherealRes.previewUrl}`);
  }
  return etherealRes;
}

/**
 * Returns diagnostic information about the active email provider configuration.
 */
export function getEmailProviderStatus(): {
  provider: 'resend' | 'brevo' | 'gmail' | 'smtp' | 'none';
  configured: boolean;
  senderAddress: string;
} {
  if (process.env.RESEND_API_KEY) {
    return {
      provider: 'resend',
      configured: true,
      senderAddress: process.env.RESEND_FROM || process.env.EMAIL_FROM || 'UniMart <onboarding@resend.dev>',
    };
  }
  if (process.env.BREVO_API_KEY) {
    return {
      provider: 'brevo',
      configured: true,
      senderAddress: process.env.BREVO_FROM || process.env.EMAIL_FROM || 'no-reply@unimart.edu',
    };
  }
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return {
      provider: 'gmail',
      configured: true,
      senderAddress: process.env.GMAIL_USER,
    };
  }
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      provider: 'smtp',
      configured: true,
      senderAddress: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER,
    };
  }
  return {
    provider: 'none',
    configured: false,
    senderAddress: 'none',
  };
}

