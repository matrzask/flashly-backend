const pool = require('../db');
const { toDeckDTO, toDeckDTOArray } = require('../dtos/deckDTO');

/**
 * Get all decks for the authenticated user
 */
async function getAllDecks(req, res) {
  try {
    const result = await pool.query('SELECT * FROM decks WHERE owner_id = $1', [req.user.id]);
    res.json(toDeckDTOArray(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
}

/**
 * Create a new deck for the authenticated user
 */
async function createDeck(req, res) {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO decks (owner_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.id, name]
    );
    res.status(201).json(toDeckDTO(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to create deck');
  }
}

module.exports = {
  getAllDecks,
  createDeck
};
