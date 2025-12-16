import crypto from 'crypto';

/**
 * Encryption utilities for vote data
 * Uses AES-256-GCM for authenticated encryption
 */

// Algorithm configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const SALT_LENGTH = 16;
const ITERATIONS = 100000;

/**
 * Derive a key from password using PBKDF2
 */
function deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256');
}

/**
 * Encrypt data with a password
 * @param {Object|string} data - Data to encrypt
 * @param {string} password - Encryption password
 * @returns {Object} - Encrypted data with salt, iv, authTag
 */
export function encrypt(data, password) {
    const salt = crypto.randomBytes(SALT_LENGTH);
    const key = deriveKey(password, salt);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    let encrypted = cipher.update(dataString, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Decrypt data with a password
 * @param {Object} encryptedData - Object with encrypted, salt, iv, authTag
 * @param {string} password - Decryption password
 * @returns {Object|string} - Decrypted data
 */
export function decrypt(encryptedData, password) {
    const { encrypted, salt, iv, authTag } = encryptedData;

    const saltBuffer = Buffer.from(salt, 'hex');
    const ivBuffer = Buffer.from(iv, 'hex');
    const authTagBuffer = Buffer.from(authTag, 'hex');

    const key = deriveKey(password, saltBuffer);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuffer);
    decipher.setAuthTag(authTagBuffer);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
        return JSON.parse(decrypted);
    } catch {
        return decrypted;
    }
}

/**
 * Encrypt the Dean's password for storage in DB
 * Uses a system key from environment variables
 */
export function encryptPassword(password) {
    const systemKey = process.env.SYSTEM_ENCRYPTION_KEY;
    if (!systemKey || systemKey.length < 32) {
        throw new Error('SYSTEM_ENCRYPTION_KEY must be at least 32 characters');
    }
    return encrypt({ password, timestamp: Date.now() }, systemKey);
}

/**
 * Decrypt the stored Dean's password
 */
export function decryptPassword(encryptedData) {
    const systemKey = process.env.SYSTEM_ENCRYPTION_KEY;
    if (!systemKey) {
        throw new Error('SYSTEM_ENCRYPTION_KEY not set');
    }
    const data = decrypt(encryptedData, systemKey);
    return data.password;
}

/**
 * Verify if provided password matches stored encrypted password
 */
export function verifyPassword(providedPassword, encryptedData) {
    try {
        const storedPassword = decryptPassword(encryptedData);
        return storedPassword === providedPassword;
    } catch {
        return false;
    }
}
