const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ 
    path: 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env' 
});

const app = express();

// ===========================================
// MIDDLEWARE
// ===========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging (optionnel mais utile)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// ===========================================
// CONNEXION MONGODB
// ===========================================
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI non définie dans .env');
    process.exit(1);
}

console.log('🔄 Connexion à MongoDB...');

mongoose.connect(MONGODB_URI)
.then(() => {
    console.log('✅ Connecté à MongoDB Atlas avec succès !');
})
.catch((error) => {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
});

// ===========================================
// ROUTES
// ===========================================
const articleRoutes = require('./routes/articles');

// Route de test
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Le serveur fonctionne !',
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'connecté' : 'déconnecté'
    });
});

// Route pour vérifier la DB
app.get('/api/db-status', (req, res) => {
    const state = mongoose.connection.readyState;
    const states = {
        0: 'déconnecté',
        1: 'connecté',
        2: 'connexion en cours',
        3: 'déconnexion en cours'
    };
    res.json({ 
        success: true,
        status: states[state],
        readyState: state
    });
});

// Routes API principales
app.use('/api/articles', articleRoutes);

// ===========================================
// GESTION DES ERREURS 404
// ===========================================
// Cette route doit être APRÈS toutes les autres routes
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: 'Route non trouvée' 
    });
});

// ===========================================
// GESTION DES ERREURS GLOBALES
// ===========================================
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur:', err);
    res.status(500).json({ 
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ===========================================
// DÉMARRAGE DU SERVEUR
// ===========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📝 Routes disponibles:`);
    console.log(`   - GET  /api/test`);
    console.log(`   - GET  /api/db-status`);
    console.log(`   - GET  /api/articles`);
    console.log(`   - GET  /api/articles/pending`);
    console.log(`   - GET  /api/articles/stats`);
    console.log(`   - GET  /api/articles/:id`);
    console.log(`   - PUT  /api/articles/:id`);
    console.log(`   - PATCH /api/articles/:id/status`);
    console.log(`   - DELETE /api/articles/:id`);
});