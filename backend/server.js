const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ 
    path: 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env' 
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

console.log('📁 Fichier .env chargé');
console.log('🔧 PORT =', process.env.PORT);
console.log('🔧 MONGODB_URI =', process.env.MONGODB_URI ? 'Définie ✓' : 'NON DÉFINIE ✗');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI non définie');
    process.exit(1);
}

console.log('🔄 Tentative de connexion à MongoDB...');

// Connexion simple sans options
mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ Connecté à MongoDB Atlas avec succès !');
})
.catch((error) => {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
});

// Routes
app.get('/api/test', (req, res) => {
    res.json({ 
        message: 'Le serveur fonctionne !',
        database: mongoose.connection.readyState === 1 ? 'connecté' : 'déconnecté'
    });
});

app.get('/api/db-status', (req, res) => {
    const state = mongoose.connection.readyState;
    const states = {
        0: 'déconnecté',
        1: 'connecté',
        2: 'connexion en cours',
        3: 'déconnexion en cours'
    };
    res.json({ 
        status: states[state],
        readyState: state
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📝 Vérifie la DB: http://localhost:${PORT}/api/db-status`);
});