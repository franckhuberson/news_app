const mongoose = require('mongoose');

// Schéma simplifié
const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    originalContent: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        default: ''
    },
    imageUrl: {
        type: String,
        default: ''
    },
    source: {
        type: String,
        required: true,
        enum: ['Le Monde', 'Le Figaro', '20 Minutes', 'Autre']
    },
    sourceUrl: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'modified', 'published', 'rejected'],
        default: 'pending'
    },
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
    timestamps: true
});

// Index simples
articleSchema.index({ status: 1, scrapedAt: -1 });
articleSchema.index({ sourceUrl: 1 });

// Méthodes simplifiées
articleSchema.methods.publish = function() {
    this.status = 'published';
    this.publishedAt = new Date();
    return this.save();
};

articleSchema.methods.reject = function() {
    this.status = 'rejected';
    return this.save();
};

// Statistiques simplifiées
articleSchema.statics.countByStatus = function() {
    return this.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
};

module.exports = mongoose.model('Article', articleSchema);