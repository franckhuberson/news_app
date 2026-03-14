import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import axios from 'axios';

// Types
interface Article {
  _id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  source: string;
  status: 'pending' | 'published' | 'rejected' | 'modified';
  scrapedAt: string;
}

// Service API
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Composant Dashboard
const Dashboard = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0
  });
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Charger les données
  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupère les articles en attente
      const articlesRes = await api.get('/articles?status=pending');
      setArticles(articlesRes.data.data || []);

      // Récupère les stats
      const statsRes = await api.get('/articles/stats');
      if (statsRes.data.data?.byStatus) {
        setStats(statsRes.data.data.byStatus);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Lancer le scraping
  const handleScrape = async () => {
  setScraping(true);
  setNotification(null);
  try {
    const response = await api.post('/scrape');
    console.log('✅ Réponse scraping:', response.data);
    setNotification({
      message: `Scraping terminé avec succès ! ${response.data.output || ''}`,
      type: 'success'
    });
    await fetchData();
  } catch (error: any) {
    console.error('❌ Erreur scraping:', error);
    setNotification({
      message: `Erreur: ${error.response?.data?.error || error.message}`,
      type: 'error'
    });
  } finally {
    setScraping(false);
    setTimeout(() => setNotification(null), 5000);
  }
};

  // Charger au démarrage
  useEffect(() => {
    fetchData();
  }, []);

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 p-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
          NewsPulse Dashboard
        </h1>
        
        <button
          onClick={handleScrape}
          disabled={scraping}
          className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${scraping ? 'animate-spin' : ''}`} />
          {scraping ? 'Scraping...' : 'Lancer le scraping'}
        </button>
      </div>

{notification && (
  <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-2xl backdrop-blur-xl border transition-all duration-500 ${
    notification.type === 'success' 
      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' 
      : 'bg-rose-500/20 border-rose-500/30 text-rose-700 dark:text-rose-400'
  }`}>
    {notification.message}
  </div>
)}
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: stats.total || 0, color: 'from-blue-500 to-cyan-500' },
          { label: 'En attente', value: stats.pending || 0, color: 'from-amber-500 to-orange-500' },
          { label: 'Publiés', value: stats.published || 0, color: 'from-emerald-500 to-teal-500' },
          { label: 'Rejetés', value: stats.rejected || 0, color: 'from-rose-500 to-pink-500' },
        ].map((stat, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-white/30 dark:border-gray-800/50 p-6">
            <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Liste des articles */}
      <h2 className="text-2xl font-bold mb-4">Articles en attente</h2>
      
      {loading ? (
        // Squelette de chargement
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/50 dark:bg-gray-900/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {articles.length === 0 ? (
            <div className="text-center py-12 backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-white/30">
              <p className="text-gray-500 dark:text-gray-400">Aucun article en attente</p>
            </div>
          ) : (
            articles.map((article) => (
              <div
                key={article._id}
                className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-white/30 dark:border-gray-800/50 p-6 hover:shadow-xl transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        En attente
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {article.source} • {formatDate(article.scrapedAt)}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{article.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 line-clamp-2">
                      {article.summary || "Aucun résumé disponible"}
                    </p>
                  </div>
                  {article.imageUrl && (
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-24 h-24 rounded-lg object-cover ml-4"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

