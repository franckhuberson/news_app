import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import maison from '../assets/maison.png';
import { Menu, X } from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  source: string;
  categorie?: string;
  scrapedAt: string;
  publishedAt?: string;
  createdAt?: string;
}

export const Home: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Liste complète des catégories
  const categories = ['Politique', 'Santé', 'Tech', 'Économie', 'Culture', 'Sports', 'Buzz', 'Emploi'];

  // Détection de la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // CHARGEMENT DES ARTICLES PUBLIÉS - TRI PAR DATE DE PUBLICATION
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const response = await api.get('/articles?status=published');
        let articlesData = response.data.data || [];
        
        // ✅ TRI PAR DATE DE PUBLICATION (publishedAt) du plus récent au plus ancien
        const sortedArticles = [...articlesData].sort((a, b) => {
          // Utiliser publishedAt pour le tri (date de publication réelle)
          const dateA = new Date(a.publishedAt || a.scrapedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.publishedAt || b.scrapedAt || b.createdAt || 0).getTime();
          return dateB - dateA; // Plus récent d'abord
        });
        
        console.log(' Articles triés par date de publication (du plus récent au plus ancien):', sortedArticles.length);
        if (sortedArticles.length > 0) {
          console.log(' Dernier article publié:', sortedArticles[0].title);
          console.log(' Date de publication:', new Date(sortedArticles[0].publishedAt || sortedArticles[0].scrapedAt).toLocaleDateString());
        }
        
        setArticles(sortedArticles);
        setFilteredArticles(sortedArticles);
      } catch (err) {
        console.error('❌ Erreur chargement articles:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, []);

  const filterArticlesByCategory = (category: string) => {
    setActiveCategory(category);
    setMobileMenuOpen(false);
    
    if (category === 'all') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article => 
        article.categorie?.toLowerCase() === category.toLowerCase()
      );
      setFilteredArticles(filtered);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setSubscribing(true);
    setSubscribeMessage(null);
    
    try {
      const response = await api.post('/subscribers/subscribe', { email });
      setSubscribeMessage({ text: response.data.message, type: 'success' });
      setEmail('');
    } catch (error: any) {
      setSubscribeMessage({ 
        text: error.response?.data?.message || 'Erreur lors de l\'abonnement', 
        type: 'error' 
      });
    } finally {
      setSubscribing(false);
      setTimeout(() => setSubscribeMessage(null), 5000);
    }
  };

  // Récupérer les 3 derniers articles publiés pour la section "Une"
  const latestArticles = filteredArticles.slice(0, 3);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* HEADER */}
      <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-0">
            
            <div className="flex items-center justify-between w-full md:w-auto">
              <span className="text-xl font-bold text-primary-500">AMAYA NEWS</span>
              
              {isMobile && (
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
            </div>

            {/* Version desktop : catégories centrées */}
            {!isMobile && (
              <nav className="hidden md:flex items-center justify-center gap-4 lg:gap-6 flex-wrap flex-1">
                <button
                  onClick={() => filterArticlesByCategory('all')}
                  className={`text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                    activeCategory === 'all' 
                      ? 'text-primary-500 border-b-2 border-primary-500 pb-1' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary-500'
                  }`}
                >
                  TOUS
                </button>
                
                {categories.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => filterArticlesByCategory(theme)}
                    className={`text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${
                      activeCategory === theme 
                        ? 'text-primary-500 border-b-2 border-primary-500 pb-1' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-primary-500'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* Menu mobile - Version horizontale */}
          {isMobile && mobileMenuOpen && (
            <nav className="md:hidden mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => filterArticlesByCategory('all')}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-full ${
                    activeCategory === 'all' 
                      ? 'text-white bg-primary-500' 
                      : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-primary-500 hover:text-white'
                  }`}
                >
                  TOUS
                </button>
                
                {categories.map((theme) => (
                  <button
                    key={theme}
                    onClick={() => filterArticlesByCategory(theme)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-full whitespace-nowrap ${
                      activeCategory === theme 
                        ? 'text-white bg-primary-500' 
                        : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-primary-500 hover:text-white'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto py-4">
        
        {/* Section Une - Les 3 derniers articles publiés */}
        <section className="max-w-7xl mx-auto p-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500">
            
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
              <div className="flex flex-col md:flex-row justify-between items-baseline mt-6 gap-4">
                <h2 className="text-4xl font-black uppercase tracking-tighter dark:text-white">
                  Bienvenue sur <span className="text-primary-500">Amaya News</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base whitespace-nowrap">
                  <span className="bg-primary-500 text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-2 shadow-lg">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    DERNIERE INFO
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700 relative group overflow-hidden">
                <img 
                  src={maison} 
                  alt="Amaya News" 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
              </div>
              <div className="flex flex-col bg-linear-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
                <div className="flex-1">
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {latestArticles.map((article) => (
                      <li 
                        key={article._id} 
                        onClick={() => window.location.href = `/article/${article._id}`}
                        className="p-5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                      >
                        <div className="absolute left-0 top-0 h-full w-1 bg-primary-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary-500 dark:text-white transition-colors pl-3 line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-3 line-clamp-2">
                          {article.summary}
                        </p>
                        <div className="mt-2 pl-3">
                          <span className="text-xs text-gray-400 mx-2">•</span>
                          <span className="text-xs text-gray-400">{formatDate(article.publishedAt || article.scrapedAt)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Grille d'articles - Tous les articles triés du plus récent au plus ancien (par date de publication) */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-gray-200 dark:border-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 border-r border-b border-gray-200 dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-800/50" />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 dark:border-gray-700 m-4">
            <p className="text-gray-500 font-bold uppercase tracking-widest">Aucun article dans cette catégorie</p>
            <button onClick={() => filterArticlesByCategory('all')} className="mt-4 text-primary-500 hover:text-primary-600 uppercase text-sm font-bold">
              Voir tous les articles →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-gray-200 dark:border-gray-800">
            {filteredArticles.map((article) => (
              <article key={article._id} className="group bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-800 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300">
                <div className="relative h-52 overflow-hidden border-b border-gray-100 dark:border-gray-800">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">Pas d'image</div>
                  )}
                  <span className="absolute top-4 left-4 bg-primary-500 text-white text-[10px] font-black uppercase px-2 py-1 tracking-tighter">Amaya News</span>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>●</span>
                    <span>{formatDate(article.publishedAt || article.scrapedAt)}</span>
                    {article.categorie && <span className="ml-auto text-[8px] bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">{article.categorie}</span>}
                  </div>
                  <h3 className="text-xl font-black uppercase leading-tight mb-4 group-hover:text-primary-500 transition-colors line-clamp-2 dark:text-white">{article.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-6">{article.summary}</p>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Link to={`/article/${article._id}`} className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform inline-flex items-center gap-2 dark:text-white hover:text-primary-500">
                      Lire la suite <span className="text-primary-500">→</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        
        {!loading && articles.length > 0 && (
          <div className="text-center mt-8 text-xs text-gray-500">Affichage de {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''} sur {articles.length}</div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <span className="text-xl font-bold text-primary-500">AMAYA NEWS</span>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">L'information qui vous connecte au monde.</p>
            </div>
            
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Catégories</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => filterArticlesByCategory(cat)}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-left"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4"></h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Newsletter</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Recevez les dernières actualités.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                {subscribeMessage && (
                  <div className={`p-2 rounded text-xs text-center ${subscribeMessage.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {subscribeMessage.text}
                  </div>
                )}
                <input 
                  type="email" 
                  placeholder="Votre email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm" 
                />
                <button 
                  type="submit" 
                  disabled={subscribing} 
                  className="px-4 py-2 bg-primary-500 text-white text-sm rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {subscribing ? 'Abonnement...' : 'S\'abonner'}
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Amaya News. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};