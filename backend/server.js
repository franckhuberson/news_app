const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ 
    path: 'C:\\Users\\Franck Huberson\\Desktop\\news_app\\.env' 
});
const multer = require('multer');
const { protect, admin } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ===========================================
// MIDDLEWARE
// ===========================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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
    console.log('✅ Connecté à MongoDB avec succès !');
})
.catch((error) => {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
});

// ===========================================
// ROUTES
// ===========================================
const articleRoutes = require('./routes/articles');
const authRoutes = require('./routes/auth');  
const subscriberRoutes = require('./routes/subscribers');

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
app.use('/api/auth', authRoutes);
app.use('/api/subscribers', subscriberRoutes);

// ===========================================
// ROUTE POUR LANCER LE SCRAPING (VERSION FINALE)
// ===========================================
app.post('/api/scrape', (req, res) => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 Lancement du scraping...');
    console.log('='.repeat(50));
    
    // Chemins avec guillemets pour gérer les espaces
    const scraperDir = '"C:\\Users\\Franck Huberson\\Desktop\\news_app\\backend\\scraper"';
    const pythonExe = '"C:\\Users\\Franck Huberson\\Desktop\\news_app\\backend\\scraper\\venv\\Scripts\\python.exe"';
    const pythonScript = '"C:\\Users\\Franck Huberson\\Desktop\\news_app\\backend\\scraper\\scraper.py"';
    
    console.log('📁 Dossier scraper:', scraperDir);
    console.log('🐍 Python exe:', pythonExe);
    console.log('📜 Script:', pythonScript);
    
    // Construire la commande avec les chemins protégés
    const command = 'cmd.exe';
    const args = ['/c', `cd ${scraperDir} && ${pythonExe} ${pythonScript}`];
    
    console.log('▶️ Commande complète:', command, args.join(' '));
    
    const pythonProcess = spawn(command, args, {
        cwd: __dirname,
        shell: true,
        windowsHide: true
    });

    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
        const message = data.toString();
        console.log(`[SCRAPER] ${message}`);
        outputData += message;
    });

    pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error(`[SCRAPER-ERROR] ${error}`);
        errorData += error;
    });

    pythonProcess.on('close', (code) => {
        console.log('='.repeat(50));
        console.log(`✅ Processus terminé avec code ${code}`);
        console.log('='.repeat(50));
        
        if (code === 0) {
            res.json({ 
                success: true, 
                message: 'Scraping terminé avec succès',
                output: outputData
            });
        } else {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur lors du scraping',
                error: errorData || 'Erreur inconnue',
                output: outputData
            });
        }
    });

    pythonProcess.on('error', (err) => {
        console.error('❌ Erreur de processus:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur de lancement du processus',
            error: err.message
        });
    });
});


// ===========================================
// ROUTES D'AUTHENTIFICATION
// ===========================================
app.use('/api/auth', authRoutes);


// ===========================================
// ROUTES UPLOARDS
// ===========================================

// Configuration multer pour sauvegarder les images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Route pour uploader une image
app.post('/api/upload', protect, admin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune image reçue' });
    }
    
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    res.json({
      success: true,
      data: { url: imageUrl, filename: req.file.filename }
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ success: false, message: 'Erreur upload' });
  }
});

// Servir les images statiquement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===========================================
// GESTION DES ERREURS 404
// ===========================================
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
        message: 'Erreur interne du serveur'
    });
});

// ===========================================
// DÉMARRAGE DU SERVEUR
// ===========================================
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
    console.log(`   - POST /api/scrape`);
    console.log(`   - POST /api/auth/register`);
    console.log(`   - POST /api/auth/login`);
    console.log(`   - GET  /api/auth/profile`);
});
