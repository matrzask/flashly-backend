const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const pool = require('../db');
const { getUserByEmail } = require('../services/userService');
const { toUserDTO } = require('../dtos/userDTO');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30m',
    });
}

const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: '14d',
    });
}

/**
 * Register a new user
 */
async function register(req, res) {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 'fail', message: 'Email and password are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ status: 'fail', message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING *',
            [email, password_hash, name || null]
        );

        const user = result.rows[0];

        // Generate tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.status(201).json({
            status: 'success',
            data: {
                user: toUserDTO(user),
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ status: 'fail', message: 'Failed to register user' });
    }
}

/**
 * Login user
 */
async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 'fail', message: 'Email and password are required' });
    }

    try {
        // Get user by email
        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ status: 'fail', message: 'Invalid email or password' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ status: 'fail', message: 'Invalid email or password' });
        }

        // Generate tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.json({
            status: 'success',
            data: {
                user: toUserDTO(user),
                token,
                refreshToken
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ status: 'fail', message: 'Failed to login' });
    }
}

/**
 * Refresh access token using refresh token
 */
async function refresh(req, res) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ status: 'fail', message: 'Refresh token is required' });
    }

    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        // Generate new access token
        const token = generateToken(decoded.id);

        res.json({
            status: 'success',
            data: {
                token
            }
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ status: 'fail', message: 'Invalid or expired refresh token' });
    }
}

module.exports = {
    generateToken,
    generateRefreshToken,
    register,
    login,
    refresh
};

