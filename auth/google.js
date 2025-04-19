// auth/google.js
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_ID,
  clientSecret: process.env.GOOGLE_SECRET,
  callbackURL:  '/auth/google/callback'
}, async (_, __, profile, done) => {
  const email = profile.emails[0].value;
  const user  = await User.findOneAndUpdate(
      { email },
      { googleId: profile.id, name: profile.displayName },
      { upsert:true, new:true }
  );
  return done(null, user);
}));

passport.serializeUser((u, done)=> done(null, u.id));
passport.deserializeUser((id, done)=> User.findById(id).then(u=>done(null,u)));

export default passport;
