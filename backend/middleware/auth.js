const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Clé secrète (doit être dans .env)
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_temporaire_changez_ça';

// Middleware pour vérifier le token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Récupérer le token du header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Accès non autorisé. Token manquant.'
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Récupérer l'utilisateur (sans le mot de passe)
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Middleware pour vérifier le rôle admin
exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Accès interdit. Droits administrateur requis.'
    });
  }
};