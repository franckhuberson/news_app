import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import logo from '../assets/logo.png';

interface Article {
  _id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  source: string;
  sourceUrl: string;
  scrapedAt: string;
}

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await api.get(`/articles/${id}`);
        setArticle(response.data.data);
      } catch (error) {
        console.error('Erreur chargement article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#FF4500] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xl font-medium text-gray-600">Article non trouvé</p>
          <Link to="/" className="mt-4 inline-block text-[#FF4500] hover:text-[#E03D00] transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-2 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-0">

          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="flex justify-between items-center">
              <Link to="/">
                <img 
                  src={logo} 
                  alt="NewsPulse" 
                  className="h-10 md:h-12 w-auto rounded-lg overflow-hidden relative z-10" 
                />
              </Link>
            </div>

            {/* Barre de navigation (Thèmes) */}
            <nav className="flex items-center justify-center md:justify-start gap-4 md:gap-6 border-t md:border-none border-gray-100 dark:border-gray-800 pt-3 md:pt-0">
              {['Politique', 'Santé', 'Tech', 'Économie', 'Culture', 'Sports'].map((theme) => (
                <Link
                  key={theme}
                  to={`/${theme.toLowerCase()}`}
                  className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors"
                >
                  {theme}
                </Link>
              ))}
            </nav>
          </div>
          <Link 
              to="/" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour
            </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          
          {article.imageUrl && (
            <div className="relative w-full h-72 md:h-96 overflow-hidden">
              <img 
                src={article.imageUrl} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="bg-[#FF4500] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                  {article.source}
                </span>
                <span className="text-white/80 text-xs">{formatDate(article.scrapedAt)}</span>
              </div>
            </div>
          )}

          <div className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6 dark:text-white">
              {article.title}
            </h1>

            {/* Résumé de l'article */}
            <div className="relative mb-10">
              <div className="absolute -left-2 top-0 w-1 h-full bg-[#FF4500] rounded-full"></div>
              <div className="pl-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {article.summary}
                </p>
              </div>
            </div>

            {/* Bouton vers la source externe */}
            <div className="flex flex-col items-start gap-6 border-t border-gray-100 dark:border-gray-800 pt-8">
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-8 py-4 bg-[#FF4500] text-white rounded-lg hover:bg-[#E03D00] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span className="font-bold">Lire l'article complet sur {article.source}</span>
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Vous allez être redirigé vers le site d'origine.
              </p>
            </div>
          </div>
        </article>
      </main>

      {/* Footer complet */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <img src={logo} alt="NewsPulse" className="h-10 w-auto" />
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                L'information qui vous connecte au monde.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Catégories</h3>
              <ul className="space-y-2">
                {['Politique', 'Santé', 'Tech', 'Économie', 'Culture', 'Sport'].map((cat) => (
                  <li key={cat}>
                    <Link to={`/${cat.toLowerCase()}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">
                      {cat}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Informations</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">À propos</Link></li>
                <li><Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">Contact</Link></li>
                <li><Link to="/mentions" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">Mentions légales</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Newsletter</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Recevez les dernières actualités.
              </p>
              <form className="flex flex-col gap-3">
                <input 
                  type="email" 
                  placeholder="Votre email"
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#FF4500] text-sm"
                />
                <button className="px-4 py-2 bg-[#FF4500] text-white text-sm rounded-lg hover:bg-[#E03D00] transition-colors">
                  S'abonner
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Axio News. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
