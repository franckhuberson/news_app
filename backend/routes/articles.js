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
// ROUTES PUBLIQUES (GET)
// ===========================================

/**
 * GET /api/articles
 * Récupère tous les articles avec pagination et filtres (VERSION OPTIMISÉE)
 */
router.get('/', async (req, res) => {
    try {
        const { 
            status, 
            source, 
            limit = 50, 
            page = 1,
            sortBy = 'scrapedAt',
            order = 'desc'
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (source) filter.source = source;
        if (req.query.categorie) filter.categorie = req.query.categorie;

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'desc' ? -1 : 1;

        // ✅ OPTIMISATION: Exécution parallèle avec lean() pour meilleures performances
        const [articles, total] = await Promise.all([
            Article.find(filter)
                .sort({ [sortBy]: sortOrder })
                .limit(parseInt(limit))
                .skip(skip)
                .lean(), // ✅ lean() pour des résultats plus rapides
            Article.countDocuments(filter)
        ]);

        console.log(`📊 GET /articles - Status: ${status || 'tous'}, Total: ${total}, Retourné: ${articles.length}`);

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
            message: 'Erreur serveur',
            error: error.message 
        });
    }
});

/**
 * GET /api/articles/pending
 * Récupère uniquement les articles en attente (OPTIMISÉ)
 */
router.get('/pending', async (req, res) => {
    try {
        const articles = await Article.find({ status: 'pending' })
            .sort({ scrapedAt: -1 })
            .limit(100)
            .lean(); // ✅ lean() pour meilleures performances

        console.log(`📊 GET /pending - ${articles.length} articles en attente`);

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

/**
 * GET /api/articles/scheduled
 * Récupère les articles programmés
 */
router.get('/scheduled', protect, async (req, res) => {
    try {
        const articles = await Article.find({ 
            isScheduled: true,
            status: 'pending'
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

/**
 * GET /api/articles/stats
 * Récupère les statistiques des articles (OPTIMISÉ)
 */
router.get('/stats', async (req, res) => {
    try {
        // ✅ OPTIMISATION: Exécution parallèle des agrégations
        const [byStatus, bySource, total, scheduledCount, lastScraped] = await Promise.all([
            Article.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            Article.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]),
            Article.countDocuments(),
            Article.countDocuments({ isScheduled: true, status: 'pending' }),
            Article.findOne().sort({ scrapedAt: -1 }).select('scrapedAt').lean()
        ]);

        res.json({
            success: true,
            data: {
                total,
                byStatus: byStatus.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                bySource: bySource.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                lastScraped: lastScraped?.scrapedAt || null,
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

/**
 * GET /api/articles/:id
 * Récupère un article spécifique
 */
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
// ROUTES D'ÉDITION (PUT/PATCH)
// ===========================================

/**
 * PUT /api/articles/:id
 * Modifie complètement un article
 */
router.put('/:id', protect, async (req, res) => {
    try {
        const { title, summary, originalContent, imageUrl, modifiedBy } = req.body;

        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ 
                success: false,
                message: 'Article non trouvé' 
            });
        }

        const modifications = [];
        if (title && title !== article.title) {
            modifications.push({
                field: 'title',
                oldValue: article.title,
                newValue: title
            });
        }
        if (summary && summary !== article.summary) {
            modifications.push({
                field: 'summary',
                oldValue: article.summary,
                newValue: summary
            });
        }
        if (originalContent && originalContent !== article.originalContent) {
            modifications.push({
                field: 'originalContent',
                oldValue: article.originalContent,
                newValue: originalContent
            });
        }

        const updateData = {
            title: title || article.title,
            summary: summary || article.summary,
            originalContent: originalContent || article.originalContent,
            imageUrl: imageUrl || article.imageUrl,
            modifiedBy: modifiedBy || 'admin'
        };

        if (modifications.length > 0) {
            updateData.modifications = [...article.modifications, ...modifications];
        }

        const updatedArticle = await Article.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Article modifié avec succès',
            data: updatedArticle
        });

    } catch (error) {
        console.error('❌ Erreur PUT /article/:id:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur',
            error: error.message 
        });
    }
});

/**
 * PATCH /api/articles/:id/status
 * Change uniquement le statut d'un article
 */
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ['pending', 'modified', 'published', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: 'Statut invalide' 
            });
        }

        const updateData = { status };
        if (status === 'published') {
            updateData.publishedAt = new Date();
            updateData.isScheduled = false;
            updateData.scheduledPublishDate = null;
        }

        const article = await Article.findByIdAndUpdate(
            req.params.id,
            updateData,
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
// ROUTES : PUBLICATION PROGRAMMÉE
// ===========================================

/**
 * POST /api/articles/:id/schedule
 * Programme la publication d'un article
 */
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

        await article.schedulePublish(scheduledDate, req.user._id);

        res.json({
            success: true,
            message: `Article programmé pour le ${scheduledDate.toLocaleString('fr-FR')}`,
            data: article
        });

    } catch (error) {
        console.error('❌ Erreur POST /schedule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur',
            error: error.message 
        });
    }
});

/**
 * DELETE /api/articles/:id/schedule
 * Annule la publication programmée d'un article
 */
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

        await article.cancelSchedule();

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

/**
 * POST /api/articles/publish-now/:id
 * Publication immédiate d'un article
 */
router.post('/publish-now/:id', protect, async (req, res) => {
    try {
        const article = await Article.findById(req.params.id);
        
        if (!article) {
            return res.status(404).json({ 
                success: false, 
                message: 'Article non trouvé' 
            });
        }

        await article.publish();

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
// ROUTES DE SUPPRESSION (DELETE)
// ===========================================

/**
 * DELETE /api/articles/:id
 * Supprime un article
 */
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

module.exports = router;