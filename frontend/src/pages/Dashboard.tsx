import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { ArticleReaderModal } from '../components/articles/ArticleReaderModal';
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Newspaper, 
  LogOut,
  Eye
} from 'lucide-react';
import { articleService, statsService, scraperService } from '../services/api';
import type { Article } from '../types';
import { useNavigate } from 'react-router-dom';

// ===========================================
// DASHBOARD PRINCIPAL
// ===========================================
export const Dashboard: React.FC = () => {
  const navigate = useNavigate(); 
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [readingArticle, setReadingArticle] = useState<Article | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    rejected: 0,
    modified: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    console.log('🔄 Fetching dashboard data...');
    
    try {
      console.log('📡 Appel getArticles(pending)...');
      const articlesRes = await articleService.getArticles('pending');
      console.log('✅ Articles reçus:', articlesRes?.data?.length || 0);
      setArticles(articlesRes?.data || []);
      
      try {
        console.log('📡 Appel getStats()...');
        const statsRes = await statsService.getStats();
        if (statsRes?.data) {
          setStats({
            total: statsRes.data.total || 0,
            pending: statsRes.data.byStatus?.pending || 0,
            published: statsRes.data.byStatus?.published || 0,
            rejected: statsRes.data.byStatus?.rejected || 0,
            modified: statsRes.data.byStatus?.modified || 0,
          });
          console.log('✅ Stats reçues:', statsRes.data);
        }
      } catch (statsError) {
        console.error('❌ Erreur stats (non bloquante):', statsError);
      }
      
    } catch (error) {
      console.error('❌ Erreur fetchData:', error);
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
    } finally {
      setScraping(false);
    }
  };

  // ✅ Fonction pour lire l'article (ouvre le modal)
  const handleReadArticle = (article: Article) => {
    setReadingArticle(article);
  };
  
  // ✅ Fonction pour écarter (rejeter) l'article
  const handleReject = async (id: string) => {
    try {
      await articleService.changeStatus(id, 'rejected');
      await fetchData();
      setNotification({ message: 'Article écarté', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'Erreur lors du rejet', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <>
      <DashboardLayout>
        <div className="m-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black dark:border-white">
            <div>
              <div className="flex items-center gap-2 mb-2 text-primary-500 font-black uppercase text-[10px]">
                <Newspaper size={14} /> Système de Rédaction
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">
                Tableau de <span className="text-primary-500">Bord</span>.
              </h1>
            </div>
            <div className="flex gap-3">
              <button onClick={handleScrape} disabled={scraping} className="flex items-center gap-3 px-8 py-4 bg-black dark:bg-white dark:text-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
                {scraping ? 'Synchronisation...' : 'Lancer le Scraper'}
              </button>
              <button onClick={handleLogout} className="px-4 py-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {notification && (
            <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {notification.message}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 mt-8 border border-black dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
            <div className="p-8 border-r border-black">
              <Database size={16} />
              <span className="text-[10px] font-black uppercase ml-2">Base Articles</span>
              <div className="text-4xl font-black mt-4">{stats.total}</div>
            </div>
            <div className="p-8 border-r border-black">
              <Clock size={16} />
              <span className="text-[10px] font-black uppercase ml-2">En attente</span>
              <div className="text-4xl font-black text-orange-500 mt-4">{stats.pending}</div>
            </div>
            <div className="p-8 border-r border-black">
              <CheckCircle size={16} />
              <span className="text-[10px] font-black uppercase ml-2">Publiés</span>
              <div className="text-4xl font-black text-green-600 mt-4">{stats.published}</div>
            </div>
            <div className="p-8">
              <XCircle size={16} />
              <span className="text-[10px] font-black uppercase ml-2">Écartés</span>
              <div className="text-4xl font-black text-primary-500 mt-4">{stats.rejected}</div>
            </div>
          </div>
        </div>

        <div className="mt-16 px-8">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-black uppercase">Flux de Modération</h2>
            <div className="h-0.5 flex-1 bg-black/10"></div>
            <span className="text-[10px] font-bold text-gray-400">{articles.length} articles</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-black">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 border-r border-b border-black animate-pulse bg-gray-50" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="py-24 text-center border-4 border-dashed border-gray-100">
              <Newspaper size={48} className="text-gray-200 mx-auto mb-4" />
              <p className="text-sm font-black uppercase text-gray-300">Aucun article à réviser</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-black shadow-2xl">
              {articles.map((article) => (
                <article key={article._id} className="group flex flex-col bg-white border-r border-b border-black hover:bg-gray-50 transition-all">
                  <div className="h-44 overflow-hidden grayscale group-hover:grayscale-0 transition-all relative border-b border-black">
                    {article.imageUrl ? (
                      <img src={article.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <Newspaper size={32} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-primary-500 text-white text-[9px] font-black uppercase px-2 py-1">
                      {article.source}
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-[9px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                      <Clock size={12} /> {new Date(article.scrapedAt).toLocaleDateString('fr-FR')}
                    </div>
                    <h3 className="font-black text-lg uppercase leading-tight mb-4 group-hover:text-primary-500 line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="mt-auto pt-6 border-t border-gray-100 flex gap-2">
                      {/* ✅ Bouton Lire l'article */}
                      <button 
                        onClick={() => handleReadArticle(article)} 
                        className="flex-1 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                      >
                        <Eye size={14} /> Lire l'article
                      </button>
                      {/* ✅ Bouton Écarter */}
                      <button 
                        onClick={() => handleReject(article._id)} 
                        className="flex-1 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                      >
                        <XCircle size={16} /> Écarter
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* ✅ Modal de lecture d'article (importé depuis le composant partagé) */}
      <ArticleReaderModal 
        article={readingArticle} 
        isOpen={!!readingArticle} 
        onClose={() => setReadingArticle(null)} 
      />
    </>
  );
};