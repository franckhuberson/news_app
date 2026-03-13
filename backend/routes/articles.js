const express = require('express');
const router = express.Router();
const Article = require('../models/Article');

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
 * Récupère tous les articles avec pagination et filtres
 */
router.get('/', async (req, res) => {
    try {
        // Paramètres de requête
        const { 
            status, 
            source, 
            limit = 20, 
            page = 1,
            sortBy = 'scrapedAt',
            order = 'desc'
        } = req.query;

        // Construction du filtre
        const filter = {};
        if (status) filter.status = status;
        if (source) filter.source = source;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sortOrder = order === 'desc' ? -1 : 1;

        // Exécution de la requête
        const articles = await Article.find(filter)
            .sort({ [sortBy]: sortOrder })
            .limit(parseInt(limit))
            .skip(skip);

        // Comptage total pour pagination
        const total = await Article.countDocuments(filter);

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
        console.error('Erreur GET /articles:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur',
            error: error.message 
        });
    }
});

/**
 * GET /api/articles/pending
 * Récupère uniquement les articles en attente
 */
router.get('/pending', async (req, res) => {
    try {
        const articles = await Article.find({ status: 'pending' })
            .sort({ scrapedAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: articles.length,
            data: articles
        });

    } catch (error) {
        console.error('Erreur GET /pending:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

/**
 * GET /api/articles/stats
 * Récupère les statistiques des articles
 */
router.get('/stats', async (req, res) => {
    try {
        // Stats par statut
        const byStatus = await Article.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Stats par source
        const bySource = await Article.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);

        // Total général
        const total = await Article.countDocuments();

        // Dernier scraping
        const lastScraped = await Article.findOne()
            .sort({ scrapedAt: -1 })
            .select('scrapedAt');

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
                lastScraped: lastScraped?.scrapedAt || null
            }
        });

    } catch (error) {
        console.error('Erreur GET /stats:', error);
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
        const article = await Article.findById(req.params.id);

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
        console.error('Erreur GET /article/:id:', error);
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
router.put('/:id', validateId, async (req, res) => {
    try {
        const { title, summary, originalContent, imageUrl, modifiedBy } = req.body;

        // Vérifier que l'article existe
        const article = await Article.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ 
                success: false,
                message: 'Article non trouvé' 
            });
        }

        // Enregistrer les modifications
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

        // Mise à jour
        const updatedArticle = await Article.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    title: title || article.title,
                    summary: summary || article.summary,
                    originalContent: originalContent || article.originalContent,
                    imageUrl: imageUrl || article.imageUrl,
                    modifiedBy: modifiedBy || 'admin',
                    status: 'modified'
                },
                $push: { modifications: { $each: modifications } }
            },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Article modifié avec succès',
            data: updatedArticle
        });

    } catch (error) {
        console.error('Erreur PUT /article/:id:', error);
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
router.patch('/:id/status', validateId, async (req, res) => {
    try {
        const { status } = req.body;

        // Validation du statut
        const validStatuses = ['pending', 'modified', 'published', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                message: 'Statut invalide' 
            });
        }

        // Préparer les données de mise à jour
        const updateData = { status };
        if (status === 'published') {
            updateData.publishedAt = new Date();
        }

        // Mise à jour
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
        console.error('Erreur PATCH /status:', error);
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
 * Supprime un article (rejet définitif)
 */
router.delete('/:id', validateId, async (req, res) => {
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
        console.error('Erreur DELETE /article/:id:', error);
        res.status(500).json({ 
            success: false,
            message: 'Erreur serveur' 
        });
    }
});

module.exports = router;