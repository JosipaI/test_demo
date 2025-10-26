const express = require('express');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const Auth0Strategy = require('passport-auth0');
const db = require('./db');
const cron = require("node-cron");
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const strategy = new Auth0Strategy(
  {
    domain: process.env.AUTH0_DOMAIN,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL: 'https://test-demo-ohoo.onrender.com/callback',
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

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
    const returnTo = encodeURIComponent('https://test-demo-ohoo.onrender.com');
    const logoutURL = `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${returnTo}`;
    res.redirect(logoutURL);
  });
});

app.get('/', (req, res) => {
  res.render('landing', {
    user: req.user || null
  });
});

const ticketsRoutes = require('./routes/ticket.routes');
app.use('/', ticketsRoutes);

const roundsRoutes = require('./routes/lotto.routes');
app.use('/', roundsRoutes);

const BASE_URL = "http://https://test-demo-ohoo.onrender.com:3000"; 

let active = false;

cron.schedule("*/2 * * * *", async () => {
  try {
    if (!active) {
      console.log("POST na /new-round");
      const res = await fetch(`${BASE_URL}/new-round`, { method: "POST" });
      console.log(`Response: ${res.status}`);
      active = true;
    } else {
      console.log("POST na /close");
      const res = await fetch(`${BASE_URL}/close`, { method: "POST" });
      console.log(`Response: ${res.status}`);
      active = false;
    }
  } catch (err) {
    console.error("Greska pri slanju zahtjeva:", err);
  }
});


app.listen(3000, () => console.log('Server running on port 3000'));