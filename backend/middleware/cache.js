const NodeCache = require('node-cache');

// Créer un cache avec une durée de vie de 5 minutes (300 secondes)
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// Middleware de cache
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Ne pas mettre en cache les requêtes POST, PUT, DELETE
    if (req.method !== 'GET') {
      return next();
    }

    // Créer une clé unique basée sur l'URL et les paramètres
    const key = req.originalUrl || req.url;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`📦 Cache hit: ${key}`);
      return res.json(cachedResponse);
    }

    // Intercepter la méthode json pour mettre en cache
    const originalJson = res.json;
    res.json = function(data) {
      cache.set(key, data, duration);
      console.log(`💾 Cache set: ${key}`);
      originalJson.call(this, data);
    };

    next();
  };
};

// Fonction pour vider le cache
const clearCache = (pattern) => {
  const keys = cache.keys();
  keys.forEach(key => {
    if (pattern ? key.includes(pattern) : true) {
      cache.del(key);
    }
  });
  console.log(`🗑️ Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}`);
};

module.exports = { cacheMiddleware, clearCache, cache };