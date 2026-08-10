import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = (): Buffer => {
  const keyBase64 = process.env.PAYMENT_CREDENTIALS_ENCRYPTION_KEY;
  if (!keyBase64) {
    throw new Error('PAYMENT_CREDENTIALS_ENCRYPTION_KEY is not defined in environment variables.');
  }
  
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) {
    throw new Error('PAYMENT_CREDENTIALS_ENCRYPTION_KEY must be exactly 32 bytes (256 bits) when decoded from base64.');
  }
  return key;
};

export const encryptPaymentCredential = (text: string): string => {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decryptPaymentCredential = (encryptedText: string): string => {
  if (!encryptedText) return '';
  
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted credential format.');
  }
  
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encryptedData = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

export const maskPaymentCredential = (text: string): string => {
  if (!text || text.length <= 4) return '••••';
  const last4 = text.substring(text.length - 4);
  return `••••${last4}`;
};
