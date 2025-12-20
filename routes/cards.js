var express = require('express');
var router = express.Router();
const { getCardsByDeckId, addCard, updateCard, deleteCard } = require('../controllers/cardsController');
const { protect } = require('../middleware/authMiddleware');

/* GET all cards for a specific deck. */
router.get('/:deck_id', protect, getCardsByDeckId);

/* POST add a new card to a deck. */
router.post('/:deck_id', protect, addCard);

/* PUT update a card. */
router.put('/:deck_id/:card_id', protect, updateCard);

/* DELETE a card from a deck. */
router.delete('/:deck_id/:card_id', protect, deleteCard);

module.exports = router;