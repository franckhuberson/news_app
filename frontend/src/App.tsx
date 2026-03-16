import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { RefreshCw, LogOut, Edit, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { Home } from './pages/Home';  
import { Login } from './pages/Login';  

// Types
interface Article {
  _id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  source: string;
  status: string;
  scrapedAt: string;
}

// Service API
const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Composant Dashboard
const Dashboard = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0
  });
  
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const fetchData = async () => {
    try {
      const [articlesRes, statsRes] = await Promise.all([
        api.get('/articles?status=pending'),
        api.get('/articles/stats')
      ]);
      
      setArticles(articlesRes.data.data || []);
      if (statsRes.data.data?.byStatus) {
        setStats(statsRes.data.data.byStatus);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  };

  const handleScrape = async () => {
    setScraping(true);
    try {
      await api.post('/scrape');
      await fetchData();
    } catch (error) {
      console.error('Erreur scraping:', error);
    } finally {
      setScraping(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* En-tête avec verre dépoli */}
      <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/20 p-6 mb-8 shadow-xl">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            NewsPulse Dashboard
          </h1>
          <div className="flex gap-4">
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${scraping ? 'animate-spin' : ''}`} />
              {scraping ? 'Scraping...' : 'Lancer le scraping'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-6 py-3 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-all"
            >
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total', value: stats.total, color: 'from-blue-500 to-cyan-500' },
          { label: 'En attente', value: stats.pending, color: 'from-amber-500 to-orange-500' },
          { label: 'Publiés', value: stats.published, color: 'from-emerald-500 to-teal-500' },
          { label: 'Rejetés', value: stats.rejected, color: 'from-rose-500 to-pink-500' },
        ].map((stat, i) => (
          <div key={i} className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/30 p-6 shadow-lg">
            <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {stat.value}
            </div>
            <div className="text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold mb-6 text-gray-800">Articles en attente</h2>

      {/* Message d'invite au scraping */}
      {articles.length === 0 ? (
        <div className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/30 p-12 text-center shadow-xl">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Bienvenue sur votre dashboard
            </h3>
            <p className="text-gray-600 mb-8">
              Aucun article en attente. Lancez le scraping pour commencer.
            </p>
            <button
              onClick={handleScrape}
              disabled={scraping}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:shadow-lg transition-all w-full text-lg font-medium"
            >
              <RefreshCw className={`w-5 h-5 ${scraping ? 'animate-spin' : ''}`} />
              {scraping ? 'Scraping en cours...' : 'Lancer le scraping'}
            </button>
          </div>
        </div>
      ) : (
        /* Liste des articles avec images et boutons */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div
              key={article._id}
              className="backdrop-blur-xl bg-white/70 rounded-2xl border border-white/30 overflow-hidden shadow-lg"
            >
              {/* Gestion des images */}
              {article.imageUrl ? (
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+non+disponible';
                  }}
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl text-gray-400">📰</span>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-700">
                    En attente
                  </span>
                  <span className="text-xs text-gray-500">{article.source}</span>
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(article.scrapedAt)}</span>
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-gray-800 line-clamp-2">
                  {article.title}
                </h3>
                
                <p className="text-gray-600 line-clamp-3 mb-4">
                  {article.summary || "Aucun résumé"}
                </p>
                
                {/* 3 boutons */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => alert('Modifier: ' + article._id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 transition-all text-sm"
                  >
                    <Edit className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(`/articles/${article._id}/status`, { status: 'published' });
                        fetchData();
                      } catch (error) {
                        console.error('Erreur publication:', error);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-emerald-500/10 text-emerald-600 rounded-xl hover:bg-emerald-500/20 transition-all text-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Publier
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.patch(`/articles/${article._id}/status`, { status: 'rejected' });
                        fetchData();
                      } catch (error) {
                        console.error('Erreur rejet:', error);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-rose-500/10 text-rose-600 rounded-xl hover:bg-rose-500/20 transition-all text-sm"
                  >
                    <XCircle className="w-4 h-4" /> Rejeter
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;