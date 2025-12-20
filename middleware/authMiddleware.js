const jwt = require('jsonwebtoken');
const { getUserById } = require('../services/userService');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const user = await getUserById(decoded.id);
            
            if (!user) {
                return res.status(401).json({ status: 'fail', message: 'User not found' });
            }
            
            req.user = user;
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            return res.status(401).json({ status: 'fail', message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ status: 'fail', message: 'Not authorized, no token' });
    }
};

const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            const user = await getUserById(decoded.id);
            
            if (!user) {
                req.user = null;
            } else {
                req.user = user;
            }
            
            next();
        } catch (error) {
            console.error('Optional auth middleware error:', error);
            req.user = null;
            next();
        }
    } else {
        req.user = null;
        next();
    }
};

module.exports = { protect, optionalProtect };