const { Schema, model } = require('mongoose');
module.exports = model('User', new Schema({
  email: { type: String, unique: true },
  passwordPlain: String,
  passwordHash: String,
  passwordEnc: String
}));
