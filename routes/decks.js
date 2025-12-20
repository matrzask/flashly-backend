var express = require('express');
var router = express.Router();
const pool = require('../db');
const { toDeckDTO, toDeckDTOArray } = require('../dtos/deckDTO');

/* GET all decks. */
router.get('/', async function (req, res) {
  try {
    const result = await pool.query('SELECT * FROM decks');
    res.json(toDeckDTOArray(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
});

/* POST a new deck. */
router.post('/', async function (req, res) {
  const { owner_id, name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO decks (owner_id, name) VALUES ($1, $2) RETURNING *',
      [owner_id, name]
    );
    res.status(201).json(toDeckDTO(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create deck');
  }
});

module.exports = router;