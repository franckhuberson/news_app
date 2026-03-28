const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_temporaire_changez_ça';

// ===========================================
// INSCRIPTION
// ===========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log('📝 Inscription:', email);

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    // Vérifier si l'utilisateur existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Créer l'utilisateur
    const user = new User({
      name,
      email,
      password,
      role: 'user'
    });

    await user.save();

    console.log('✅ Utilisateur créé:', email);

    // Créer le token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// ===========================================
// CONNEXION
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir email et mot de passe'
      });
    }

    // Chercher l'utilisateur avec le mot de passe
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('🔑 Comparaison du mot de passe...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('✅ Résultat comparaison:', isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// ===========================================
// DÉCONNEXION (côté client uniquement)
// ===========================================
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// ===========================================
// PROFIL (route protégée)
// ===========================================
router.get('/profile', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    console.error('Erreur profile:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ===========================================
// CRÉER UN ADMIN (route protégée - admin seulement)
// ===========================================
router.post('/create-admin', protect, admin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin créé avec succès',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur create-admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// Récupérer tous les administrateurs
router.get('/admins', protect, admin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Erreur récupération admins:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Supprimer un administrateur
router.delete('/admins/:id', protect, admin, async (req, res) => {
  try {
    const adminToDelete = await User.findById(req.params.id);
    if (!adminToDelete) {
      return res.status(404).json({ success: false, message: 'Administrateur non trouvé' });
    }
    if (adminToDelete.email === 'admin@test.com') {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer l\'admin principal' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Administrateur supprimé' });
  } catch (error) {
    console.error('Erreur suppression admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// RÉCUPÉRER TOUS LES ADMINISTRATEURS
// ===========================================
router.get('/admins', protect, admin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('-password');
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error('Erreur récupération admins:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// SUPPRIMER UN ADMINISTRATEUR
// ===========================================
router.delete('/admins/:id', protect, admin, async (req, res) => {
  try {
    const adminToDelete = await User.findById(req.params.id);
    if (!adminToDelete) {
      return res.status(404).json({ success: false, message: 'Administrateur non trouvé' });
    }
    if (adminToDelete.email === 'admin@test.com') {
      return res.status(400).json({ success: false, message: 'Impossible de supprimer l\'administrateur principal' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Administrateur supprimé' });
  } catch (error) {
    console.error('Erreur suppression admin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;