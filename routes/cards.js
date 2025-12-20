var express = require('express');
var router = express.Router();
const { getCardsByDeckId, updateCards } = require('../controllers/cardsController');
const { protect } = require('../middleware/authMiddleware');

/* GET all cards for a specific deck. */
router.get('/:deck_id', protect, getCardsByDeckId);

/* POST new cards. */
router.post('/update', protect, updateCards);

module.exports = router;