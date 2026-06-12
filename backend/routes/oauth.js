import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as AppleStrategy } from 'passport-apple';
import { Strategy as OpenIDConnectStrategy } from 'passport-openidconnect';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function findOrCreateUser(profile, provider, done) {
  const email = profile.emails?.[0]?.value;
  const name = profile.displayName || profile.name || '';
  const firstName = profile.name?.givenName || name.split(' ')[0] || provider;
  const lastName = profile.name?.familyName || name.split(' ').slice(1).join(' ') || 'User';
  const avatar = profile.photos?.[0]?.value;

  User.findOne({ provider, providerId: profile.id })
    .then(user => {
      if (user) {
        return done(null, user);
      }
      User.findOne({ email })
        .then(existingUser => {
          if (existingUser) {
            existingUser.provider = provider;
            existingUser.providerId = profile.id;
            if (avatar) existingUser.avatar = avatar;
            return existingUser.save().then(u => done(null, u));
          }
          const newUser = new User({
            firstName,
            lastName,
            email,
            provider,
            providerId: profile.id,
            isVerified: true,
            avatar
          });
          return newUser.save().then(u => done(null, u));
        });
    })
    .catch(err => done(err, null));
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'dummy',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
  callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return done(new Error('Google OAuth not configured'));
  }
  findOrCreateUser(profile, 'google', done);
}));

passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID || 'dummy',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy',
  callbackURL: `${process.env.BACKEND_URL}/api/auth/github/callback`
}, (accessToken, refreshToken, profile, done) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return done(new Error('GitHub OAuth not configured'));
  }
  findOrCreateUser(profile, 'github', done);
}));

if (process.env.APPLE_CLIENT_ID) {
  passport.use(new AppleStrategy({
    clientID: process.env.APPLE_CLIENT_ID,
    teamID: process.env.APPLE_TEAM_ID,
    keyID: process.env.APPLE_KEY_ID,
    privateKeyLocation: process.env.APPLE_PRIVATE_KEY_PATH,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/apple/callback`
  }, (req, accessToken, refreshToken, idToken, profile, done) => {
    const email = idToken?.email;
    const user = {
      id: idToken?.sub,
      emails: email ? [{ value: email }] : [],
      displayName: idToken?.name || email?.split('@')[0] || 'Apple User',
      name: idToken?.name ? { givenName: idToken.name.firstName, familyName: idToken.name.lastName } : undefined
    };
    findOrCreateUser({ ...profile, ...user }, 'apple', done);
  }));
} else {
  // Create a dummy strategy to prevent errors when Apple OAuth is not configured
  passport.use('apple', new AppleStrategy({
    clientID: 'dummy-apple-id',
    teamID: 'dummy-team',
    keyID: 'dummy-key',
    privateKeyLocation: './dummy.p8',
    callbackURL: 'http://localhost:5000/api/auth/apple/callback'
  }, (req, accessToken, refreshToken, idToken, profile, done) => {
    done(new Error('Apple OAuth not configured'));
  }));
}

if (process.env.YAHOO_CLIENT_ID) {
  passport.use('yahoo', new OpenIDConnectStrategy({
    issuer: 'https://api.login.yahoo.com',
    authorizationURL: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenURL: 'https://api.login.yahoo.com/oauth2/get_token',
    userInfoURL: 'https://api.login.yahoo.com/openid/v1/userinfo',
    clientID: process.env.YAHOO_CLIENT_ID,
    clientSecret: process.env.YAHOO_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/yahoo/callback`,
    scope: ['openid', 'email', 'profile']
  }, (issuer, sub, profile, accessToken, refreshToken, done) => {
    findOrCreateUser({
      id: sub,
      emails: profile?.email ? [{ value: profile.email }] : [],
      displayName: profile?.name || profile?.given_name || 'Yahoo User',
      name: { givenName: profile?.given_name, familyName: profile?.family_name }
    }, 'yahoo', done);
  }));
} else {
  // Create a dummy strategy to prevent errors when Yahoo OAuth is not configured
  passport.use('yahoo', new OpenIDConnectStrategy({
    issuer: 'https://api.login.yahoo.com',
    authorizationURL: 'https://api.login.yahoo.com/oauth2/request_auth',
    tokenURL: 'https://api.login.yahoo.com/oauth2/get_token',
    userInfoURL: 'https://api.login.yahoo.com/openid/v1/userinfo',
    clientID: 'dummy-yahoo-id',
    clientSecret: 'dummy-yahoo-secret',
    callbackURL: 'http://localhost:5000/api/auth/yahoo/callback',
    scope: ['openid', 'email', 'profile']
  }, (issuer, sub, profile, accessToken, refreshToken, done) => {
    done(new Error('Yahoo OAuth not configured'));
  }));
}

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }), (req, res) => {
  const token = generateToken(req.user);
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
});

if (process.env.APPLE_CLIENT_ID) {
  router.get('/apple', passport.authenticate('apple', { session: false }));

  router.post('/apple/callback', passport.authenticate('apple', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }), (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  });
}

if (process.env.YAHOO_CLIENT_ID) {
  router.get('/yahoo', passport.authenticate('yahoo', { session: false }));

  router.get('/yahoo/callback', passport.authenticate('yahoo', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed` }), (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  });
}

export default router;
