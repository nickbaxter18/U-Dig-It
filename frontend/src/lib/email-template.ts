import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { logger } from './logger';
import { SUPABASE_URL as CONFIG_SUPABASE_URL } from '@/lib/supabase/config';

const LOGO_CANDIDATE_PATHS = [
  ['b5dd9044-d359-4962-9538-69d82f35c66d.png.PNG'],
  ['..', 'b5dd9044-d359-4962-9538-69d82f35c66d.png.PNG'],
  ['frontend', 'b5dd9044-d359-4962-9538-69d82f35c66d.png.PNG'],
  ['..', 'frontend', 'b5dd9044-d359-4962-9538-69d82f35c66d.png.PNG'],
  ['public', 'images', 'email-logo.png'],
  ['public', 'images', 'udigit-logo.png'],
  ['frontend', 'public', 'images', 'email-logo.png'],
  ['frontend', 'public', 'images', 'udigit-logo.png'],
];

const LOGO_CID = 'company-email-logo';
const LOGO_FILENAME = 'udig-it-logo.png';

const CUSTOM_LOGO_URL =
  process.env.NEXT_PUBLIC_EMAIL_ASSET_URL ||
  process.env.NEXT_PUBLIC_EMAIL_ASSET_BASE_URL ||
  process.env.EMAIL_ASSET_URL ||
  process.env.EMAIL_ASSET_BASE_URL ||
  null;

const SUPABASE_URL = (CONFIG_SUPABASE_URL || '').replace(/\/$/, '') || null;
const EMAIL_LOGO_BUCKET = process.env.NEXT_PUBLIC_EMAIL_LOGO_BUCKET || 'Email Photos';
const EMAIL_LOGO_PATH =
  process.env.NEXT_PUBLIC_EMAIL_LOGO_PATH || 'Untitled folder/Logo No Background.PNG';

const encodeStoragePath = (path: string) =>
  path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

const REMOTE_LOGO_URL = CUSTOM_LOGO_URL
  ? CUSTOM_LOGO_URL
  : SUPABASE_URL
    ? `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(
        EMAIL_LOGO_BUCKET
      )}/${encodeStoragePath(EMAIL_LOGO_PATH)}`
    : null;

const FALLBACK_BASE64_PATHS = [
  ['frontend', 'src', 'lib', 'email-logo-fallback.base64'],
  ['src', 'lib', 'email-logo-fallback.base64'],
  ['email-logo-fallback.base64'],
];

let cachedLogoBuffer: Buffer | null | undefined;
let logoLoadLogged = false;
let cachedFallbackBase64: string | null | undefined;

function loadFallbackBase64(): string | null {
  if (cachedFallbackBase64 !== undefined) {
    return cachedFallbackBase64;
  }

  for (const segments of FALLBACK_BASE64_PATHS) {
    try {
      const candidatePath = join(process.cwd(), ...segments);
      const base64 = readFileSync(candidatePath, 'utf8').trim();
      if (base64) {
        cachedFallbackBase64 = base64;
        logger.debug('Email logo fallback base64 loaded', {
          component: 'email-template',
          action: 'logo_fallback_loaded',
          metadata: { path: candidatePath, length: base64.length },
        });
        return cachedFallbackBase64;
      }
    } catch {
      // Continue searching
    }
  }

  cachedFallbackBase64 = null;
  return cachedFallbackBase64;
}

function tryLoadLogo(): Buffer | null {
  if (cachedLogoBuffer !== undefined) {
    return cachedLogoBuffer;
  }

  for (const segments of LOGO_CANDIDATE_PATHS) {
    try {
      const candidatePath = join(process.cwd(), ...segments);
      const buffer = readFileSync(candidatePath);
      cachedLogoBuffer = buffer;
      if (!logoLoadLogged) {
        logger.debug('Email logo loaded from filesystem', {
          component: 'email-template',
          action: 'logo_loaded',
          metadata: { path: candidatePath, size: buffer.length },
        });
        logoLoadLogged = true;
      }
      return cachedLogoBuffer;
    } catch {
      // Continue
    }
  }

  const fallbackBase64 = loadFallbackBase64();
  if (fallbackBase64) {
    cachedLogoBuffer = Buffer.from(fallbackBase64, 'base64');
    if (!logoLoadLogged) {
      logger.warn('Email logo file not found, using embedded fallback', {
        component: 'email-template',
        action: 'logo_missing_fallback',
      });
      logoLoadLogged = true;
    }
    return cachedLogoBuffer;
  }

  cachedLogoBuffer = null;

  if (!logoLoadLogged) {
    logger.warn('Email logo file not found and fallback unavailable, using remote URL', {
      component: 'email-template',
      action: 'logo_missing_remote',
    });
    logoLoadLogged = true;
  }

  return cachedLogoBuffer;
}

export function getEmailLogoCid(): string {
  return LOGO_CID;
}

export function getEmailLogoAttachment(): {
  content: string;
  filename: string;
  type: string;
  disposition: 'inline';
  content_id: string;
} | null {
  if (REMOTE_LOGO_URL) {
    return null;
  }

  const buffer = tryLoadLogo();
  if (!buffer) {
    const fallbackBase64 = loadFallbackBase64();
    if (!fallbackBase64) {
      return null;
    }

    return {
      content: fallbackBase64,
      filename: LOGO_FILENAME,
      type: 'image/png',
      disposition: 'inline',
      content_id: LOGO_CID,
    };
  }

  return {
    content: buffer.toString('base64'),
    filename: LOGO_FILENAME,
    type: 'image/png',
    disposition: 'inline',
    content_id: LOGO_CID,
  };
}

export function getEmailLogoImgSrc(): string {
  if (REMOTE_LOGO_URL) {
    return REMOTE_LOGO_URL;
  }

  const buffer = tryLoadLogo();
  if (buffer) {
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  const fallbackBase64 = loadFallbackBase64();
  if (fallbackBase64) {
    return `data:image/png;base64,${fallbackBase64}`;
  }

  return 'https://udigitrentals.com/images/udigit-logo.png';
}

export function escapeHtml(input: string | number | null | undefined): string {
  if (input === null || input === undefined) {
    return '';
  }

  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const DEFAULT_REGISTRATION_LINE = 'HST/GST Registration: 744292160 RT0001';

interface EmailLayoutOptions {
  headline: string;
  bodyHtml: string;
  previewText?: string;
  accentColor?: string;
  footerHtml?: string;
  tagLine?: string;
  companyLine?: string;
  addressLine?: string;
  registrationLine?: string | null;
}

export function renderEmailLayout({
  headline,
  bodyHtml,
  previewText,
  accentColor = '#0f172a',
  footerHtml,
  tagLine,
  companyLine = 'U-Dig It Rentals Inc.',
  addressLine = '945 Golden Grove Road, Saint John, NB E2H 2X1, Canada',
  registrationLine = DEFAULT_REGISTRATION_LINE,
}: EmailLayoutOptions): string {
  const logoSrc = getEmailLogoImgSrc();
  const safeHeadline = escapeHtml(headline);
  const safeCompanyLine = escapeHtml(companyLine);
  const safeAddressLine = escapeHtml(addressLine);
  const safeTagLine = tagLine ? escapeHtml(tagLine) : '';
  const safeRegistrationLine =
    registrationLine && registrationLine.trim().length > 0
      ? escapeHtml(registrationLine)
      : '';
  const preview = previewText ? escapeHtml(previewText) : '';
  const goldAccentLine =
    'height:3px; background:linear-gradient(90deg, rgba(225,188,86,0) 0%, rgba(225,188,86,0.85) 25%, rgba(225,188,86,0.85) 75%, rgba(225,188,86,0) 100%);';
  const softDividerLine = 'height:1px; background:#e5e7eb;';
  const dotMatrixBackground =
    'background-image: radial-gradient(rgba(225,188,86,0.2) 1.5px, transparent 1.5px); background-size:36px 36px; background-position:50% 50%;';
  const tagLineHtml = safeTagLine
    ? `<p style="margin:12px 0 0; font-size:11px; letter-spacing:0.18em; text-transform:uppercase; color:#d1d5db;">${safeTagLine}</p>`
    : '';
  const footerContent =
    footerHtml ??
    `
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse; margin-top:28px; background:#0f172a; color:#f8fafc; border-radius:16px; overflow:hidden;">
        <tr>
          <td style="${goldAccentLine}; border-radius:16px 16px 0 0;"></td>
        </tr>
        <tr>
          <td style="padding:26px 28px 14px;">
            <p style="margin:0; font-size:16px; font-weight:600;">We're here whenever you need us.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 16px;">
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;">
              <tr>
                <td width="50%" valign="top" style="padding-right:12px;">
                  <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#cbd5f5;">Contact</p>
                  <p style="margin:0 0 8px; font-size:13px; line-height:1.5;">
                    📞 <a href="tel:+15066431575" style="color:#E1BC56; text-decoration:none;">(506) 643-1575</a>
                  </p>
                  <p style="margin:0 0 8px; font-size:13px; line-height:1.5;">
                    ✉️ <a href="mailto:info@udigit.ca" style="color:#E1BC56; text-decoration:none;">info@udigit.ca</a>
                  </p>
                  <p style="margin:0; font-size:13px; line-height:1.5;">
                    📍 945 Golden Grove Road<br />Saint John, NB E2H 2X1
                  </p>
                </td>
                <td width="50%" valign="top" style="padding-left:12px;">
                  <p style="margin:0 0 10px; font-size:12px; letter-spacing:0.18em; text-transform:uppercase; color:#cbd5f5;">Hours</p>
                  <p style="margin:0 0 6px; font-size:13px; line-height:1.5;">Monday – Saturday: 7:00 AM – 6:00 PM</p>
                  <p style="margin:0 0 6px; font-size:13px; line-height:1.5;">Sunday: By appointment</p>
                  <p style="margin:0; font-size:12px; color:#94a3b8;">Need equipment after hours? Call and we'll make it happen.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:6px 28px 22px;">
            <a href="http://localhost:3000/" style="
              display:inline-block;
              padding:12px 26px;
              border-radius:999px;
              background:linear-gradient(135deg, #E1BC56 0%, #F4D03F 100%);
              color:#111827;
              font-weight:600;
              text-decoration:none;
            ">
              Book Equipment
            </a>
          </td>
        </tr>
        <tr>
          <td style="${goldAccentLine}"></td>
        </tr>
        <tr>
          <td align="center" style="padding:16px 28px 26px; font-size:11px; color:#94a3b8; line-height:1.6;">
            U-Dig It Rentals Inc. • Saint John, NB • © ${new Date().getFullYear()} All rights reserved.<br />
            This is an automated message. Need help? Reply to this email or call (506) 643-1575.
          </td>
        </tr>
      </table>
    `;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${safeHeadline}</title>
      </head>
      <body style="margin:0; padding:0; background-color:#f3f4f6; font-family: 'Helvetica Neue', Arial, sans-serif; color:#111827;">
        ${
          preview
            ? `<div style="display:none; font-size:1px; color:#f3f4f6; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${preview}</div>`
            : ''
        }
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="background-color:#f3f4f6; padding: 32px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="max-width:600px; background-color:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e5e7eb; box-shadow:0 10px 25px rgba(15, 23, 42, 0.08);">
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:28px 24px 26px;">
                          <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse; background-color:#0f172a; border-radius:14px;">
                            <tr>
                              <td style="${goldAccentLine} border-radius:14px 14px 0 0;"></td>
                            </tr>
                            <tr>
                              <td style="padding:8px 18px 8px; ${dotMatrixBackground}">
                                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style="border-collapse:collapse;">
                                  <tr>
                                    <td align="center">
                                      <div style="display:inline-block; position:relative; padding-bottom:0;">
                                        <img src="${logoSrc}" alt="U-Dig It Rentals logo" width="275" style="display:block; width:275px; max-width:275px; height:auto; position:relative; z-index:1;" />
                                        <div style="position:absolute; left:20%; right:20%; bottom:28px; height:11px; border-radius:999px; background:radial-gradient(circle at center, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.2) 55%, rgba(0,0,0,0) 100%); opacity:0.98;"></div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td align="center" style="padding-top:2px;">
                                      <p style="margin:0; font-size:10px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:#f9fafb;">
                                        ${safeCompanyLine}
                                      </p>
                                      <p style="margin:2px 0 0; font-size:9px; color:#d1d5db;">${safeAddressLine}</p>
                                      ${
                                        safeRegistrationLine
                                          ? `<p style="margin:2px 0 0; font-size:9px; color:#d1d5db;">${safeRegistrationLine}</p>`
                                          : ''
                                      }
                                      ${tagLineHtml}
                                      <h1 style="margin:8px 0 16px; font-size:19px; line-height:1.3; font-weight:700; color:${accentColor};">
                                        ${safeHeadline}
                                      </h1>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                            <tr>
                              <td style="${goldAccentLine} border-radius:0 0 14px 14px;"></td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:0 24px 18px;">
                          <div style="${softDividerLine}; border-radius:8px;"></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:24px 24px 32px;">
                    ${bodyHtml}
                    <hr style="border:none; border-top:1px solid #e5e7eb; margin:32px 0;" />
                    ${footerContent}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}
