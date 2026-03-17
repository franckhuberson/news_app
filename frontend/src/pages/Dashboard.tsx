import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ArticleCard } from '../components/articles/ArticleCard';
import { RefreshCw } from 'lucide-react';
import { articleService, statsService, scraperService } from '../services/api';
import type { Article } from '../types';
import logo from '../assets/logo.png';

export const Dashboard: React.FC = () => {
  const [articles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0,
    modified: 0,
  });
  useEffect(() => {
    console.log('🔍 Dashboard monté');
    console.log('🔐 Token:', localStorage.getItem('auth_token'));
    console.log('👤 User:', localStorage.getItem('user'));
    fetchData();
  }, []);
  const fetchData = async () => {
  setLoading(true);
  try {
    // Charge UNIQUEMENT les statistiques
    console.log('📊 Chargement des stats...');
    const statsRes = await statsService.getStats();
    
    if (statsRes && statsRes.data) {
      setStats({
        total: statsRes.data.total || 0,
        pending: statsRes.data.byStatus?.pending || 0,
        published: statsRes.data.byStatus?.published || 0,
        rejected: statsRes.data.byStatus?.rejected || 0,
        modified: statsRes.data.byStatus?.modified || 0,
      });
      console.log('✅ Stats chargées');
    }
    
    // NE PAS charger les articles ici
    // setArticles([]); // Les articles restent vides
    
  } catch (error) {
    console.error('❌ Erreur chargement stats:', error);
  } finally {
    setLoading(false);
  }
};


  const handleScrape = async () => {
    setScraping(true);
    try {
      await scraperService.runScraper();
      await fetchData();
    } catch (error) {
      console.error('Erreur scraping:', error);
      alert('Erreur lors du scraping');
    } finally {
      setScraping(false);
    }
  };

  

  return (
    <DashboardLayout>
      {/* Header avec stats */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img 
              src={logo} 
              alt="NewsPulse" 
              className="h-10 w-auto"
            />
            <span className="text-2xl font-semibold text-gray-700">Dashboard</span>
          </div>
          
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${scraping ? 'animate-spin' : ''}`} />
            {scraping ? 'Scraping en cours...' : 'Lancer le scraping'}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'from-blue-500 to-cyan-500' },
            { label: 'En attente', value: stats.pending, color: 'from-amber-500 to-orange-500' },
            { label: 'Publiés', value: stats.published, color: 'from-emerald-500 to-teal-500' },
            { label: 'Rejetés', value: stats.rejected, color: 'from-rose-500 to-pink-500' },
          ].map((stat, index) => (
            <div
              key={index}
              className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-white/30 dark:border-gray-800/50 p-6"
            >
              <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des articles */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Articles en attente</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/50 dark:bg-gray-900/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {articles.map((article) => (
    <ArticleCard
      key={article._id}
      article={article}
      onEdit={(id) => console.log('Modifier:', id)}
      onPublish={async (id) => {
        try {
          await articleService.changeStatus(id, 'published');
          fetchData(); // Rafraîchit la liste
        } catch (error) {
          console.error('Erreur publication:', error);
        }
      }}
      onReject={async (id) => {
        try {
          await articleService.changeStatus(id, 'rejected');
          fetchData(); // Rafraîchit la liste
        } catch (error) {
          console.error('Erreur rejet:', error);
        }
      }}
    />
  ))}
</div>
        )}
      </div>
    </DashboardLayout>
  );
};

