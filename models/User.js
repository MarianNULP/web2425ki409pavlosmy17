const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  passwordHash: {
    type: String,
    required: function() { return !this.googleId; }
  },
  googleId: {
    type: String,
    required: function() { return !this.passwordHash; }
  }
}, { timestamps: true });

module.exports = model('User', userSchema);

