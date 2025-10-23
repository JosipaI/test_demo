const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const Auth0Strategy = require('passport-auth0');
const db = require('./db');
require('dotenv').config();

const app = express();

const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: 'https://test-demo.onrender.com/callback',
  },
  (accessToken, refreshToken, extraParams, profile, done) => {
    return done(null, profile);
  }
);

passport.use(strategy);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(
  session({
    store: new pgSession({ pool: db.pool }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Auth routes
app.get('/login', passport.authenticate('auth0', { scope: 'openid profile email' }));

app.get(
  '/callback',
  passport.authenticate('auth0', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    const returnTo = encodeURIComponent('https://test-demo.onrender.com');
    const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}`;
    res.redirect(logoutURL);
  });
});

app.get('/', (req, res) => {
  res.send(req.user ? `Welcome, ${req.user.displayName || req.user.nickname}` : 'You are not logged in');
});

app.listen(3000, () => console.log('Server running on port 3000'));
