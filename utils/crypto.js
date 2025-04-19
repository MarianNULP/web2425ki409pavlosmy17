const bcrypt = require('bcrypt');
const crypto = require('crypto');

const key = Buffer.from(process.env.ENC_KEY, 'hex');

// AES‑256‑CBC
function encrypt(plain) {
  const iv     = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const enc    = Buffer.concat([cipher.update(plain), cipher.final()]);
  return iv.toString('hex') + ':' + enc.toString('hex');
}

module.exports = {
  encrypt,
  hash:  plain => bcrypt.hash(plain, 12),
  verifyHash: (plain, hash) => bcrypt.compare(plain, hash)
};
