// Chemin ABSOLU vers ton fichier .env
const path = require('path');
require('dotenv').config({ 
    path: 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env' 
});

console.log('📁 Fichier .env chargé depuis:', 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env');
console.log('PORT =', process.env.PORT);
console.log('MONGODB_URI =', process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 30) + '...' : 'NON DÉFINI');
console.log('NODE_ENV =', process.env.NODE_ENV);