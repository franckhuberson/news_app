import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Menu, X, ArrowLeft } from 'lucide-react';

interface Article {
  _id: string;
  title: string;
  summary: string;
  imageUrl?: string;
  source: string;
  sourceUrl: string;
  scrapedAt: string;
  originalContent?: string;
  categorie?: string;
  publishedAt?: string;
  metadata?: {
    wordCount?: number;
    authors?: string[];
  };
}

// 🔹 Extraire l'ID d'une vidéo YouTube (CORRIGÉ)
const extractYouTubeId = (url: string): string | null => {
  // ✅ Nettoyer l'URL
  const cleanUrl = url.trim();
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/v\/([^/?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match) {
      console.log('🎬 ID extrait:', match[1]);
      return match[1];
    }
  }
  
  console.log('❌ Aucun ID trouvé pour:', cleanUrl);
  return null;
};

// 🔹 Parser le contenu Markdown
const useParseContent = () => {
  return useCallback((content: string) => {
    if (!content) return [];
    
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line) continue;
      
      // ✅ Image (format: ![Image](url))
      const imageMatch = line.match(/!\[Image\]\(([^)]+)\)/);
      if (imageMatch) {
        const url = imageMatch[1];
        elements.push(
          <div key={`image-${i}`} className="my-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img 
              src={url} 
              alt="Image de l'article" 
              loading="lazy"
              className="w-full h-auto max-h-125 object-cover"
              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
            />
          </div>
        );
        continue;
      }
      
      // ✅ Vidéo (format: [Vidéo: url])
      const videoMatch = line.match(/\[Vidéo:\s*([^\]]+)\]/);
      if (videoMatch) {
        const url = videoMatch[1].trim();
        const videoId = extractYouTubeId(url);
        if (videoId) {
          elements.push(
            <div key={`video-${i}`} className="my-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="Vidéo YouTube"
                className="w-full aspect-video"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        } else {
          elements.push(
            <div key={`video-${i}`} className="my-6 p-6 bg-gray-100 dark:bg-gray-800 rounded-xl text-center text-gray-500 border-2 border-dashed border-gray-300">
              🎬 Lien vidéo invalide: {url}
            </div>
          );
        }
        continue;
      }
      
      // ✅ Sous-titre (format: ## texte)
      const subtitleMatch = line.match(/^##\s+(.+)/);
      if (subtitleMatch) {
        elements.push(
          <h2 key={`subtitle-${i}`} className="text-2xl md:text-3xl font-black mt-10 mb-4 dark:text-white leading-tight">
            {subtitleMatch[1]}
          </h2>
        );
        continue;
      }
      
      // ✅ Paragraphe normal
      if (line === '---') continue;
      if (line.startsWith('Source :') || line.startsWith('Source:')) continue;
      
      elements.push(
        <p key={`paragraph-${i}`} className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg mb-6">
          {line}
        </p>
      );
    }
    
    return elements;
  }, []);
};

export const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [suggestedArticles, setSuggestedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const parseContent = useParseContent();

  // Détection de la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Chargement avec cache
  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      try {
        // Vérifier le cache
        const cacheKey = `article_${id}`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}_time`);
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 5 * 60 * 1000) {
            const data = JSON.parse(cached);
            setArticle(data);
            if (data) {
              await fetchSuggestions(data);
            }
            setLoading(false);
            return;
          }
        }
        
        // Charger depuis l'API
        const response = await api.get(`/articles/${id}`);
        const data = response.data.data;
        setArticle(data);
        
        // Mettre en cache
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
        
        if (data) {
          await fetchSuggestions(data);
        }
      } catch (error) {
        console.error('Erreur chargement article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  // Récupérer les articles suggérés (6 articles)
  const fetchSuggestions = useCallback(async (currentArticle: Article) => {
    setLoadingSuggestions(true);
    try {
      const category = currentArticle.categorie || '';
      
      // Vérifier le cache des suggestions
      const cacheKey = `suggestions_${category}_${currentArticle._id}`;
      const cached = localStorage.getItem(cacheKey);
      const cacheTime = localStorage.getItem(`${cacheKey}_time`);
      
      if (cached && cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        if (age < 5 * 60 * 1000) {
          setSuggestedArticles(JSON.parse(cached));
          setLoadingSuggestions(false);
          return;
        }
      }
      
      // 1️⃣ Articles de la même catégorie
      let categoryResponse = await api.get(`/articles?status=published&categorie=${category}&limit=12`);
      let categoryArticles = categoryResponse.data.data || [];
      let filtered = categoryArticles.filter((a: Article) => a._id !== currentArticle._id);
      
      // 2️⃣ Fallback : articles récents
      if (filtered.length < 6) {
        const recentResponse = await api.get('/articles?status=published&limit=12');
        const recentArticles = recentResponse.data.data || [];
        const recentFiltered = recentArticles.filter((a: Article) => a._id !== currentArticle._id);
        
        const merged = [...filtered];
        for (const recent of recentFiltered) {
          if (!merged.some(a => a._id === recent._id)) {
            merged.push(recent);
          }
        }
        const results = merged.slice(0, 6);
        setSuggestedArticles(results);
        localStorage.setItem(cacheKey, JSON.stringify(results));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      } else {
        const results = filtered.slice(0, 6);
        setSuggestedArticles(results);
        localStorage.setItem(cacheKey, JSON.stringify(results));
        localStorage.setItem(`${cacheKey}_time`, Date.now().toString());
      }
      
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
      setSuggestedArticles([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const categories = ['Politique', 'Santé', 'Tech', 'Économie', 'Culture', 'Sports', 'Buzz', 'Emploi'];

  // Mémoriser le contenu parsé avec useMemo
  const contentElements = useMemo(() => {
    return article?.originalContent ? parseContent(article.originalContent) : [];
  }, [article?.originalContent, parseContent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-20 h-20 text-gray-300 dark:text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-xl font-medium text-gray-600 dark:text-gray-400">Article non trouvé</p>
          <Link to="/" className="mt-4 inline-block text-primary-500 hover:text-primary-600 transition-colors">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* HEADER */}
      <header className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <Link 
                to="/" 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-500"
                aria-label="Retour à l'accueil"
              >
                <ArrowLeft size={20} />
                <span className="text-xs font-medium hidden sm:inline">Retour</span>
              </Link>
              
              <Link to="/">
                <span className="text-xl font-bold text-primary-500">AMAYA NEWS</span>
              </Link>
            </div>
            
            {isMobile && (
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>

          {/* CATÉGORIES AVEC PARAMÈTRE URL */}
          {!isMobile && (
            <nav className="hidden md:flex items-center justify-center gap-4 lg:gap-6 flex-wrap mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link to="/" className="text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap text-gray-600 dark:text-gray-400 hover:text-primary-500">TOUS</Link>
              {categories.map((theme) => (
                <Link key={theme} to={`/?category=${theme.toLowerCase()}`} className="text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap text-gray-600 dark:text-gray-400 hover:text-primary-500">{theme}</Link>
              ))}
            </nav>
          )}

          {isMobile && mobileMenuOpen && (
            <nav className="md:hidden mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex flex-wrap gap-2 justify-center">
                <Link to="/" className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-full text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-primary-500 hover:text-white">TOUS</Link>
                {categories.map((theme) => (
                  <Link key={theme} to={`/?category=${theme.toLowerCase()}`} className="px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors rounded-full whitespace-nowrap text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-primary-500 hover:text-white">{theme}</Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-800">
          
          {article.imageUrl && (
            <div className="relative w-full h-72 md:h-96 overflow-hidden">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                loading="lazy"
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">Amaya News</span>
                <span className="text-white/80 text-xs">{formatDate(article.scrapedAt)}</span>
              </div>
            </div>
          )}

          <div className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-tight mb-6 dark:text-white">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                {article.source || 'Amaya News'}
              </span>
              <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {formatDate(article.scrapedAt)}
              </span>
              {article.metadata?.wordCount && (
                <>
                  <span className="w-1 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    {article.metadata.wordCount} mots
                  </span>
                </>
              )}
            </div>

            {article.summary && (
              <div className="relative mb-10">
                <div className="absolute -left-2 top-0 w-1 h-full bg-primary-500 rounded-full"></div>
                <div className="pl-6">
                  <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed italic">{article.summary}</p>
                </div>
              </div>
            )}

            <div className="prose prose-lg dark:prose-invert max-w-none">
              {contentElements.length > 0 ? contentElements : <p className="text-gray-500 dark:text-gray-400 italic">Aucun contenu disponible.</p>}
            </div>
          </div>
        </article>

        {/* SUGGESTIONS DE LECTURE */}
        {suggestedArticles.length > 0 && (
          <section className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-black uppercase tracking-tighter dark:text-white">
                 À LIRE
              </h2>
              <div className="h-0.5 flex-1 bg-linear-to-r from-primary-500 to-transparent"></div>
            </div>

            {loadingSuggestions ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-28 rounded-lg border border-gray-200 dark:border-gray-800 animate-pulse bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {suggestedArticles.map((suggested) => (
                  <Link
                    key={suggested._id}
                    to={`/article/${suggested._id}`}
                    className="group block bg-white dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 hover:shadow-md transition-all duration-200 hover:border-primary-500"
                  >
                    <div className="relative h-20 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {suggested.imageUrl ? (
                        <img 
                          src={suggested.imageUrl} 
                          alt={suggested.title} 
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">📷</div>
                      )}
                      {suggested.categorie && (
                        <span className="absolute top-0.5 left-0.5 bg-primary-500 text-white text-[6px] font-black uppercase px-1 py-0.5 rounded">
                          {suggested.categorie}
                        </span>
                      )}
                    </div>

                    <div className="p-1.5">
                      <h3 className="font-black text-[9px] uppercase leading-tight line-clamp-2 group-hover:text-primary-500 transition-colors dark:text-white min-h-5.5">
                        {suggested.title}
                      </h3>
                      <p className="text-[7px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {formatDate(suggested.publishedAt || suggested.scrapedAt)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
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
                  <Link key={cat} to={`/?category=${cat.toLowerCase()}`} className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors">{cat}</Link>
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
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">© {new Date().getFullYear()} Amaya News. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};