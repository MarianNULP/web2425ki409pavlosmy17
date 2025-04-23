const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User           = require('../models/User');

passport.use(new GoogleStrategy({
  clientID    : process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL : '/auth/google/callback'
}, async (_access, _refresh, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const user  = await User.findOneAndUpdate(
      { email },
      { googleId: profile.id, name: profile.displayName },
      { upsert:true, new:true }
    );
    done(null, user);
  } catch (e) { done(e); }
}));

passport.serializeUser((u, done)=> done(null, u.id));
passport.deserializeUser((id, done)=>
  User.findById(id).then(u=>done(null,u)).catch(done)
);

module.exports = passport;
