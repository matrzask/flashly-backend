/**
 * Data Transfer Object for User entity
 * Sanitizes user data by removing sensitive fields
 */

/**
 * Converts a database user row to a safe DTO
 * @param {Object} user - Raw user object from database
 * @returns {Object} Sanitized user object
 */
function toUserDTO(user) {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    created_at: user.created_at,
    updated_at: user.updated_at
    // Excludes password_hash for security
  };
}

/**
 * Converts an array of user rows to DTOs
 * @param {Array} users - Array of raw user objects
 * @returns {Array} Array of sanitized user objects
 */
function toUserDTOArray(users) {
  if (!Array.isArray(users)) return [];
  return users.map(toUserDTO);
}

module.exports = {
  toUserDTO,
  toUserDTOArray
};
