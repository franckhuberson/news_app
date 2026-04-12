import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Clock, Newspaper, Trash2, LogOut } from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  source: string;
  categorie?: string;
  status: string;
  scrapedAt: string;
  originalContent?: string;
}

export const ArticlesByCategory: React.FC = () => {
  const { category, status } = useParams<{ category?: string; status?: string }>();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getTitle = () => {
    const statusText = status === 'published' ? 'Publiés' : status === 'rejected' ? 'Rejetés' : 'En attente';
    const categoryText = category === 'all' || !category ? 'tous' : category;
    return `${statusText} - ${categoryText.toUpperCase()}`;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cet article ? Cette action est irréversible.')) {
      return;
    }
    
    setDeletingId(id);
    try {
      await api.delete(`/articles/${id}`);
      setArticles(articles.filter(article => article._id !== id));
      setNotification({ message: 'Article supprimé avec succès', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Erreur suppression:', error);
      setNotification({ message: 'Erreur lors de la suppression', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        let url = `/articles?status=${status}`;
        if (category && category !== 'all') {
          url += `&categorie=${category.toLowerCase()}`;
        }
        const response = await api.get(url);
        setArticles(response.data.data || []);
      } catch (error) {
        console.error('Erreur chargement articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [category, status]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* HEADER */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black dark:border-white">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#FF4500] font-black uppercase tracking-[0.3em] text-[10px]">
                <Newspaper size={14} /> Système de Rédaction
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">
                {getTitle()}
              </h1>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`fixed bottom-4 right-4 p-3 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {notification.message}
          </div>
        )}
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-black dark:border-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 border-r border-b border-black dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-800" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center border-4 border-dashed border-gray-100 dark:border-gray-900 flex flex-col items-center">
            <Newspaper size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
            <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-300">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-black dark:border-gray-800 shadow-2xl">
            {articles.map((article) => (
              <article 
                key={article._id} 
                className="group flex flex-col bg-white dark:bg-gray-900 border-r border-b border-black dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300 relative"
              >
                <div className="h-44 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 relative border-b border-black dark:border-gray-800">
                  {article.imageUrl ? (
                    <img 
                      src={article.imageUrl} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                      alt={article.title}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Newspaper size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-[#FF4500] text-white text-[9px] font-black uppercase px-2 py-1 tracking-widest shadow-lg">
                    {article.source}
                  </div>
                  {article.categorie && (
                    <div className="absolute top-4 right-4 bg-black/80 text-white text-[9px] font-black uppercase px-2 py-1 tracking-widest shadow-lg">
                      {article.categorie}
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Clock size={12} /> {formatDate(article.scrapedAt)}
                  </div>
                  <h3 className="font-black text-lg uppercase leading-[1.1] mb-4 group-hover:text-[#FF4500] transition-colors line-clamp-2 dark:text-white italic">
                    {article.title}
                  </h3>
                  
                  {article.summary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                      {article.summary}
                    </p>
                  )}
                  
                  <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                    <Link 
                      to={`/article/${article._id}`}
                      className="flex-1 py-3 bg-black dark:bg-white dark:text-black text-white text-[10px] font-black uppercase tracking-widest text-center hover:bg-[#FF4500] dark:hover:bg-[#FF4500] transition-all shadow-md"
                    >
                      Lire
                    </Link>
                    <button 
                      onClick={() => handleDelete(article._id)}
                      disabled={deletingId === article._id}
                      className="px-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all disabled:opacity-50"
                      title="Supprimer définitivement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Overlay de suppression */}
                {deletingId === article._id && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};