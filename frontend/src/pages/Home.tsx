import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import maison from '../assets/maison.png';
import { Menu, X, Search, Shield, Check, AlertCircle } from 'lucide-react';

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
  const location = useLocation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // États pour le modal des conditions
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [, setTermsAccepted] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  
  // État pour le formulaire d'abonnement
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  const categories = ['Politique', 'Santé', 'Tech', 'Économie', 'Culture', 'Sports', 'Buzz', 'Emploi'];

  // ✅ 1. Mise en cache des articles
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    const consent = document.cookie.split('; ').find(row => row.startsWith('terms_accepted='));
    if (!consent) {
      setTimeout(() => {
        setShowTermsModal(true);
      }, 2000);
    } else {
      setTermsAccepted(true);
    }
  }, []);

  // ✅ 2. Chargement optimisé avec cache
  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        // ✅ Vérifier le cache
        const cached = localStorage.getItem('articles_cache');
        const cacheTime = localStorage.getItem('articles_cache_time');
        
        // ✅ Cache valide pendant 5 minutes
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 5 * 60 * 1000) {
            const data = JSON.parse(cached);
            setArticles(data);
            setFilteredArticles(data);
            setLoading(false);
            console.log('📦 Articles chargés depuis le cache');
            return;
          }
        }
        
        // ✅ Charger depuis l'API avec limite
        const response = await api.get('/articles?status=published&limit=50');
        let articlesData = response.data.data || [];
        
        const sortedArticles = [...articlesData].sort((a, b) => {
          const dateA = new Date(a.publishedAt || a.scrapedAt || a.createdAt || 0).getTime();
          const dateB = new Date(b.publishedAt || b.scrapedAt || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        // ✅ Mettre en cache
        localStorage.setItem('articles_cache', JSON.stringify(sortedArticles));
        localStorage.setItem('articles_cache_time', Date.now().toString());
        
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

  // ✅ 3. Filtrage par catégorie optimisé avec useMemo
  useEffect(() => {
    if (articles.length === 0) return;
    
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    
    if (category) {
      const matchedCategory = categories.find(c => c.toLowerCase() === category.toLowerCase());
      if (matchedCategory) {
        const filtered = articles.filter(article => 
          article.categorie?.toLowerCase() === matchedCategory.toLowerCase()
        );
        setFilteredArticles(filtered);
        setActiveCategory(matchedCategory);
      }
    } else {
      setFilteredArticles(articles);
      setActiveCategory('all');
    }
  }, [location.search, articles]);

  // ✅ 4. Recherche optimisée avec useCallback
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      if (activeCategory === 'all') {
        setFilteredArticles(articles);
      } else {
        const filtered = articles.filter(article => 
          article.categorie?.toLowerCase() === activeCategory.toLowerCase()
        );
        setFilteredArticles(filtered);
      }
      return;
    }

    const searchLower = query.toLowerCase().trim();
    const baseArticles = activeCategory === 'all' 
      ? articles 
      : articles.filter(article => 
          article.categorie?.toLowerCase() === activeCategory.toLowerCase()
        );
    
    const results = baseArticles.filter(article => 
      article.title.toLowerCase().includes(searchLower) ||
      article.summary?.toLowerCase().includes(searchLower) ||
      article.categorie?.toLowerCase().includes(searchLower)
    );
    setFilteredArticles(results);
  }, [articles, activeCategory]);

  // ✅ 5. Filtrage par catégorie optimisé avec useCallback
  const filterArticlesByCategory = useCallback((category: string) => {
    setActiveCategory(category);
    setMobileMenuOpen(false);
    setSearchQuery('');
    
    if (category === 'all') {
      setFilteredArticles(articles);
    } else {
      const filtered = articles.filter(article => 
        article.categorie?.toLowerCase() === category.toLowerCase()
      );
      setFilteredArticles(filtered);
    }
  }, [articles]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // ✅ 6. Optimisation du tri avec useMemo
  const latestArticles = useMemo(() => {
    return filteredArticles.slice(0, 3);
  }, [filteredArticles]);

  const handleAcceptTerms = () => {
    if (!termsChecked) {
      const alertElement = document.getElementById('termsAlert');
      if (alertElement) {
        alertElement.classList.remove('opacity-0');
        alertElement.classList.add('opacity-100');
        setTimeout(() => {
          alertElement.classList.remove('opacity-100');
          alertElement.classList.add('opacity-0');
        }, 3000);
      }
      return;
    }
    
    document.cookie = `terms_accepted=true; path=/; max-age=${60 * 60 * 24 * 365}`;
    setTermsAccepted(true);
    setShowTermsModal(false);
  };

  const handleDeclineTerms = () => {
    if (confirm('Vous devez accepter les conditions d\'utilisation pour continuer à utiliser Amaya News. Souhaitez-vous quitter le site ?')) {
      window.location.href = 'https://www.google.com';
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setSubscribeMessage({ text: 'Veuillez entrer votre email', type: 'error' });
      setTimeout(() => setSubscribeMessage(null), 3000);
      return;
    }

    setSubscribing(true);
    setSubscribeMessage(null);

    try {
      const response = await api.post('/subscribers/subscribe', { email });
      setSubscribeMessage({ text: response.data.message || '✅ Abonnement réussi !', type: 'success' });
      setEmail('');
      setTimeout(() => setSubscribeMessage(null), 5000);
    } catch (error: any) {
      setSubscribeMessage({ 
        text: error.response?.data?.message || '❌ Erreur lors de l\'abonnement', 
        type: 'error' 
      });
      setTimeout(() => setSubscribeMessage(null), 5000);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* HEADER */}
      <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-0">
            
            <div className="flex items-center justify-between w-full md:w-auto">
              <Link to="/">
                <span className="text-xl font-bold text-primary-500">AMAYA NEWS</span>
              </Link>
              
              {isMobile && (
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              )}
            </div>

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

        {/* 🔍 BARRE DE RECHERCHE */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-sm dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-center text-xs text-gray-400 mt-2">
              {filteredArticles.length} résultat{filteredArticles.length > 1 ? 's' : ''} pour "{searchQuery}"
            </p>
          )}
        </div>

        {/* Grille d'articles */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-gray-200 dark:border-gray-800">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-60 border-r border-b border-gray-200 dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-800/50" />
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 dark:border-gray-700 m-4">
            <p className="text-gray-500 font-bold uppercase tracking-widest">
              {searchQuery ? 'Aucun article ne correspond à votre recherche' : 'Aucun article dans cette catégorie'}
            </p>
            {searchQuery && (
              <button onClick={() => handleSearch('')} className="mt-4 text-primary-500 hover:text-primary-600 uppercase text-sm font-bold">
                Voir tous les articles →
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-gray-200 dark:border-gray-800">
            {filteredArticles.map((article) => (
              <Link
                key={article._id}
                to={`/article/${article._id}`}
                className="group bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-800 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300 cursor-pointer"
              >
                <div className="relative h-32 overflow-hidden border-b border-gray-100 dark:border-gray-800">
                  {article.imageUrl ? (
                    <img 
                      src={article.imageUrl} 
                      alt={article.title} 
                      loading="lazy"
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs">Pas d'image</div>
                  )}
                  <span className="absolute top-2 left-2 bg-primary-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 tracking-tighter">Amaya News</span>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <div className="flex items-center gap-1.5 mb-1.5 text-[8px] font-bold uppercase tracking-widest text-gray-400">
                    <span>●</span>
                    <span>{formatDate(article.publishedAt || article.scrapedAt)}</span>
                    {article.categorie && <span className="ml-auto text-[7px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">{article.categorie}</span>}
                  </div>
                  <h3 className="text-sm font-black uppercase leading-tight mb-1.5 group-hover:text-primary-500 transition-colors line-clamp-2 dark:text-white">
                    {article.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                    {article.summary}
                  </p>
                  <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800"></div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {!loading && articles.length > 0 && (
          <div className="text-center mt-6 text-[10px] text-gray-500">
            {filteredArticles.length} article{filteredArticles.length > 1 ? 's' : ''}
            {searchQuery && ` trouvé(s) pour "${searchQuery}"`}
          </div>
        )}
      </main>

      {/* ✅ MODAL CONDITIONS D'UTILISATION */}
      {showTermsModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-300">
            {/* En-tête */}
            <div className="bg-linear-to-r from-primary-500 to-primary-600 px-6 py-5 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Shield className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-white font-black uppercase text-base tracking-wider">
                    Conditions d'utilisation
                  </h2>
                  <p className="text-white/80 text-xs">
                    Veuillez lire et accepter pour continuer
                  </p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              <div className="space-y-3">
                <p className="font-bold text-gray-800 dark:text-white">1. Acceptation des conditions</p>
                <p className="pl-4 text-gray-500 dark:text-gray-400">En utilisant Amaya News, vous acceptez pleinement les présentes conditions d'utilisation.</p>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-gray-800 dark:text-white">2. Contenu</p>
                <p className="pl-4 text-gray-500 dark:text-gray-400">Les articles et informations publiés sur Amaya News sont à titre informatif. Nous nous efforçons de fournir des informations exactes, mais ne garantissons pas leur exhaustivité.</p>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-gray-800 dark:text-white">3. Protection des données</p>
                <p className="pl-4 text-gray-500 dark:text-gray-400">Vos données personnelles sont traitées conformément à notre politique de confidentialité. Nous ne partageons pas vos informations avec des tiers sans votre consentement explicite.</p>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-gray-800 dark:text-white">4. Cookies</p>
                <p className="pl-4 text-gray-500 dark:text-gray-400">Notre site utilise des cookies pour améliorer votre expérience de navigation. En continuant, vous acceptez leur utilisation.</p>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-gray-800 dark:text-white">5. Modifications</p>
                <p className="pl-4 text-gray-500 dark:text-gray-400">Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications prennent effet dès leur publication sur le site.</p>
              </div>

              <div className="space-y-3">
                <p className="font-bold text-gray-800 dark:text-white">6. Contact</p>
                <p className="pl-4 text-gray-500 dark:text-gray-400">Pour toute question concernant ces conditions, contactez-nous à : <span className="text-primary-500">amayanewsweb.com</span></p>
              </div>
            </div>

            {/* Footer avec boutons */}
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6">
              <div id="termsAlert" className="opacity-0 transition-opacity duration-300 mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <AlertCircle size={14} />
                <span>Veuillez cocher la case pour accepter les conditions</span>
              </div>

              <div className="flex items-start gap-3 mb-4">
                <input
                  type="checkbox"
                  id="termsCheckbox"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  className="w-5 h-5 mt-0.5 text-primary-500 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                />
                <label htmlFor="termsCheckbox" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                  J'ai lu et j'accepte les <span className="text-primary-500 hover:underline cursor-pointer">conditions d'utilisation</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptTerms}
                  className="flex-1 px-6 py-3 bg-primary-500 text-white text-sm font-bold rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20"
                >
                  <Check size={18} />
                  J'accepte et je continue
                </button>
                <button
                  onClick={handleDeclineTerms}
                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-bold rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Je refuse
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Footer avec formulaire d'abonnement */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <Link to="/">
                <span className="text-xl font-bold text-primary-500">AMAYA NEWS</span>
              </Link>
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Informations</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">À propos</Link></li>
                <li><Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Contact</Link></li>
                <li><Link to="/mentions" className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">Mentions légales</Link></li>
              </ul>
            </div>

            {/* Formulaire d'abonnement */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Newsletter</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Recevez les dernières actualités.</p>
              <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
                {subscribeMessage && (
                  <div className={`p-2 rounded text-xs text-center ${subscribeMessage.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
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
                  {subscribing ? 'Abonnement...' : "S'abonner"}
                </button>
              </form>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              © {new Date().getFullYear()} Amaya News. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};