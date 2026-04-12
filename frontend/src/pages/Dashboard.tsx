import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Edit3, 
  Newspaper, 
  LogOut,
  Save,
  X,
  Facebook,
  Share2,
  Globe
} from 'lucide-react';
import { articleService, statsService, scraperService } from '../services/api';
import type { Article } from '../types';
import { useNavigate } from 'react-router-dom';

// Modal de choix de publication
const PublishOptionsModal: React.FC<{
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, options: string[]) => Promise<void>;
}> = ({ article, isOpen, onClose, onConfirm }) => {
  const [publishAxio, setPublishAxio] = useState(true);
  const [publishFacebook, setPublishFacebook] = useState(false);
  const [publishWhatsApp, setPublishWhatsApp] = useState(false);
  const [publishing, setPublishing] = useState(false);

  if (!isOpen || !article) return null;

  const handlePublish = async () => {
    const options = [];
    if (publishAxio) options.push('axio');
    if (publishFacebook) options.push('facebook');
    if (publishWhatsApp) options.push('whatsapp');
    
    if (options.length === 0) {
      alert('Veuillez sélectionner au moins une option de publication');
      return;
    }
    
    setPublishing(true);
    try {
      await onConfirm(article._id, options);
      onClose();
    } catch (error) {
      console.error('Erreur publication:', error);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full">
        <div className="border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter">Options de publication</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choisissez où publier "{article.title.substring(0, 60)}..."
          </p>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="checkbox"
                checked={publishAxio}
                onChange={(e) => setPublishAxio(e.target.checked)}
                className="w-4 h-4 text-[#FF4500] rounded focus:ring-[#FF4500]"
              />
              <Globe size={20} className="text-[#FF4500]" />
              <span className="font-bold">Axio News (Base de données)</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="checkbox"
                checked={publishFacebook}
                onChange={(e) => setPublishFacebook(e.target.checked)}
                className="w-4 h-4 text-[#FF4500] rounded focus:ring-[#FF4500]"
              />
              <Facebook size={20} className="text-[#1877F2]" />
              <span className="font-bold">Facebook</span>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <input
                type="checkbox"
                checked={publishWhatsApp}
                onChange={(e) => setPublishWhatsApp(e.target.checked)}
                className="w-4 h-4 text-[#FF4500] rounded focus:ring-[#FF4500]"
              />
              <Share2 size={20} className="text-[#25D366]" />
              <span className="font-bold">WhatsApp</span>
            </label>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black uppercase text-xs tracking-widest rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="px-6 py-3 bg-[#FF4500] text-white font-black uppercase text-xs tracking-widest rounded-lg hover:bg-[#E03D00] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <CheckCircle size={16} />
            {publishing ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal d'édition d'article
const EditArticleModal: React.FC<{
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => Promise<void>;
}> = ({ article, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSummary(article.summary || '');
      setContent(article.originalContent || '');
      setImageUrl(article.imageUrl || '');
    }
  }, [article]);

  if (!isOpen || !article) return null;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        setImageUrl(data.data.url);
      } else {
        alert('Erreur upload');
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(article._id, { 
        title, 
        summary, 
        originalContent: content,
        imageUrl: imageUrl  
      });
      onClose();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase tracking-tighter">Modifier l'article</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Titre</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Résumé</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none"
            />
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Image</label>
            <div className="flex gap-3 mb-3">
              <label className="cursor-pointer px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <span className="text-xs font-bold uppercase tracking-wider">📁 Choisir une image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {uploading && <span className="text-xs text-gray-500 animate-pulse">Upload en cours...</span>}
            </div>
            
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">OU</span>
              </div>
            </div>
            
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://exemple.com/image.jpg"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none"
            />
            
            {imageUrl && (
              <div className="mt-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Aperçu :</p>
                <div className="relative w-full h-40 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <img 
                    src={imageUrl} 
                    alt="Aperçu" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+invalide';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black uppercase text-xs tracking-widest rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-6 py-3 bg-[#FF4500] text-white font-black uppercase text-xs tracking-widest rounded-lg hover:bg-[#E03D00] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate(); 
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [publishingArticle, setPublishingArticle] = useState<Article | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);
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
      const [articlesRes, statsRes] = await Promise.all([
        articleService.getArticles('pending'),
        statsService.getStats()
      ]);
      setArticles(articlesRes.data || []);
      if (statsRes?.data) {
        setStats({
          total: statsRes.data.total || 0,
          pending: statsRes.data.byStatus?.pending || 0,
          published: statsRes.data.byStatus?.published || 0,
          rejected: statsRes.data.byStatus?.rejected || 0,
          modified: statsRes.data.byStatus?.modified || 0,
        });
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
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

  const handlePublishWithOptions = async (id: string, options: string[]) => {
    try {
      const publishedPlatforms = [];
      
      // Publication sur Axio News (base de données)
      if (options.includes('axio')) {
        await articleService.changeStatus(id, 'published');
        publishedPlatforms.push('Axio News');
      }
      
      // Publication sur Facebook
      if (options.includes('facebook')) {
        const response = await fetch(`http://localhost:5000/api/articles/${id}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ platform: 'facebook' })
        });
        if (response.ok) publishedPlatforms.push('Facebook');
      }
      
      // Publication sur WhatsApp
      if (options.includes('whatsapp')) {
        const response = await fetch(`http://localhost:5000/api/articles/${id}/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify({ platform: 'whatsapp' })
        });
        if (response.ok) publishedPlatforms.push('WhatsApp');
      }
      
      const platformNames = publishedPlatforms.join(', ');
      setNotification({ 
        message: `Article publié avec succès sur : ${platformNames}`, 
        type: 'success' 
      });
      
      setTimeout(() => setNotification(null), 5000);
      await fetchData();
    } catch (error) {
      console.error('❌ Erreur publication:', error);
      setNotification({ 
        message: 'Erreur lors de la publication sur certaines plateformes', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePublishClick = (article: Article) => {
    // Ouvrir le modal de choix des options
    setPublishingArticle(article);
  };

  const handleReject = async (id: string) => {
    try {
      await articleService.changeStatus(id, 'rejected');
      await fetchData();
      setNotification({ message: 'Article rejeté', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('❌ Erreur rejet:', error);
      setNotification({ message: 'Erreur lors du rejet', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await articleService.updateArticle(id, data);
      await fetchData();
      setNotification({ message: 'Article modifié avec succès', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('❌ Erreur modification:', error);
      throw error;
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
        {/* HEADER */}
        <div className="m-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black dark:border-white">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#FF4500] font-black uppercase tracking-[0.3em] text-[10px] ">
                <Newspaper size={14} /> Système de Rédaction
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">
                Tableau de <span className="text-[#FF4500]">Bord</span>.
              </h1>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleScrape}
                disabled={scraping}
                className="flex items-center gap-3 px-8 py-4 bg-black dark:bg-white dark:text-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#FF4500] dark:hover:bg-[#FF4500] dark:hover:text-white transition-all duration-300 disabled:opacity-50 shadow-lg shadow-black/10"
              >
                <RefreshCw className={`w-4 h-4 ${scraping ? 'animate-spin' : ''}`} />
                {scraping ? 'Synchronisation...' : 'Lancer le Scraper'}
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {notification.message}
              </div>
            </div>
          )}

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 mt-8 border border-black dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl">
            {[
              { label: 'Base Articles', value: stats.total, icon: <Database size={16}/>, border: 'border-r' },
              { label: 'En attente', value: stats.pending, icon: <Clock size={16}/>, border: 'border-r', color: 'text-orange-500' },
              { label: 'Publiés', value: stats.published, icon: <CheckCircle size={16}/>, border: 'border-r', color: 'text-green-600' },
              { label: 'Écartés', value: stats.rejected, icon: <XCircle size={16}/>, border: '', color: 'text-[#FF4500]' },
            ].map((stat, index) => (
              <div key={index} className={`p-8 ${stat.border} border-black dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors`}>
                <div className="flex items-center gap-2 mb-4 text-gray-400">
                  {stat.icon}
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{stat.label}</span>
                </div>
                <div className={`text-4xl font-black tracking-tighter ${stat.color || 'dark:text-white'}`}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FLUX DE MODÉRATION */}
        <div className="mt-16">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Flux de Modération</h2>
            <div className="h-[2px] flex-1 bg-black/10 dark:bg-white/10"></div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{articles.length} articles</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-black dark:border-gray-800">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 border-r border-b border-black dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-800" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="py-24 text-center border-4 border-dashed border-gray-100 dark:border-gray-900 flex flex-col items-center">
              <Newspaper size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-300">Aucun article à réviser</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-black dark:border-gray-800 shadow-2xl">
              {articles.map((article) => (
                <article key={article._id} className="group flex flex-col bg-white dark:bg-gray-900 border-r border-b border-black dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300">
                  <div className="h-44 overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-700 relative border-b border-black dark:border-gray-800">
                    {article.imageUrl ? (
                      <img src={article.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <Newspaper size={32} className="text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-[#FF4500] text-white text-[9px] font-black uppercase px-2 py-1 tracking-widest shadow-lg">
                      {article.source}
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Clock size={12} /> {new Date(article.scrapedAt).toLocaleDateString('fr-FR')}
                    </div>
                    <h3 className="font-black text-lg uppercase leading-[1.1] mb-4 group-hover:text-[#FF4500] transition-colors line-clamp-2 dark:text-white italic">
                      {article.title}
                    </h3>
                    
                    <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                      <button 
                        onClick={() => handlePublishClick(article)}
                        className="flex-1 py-3 bg-black dark:bg-white dark:text-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF4500] dark:hover:bg-[#FF4500] transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Globe size={14} />
                        Publier
                      </button>
                      <button 
                        onClick={() => handleReject(article._id)}
                        className="px-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"
                      >
                        <XCircle size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingArticle(article)}
                        className="px-4 border-2 border-black dark:border-white hover:bg-black hover:text-white transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Modal d'édition */}
      <EditArticleModal
        article={editingArticle}
        isOpen={!!editingArticle}
        onClose={() => setEditingArticle(null)}
        onSave={handleEdit}
      />

      {/* Modal de choix de publication */}
      <PublishOptionsModal
        article={publishingArticle}
        isOpen={!!publishingArticle}
        onClose={() => setPublishingArticle(null)}
        onConfirm={handlePublishWithOptions}
      />
    </>
  );
};