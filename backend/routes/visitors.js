const express = require('express');
const router = express.Router();
const Visitor = require('../models/Visitor');
const { protect, admin } = require('../middleware/auth');

// Récupérer les statistiques des visiteurs (admin uniquement)
router.get('/stats', protect, admin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let daysToFetch = 30;
    if (period === '7d') daysToFetch = 7;
    if (period === '30d') daysToFetch = 30;
    if (period === '90d') daysToFetch = 90;
    
    // Récupérer les visiteurs des X derniers jours
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysToFetch);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const visitors = await Visitor.find({
      date: { $gte: startDateStr }
    }).sort({ date: 1 });
    
    // Agréger par date
    const dailyData = [];
    const currentDate = new Date(startDate);
    const endDate = new Date();
    
    const visitorMap = new Map();
    visitors.forEach(v => {
      visitorMap.set(v.date, {
        count: v.count,
        uniqueSessions: 1,
        pages: v.pages
      });
    });
    
    // Générer toutes les dates de la période
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const visitorData = visitorMap.get(dateStr) || { count: 0, uniqueSessions: 0, pages: [] };
      
      dailyData.push({
        date: dateStr,
        formattedDate: formattedDate,
        visits: visitorData.count,
        uniqueVisitors: visitorData.uniqueSessions,
        pageViews: visitorData.pages?.length || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Calculer les totaux
    const totalVisits = dailyData.reduce((sum, d) => sum + d.visits, 0);
    const totalUniqueVisitors = dailyData.reduce((sum, d) => sum + d.uniqueVisitors, 0);
    const totalPageViews = dailyData.reduce((sum, d) => sum + d.pageViews, 0);
    
    // Moyennes
    const avgVisitsPerDay = dailyData.length > 0 ? Math.round(totalVisits / dailyData.length) : 0;
    const avgPageViewsPerDay = dailyData.length > 0 ? Math.round(totalPageViews / dailyData.length) : 0;
    
    // Pages les plus visitées
    const pageCounts = new Map();
    for (const visitor of visitors) {
      for (const page of visitor.pages) {
        pageCounts.set(page.path, (pageCounts.get(page.path) || 0) + 1);
      }
    }
    
    const topPages = Array.from(pageCounts.entries())
      .map(([page, views]) => ({ page: page || '/', views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
    
    res.json({
      success: true,
      data: {
        summary: {
          totalVisits,
          totalUniqueVisitors,
          totalPageViews,
          avgVisitsPerDay,
          avgPageViewsPerDay,
          period: `${daysToFetch} days`
        },
        daily: dailyData,
        topPages
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur stats visiteurs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;