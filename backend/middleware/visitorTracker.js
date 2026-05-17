const Visitor = require('../models/Visitor');
const crypto = require('crypto');

// Exclure TOUTES les routes API et admin
const EXCLUDED_PATHS = [
  '/admin',
  '/api',
  '/login',
  '/logout',
  '/uploads'
];

const visitorTracker = async (req, res, next) => {
  // ✅ Exclure toutes les routes qui commencent par /api ou /admin
  const isExcluded = EXCLUDED_PATHS.some(path => req.path.startsWith(path));
  
  if (isExcluded) {
    return next();
  }
  
  // ✅ Ne tracker que les pages HTML (pas les fichiers statiques)
  const acceptHeader = req.headers.accept || '';
  const isPageRequest = acceptHeader.includes('text/html') || req.path === '/';
  
  if (!isPageRequest) {
    return next();
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    
    let sessionId = req.cookies?.visitorId;
    if (!sessionId) {
      sessionId = crypto.randomBytes(32).toString('hex');
      res.cookie('visitorId', sessionId, { 
        maxAge: 365 * 24 * 60 * 60 * 1000, 
        httpOnly: false,
        sameSite: 'lax'
      });
    }

    const existingToday = await Visitor.findOne({
      date: today,
      sessionId: sessionId
    });

    const pagePath = req.path === '/' ? '/' : req.path;

    if (existingToday) {
      const pageExists = existingToday.pages.some(p => p.path === pagePath);
      if (!pageExists) {
        existingToday.pages.push({ path: pagePath, timestamp: new Date() });
        await existingToday.save();
      }
    } else {
      await Visitor.create({
        date: today,
        count: 1,
        sessionId: sessionId,
        pages: [{ path: pagePath, timestamp: new Date() }]
      });
      console.log(`👤 Nouveau visiteur: ${pagePath}`);
    }

  } catch (error) {
    console.error('❌ Erreur tracking:', error);
  }
  
  next();
};

module.exports = visitorTracker;