import { generateSecret, generateURI, verify } from 'otplib';
import QRCode from 'qrcode';
import { authConfig } from './auth.config';

export interface TotpSetup {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

export async function createTotpSetup(email: string): Promise<TotpSetup> {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: authConfig.totpIssuer,
    label: email,
    secret,
    period: 30,
  });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret,
    otpauthUrl,
    qrCodeDataUrl,
  };
}

export async function verifyTotp(code: string, secret: string): Promise<boolean> {
  const result = await verify({
    secret,
    token: code,
    period: 30,
    epochTolerance: authConfig.totpWindow * 30,
  });

  return result.valid;
}
