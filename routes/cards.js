var express = require('express');
var router = express.Router();
const pool = require('../db');

/* GET all cards for a specific deck. */
router.get('/:deck_id', async function (req, res, next) {
  const { deck_id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM cards WHERE deck_id = $1', [deck_id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
});

/* POST a new card. */
router.post('/', async function (req, res, next) {
  const { deck_id, front, back } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3) RETURNING *',
      [deck_id, front, back]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create card');
  }
});

module.exports = router;