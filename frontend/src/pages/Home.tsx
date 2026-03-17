import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import logo from '../assets/logo.png';
import maison from '../assets/maison.png';

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

  useEffect(() => {
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
        
        <Link
          to="/login"
          className="md:hidden px-3 py-1.5 bg-[#FF4500] text-white text-[10px] font-bold uppercase rounded-lg hover:bg-[#E03D00] transition-colors"
        >
          Admin
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

    {/* Bouton Admin visible UNIQUEMENT sur ordinateur (Desktop) */}
    <div className="hidden md:block">
      <Link
        to="/login"
        className="px-5 py-2 bg-[#FF4500] text-white text-xs font-bold uppercase tracking-tighter rounded-xl hover:bg-[#E03D00] transition-all shadow-lg hover:shadow-xl hover:shadow-[#FF4500]/25"
      >
        Espace Admin
      </Link>
    </div>
  </div>
</header>


{/* Contenu principal */}
<main className="container mx-auto py-8">
             
  <section className="max-w-7xl mx-auto p-4">
    {/* Structure principale avec bordures fines style journal */}
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-500">
      
      {/* Bandeau d'alerte et Titre principal */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-baseline mt-6 gap-4">
          <h2 className="text-2xl md:text-4xl font-black leading-[1.1] max-w-4xl tracking-tight dark:text-white">
            Bienvenue sur <span className="text-[#FF4500]">Axio News</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base whitespace-nowrap">
            <span className="bg-[#FF4500] text-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-full inline-flex items-center gap-2 shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          ALERTE INFO
        </span>
          </p>
        </div>
      </div>

      {/* Grille de contenu (Image à gauche, Liste à droite) */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        
        {/* Photo à la une (2/3 de l'espace) */}
        <div className="lg:col-span-1 border-r border-gray-200 dark:border-gray-700 relative group overflow-hidden">
          <img 
            src={maison} 
            alt="NewsPulse" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          />
        </div>
        <div className="flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900">
          
          <div className="flex-1">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              <li className="p-5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#FF4500] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-[#FF4500] dark:text-white transition-colors pl-3">
                  Marchés boursiers : forte hausse portée par la tech
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-3">
                  Les indices européens atteignent des sommets inédits depuis 2024.
                </p>
              </li>
              <li className="p-5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#FF4500] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-[#FF4500] dark:text-white transition-colors pl-3">
                  Élections locales : les premiers résultats sont tombés
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-3">
                  Taux de participation historique dans plusieurs régions.
                </p>
              </li>
              <li className="p-5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#FF4500] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-[#FF4500] dark:text-white transition-colors pl-3">
                  Marchés boursiers : forte hausse portée par la tech
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-3">
                  Les indices européens atteignent des sommets inédits depuis 2024.
                </p>
              </li>
              <li className="p-5 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-1 bg-[#FF4500] transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <h3 className="font-bold text-lg leading-tight group-hover:text-[#FF4500] dark:text-white transition-colors pl-3">
                  Marchés boursiers : forte hausse portée par la tech
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 pl-3">
                  Les indices européens atteignent des sommets inédits depuis 2024.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
    </div>
  </section>
  {loading ? (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-gray-200 dark:border-gray-800">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="h-80 border-r border-b border-gray-200 dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-800/50" />
    ))}
  </div>
) : articles.length === 0 ? (
  <div className="text-center py-20 border border-dashed border-gray-300 dark:border-gray-700 m-4">
    <p className="text-gray-500 font-bold uppercase tracking-widest">Aucun article publié pour le moment</p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-t border-l border-gray-200 dark:border-gray-800">
    {articles.map((article) => (
      <article
        key={article._id}
        className="group bg-white dark:bg-gray-900 border-r border-b border-gray-200 dark:border-gray-800 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-300"
      >
        {/* Conteneur Image avec effet noir et blanc au repos */}
        <div className="relative h-52 overflow-hidden border-b border-gray-100 dark:border-gray-800">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 ease-in-out group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
              Pas d'image
            </div>
          )}
          {/* Badge Catégorie / Source style News */}
          <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black uppercase px-2 py-1 tracking-tighter">
            {article.source || "INFO"}
          </span>
        </div>

        {/* Contenu Texte */}
        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <span>●</span>
            <span>{formatDate(article.scrapedAt)}</span>
          </div>
          
          <h3 className="text-xl font-black uppercase leading-tight mb-4 group-hover:text-red-600 transition-colors line-clamp-2 dark:text-white">
            {article.title}
          </h3>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-6">
            {article.summary}
          </p>

          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            <button className="text-[11px] font-black uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform inline-flex items-center gap-2 dark:text-white">
              Lire la suite <span className="text-red-600">→</span>
            </button>
          </div>
        </div>
      </article>
    ))}
  </div>
)}
</main>
{/* Pied de page */}
<footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-16">
  <div className="container mx-auto px-4 py-12">
    
    {/* Section principale du footer - 4 colonnes */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
      
      {/* Colonne 1 - Logo et description */}
      <div className="space-y-4">
        <img 
          src={logo} 
          alt="NewsPulse" 
          className="h-10 w-auto"
        />
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          L'information qui vous connecte au monde. Actualités 24/7, analyses approfondies et reportages exclusifs.
        </p>
        <div className="flex gap-4 pt-2">
          {/* Icônes réseaux sociaux avec ta couleur */}
          <a href="#" className="text-gray-400 hover:text-[#FF4500] transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
          <a href="#" className="text-gray-400 hover:text-[#FF4500] transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.937 4.937 0 004.604 3.417 9.868 9.868 0 01-6.102 2.104c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.79-3.256c.35-.647.659-1.33.923-2.048a9.94 9.94 0 002.44-2.504z"/></svg>
          </a>
          <a href="#" className="text-gray-400 hover:text-[#FF4500] transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z"/></svg>
          </a>
        </div>
      </div>

      {/* Colonne 2 - Catégories */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Catégories</h3>
        <ul className="space-y-2">
          {['Politique', 'Santé', 'Tech', 'Économie', 'Culture', 'Sport'].map((cat) => (
            <li key={cat}>
              <Link 
                to={`/${cat.toLowerCase()}`}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors"
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Colonne 3 - Liens utiles */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Informations</h3>
        <ul className="space-y-2">
          <li><Link to="/about" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">À propos</Link></li>
          <li><Link to="/contact" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">Contact</Link></li>
          <li><Link to="/mentions" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">Mentions légales</Link></li>
          <li><Link to="/confidentialite" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">Confidentialité</Link></li>
          <li><Link to="/cookies" className="text-sm text-gray-600 dark:text-gray-400 hover:text-[#FF4500] transition-colors">Gestion des cookies</Link></li>
        </ul>
      </div>

      {/* Colonne 4 - Newsletter */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Newsletter</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Recevez les dernières actualités directement dans votre boîte mail.
        </p>
        <form className="flex flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Votre email"
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent text-sm"
          />
          <button 
            type="submit"
            className="px-4 py-2 bg-[#FF4500] text-white text-sm font-semibold rounded-lg hover:bg-[#E03D00] transition-colors"
          >
            S'abonner
          </button>
        </form>
      </div>
    </div>

    {/* Séparateur */}
    <div className="border-t border-gray-200 dark:border-gray-800 my-8"></div>

    {/* Copyright et mentions */}
    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} Axio News. Tous droits réservés. 
        Site réalisé par mrkangah999@gmail.com . 
      </p>
      <div className="flex gap-6">
        <Link to="/mentions" className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#FF4500] transition-colors">
          Mentions légales
        </Link>
        <Link to="/confidentialite" className="text-xs text-gray-500 dark:text-gray-400 hover:text-[#FF4500] transition-colors">
          Confidentialité
        </Link>
      </div>
    </div>
  </div>
</footer>
</div>
  );
}
