const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Article = require('../models/Article');
const { protect, admin } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète_temporaire_changez_ça';

// ===========================================
// CONFIGURATION API SOCIAL MEDIA
// ===========================================
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID || '';
const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN || '';
const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID || '';
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';

// ===========================================
// FONCTION POUR PUBLIER SUR FACEBOOK
// ===========================================
async function publishToFacebook(article) {
  try {
    if (!FACEBOOK_PAGE_ID || !FACEBOOK_ACCESS_TOKEN) {
      console.log('⚠️ Configuration Facebook manquante');
      return { success: false, message: 'Configuration Facebook manquante' };
    }

    const message = `${article.title}\n\n${article.summary || ''}\n\nLire la suite sur notre site web`;
    
    if (article.imageUrl) {
      const response = await fetch(`https://graph.facebook.com/${FACEBOOK_PAGE_ID}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: article.imageUrl,
          caption: message,
          access_token: FACEBOOK_ACCESS_TOKEN
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return { success: true, postId: data.id };
    } else {
      const response = await fetch(`https://graph.facebook.com/${FACEBOOK_PAGE_ID}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          access_token: FACEBOOK_ACCESS_TOKEN
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return { success: true, postId: data.id };
    }
  } catch (error) {
    console.error('❌ Erreur publication Facebook:', error);
    return { success: false, message: error.message };
  }
}

// ===========================================
// FONCTION POUR PUBLIER SUR WHATSAPP
// ===========================================
async function publishToWhatsApp(article) {
  try {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('⚠️ Configuration WhatsApp manquante');
      return { success: false, message: 'Configuration WhatsApp manquante' };
    }

    const subscribers = await User.find({ wantsWhatsAppNotifications: true }).select('phoneNumber');
    
    if (subscribers.length === 0) {
      return { success: false, message: 'Aucun abonné WhatsApp trouvé' };
    }

    const results = [];
    for (const subscriber of subscribers) {
      if (subscriber.phoneNumber) {
        const message = `📢 *${article.title}*\n\n${article.summary || ''}\n\n👉 Lire la suite sur Axio News`;
        const response = await fetch(`https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: subscriber.phoneNumber,
            type: 'text',
            text: { body: message }
          })
        });
        const data = await response.json();
        results.push({ phone: subscriber.phoneNumber, success: !data.error });
      }
    }

    return { 
      success: true, 
      message: `${results.filter(r => r.success).length} messages WhatsApp envoyés`,
      results 
    };
  } catch (error) {
    console.error('❌ Erreur publication WhatsApp:', error);
    return { success: false, message: error.message };
  }
}

// ===========================================
// FONCTION POUR ENVOYER UN MESSAGE SIMPLE WHATSAPP
// ===========================================
async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.log('⚠️ Configuration WhatsApp manquante');
      return { success: false, message: 'Configuration WhatsApp manquante' };
    }

    const response = await fetch(`https://graph.facebook.com/v22.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: phoneNumber,
        type: 'text',
        text: { body: message }
      })
    });
    
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return { success: true, messageId: data.messages?.[0]?.id };
  } catch (error) {
    console.error('❌ Erreur envoi WhatsApp:', error);
    return { success: false, message: error.message };
  }
}

// ===========================================
// ENDPOINTS DE PUBLICATION SOCIALE
// ===========================================
router.post('/share-facebook/:articleId', protect, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);
    if (!article) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    const result = await publishToFacebook(article);
    if (result.success) {
      article.facebookPostId = result.postId;
      article.sharedOnFacebook = true;
      article.facebookShareDate = new Date();
      await article.save();
      res.json({ success: true, message: 'Article publié sur Facebook avec succès', data: result });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/share-whatsapp/:articleId', protect, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);
    if (!article) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    const result = await publishToWhatsApp(article);
    if (result.success) {
      article.lastWhatsAppShare = new Date();
      await article.save();
      res.json({ success: true, message: 'Article partagé sur WhatsApp avec succès', data: result });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/share-multiple/:articleId', protect, async (req, res) => {
  try {
    const { platforms, phoneNumber } = req.body;
    const article = await Article.findById(req.params.articleId);
    if (!article) return res.status(404).json({ success: false, message: 'Article non trouvé' });
    const results = {};
    if (platforms.includes('facebook')) results.facebook = await publishToFacebook(article);
    if (platforms.includes('whatsapp')) results.whatsapp = await publishToWhatsApp(article);
    await article.save();
    res.json({ success: true, message: 'Publication(s) réussie(s)', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===========================================
// INSCRIPTION (TOUS LES UTILISATEURS SONT ADMIN)
// ===========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ TOUS LES NOUVEAUX UTILISATEURS SONT ADMIN
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'admin'
    });

    await user.save();
    console.log('✅ Utilisateur créé:', email, '- Rôle: admin');

    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: 'admin' },
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// ===========================================
// CONNEXION (FORCE LE RÔLE ADMIN)
// ===========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir email et mot de passe' });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    console.log('🔐 Tentative connexion:', email);
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log('❌ Mot de passe invalide');
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    console.log('✅ Connexion réussie:', email);

    // ✅ FORCER LE RÔLE ADMIN DANS LE TOKEN
    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: 'admin' },
        token
      }
    });

  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// ===========================================
// DÉCONNEXION
// ===========================================
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Déconnexion réussie' });
});

// ===========================================
// PROFIL (FORCE LE RÔLE ADMIN)
// ===========================================
router.get('/profile', protect, async (req, res) => {
  try {
    const user = req.user.toObject();
    user.role = 'admin';
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Erreur profile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// RÉCUPÉRER TOUS LES UTILISATEURS
// ===========================================
router.get('/admins', protect, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Erreur récupération users:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// SUPPRIMER UN UTILISATEUR
// ===========================================
router.delete('/admins/:id', protect, async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Erreur suppression user:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// CHANGER LE MOT DE PASSE
// ===========================================
router.post('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir l\'ancien et le nouveau mot de passe' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
    }

    const user = await User.findById(req.user.id).select('+password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Mot de passe actuel incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: 'Mot de passe changé avec succès' });

  } catch (error) {
    console.error('❌ Erreur changement mot de passe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// MOT DE PASSE OUBLIÉ
// ===========================================
const { sendResetCodeEmail, generateCode } = require('../utils/emailService');
const resetCodes = new Map();

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('📧 Demande de réinitialisation pour:', email);

    if (!email) {
      return res.status(400).json({ success: false, message: 'Veuillez fournir votre email' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Aucun compte trouvé avec cet email' });
    }

    const code = generateCode();
    resetCodes.set(email, { code, expiresAt: Date.now() + 15 * 60 * 1000 });

    const emailSent = await sendResetCodeEmail(email, code);

    if (emailSent) {
      res.json({ success: true, message: 'Un code de réinitialisation a été envoyé à votre adresse email' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de l\'envoi de l\'email' });
    }

  } catch (error) {
    console.error('❌ Erreur forgot-password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===========================================
// VÉRIFIER LE CODE ET RÉINITIALISER
// ===========================================
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, code et nouveau mot de passe requis' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const storedData = resetCodes.get(email);
    
    if (!storedData) {
      return res.status(400).json({ success: false, message: 'Aucune demande de réinitialisation trouvée' });
    }

    if (storedData.expiresAt < Date.now()) {
      resetCodes.delete(email);
      return res.status(400).json({ success: false, message: 'Le code a expiré. Veuillez refaire une demande' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ success: false, message: 'Code invalide' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    resetCodes.delete(email);

    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });

  } catch (error) {
    console.error('❌ Erreur verify-reset-code:', error);
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
      return res.status(400).json({ success: false, message: 'Aucune demande trouvée' });
    }
    
    if (storedData.expiresAt < Date.now()) {
      resetCodes.delete(email);
      return res.status(400).json({ success: false, message: 'Code expiré' });
    }
    
    if (storedData.code !== code) {
      return res.status(400).json({ success: false, message: 'Code invalide' });
    }
    
    res.json({ success: true, message: 'Code valide' });
    
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
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    resetCodes.delete(email);
    
    console.log('✅ Mot de passe réinitialisé pour:', email);
    
    res.json({ success: true, message: 'Mot de passe réinitialisé avec succès' });
    
  } catch (error) {
    console.error('❌ Erreur reset-password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;