const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'flashly',
  password: 'admin',
  port: 5432, // Default PostgreSQL port
});

module.exports = pool;