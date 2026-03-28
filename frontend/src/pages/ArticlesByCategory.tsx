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
              <h1 className="text-5xl font-black uppercase tracking-tighter dark:text-white italic">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Aucun article trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article._id}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition-all relative"
              >
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {article.source}
                    </span>
                    {article.categorie && (
                      <span className="text-xs bg-[#FF4500]/10 text-[#FF4500] px-2 py-1 rounded">
                        {article.categorie}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatDate(article.scrapedAt)}
                    </span>
                    <div className="flex gap-3">
                      <Link 
                        to={`/article/${article._id}`}
                        className="text-[#FF4500] hover:underline"
                      >
                        Lire →
                      </Link>
                      <button
                        onClick={() => handleDelete(article._id)}
                        disabled={deletingId === article._id}
                        className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                        title="Supprimer définitivement"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                {deletingId === article._id && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
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