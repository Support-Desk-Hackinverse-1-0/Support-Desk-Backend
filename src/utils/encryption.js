import crypto from 'crypto';
import { config } from '../config/config.js';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(config.ENCRYPTION_KEY, 'utf-8'); // Must be 32 bytes
const IV_LENGTH = 16; // For AES, this is always 16

export const encrypt = (text) => {
    if (!text) return null;
    
    // Check if key is exactly 32 bytes
    if (ENCRYPTION_KEY.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text) => {
    if (!text) return null;

    if (ENCRYPTION_KEY.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
    }

    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
};
