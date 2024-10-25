import { randomBytes, createCipheriv, BinaryLike, scryptSync, createDecipheriv } from 'crypto';

const env = process.env;

// Function to derive key
const deriveKey = async (password: string, salt: BinaryLike | Buffer): Promise<Buffer> => {
    return scryptSync(password, salt, 32); // Return key as a Buffer
};

export const encryptText = async (target: string) => {
    const iv = randomBytes(12); // 12-byte IV for GCM
    const salt = randomBytes(16); // 16-byte salt for key derivation
    const password = env.CIPHER_PASS; // Your password

    const key: Buffer = await deriveKey(password, salt); // Derive key as a Buffer

    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const encryptedText = Buffer.concat([cipher.update(target, 'utf8'), cipher.final()]);

    // Get the authentication tag (important for GCM mode)
    const authTag = cipher.getAuthTag();

    // Return all necessary components for decryption
    const result = {
        iv: iv.toString('hex'),
        salt: salt.toString('hex'),
        encryptedText: encryptedText.toString('hex'),
        tag: authTag.toString('hex') // Include the authentication tag
    };

    return result;
};

export const decryptText = async ({ iv, salt, encryptedText, tag }) => {
    const password = env.CIPHER_PASS;

    // Derive the same key from password and salt
    const key: Buffer = await deriveKey(password, Buffer.from(salt, 'hex'));

    // Create decipher with the same key and IV
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'hex'));

    // Set the authentication tag (important for GCM mode)
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    // Decrypt the text
    const decryptedText = Buffer.concat([
        decipher.update(Buffer.from(encryptedText, 'hex')),
        decipher.final(),
    ]);

    return decryptedText.toString('utf8');
};
