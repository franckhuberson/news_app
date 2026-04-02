const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { protect, admin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_temporaire_changez_ça';

// ===========================================
// STOCKAGES TEMPORAIRES
// ===========================================
const resetCodes = new Map();
const adminCreationCodes = new Map();

// ===========================================
// INSCRIPTION
// ===========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let userRole = 'user';
    if (role === 'admin') {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          if (decoded.role === 'admin') {
            userRole = 'admin';
            console.log('✅ Création d\'un admin par un admin');
          }
        } catch (err) {
          console.log('Token invalide, création utilisateur standard');
        }
      }
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: userRole
    });

    await user.save();
    console.log('✅ Utilisateur créé:', email, '- Rôle:', userRole);

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

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('🔐 Tentative connexion:', email);
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe invalide');
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    console.log('✅ Connexion réussie:', email);

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
// DÉCONNEXION
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

// ===========================================
// CHANGER LE MOT DE PASSE
// ===========================================
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir l\'ancien et le nouveau mot de passe'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }

    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

// ===========================================
// MOT DE PASSE OUBLIÉ
// ===========================================
const { sendResetCodeEmail, generateCode } = require('../utils/emailService');

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Demande de réinitialisation pour:', email);

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez fournir votre email'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Aucun compte trouvé avec cet email'
      });
    }

    const code = generateCode();
    
    resetCodes.set(email, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    const emailSent = await sendResetCodeEmail(email, code);

    if (emailSent) {
      res.json({
        success: true,
        message: 'Un code de réinitialisation a été envoyé à votre adresse email'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email'
      });
    }

  } catch (error) {
    console.error('❌ Erreur forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ===========================================
// VÉRIFIER LE CODE ET RÉINITIALISER
// ===========================================
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, code et nouveau mot de passe requis'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    const storedData = resetCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Aucune demande de réinitialisation trouvée'
      });
    }

    if (storedData.expiresAt < Date.now()) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Le code a expiré. Veuillez refaire une demande'
      });
    }

    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    resetCodes.delete(email);

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur verify-reset-code:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

// ===========================================
// CRÉATION D'ADMIN AVEC CODE DE VÉRIFICATION
// ===========================================

router.post('/request-admin-code', async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📧 Demande de code admin pour:', email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }
    
    const code = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    adminCreationCodes.set(email, {
      code,
      expiresAt: Date.now() + 15 * 60 * 1000
    });
    
    console.log(`🔐 CODE ADMIN POUR ${email}: ${code}`);
    
    // Envoi de l'email
    const { sendAdminCodeEmail } = require('../utils/emailService');
    const emailSent = await sendAdminCodeEmail(email, code);
    
    if (emailSent) {
      res.json({
        success: true,
        message: 'Un code de confirmation a été envoyé à votre adresse email'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email. Vérifiez la configuration Gmail.'
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur request-admin-code:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.post('/verify-admin-code', async (req, res) => {
  try {
    const { email, code, name, password } = req.body;
    
    console.log('🔍 Vérification code admin pour:', email);
    console.log('📝 Code reçu:', code);
    
    const storedData = adminCreationCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Aucune demande trouvée' });
    }
    
    if (storedData.expiresAt < Date.now()) {
      adminCreationCodes.delete(email);
      return res.status(400).json({ success: false, message: 'Code expiré' });
    }
    
    if (storedData.code !== code) {
      return res.status(400).json({ success: false, message: 'Code invalide' });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });
    
    await user.save();
    
    adminCreationCodes.delete(email);
    
    console.log('✅ Admin créé avec succès:', email);
    
    res.json({
      success: true,
      message: 'Administrateur créé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur verify-admin-code:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// VÉRIFIER LE CODE (sans changer le mot de passe)
// ===========================================
router.post('/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    console.log('🔍 Vérification code pour:', email);
    console.log('📝 Code reçu:', code);
    
    const storedData = resetCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Aucune demande trouvée'
      });
    }
    
    if (storedData.expiresAt < Date.now()) {
      resetCodes.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Code expiré'
      });
    }
    
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: 'Code invalide'
      });
    }
    
    res.json({
      success: true,
      message: 'Code valide'
    });
    
  } catch (error) {
    console.error('❌ Erreur verify-code:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// RÉINITIALISER LE MOT DE PASSE (après vérification)
// ===========================================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    
    console.log('🔑 Réinitialisation mot de passe pour:', email);
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    // Supprimer le code associé
    resetCodes.delete(email);
    
    console.log('✅ Mot de passe réinitialisé pour:', email);
    
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur reset-password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;