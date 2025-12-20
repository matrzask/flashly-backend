var express = require('express');
var router = express.Router();
const { getAllDecks, createDeck } = require('../controllers/decksController');
const { protect } = require('../middleware/authMiddleware');

/* GET all decks. */
router.get('/', protect, getAllDecks);

/* POST a new deck. */
router.post('/', protect, createDeck);

module.exports = router;