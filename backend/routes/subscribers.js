const express = require('express');
const router = express.Router();
const Subscriber = require('../models/Subscriber');
const { protect, admin } = require('../middleware/auth');

// Route publique pour s'abonner (pas besoin d'être connecté)
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email requis' });
    }

    // Vérifier si l'email existe déjà
    const existing = await Subscriber.findOne({ email });
    if (existing) {
      // Si l'email existe mais est désabonné, on réactive
      if (existing.status === 'unsubscribed') {
        existing.status = 'active';
        await existing.save();
        return res.json({ success: true, message: 'Réabonnement réussi !' });
      }
      return res.status(400).json({ success: false, message: 'Cet email est déjà abonné' });
    }

    // Créer un nouvel abonné
    const subscriber = new Subscriber({ email });
    await subscriber.save();

    res.json({ success: true, message: 'Abonnement réussi !' });
  } catch (error) {
    console.error('Erreur abonnement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route admin pour lister tous les abonnés
router.get('/subscribers', protect, admin, async (req, res) => {
  try {
    const subscribers = await Subscriber.find().sort({ subscribedAt: -1 });
    res.json({ success: true, count: subscribers.length, data: subscribers });
  } catch (error) {
    console.error('Erreur liste abonnés:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Route admin pour désabonner un utilisateur
router.delete('/subscribers/:id', protect, admin, async (req, res) => {
  try {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      return res.status(404).json({ success: false, message: 'Abonné non trouvé' });
    }
    subscriber.status = 'unsubscribed';
    await subscriber.save();
    res.json({ success: true, message: 'Désabonnement réussi' });
  } catch (error) {
    console.error('Erreur désabonnement:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;