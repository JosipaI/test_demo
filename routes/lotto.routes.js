const express = require('express');
const { pool } = require('../db');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');


router.post('/new-round', async (req, res) => {
  try {
    const active = await pool.query('SELECT rounds_id FROM rounds WHERE is_active = TRUE');

    if (active.rowCount > 0) {
        return res.status(204).send();
    }
        
    await pool.query('INSERT INTO rounds (is_active) VALUES (TRUE)');
    console.log("Pokrenuto kolo")
    res.status(200).json({ message: 'Pokrenuto je novo kolo' });
    
  } catch (e) {
    console.error("Kolo se nije uspjelo pokrenuti:", e);
    res.status(500).send('Kvar na serveru');
  }
});

router.post('/close', async (req, res) => {
  try {
    const result = await pool.query('UPDATE rounds SET is_active = FALSE WHERE is_active = TRUE');
    if (result.rowCount === 0) {
        return res.status(204).send();
    }

    const randomNumbers = Array.from({ length: 45 }, (_, i) => i + 1).sort(() => 0.5 - Math.random()).slice(0, 6).sort((a, b) => a - b);

    const newLocal = await pool.query(`UPDATE rounds SET is_active = FALSE, creation_time = NOW(), numbers = $1 WHERE is_active = TRUE`,[randomNumbers]);
    const ticketsRes = await pool.query('SELECT id FROM tickets WHERE rounds_id = $1', [roundId]);

    for (const ticket of ticketsRes.rows) {
      const ticketUrl = `https://tvoja-aplikacija.onrender.com/ticket/${ticket.id}`;
      const qrBuffer = await generateQRCode(ticketUrl);

      await pool.query('UPDATE tickets SET qr_code = $1 WHERE id = $2', [qrBuffer, ticket.id]);
    }

    console.log(`Kolo ${roundId} zatvoreno i QR kodovi generirani za sve listiće.`);
   

    return res.sendStatus(204).json({ message: 'Kolo je zatvoreno' });

  } catch (e) {
    console.error(e);
    res.status(500).send('Kvar na serveru');
  }
});

router.post('/store-results', async (req, res) => {
  try {
    const { numbers, oib } = req.body;

    if (!oib) {
      return res.status(400).json({ error: 'Unesite OIB ili broj putovnice.' });
    }

    if (oib.length != 20) {
      return res.status(400).json({ error: 'OIB ili broj putovnice mora imati 20 znakova.' });
    }

    if (!numbers) {
      return res.status(400).json({ error: 'Unesite brojeve.' });
    }
    const numbersArray = numbers.split(',').map(n => parseInt(n, 10));

    if (!Array.isArray(numbersArray)) {
      return res.status(400).json({ error: 'Nije uneseno polje brojeva!' });
    }

    const lastClosedRound = await pool.query(`
      SELECT rounds_id, numbers 
      FROM rounds 
      WHERE is_active = FALSE 
      ORDER BY rounds_id DESC 
      LIMIT 1
    `);
    if (lastClosedRound.rowCount === 0) {
      return res.status(400).json({ error: 'Nije zatvoreno kolo' });
    }

    const round = lastClosedRound.rows[0];
    //console.log(round);
    //console.log(lastClosedRound);
    if (round.numbers) {
      return res.status(400).json({ error: 'Rezultati ovog kola su spremljeni' });
    }
    //console.log("HEREEEEEEEE 1111111111111");
    new_numbers = `{${numbersArray.join(",")}}`;
    //console.log(new_numbers);
    //console.log(round.rounds_id);
    //console.log("HEREEEEEEEE 2222222222222")

    const newLocal = await pool.query('UPDATE rounds SET numbers = $1 WHERE rounds_id = $2', [new_numbers, round.rounds_id]);
    console.log("HEREEEEEEEE 3333333333333")
    const ticketId = await pool.query('SELECT id FROM tickets WHERE tickets.rounds_id = $1', [round.rounds_id]);
    console.log("TICKET ID")
    console.log(ticketId)
    console.log("HEREEEEEEEE 3333333333333")
    
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send('Kvar na serveru');
  }
});

router.post('/tickets', async (req, res) => {
  try {
    const { numbers, oib } = req.body;

    if (!oib || oib.length != 20) {
      return res.status(400).json({ error: 'OIB ili broj putovnice mora imati 20 znakova.' });
    }

    if (!numbers) {
      return res.status(400).json({ error: 'Unesite brojeve.' });
    }

    const numbersArray = numbers.split(',').map(n => parseInt(n, 10));
    if (numbersArray.length !== 6) {
      return res.status(400).json({ error: 'Brojevi listića moraju biti 6.' });
    }

    const ticketId = uuidv4();

    const lastRoundRes = await pool.query(`
      SELECT rounds_id FROM rounds WHERE is_active = TRUE ORDER BY rounds_id DESC LIMIT 1
    `);

    if (lastRoundRes.rowCount === 0) {
      return res.status(400).json({ error: 'Nema aktivnog kola.' });
    }

    const roundId = lastRoundRes.rows[0].rounds_id;

    await pool.query(
      'INSERT INTO tickets (ticket_id, oib, numbers, rounds_id) VALUES ($1, $2, $3::int[], $4)',
      [ticketId, oib, numbersArray, roundId]
    );

    const ticketUrl = `https://test-demo-ohoo.onrender.onrender.com/ticket/${ticketId}`;

    res.redirect(`/ticket/${ticketId}`);


  } catch (e) {
    console.error("Greška pri kreiranju listića i QR koda:", e);
    res.status(500).send('Kvar na serveru');
  }
});

router.get('/ticket/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const ticketRes = await pool.query('SELECT * FROM tickets WHERE ticket_id = $1', [id]);
    if (ticketRes.rowCount === 0) return res.status(404).send('Listić nije pronađen');

    const ticket = ticketRes.rows[0];

    const roundRes = await pool.query('SELECT * FROM rounds WHERE rounds_id = $1', [ticket.rounds_id]);
    const round = roundRes.rows[0];

    res.render('ticket', { ticket, round });
  } catch (e) {
    console.error(e);
    res.status(500).send('Kvar na serveru');
  }
});

router.get('/ticket/:id/qrcode', async (req, res) => {
  try {
    const { id } = req.params;

    const ticketRes = await pool.query('SELECT qr_code FROM tickets WHERE id = $1', [id]);
    if (ticketRes.rowCount === 0 || !ticketRes.rows[0].qr_code) {
      return res.status(404).send('QR kod nije pronađen');
    }

    res.setHeader('Content-Type', 'image/png');
    res.send(ticketRes.rows[0].qr_code);

  } catch (e) {
    console.error(e);
    res.status(500).send('Kvar na serveru');
  }
});


router.get('/check-ticket', (req, res) => {
  res.render('check_ticket', { error: null });
});

router.get('/check-ticket/view', async (req, res) => {
  try {
    const { ticket_id } = req.query;

    if(!ticket_id) {
      return res.render('check_ticket', { error: 'Molimo unesite kod listića.' });
    }

    const ticketRes = await pool.query('SELECT * FROM tickets WHERE ticket_id = $1', [ticket_id]);
    if(ticketRes.rowCount === 0) {
      return res.render('check_ticket', { error: 'Listić nije pronađen.' });
    }

    const ticket = ticketRes.rows[0];

    const roundRes = await pool.query('SELECT * FROM rounds WHERE rounds_id = $1', [ticket.rounds_id]);
    const round = roundRes.rows[0];

    res.render('ticket', { ticket, round });

  } catch (e) {
    console.error(e);
    res.render('check_ticket', { error: 'Došlo je do greške na serveru.' });
  }
});

module.exports = router;
