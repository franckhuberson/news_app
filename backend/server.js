// Import des dépendances
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Initialisation de l'application Express
const app = express();

// Middleware
app.use(cors());           // Permet les requêtes cross-origin
app.use(express.json());    // Permet de recevoir du JSON dans les requêtes

// Port du serveur
const PORT = process.env.PORT || 5000;

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Le serveur fonctionne !' });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📝 Route de test: http://localhost:${PORT}/api/test`);
});