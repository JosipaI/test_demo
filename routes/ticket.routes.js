const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const db = require('../db'); 

router.get('/', (req, res) => {
  res.render('ticket', { user: req.user || null });
});

router.post('/', async (req, res) => {
  try {
    const { user_id, numbers, user_email } = req.body;

    if (!user_id) {
      return res.status(400).send('Nema korisnika.');
    }

    if (numbers.length == 0) {
      return res.status(400).send('Nema odabranih brojeva.');
    }

    const numbersArray = numbers.split(',').map(n => parseInt(n, 10));

    needed_array = []
    if (numbersArray.length < 6 || numbersArray.length > 10) {
      return res.status(400).send('Odaberi od 6 do 10 brojeva.');
    }

    const ticketId = uuidv4();
    const date = new Date();

    // Spremanje u bazu
    await db.pool.query(
      'INSERT INTO tickets (ticket_id, user_id, numbers, user_email, creation_time) VALUES ($1, $2, $3, $4, $5)',
      [ticketId, user_id, numbers, user_email, date]
    );

    const ticketUrl = `https://test-demo-ohoo.onrender.com/api/tickets/${ticketId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(ticketUrl);

    res.render('ticket_success', {
      ticketId,
      numbers: numbersArray,
      qrCodeDataUrl,
      user: req.user || null
    });
  } catch (e) {
    console.error('Nije moguce spremiti listić', e);
    res.status(500).send('Kvar na serveru.');
  }
});

router.get('/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const result = await db.pool.query('SELECT * FROM tickets WHERE ticket_id = $1', [ticketId]);
    found_rows = result.rows
    if (found_rows.length === 0) {
      return res.status(404).send('Nema listica');
    }

    const ticket = result.rows[0];
    tick_numbs = ticket.numbers.split(',').map(n => parseInt(n, 10));

    res.render('qr_show', {
      ticketId: ticket.ticket_id,
      numbers: tick_numbs,
      qrCodeDataUrl: null, 
      user: req.user || null
    });
  } catch (e) {
    console.error('Pogreska pri dohvaćanju listica:', e);
    res.status(500).send('Kvar na serveru.');
  }
});

module.exports = router;
