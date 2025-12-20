const pool = require('../db');
const { toUserDTO } = require('../dtos/userDTO');

/**
 * User Service - Handles all user-related database operations
 */

/**
 * Find a user by ID
 * @param {string} userId - UUID of the user
 * @returns {Promise<Object|null>} User DTO or null if not found
 */
async function getUserById(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toUserDTO(result.rows[0]);
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
}

/**
 * Find a user by email
 * @param {string} email - User's email address
 * @returns {Promise<Object|null>} User object (including password_hash) or null if not found
 */
async function getUserByEmail(email) {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    // Return raw user for authentication purposes (includes password_hash)
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw error;
  }
}

/**
 * Get all users
 * @returns {Promise<Array>} Array of user DTOs
 */
async function getAllUsers() {
  try {
    const result = await pool.query('SELECT * FROM users');
    return result.rows.map(toUserDTO);
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

module.exports = {
  getUserById,
  getUserByEmail,
  getAllUsers
};
