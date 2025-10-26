const express = require('express');
const router = express.Router();
const { pool } = require('../db');


router.get('/', async (req, res) => {
  const round = await pool.query('SELECT * FROM rounds ORDER BY id DESC LIMIT 1');
  let activeRound = round.rowCount ? round.rows[0] : null;

  let ticketCount = 0;
  if (activeRound) {
    const result = await pool.query('SELECT COUNT(*) FROM tickets WHERE round_id = $1', [activeRound.id]);
    ticketCount = result.rows[0].count;
  }

  res.render('landing', {
    user: req.user || null,
    round: activeRound,
    ticketCount
  });
});

module.exports = router;