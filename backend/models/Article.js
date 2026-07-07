const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    originalContent: { type: String, required: true },
    summary: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    source: { type: String, default: 'Abidjan.net' },
    
    // ✅ Valeur par défaut unique basée sur le timestamp
    sourceUrl: { type: String, default: function() {
        return `article-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }},
    
    status: {
        type: String,
        enum: ['brouillon', 'pending', 'modified', 'published', 'rejected', 'scheduled'],
        default: 'brouillon'
    },
    categorie: { type: String, default: '' },
    scrapedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date, default: null },
    modifiedBy: { type: String, default: null },
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
    },
    scheduledPublishDate: { type: Date, default: null },
    isScheduled: { type: Boolean, default: false },
    scheduledBy: { type: String, default: null },
    scheduledAt: { type: Date, default: null }
}, {
    timestamps: true,
    collection: 'articles'
});

// Index
articleSchema.index({ status: 1, scrapedAt: -1 });
articleSchema.index({ isScheduled: 1, scheduledPublishDate: 1, status: 1 });
// PAS d'index sur sourceUrl !

// Méthodes
articleSchema.methods.publish = function() {
    this.status = 'published';
    this.publishedAt = new Date();
    this.isScheduled = false;
    this.scheduledPublishDate = null;
    return this.save();
};

articleSchema.methods.reject = function() {
    this.status = 'rejected';
    this.isScheduled = false;
    this.scheduledPublishDate = null;
    return this.save();
};

articleSchema.methods.schedulePublish = function(publishDate, userId) {
    this.status = 'pending';
    this.isScheduled = true;
    this.scheduledPublishDate = new Date(publishDate);
    this.scheduledBy = userId;
    this.scheduledAt = new Date();
    return this.save();
};

articleSchema.methods.cancelSchedule = function() {
    this.isScheduled = false;
    this.scheduledPublishDate = null;
    this.scheduledBy = null;
    this.scheduledAt = null;
    return this.save();
};

articleSchema.statics.getPendingScheduledArticles = function() {
    const now = new Date();
    return this.find({
        isScheduled: true,
        scheduledPublishDate: { $lte: now },
        status: { $in: ['pending', 'scheduled'] }
    });
};

articleSchema.statics.countByStatus = function() {
    return this.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
};

module.exports = mongoose.model('Article', articleSchema);