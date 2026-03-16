import React, { useEffect, useState } from 'react';
import { Link,  useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';


interface Article {
  _id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  source: string;
  scrapedAt: string;
}

export const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    // Récupère uniquement les articles publiés
    api.get('/articles?status=published')
      .then(res => {
        setArticles(res.data.data || []);
      })
      .catch(err => console.error('Erreur chargement articles:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-purple-500 bg-clip-text text-transparent">
            NewsPulse
          </h1>
          
          <div className="flex items-center gap-4">
            {isAuthenticated && isAdmin ? (
              <Link
                to="/admin"
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
              >
                Dashboard Admin
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition"
              >
                Espace Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-8">Dernières actualités</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-white/50 animate-pulse" />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun article publié pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article._id}
                className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-white/30 overflow-hidden hover:shadow-xl transition-all"
              >
                {article.imageUrl && (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 bg-primary-500/10 text-primary-700 rounded-full">
                      {article.source}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(article.scrapedAt)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3 line-clamp-2">{article.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 line-clamp-3">
                    {article.summary}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};