const Visitor = require('../models/Visitor');
const crypto = require('crypto');

// Exclure TOUTES les routes API et admin
const EXCLUDED_PATHS = [
  '/admin',
  '/api/admin',
  '/api/auth',
  '/api/login',
  '/api/register',
  '/api/visitors',
  '/api/articles/stats',
  '/api/articles/scheduled',
  '/api/articles/pending',
  '/api/scrape',
  '/api/upload',
  '/api/subscribers',
  '/login',
  '/logout'
];

const hashIp = (ip) => {
  return crypto.createHash('sha256').update(ip + (process.env.JWT_SECRET || 'secret')).digest('hex').substring(0, 32);
};

const visitorTracker = async (req, res, next) => {
  // ✅ Exclure toutes les routes API et admin
  const isExcluded = EXCLUDED_PATHS.some(path => req.path.startsWith(path));
  
  if (isExcluded) {
    return next();
  }
  
  // ✅ Exclure les requêtes qui ne sont pas des pages HTML
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

    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    const ipHash = hashIp(ip);

    const existingToday = await Visitor.findOne({
      date: today,
      sessionId: sessionId
    });

    const pagePath = req.path === '/' ? '/accueil' : req.path;

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
        ipHash: ipHash,
        userAgent: req.headers['user-agent']?.substring(0, 500),
        referrer: req.headers.referer || 'direct',
        pages: [{ path: pagePath, timestamp: new Date() }]
      });
    }

  } catch (error) {
    console.error('❌ Erreur tracking visiteur:', error);
  }
  
  next();
};

module.exports = visitorTracker;