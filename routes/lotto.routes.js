const express = require('express');
const { pool } = require('../db');
const router = express.Router();


router.post('/new-round', async (req, res) => {
  try {
    const active = await pool.query('SELECT rounds_id FROM rounds WHERE is_active = TRUE');
    if (!active.rowCount) {
      await pool.query('INSERT INTO rounds (is_active) VALUES (TRUE)');
    res.status(200).json({ message: 'Pokrenuto je novo kolo' });
    }
    return res.status(204).send();
    
  } catch (e) {
    console.error("Kolo se nije uspjelo pokrenuti:", e);
    res.status(500).send('Kvar na serveru');
  }
});

router.post('/close', async (req, res) => {
  try {
    const result = await pool.query('UPDATE rounds SET is_active = FALSE WHERE is_active = TRUE');
    if (result.rowCount > 0) {
        res.status(200).json({ message: 'Kolo je zatvoreno' });
    }
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send('Kvar na serveru');
  }
});

router.post('/store-results', async (req, res) => {
  try {
    const { numbers } = req.body;

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
    if (!lastClosedRound) {
      return res.status(400).json({ error: 'Nije zatvoreno kolo' });
    }

    const round = lastClosedRound.rows[0];
    console.log(round)
    console.log(lastClosedRound.rows)
    if (round.numbers) {
      return res.status(400).json({ error: 'Rezultati ovog kola su spremljeni' });
    }

    await pool.query('UPDATE rounds SET numbers = $1 WHERE rounds_id = $2', [numbers.join(','), round.rounds_id]);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send('Kvar na serveru');
  }
});

module.exports = router;
