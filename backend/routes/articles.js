const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { protect, admin } = require('../middleware/auth');

// ===========================================
// MIDDLEWARE DE VALIDATION D'ID
// ===========================================
const validateId = (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ 
            success: false,
            message: 'ID d\'article invalide' 
        });
    }
    next();
};

// ===========================================
// POST /api/articles - CRÉER UN ARTICLE
// ===========================================
router.post('/', protect, async (req, res) => {
    try {
        console.log('📝 Création d\'un nouvel article...');
        console.log('📦 Données reçues:', req.body);
        
        // Validation des champs requis
        if (!req.body.title) {
            return res.status(400).json({
                success: false,
                message: 'Le titre est requis'
            });
        }
        
        // Création de l'article
        const article = new Article({
            title: req.body.title,
            originalContent: req.body.originalContent || req.body.content || '',
            summary: req.body.summary || '',
            categorie: req.body.categorie || '',
            imageUrl: req.body.imageUrl || '',
            source: req.body.source || 'Amaya News',
            status: req.body.status || 'pending',
            isScheduled: req.body.isScheduled || false,
            scheduledPublishDate: req.body.scheduledPublishDate || null,
            scrapedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        const savedArticle = await article.save();
        
        console.log(`✅ Article créé avec succès: ${savedArticle.title}`);
        console.log(`   ID: ${savedArticle._id}`);
        console.log(`   Statut: ${savedArticle.status}`);
        
        res.status(201).json({
            success: true,
            message: 'Article créé avec succès',
            data: savedArticle
        });
        
    } catch (error) {
        console.error('❌ Erreur création article:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de la création de l\'article'
        });
    }
});

// ===========================================
// GET /api/articles - RÉCUPÉRER LES ARTICLES
// ===========================================
router.get('/', async (req, res) => {
    try {
        const { status, source, limit = 100, page = 1, categorie } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (source) filter.source = source;
        if (categorie) filter.categorie = categorie;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Tri par date de publication pour les articles publiés
        let sortField = 'scrapedAt';
        let sortOrder = -1;
        
        if (status === 'published') {
            sortField = 'publishedAt';
            sortOrder = -1;
        }
        
        const sortObject = {};
        sortObject[sortField] = sortOrder;

        const [articles, total] = await Promise.all([
            Article.find(filter)
                .sort(sortObject)
                .limit(parseInt(limit))
                .skip(skip)
                .lean(),
            Article.countDocuments(filter)
        ]);

        res.json({
            success: true,
            count: articles.length,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            data: articles
        });

    } catch (error) {
        console.error('❌ Erreur GET /articles:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// ===========================================
// GET /api/articles/pending - ARTICLES EN ATTENTE
// ===========================================
router.get('/pending', async (req, res) => {
    try {
        const articles = await Article.find({ status: 'pending' })
            .sort({ scrapedAt: -1 })
            .limit(100)
            .lean();

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });

    } catch (error) {
        console.error('❌ Erreur GET /pending:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// GET /api/articles/scheduled - ARTICLES PROGRAMMÉS
// ===========================================
router.get('/scheduled', protect, async (req, res) => {
    try {
        const articles = await Article.find({ 
            isScheduled: true,
            status: { $in: ['pending', 'scheduled'] }  // ✅ CORRIGÉ
        }).sort({ scheduledPublishDate: 1 }).lean();

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });

    } catch (error) {
        console.error('❌ Erreur GET /scheduled:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// GET /api/articles/stats - STATISTIQUES
// ===========================================
router.get('/stats', async (req, res) => {
    try {
        const [byStatus, total, scheduledCount] = await Promise.all([
            Article.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Article.countDocuments(),
            Article.countDocuments({ isScheduled: true, status: 'pending' })
        ]);

        const byStatusObj = {};
        byStatus.forEach(item => {
            byStatusObj[item._id] = item.count;
        });

        res.json({
            success: true,
            data: {
                total,
                byStatus: byStatusObj,
                scheduledCount
            }
        });

    } catch (error) {
        console.error('❌ Erreur GET /stats:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// GET /api/articles/:id - ARTICLE PAR ID
// ===========================================
router.get('/:id', validateId, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id).lean();

        if (!article) {
            return res.status(404).json({ 
                success: false,
                message: 'Article non trouvé' 
            });
        }

        res.json({
            success: true,
            data: article
        });

    } catch (error) {
        console.error('❌ Erreur GET /article/:id:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// PUT /api/articles/:id - MODIFIER UN ARTICLE
// ===========================================
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, summary, originalContent, imageUrl } = req.body;

        const updatedArticle = await Article.findByIdAndUpdate(
            req.params.id,
            { 
                $set: { 
                    title, 
                    summary, 
                    originalContent, 
                    imageUrl,
                    updatedAt: new Date()
                } 
            },
            { new: true, runValidators: true }
        );

        if (!updatedArticle) {
            return res.status(404).json({ 
                success: false,
                message: 'Article non trouvé' 
            });
        }

        res.json({
            success: true,
            message: 'Article modifié avec succès',
            data: updatedArticle
        });

    } catch (error) {
        console.error('❌ Erreur PUT /article/:id:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// ===========================================
// PATCH /api/articles/:id/status - CHANGER LE STATUT
// ===========================================
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'published', 'rejected', 'scheduled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: 'Statut invalide' 
            });
        }

        const updateData = { status, updatedAt: new Date() };
        if (status === 'published') {
            updateData.publishedAt = new Date();
            updateData.isScheduled = false;
            updateData.scheduledPublishDate = null;
        }

        const article = await Article.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!article) {
            return res.status(404).json({ 
                success: false,
                message: 'Article non trouvé' 
            });
        }

        res.json({
            success: true,
            message: `Statut changé pour ${status}`,
            data: article
        });

    } catch (error) {
        console.error('❌ Erreur PATCH /status:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// DELETE /api/articles/:id - SUPPRIMER UN ARTICLE
// ===========================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const article = await Article.findByIdAndDelete(req.params.id);

        if (!article) {
            return res.status(404).json({ 
                success: false,
                message: 'Article non trouvé' 
            });
        }

        res.json({
            success: true,
            message: 'Article supprimé avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur DELETE /article/:id:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// POST /api/articles/:id/schedule - PROGRAMMER
// ===========================================
router.post('/:id/schedule', protect, async (req, res) => {
    try {
        const { publishDate } = req.body;
        
        if (!publishDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Date de publication requise' 
            });
        }

        const scheduledDate = new Date(publishDate);
        
        if (scheduledDate <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'La date de publication doit être dans le futur' 
            });
        }

        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false, 
                message: 'Article non trouvé' 
            });
        }

        article.isScheduled = true;
        article.scheduledPublishDate = scheduledDate;
        article.status = 'scheduled';
        await article.save();

        res.json({
            success: true,
            message: `Article programmé pour le ${scheduledDate.toLocaleString('fr-FR')}`,
            data: article
        });

    } catch (error) {
        console.error('❌ Erreur POST /schedule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur'
        });
    }
});

// ===========================================
// DELETE /api/articles/:id/schedule - ANNULER PROGRAMMATION
// ===========================================
router.delete('/:id/schedule', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false, 
                message: 'Article non trouvé' 
            });
        }

        if (!article.isScheduled) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cet article n\'est pas programmé' 
            });
        }

        article.isScheduled = false;
        article.scheduledPublishDate = null;
        article.status = 'pending';
        await article.save();

        res.json({
            success: true,
            message: 'Publication programmée annulée',
            data: article
        });

    } catch (error) {
        console.error('❌ Erreur DELETE /schedule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// POST /api/articles/publish-now/:id - PUBLIER IMMÉDIATEMENT
// ===========================================
router.post('/publish-now/:id', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false, 
                message: 'Article non trouvé' 
            });
        }

        article.status = 'published';
        article.publishedAt = new Date();
        article.isScheduled = false;
        article.scheduledPublishDate = null;
        await article.save();

        res.json({
            success: true,
            message: 'Article publié immédiatement',
            data: article
        });

    } catch (error) {
        console.error('❌ Erreur POST /publish-now:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur' 
        });
    }
});

// ===========================================
// PATCH /api/articles/:id/schedule - PROGRAMMER (POUR LE DASHBOARD)
// ===========================================
router.patch('/:id/schedule', protect, async (req, res) => {
    try {
        const { scheduledDate } = req.body;
        
        // Utiliser scheduledDate ou publishDate
        const publishDate = scheduledDate || req.body.publishDate;
        
        if (!publishDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Date de publication requise' 
            });
        }

        const scheduledDateObj = new Date(publishDate);
        
        if (scheduledDateObj <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'La date de publication doit être dans le futur' 
            });
        }

        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false, 
                message: 'Article non trouvé' 
            });
        }

        // Programmer l'article
        article.isScheduled = true;
        article.scheduledPublishDate = scheduledDateObj;
        article.status = 'pending';
        await article.save();

        res.json({
            success: true,
            message: `Article programmé pour le ${scheduledDateObj.toLocaleString('fr-FR')}`,
            data: article
        });

    } catch (error) {
        console.error('❌ Erreur PATCH /schedule:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erreur serveur'
        });
    }
});

module.exports = router;