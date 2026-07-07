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

    const existingVisitor = await Visitor.findOne({
      date: today,
      sessionId
    });

    if (!existingVisitor) {
      await Visitor.create({
        date: today,
        sessionId,
        pages: [
          {
            path: req.originalUrl,
            timestamp: new Date()
          }
        ]
      });

      console.log('✅ Nouveau visiteur enregistré');
    } else {
      console.log('⏭️ Déjà enregistré aujourd’hui');
    }

    next();

  } catch (error) {
    console.error('❌ Visitor tracker error:', error);
    next();
  }
};

module.exports = visitorTracker;