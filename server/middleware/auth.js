const jwt = require('jsonwebtoken');

// Vérifie la présence d'un JWT valide dans Authorization: Bearer <token>
module.exports = function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé : token manquant' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Accès refusé : token invalide ou expiré' });
    }
};
