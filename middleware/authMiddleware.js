const jwt = require('jsonwebtoken');
const config = require('config');

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;
   
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization required' });
    }

    //get token from cookies
    const token = req.cookies.token || authHeader.split(' ')[1];
    
    try {
        const decoded = jwt.verify(token, config.get('JWT_SECRET'));
        req.user = decoded.user;
        next()

    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }

}

module.exports = authMiddleware;