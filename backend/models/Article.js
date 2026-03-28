const mongoose = require('mongoose');

// Schéma adapté à ta base existante "newspulse"
const articleSchema = new mongoose.Schema({
    // Correspond à "titre" dans ta base
    title: {
        type: String,
        required: true
    },
    
    // Correspond à "texte" dans ta base
    originalContent: {
        type: String,
        required: true
    },
    
    // Correspond à "résumé" dans ta base
    summary: {
        type: String,
        default: ''
    },
    
    // Correspond à "URL_de_l_image" dans ta base
    imageUrl: {
        type: String,
        default: ''
    },
    
    // Correspond à la source (à déduire de l'URL ou à ajouter)
    source: {
        type: String,
        default: 'Abidjan.net'  // Valeur par défaut
    },
    
    // Correspond à "URL" dans ta base
    sourceUrl: {
        type: String,
        required: true,
        unique: true  // Important pour éviter les doublons
    },
    
    // Correspond à "statut" dans ta base
    status: {
        type: String,
        enum: ['brouillon', 'pending', 'modified', 'published', 'rejected'],
        default: 'brouillon'
    },

    // Correspond à "catégorie" dans ta base
    categorie: {
        type: String,
        default: ''
    },
    
    // Correspond à "créé_à" dans ta base
    scrapedAt: {
        type: Date,
        default: Date.now
    },
    
    publishedAt: {
        type: Date,
        default: null
    },
    
    modifiedBy: {
        type: String,
        default: null
    },
    
    modifications: [{
        field: String,
        oldValue: String,
        newValue: String,
        modifiedAt: { type: Date, default: Date.now }
    }],
    
    metadata: {
        authors: [String],
        keywords: [String],
        publishDate: Date,
        wordCount: Number
    }
}, {
    timestamps: true,  // Ajoute createdAt et updatedAt automatiquement
    collection: 'articles'  // IMPORTANT: Nom de ta collection existante
});

// Index pour recherche rapide
articleSchema.index({ status: 1, scrapedAt: -1 });
articleSchema.index({ sourceUrl: 1 });

// Méthodes
articleSchema.methods.publish = function() {
    this.status = 'published';
    this.publishedAt = new Date();
    return this.save();
};

articleSchema.methods.reject = function() {
    this.status = 'rejected';
    return this.save();
};

// Statistiques
articleSchema.statics.countByStatus = function() {
    return this.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
};

module.exports = mongoose.model('Article', articleSchema);