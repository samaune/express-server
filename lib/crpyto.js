import crypto from 'crypto';
const algorithm = 'aes-256-ctr';
const secretKey = 'vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3';
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const content = `${iv.toString('hex')}&${encrypted.toString('hex')}`;
    return content;
};

const decrypt = (hash) => {
    const chunk = hash.split("&");
    const iv = chunk[0];
    const content = chunk[1];
    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(iv, 'hex'));
    const decrpyted = Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]);
    return decrpyted.toString();
};

export default {
    encrypt,
    decrypt
};