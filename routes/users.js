var express = require('express');
var router = express.Router();
const pool = require('../db');
const { toUserDTOArray } = require('../dtos/userDTO');

/* GET users listing. */
router.get('/', async function(req, res) {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(toUserDTOArray(result.rows));
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
});

module.exports = router;