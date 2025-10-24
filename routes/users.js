var express = require('express');
var router = express.Router();
const pool = require('../db');

/* GET users listing. */
router.get('/', async function(req, res, next) {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows); // Send the query result as JSON
  } catch (err) {
    console.error(err);
    res.status(500).send('Database query failed');
  }
});

module.exports = router;