// ===========================================
// 1. CORRECTION DNS 
// ===========================================
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

// ===========================================
// 2. CHARGEMENT DE DOTENV
// ===========================================
require('dotenv').config();

// ===========================================
// 3. IMPORTS DES MODULES
// ===========================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { protect, admin } = require('./middleware/auth');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const compression = require('compression');
// ✅ AJOUT DU CACHE
const { cacheMiddleware, clearCache } = require('./middleware/cache');

const app = express();
const PORT = process.env.PORT || 5000;

// ===========================================
// MIDDLEWARE
// ===========================================
// ✅ Compression gzip
app.use(compression());

app.use(cors({
  origin: ["https://amayanews.com", "https://www.amayanews.com", "http://localhost:5173"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware de logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ===========================================
// MIDDLEWARE ET ROUTES VISITEURS
// ===========================================
const visitorTracker = require('./middleware/visitorTracker');
const visitorRoutes = require('./routes/visitors');

app.use(visitorTracker);
app.use('/api/visitors', visitorRoutes);

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
    startScheduler();
})
.catch((error) => {
    console.error('❌ Erreur de connexion à MongoDB:', error.message);
    process.exit(1);
});

// ===========================================
// SCHEDULER POUR PUBLICATION PROGRAMMÉE
// ===========================================

let schedulerRunning = false;

function startScheduler() {
    if (schedulerRunning) return;
    schedulerRunning = true;
    
    console.log('📅 Scheduler de publication programmée démarré');
    
    const checkInterval = process.env.SCHEDULER_INTERVAL || '* * * * *';
    
    cron.schedule(checkInterval, async () => {
        try {
            const Article = require('./models/Article');
            const now = new Date();
            
            const articlesToPublish = await Article.find({
                isScheduled: true,
                scheduledPublishDate: { $lte: now },
                status: { $in: ['pending', 'scheduled'] }
            });
            
            if (articlesToPublish.length === 0) return;
            
            console.log(`📅 ${articlesToPublish.length} article(s) à publier programmé(s) à ${now.toLocaleString('fr-FR')}`);
            
            for (const article of articlesToPublish) {
                try {
                    await article.publish();
                    console.log(`✅ Article publié automatiquement: ${article.title.substring(0, 50)}...`);
                } catch (error) {
                    console.error(`❌ Erreur publication auto pour ${article._id}:`, error.message);
                }
            }
        } catch (error) {
            console.error('❌ Erreur dans le scheduler:', error);
        }
    });
    
    console.log('✅ Scheduler configuré - Vérification toutes les minutes');
}

// ===========================================
// ROUTES
// ===========================================
const articleRoutes = require('./routes/articles');
const authRoutes = require('./routes/auth');  
const subscriberRoutes = require('./routes/subscribers');

// Route de test (sans cache)
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true,
        message: 'Le serveur fonctionne !',
        timestamp: new Date(),
        database: mongoose.connection.readyState === 1 ? 'connecté' : 'déconnecté'
    });
});

// Route pour vérifier la DB (sans cache)
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

// ===========================================
// ✅ ROUTES API PRINCIPALES AVEC CACHE
// ===========================================

// ✅ Cache de 5 minutes pour les articles
app.use('/api/articles', cacheMiddleware(300), articleRoutes);

// ✅ Cache de 1 minute pour les abonnés
app.use('/api/subscribers', cacheMiddleware(60), subscriberRoutes);

// ✅ Cache de 5 minutes pour les visiteurs
app.use('/api/visitors', cacheMiddleware(300), visitorRoutes);

// ⚠️ Pas de cache pour l'authentification
app.use('/api/auth', authRoutes);

// ===========================================
// ROUTE POUR VIDER LE CACHE (ADMIN UNIQUEMENT)
// ===========================================
app.post('/api/admin/clear-cache', protect, admin, (req, res) => {
    const { pattern } = req.body;
    clearCache(pattern);
    res.json({ 
        success: true, 
        message: `Cache vidé${pattern ? ` pour le pattern: ${pattern}` : ''}` 
    });
});

// ===========================================
// ROUTE POUR LANCER LE SCRAPING
// ===========================================
app.post('/api/scrape', (req, res) => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Lancement du scraping...');
  console.log('='.repeat(50));
  
  const { spawn } = require('child_process');
  const path = require('path');
  const scraperPath = path.join(__dirname, 'scraper', 'scraper.py');
  const pythonExe = './scraper/venv/Scripts/python.exe';
  
  console.log('📁 Script:', scraperPath);
  console.log('🐍 Python:', pythonExe);
  
  const pythonProcess = spawn(pythonExe, [scraperPath]);
  
  let output = '';
  let error = '';
  
  pythonProcess.stdout.on('data', (data) => {
    const message = data.toString();
    console.log(`[SCRAPER] ${message}`);
    output += message;
  });
  
  pythonProcess.stderr.on('data', (data) => {
    const errMsg = data.toString();
    console.error(`[SCRAPER-ERROR] ${errMsg}`);
    error += errMsg;
  });
  
  pythonProcess.on('close', (code) => {
    console.log('='.repeat(50));
    console.log(`✅ Processus terminé avec code ${code}`);
    console.log('='.repeat(50));
    
    if (code === 0) {
      res.json({ success: true, message: 'Scraping terminé avec succès', output });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors du scraping', error });
    }
  });
  
  pythonProcess.on('error', (err) => {
    console.error('❌ Erreur de processus:', err);
    res.status(500).json({ success: false, message: err.message });
  });
}); 

// ===========================================
// ROUTES UPLOADS
// ===========================================

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
  limits: { fileSize: 5 * 1024 * 1024 },
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

app.post('/api/upload', protect, upload.single('image'), (req, res) => {
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
    console.log(`   - GET  /api/articles (cache 5min)`);
    console.log(`   - GET  /api/articles/pending (cache 5min)`);
    console.log(`   - GET  /api/articles/scheduled (cache 5min)`);
    console.log(`   - GET  /api/articles/stats (cache 5min)`);
    console.log(`   - GET  /api/articles/:id (cache 5min)`);
    console.log(`   - PUT  /api/articles/:id`);
    console.log(`   - PATCH /api/articles/:id/status`);
    console.log(`   - DELETE /api/articles/:id`);
    console.log(`   - POST /api/articles/:id/schedule`);
    console.log(`   - DELETE /api/articles/:id/schedule`);
    console.log(`   - POST /api/articles/publish-now/:id`);
    console.log(`   - POST /api/scrape`);
    console.log(`   - POST /api/auth/register`);
    console.log(`   - POST /api/auth/login`);
    console.log(`   - GET  /api/auth/profile`);
    console.log(`   - GET  /api/visitors/stats (cache 5min)`);
    console.log(`   - POST /api/admin/clear-cache (admin)`);
});