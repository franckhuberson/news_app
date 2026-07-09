// middleware/redisCache.js
const redis = require('redis');
const client = redis.createClient();

const redisCache = (duration) => {
  return async (req, res, next) => {
    const key = req.originalUrl;
    const cached = await client.get(key);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    res.sendResponse = res.json;
    res.json = (body) => {
      client.setEx(key, duration, JSON.stringify(body));
      res.sendResponse(body);
    };
    next();
  };
};