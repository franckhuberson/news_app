const Visitor = require('../models/Visitor');
const crypto = require('crypto');

const visitorTracker = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    let sessionId = req.cookies?.visitorSession;

    if (!sessionId) {
      sessionId = crypto.randomBytes(32).toString('hex');

      res.cookie('visitorSession', sessionId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: false
      });
    }

    console.log('🟢 Session:', sessionId);

    // ✅ RECHERCHER LE VISITEUR DU JOUR
    let visitor = await Visitor.findOne({
      date: today,
      sessionId
    });

    if (!visitor) {
      // ✅ CRÉER UN NOUVEAU VISITEUR
      visitor = await Visitor.create({
        date: today,
        sessionId,
        count: 1,
        pages: [
          {
            path: req.originalUrl,
            timestamp: new Date()
          }
        ]
      });
      console.log('✅ Nouveau visiteur enregistré');
    } else {
      // ✅ METTRE À JOUR LE COMPTEUR ET LES PAGES
      visitor.count += 1;
      
      // Ajouter la page seulement si elle est différente de la dernière
      const lastPage = visitor.pages[visitor.pages.length - 1];
      if (!lastPage || lastPage.path !== req.originalUrl) {
        visitor.pages.push({
          path: req.originalUrl,
          timestamp: new Date()
        });
        console.log(`📄 Page ajoutée: ${req.originalUrl}`);
      } else {
        // Mettre à jour le timestamp de la dernière page
        lastPage.timestamp = new Date();
      }
      
      await visitor.save();
      console.log('⏭️ Visiteur mis à jour');
    }

    next();

  } catch (error) {
    console.error('❌ Visitor tracker error:', error);
    next();
  }
};

module.exports = visitorTracker;