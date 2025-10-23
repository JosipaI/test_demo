const express = require('express');
const app = express();
const path = require('path');
const pg = require('pg')
const passport = require('passport');
const db = require('./db');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const Auth0Strategy = require('passport-auth0');

require('dotenv').config();

const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: '/callback'
  },
  (accessToken, refreshToken, extraParams, profile, done) => {
    return done(null, profile);
  }
);

passport.use(strategy);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const landingRouter = require('./routes/landing.routes');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));

//pohrana sjednica u postgres bazu korštenjem connect-pg-simple modula
app.use(session({
    store: new pgSession({
        pool: db.pool,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize());
app.use(passport.session());

app.get('/login', passport.authenticate('auth0', {
  scope: 'Email OpenID Profile'
}));

app.get('/callback', passport.authenticate('auth0', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/');
});


app.get('/logout', (req, res) => {
  req.logout(err => {
    const returnTo = encodeURIComponent('https://test-demo.onrender.com');
    const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}`;
    res.redirect(logoutURL);
  });
});


app.get('/', (req, res) => {
  res.send(req.user ? `Welcome ${req.user.displayName}`: 'You are not logged in');
});

app.listen(3000);