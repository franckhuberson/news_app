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
    console.log('1️⃣ Début register');
    const { name, email, password } = req.body;
    console.log('2️⃣ Données reçues:', { name, email });

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir tous les champs'
      });
    }

    console.log('3️⃣ Recherche utilisateur existant');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    console.log('4️⃣ Création utilisateur');
    const user = await User.create({
      name,
      email,
      password,
      role: 'user'
    });

    console.log('5️⃣ Utilisateur créé avec ID:', user._id);

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('6️⃣ Token généré');

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

    console.log('7️⃣ Réponse envoyée');

  } catch (error) {
    console.error('❌ Erreur register:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// ===========================================
// CONNEXION AVEC LOGS
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // === LOGS DE DÉBOGAGE ===
    console.log('\n' + '='.repeat(50));
    console.log('🔐 TENTATIVE DE CONNEXION');
    console.log('='.repeat(50));
    console.log('1️⃣ Email reçu:', email);
    console.log('2️⃣ Mot de passe reçu:', password);

    // Validation
    if (!email || !password) {
      console.log('❌ 3️⃣ Validation échouée: champs manquants');
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir email et mot de passe'
      });
    }
    console.log('✅ 3️⃣ Validation OK');

    // Chercher l'utilisateur
    console.log('4️⃣ Recherche utilisateur dans MongoDB...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ 5️⃣ Utilisateur non trouvé pour:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    console.log('✅ 5️⃣ Utilisateur trouvé:', user.email);
    console.log('6️⃣ Hash en base:', user.password.substring(0, 30) + '...');

    // Vérifier le mot de passe
    console.log('7️⃣ Comparaison du mot de passe...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('8️⃣ Résultat comparaison:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ 9️⃣ Mot de passe invalide');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }
    console.log('✅ 9️⃣ Mot de passe valide');

    // Créer le token
    console.log('🔟 Génération du token...');
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ 1️⃣1️⃣ Token généré');

    console.log('✅ 1️⃣2️⃣ Connexion réussie !');
    console.log('='.repeat(50) + '\n');

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

module.exports = router;