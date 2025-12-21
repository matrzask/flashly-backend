var express = require('express');
var router = express.Router();
const { getAllDecks, createDeck, getDeckById, updateDeck, deleteDeck, getPublicDecks, copyPublicDeck } = require('../controllers/decksController');
const { protect } = require('../middleware/authMiddleware');

/* GET all public decks. */
router.get('/public', getPublicDecks);

/* POST copy a public deck. */
router.post('/:id/copy', protect, copyPublicDeck);

/* GET all user decks. */
router.get('/', protect, getAllDecks);

/* POST a new deck. */
router.post('/', protect, createDeck);

/* GET a specific deck by ID. */
router.get('/:id', protect, getDeckById);

/* PUT update a deck. */
router.put('/:id', protect, updateDeck);

/* DELETE a deck. */
router.delete('/:id', protect, deleteDeck);

module.exports = router;