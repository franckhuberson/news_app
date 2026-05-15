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
  Globe,
  Calendar
} from 'lucide-react';
import { articleService, statsService, scraperService } from '../services/api';
import type { Article } from '../types';
import { useNavigate } from 'react-router-dom';

// ===========================================
// MODAL : CHOIX DE PUBLICATION (SCROLLABLE)
// ===========================================
const PublishOptionsModal: React.FC<{
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, options: string[], isScheduled?: boolean, scheduledDate?: Date) => Promise<void>;
}> = ({ article, isOpen, onClose, onConfirm }) => {
  const [publishAxio, setPublishAxio] = useState(true);
  const [publishFacebook, setPublishFacebook] = useState(false);
  const [publishWhatsApp, setPublishWhatsApp] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [publishDate, setPublishDate] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPublishDate('');
      setPublishTime('');
      setIsScheduled(false);
      setPublishAxio(true);
      setPublishFacebook(false);
      setPublishWhatsApp(false);
    }
  }, [isOpen]);

  if (!isOpen || !article) return null;

  const handleSubmit = async () => {
    const options = [];
    if (publishAxio) options.push('axio');
    if (publishFacebook) options.push('facebook');
    if (publishWhatsApp) options.push('whatsapp');
    
    if (options.length === 0) {
      alert('Veuillez sélectionner au moins une plateforme');
      return;
    }

    let scheduledDate = undefined;
    if (isScheduled) {
      if (!publishDate || !publishTime) {
        alert('Veuillez choisir une date et une heure');
        return;
      }
      scheduledDate = new Date(`${publishDate}T${publishTime}`);
      if (scheduledDate <= new Date()) {
        alert('La date de publication doit être dans le futur');
        return;
      }
    }

    setLoading(true);
    try {
      await onConfirm(article._id, options, isScheduled, scheduledDate);
      onClose();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black uppercase tracking-tighter">Options de publication</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">{article.title}</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">PUBLIER SUR :</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" checked={publishAxio} onChange={(e) => setPublishAxio(e.target.checked)} className="w-4 h-4 text-[#FF4500] rounded" />
                <Globe size={20} className="text-[#FF4500]" />
                <span className="font-bold">Axio News (Base de données)</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" checked={publishFacebook} onChange={(e) => setPublishFacebook(e.target.checked)} className="w-4 h-4 text-[#FF4500] rounded" />
                <Facebook size={20} className="text-[#1877F2]" />
                <span className="font-bold">Facebook</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="checkbox" checked={publishWhatsApp} onChange={(e) => setPublishWhatsApp(e.target.checked)} className="w-4 h-4 text-[#FF4500] rounded" />
                <Share2 size={20} className="text-[#25D366]" />
                <span className="font-bold">WhatsApp</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">QUAND PUBLIER ?</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="radio" name="schedule" checked={!isScheduled} onChange={() => setIsScheduled(false)} className="w-4 h-4 text-[#FF4500]" />
                <span className="font-bold">Publier immédiatement</span>
              </label>
              
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <input type="radio" name="schedule" checked={isScheduled} onChange={() => setIsScheduled(true)} className="w-4 h-4 text-[#FF4500]" />
                <Calendar size={20} className="text-[#FF4500]" />
                <span className="font-bold">Programmer la publication</span>
              </label>
            </div>
          </div>

          {isScheduled && (
            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">DATE</label>
                <input
                  type="date"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">HEURE</label>
                <input
                  type="time"
                  value={publishTime}
                  onChange={(e) => setPublishTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500] outline-none"
                />
              </div>
            </div>
          )}
        </div>
        
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black uppercase text-xs tracking-widest rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">Annuler</button>
          <button onClick={handleSubmit} disabled={loading} className="px-6 py-3 bg-[#FF4500] text-white font-black uppercase text-xs tracking-widest rounded-lg hover:bg-[#E03D00] transition-colors disabled:opacity-50 flex items-center gap-2">
            <CheckCircle size={16} />
            {loading ? 'Publication...' : (isScheduled ? 'Programmer' : 'Publier maintenant')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// MODAL D'ÉDITION D'ARTICLE
// ===========================================
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
      }
    } catch (error) {
      console.error('Erreur upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(article._id, { title, summary, originalContent: content, imageUrl });
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
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b p-6 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase">Modifier l'article</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-black uppercase mb-2">Titre</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:border-[#FF4500] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2">Résumé</label>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:border-[#FF4500] outline-none" />
          </div>
          <div>
            <label className="block text-xs font-black uppercase mb-2">Image</label>
            <div className="flex gap-3 mb-3">
              <label className="cursor-pointer px-4 py-2 bg-gray-100 border rounded-lg hover:bg-gray-200">
                📁 Choisir une image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {uploading && <span className="text-xs animate-pulse">Upload...</span>}
            </div>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://exemple.com/image.jpg" className="w-full px-4 py-3 bg-gray-50 border rounded-lg focus:border-[#FF4500] outline-none" />
            {imageUrl && (
              <div className="mt-3">
                <img src={imageUrl} alt="Aperçu" className="w-full h-40 object-cover rounded-lg border" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+invalide'} />
              </div>
            )}
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t p-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-3 border-2 rounded-lg font-black uppercase text-xs">Annuler</button>
          <button onClick={handleSave} disabled={saving || uploading} className="px-6 py-3 bg-[#FF4500] text-white rounded-lg font-black uppercase text-xs flex items-center gap-2 disabled:opacity-50">
            <Save size={16} /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// DASHBOARD PRINCIPAL CORRIGÉ
// ===========================================
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
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [navigate]);

  // ✅ CORRECTION: fetchData avec gestion d'erreurs améliorée
  const fetchData = async () => {
    setLoading(true);
    console.log('🔄 Fetching dashboard data...');
    
    try {
      // Récupérer les articles en attente
      console.log('📡 Appel getArticles(pending)...');
      const articlesRes = await articleService.getArticles('pending');
      console.log('✅ Articles reçus:', articlesRes?.data?.length || 0);
      setArticles(articlesRes?.data || []);
      
      // Récupérer les statistiques (optionnel, ne pas bloquer)
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
        // Ne pas afficher d'erreur à l'utilisateur pour les stats
      }
      
    } catch (error) {
      console.error('❌ Erreur fetchData:', error);
      // Ne pas afficher d'alerte, juste en console
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

  const handlePublishWithOptions = async (id: string, options: string[], isScheduled: boolean = false, scheduledDate?: Date) => {
    try {
      if (options.includes('axio')) {
        if (isScheduled && scheduledDate) {
          const response = await fetch(`http://localhost:5000/api/articles/${id}/schedule`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ publishDate: scheduledDate.toISOString() })
          });
          if (response.ok) {
            setNotification({ message: `Article programmé pour le ${scheduledDate.toLocaleString('fr-FR')}`, type: 'success' });
          } else {
            throw new Error('Erreur de programmation');
          }
        } else {
          await articleService.changeStatus(id, 'published');
          setNotification({ message: 'Article publié sur Axio News', type: 'success' });
        }
      }
      
      setTimeout(() => setNotification(null), 5000);
      await fetchData();
    } catch (error) {
      console.error('❌ Erreur publication:', error);
      setNotification({ message: 'Erreur lors de la publication', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handlePublishClick = (article: Article) => setPublishingArticle(article);
  
  const handleReject = async (id: string) => {
    try {
      await articleService.changeStatus(id, 'rejected');
      await fetchData();
      setNotification({ message: 'Article rejeté', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'Erreur lors du rejet', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await articleService.updateArticle(id, data);
      await fetchData();
      setNotification({ message: 'Article modifié', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
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
        <div className="m-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black dark:border-white">
            <div>
              <div className="flex items-center gap-2 mb-2 text-[#FF4500] font-black uppercase text-[10px]">
                <Newspaper size={14} /> Système de Rédaction
              </div>
              <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">
                Tableau de <span className="text-[#FF4500]">Bord</span>.
              </h1>
            </div>
            <div className="flex gap-3">
              <button onClick={handleScrape} disabled={scraping} className="flex items-center gap-3 px-8 py-4 bg-black dark:bg-white dark:text-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#FF4500] transition-all disabled:opacity-50">
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
            <div className="p-8 border-r border-black"><Database size={16} /><span className="text-[10px] font-black uppercase ml-2">Base Articles</span><div className="text-4xl font-black mt-4">{stats.total}</div></div>
            <div className="p-8 border-r border-black"><Clock size={16} /><span className="text-[10px] font-black uppercase ml-2">En attente</span><div className="text-4xl font-black text-orange-500 mt-4">{stats.pending}</div></div>
            <div className="p-8 border-r border-black"><CheckCircle size={16} /><span className="text-[10px] font-black uppercase ml-2">Publiés</span><div className="text-4xl font-black text-green-600 mt-4">{stats.published}</div></div>
            <div className="p-8"><XCircle size={16} /><span className="text-[10px] font-black uppercase ml-2">Écartés</span><div className="text-4xl font-black text-[#FF4500] mt-4">{stats.rejected}</div></div>
          </div>
        </div>

        <div className="mt-16 px-8">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-black uppercase">Flux de Modération</h2>
            <div className="h-[2px] flex-1 bg-black/10"></div>
            <span className="text-[10px] font-bold text-gray-400">{articles.length} articles</span>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border border-black">
              {[...Array(3)].map((_, i) => <div key={i} className="h-80 border-r border-b border-black animate-pulse bg-gray-50" />)}
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
                    {article.imageUrl ? <img src={article.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center"><Newspaper size={32} className="text-gray-400" /></div>}
                    <div className="absolute top-4 left-4 bg-[#FF4500] text-white text-[9px] font-black uppercase px-2 py-1">{article.source}</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-[9px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><Clock size={12} /> {new Date(article.scrapedAt).toLocaleDateString('fr-FR')}</div>
                    <h3 className="font-black text-lg uppercase leading-tight mb-4 group-hover:text-[#FF4500] line-clamp-2">{article.title}</h3>
                    <div className="mt-auto pt-6 border-t border-gray-100 flex gap-2">
                      <button onClick={() => handlePublishClick(article)} className="flex-1 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF4500] transition-all flex items-center justify-center gap-2"><Globe size={14} /> Publier</button>
                      <button onClick={() => handleReject(article._id)} className="px-4 border-2 border-black hover:bg-red-600 hover:border-red-600 hover:text-white transition-all"><XCircle size={16} /></button>
                      <button onClick={() => setEditingArticle(article)} className="px-4 border-2 border-black hover:bg-black hover:text-white transition-all"><Edit3 size={16} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      <EditArticleModal article={editingArticle} isOpen={!!editingArticle} onClose={() => setEditingArticle(null)} onSave={handleEdit} />
      <PublishOptionsModal article={publishingArticle} isOpen={!!publishingArticle} onClose={() => setPublishingArticle(null)} onConfirm={handlePublishWithOptions} />
    </>
  );
};