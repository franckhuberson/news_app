import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Clock, Newspaper, LogOut, CheckCircle, XCircle, Edit3, Save, X } from 'lucide-react';

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
            {imageUrl && <img src={imageUrl} alt="Aperçu" className="mt-3 w-full h-40 object-cover rounded-lg border" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x200?text=Image+invalide'} />}
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

export const ArticlesByCategory: React.FC = () => {
  const { status, category } = useParams<{ status: string; category: string }>();
  const navigate = useNavigate();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  const categoryMap: { [key: string]: string } = {
    'all': 'all',
    'politique': 'Politique',
    'economie': 'Économie',
    'sante': 'Santé',
    'tech': 'Tech',
    'sports': 'Sports',
    'culture': 'Culture',
    'buzz': 'Buzz',
    'emploi': 'Emploi'
  };

  const displayNames: { [key: string]: string } = {
    'all': 'TOUS',
    'politique': 'POLITIQUE',
    'economie': 'ÉCONOMIE',
    'sante': 'SANTÉ',
    'tech': 'TECH',
    'sports': 'SPORTS',
    'culture': 'CULTURE',
    'buzz': 'BUZZ',
    'emploi': 'EMPLOI'
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getTitle = () => {
    let statusText = '';
    if (status === 'published') statusText = 'Publiés';
    else if (status === 'rejected') statusText = 'Rejetés';
    else statusText = 'En attente';
    const categoryText = displayNames[category || 'all'] || (category || 'TOUS').toUpperCase();
    return `${statusText} - ${categoryText}`;
  };

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/articles/${id}/status`, { status: 'published' });
      setArticles(articles.filter(article => article._id !== id));
      setNotification({ message: 'Article publié avec succès', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'Erreur lors de la publication', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await api.patch(`/articles/${id}/status`, { status: 'rejected' });
      setArticles(articles.filter(article => article._id !== id));
      setNotification({ message: 'Article rejeté', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      setNotification({ message: 'Erreur lors du rejet', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleEdit = async (id: string, data: any) => {
    try {
      await api.put(`/articles/${id}`, data);
      setNotification({ message: 'Article modifié avec succès', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
      
      let url = `/articles?status=${status}`;
      const mappedCategory = categoryMap[category || 'all'];
      if (mappedCategory && mappedCategory !== 'all') {
        url += `&categorie=${encodeURIComponent(mappedCategory)}`;
      }
      const response = await api.get(url);
      setArticles(response.data.data || []);
    } catch (error) {
      setNotification({ message: 'Erreur lors de la modification', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      throw error;
    }
  };

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        // ✅ CORRECTION : Utiliser le status de l'URL sans forcer 'pending'
        if (!status) {
          console.log('⏳ Pas de status dans l\'URL');
          setLoading(false);
          return;
        }
        
        let url = `/articles?status=${status}`;
        
        const mappedCategory = categoryMap[category || 'all'];
        if (mappedCategory && mappedCategory !== 'all') {
          url += `&categorie=${encodeURIComponent(mappedCategory)}`;
        }
        
        console.log('📡 Appel API:', url);
        const response = await api.get(url);
        console.log('✅ Articles reçus:', response.data.data?.length);
        setArticles(response.data.data || []);
      } catch (error) {
        console.error('❌ Erreur chargement articles:', error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchArticles();
  }, [status, category]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <>
      <DashboardLayout>
        <div className="p-8">
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
                <button onClick={handleLogout} className="px-4 py-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all duration-300">
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </div>

          {notification && (
            <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-50 ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
              {notification.message}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF4500]"></div>
            </div>
          ) : articles.length === 0 ? (
            <div className="py-24 text-center border-4 border-dashed border-gray-100 dark:border-gray-900 flex flex-col items-center">
              <Newspaper size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-300">Aucun article trouvé</p>
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
                      <button onClick={() => handlePublish(article._id)} className="flex-1 py-3 bg-black dark:bg-white dark:text-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#FF4500] dark:hover:bg-[#FF4500] transition-all shadow-md flex items-center justify-center gap-2">
                        <CheckCircle size={14} /> Publier
                      </button>
                      <button onClick={() => handleReject(article._id)} className="px-4 border-2 border-black dark:border-white hover:bg-red-600 hover:border-red-600 hover:text-white transition-all">
                        <XCircle size={16} />
                      </button>
                      <button onClick={() => setEditingArticle(article)} className="px-4 border-2 border-black dark:border-white hover:bg-black hover:text-white transition-all">
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

      <EditArticleModal article={editingArticle} isOpen={!!editingArticle} onClose={() => setEditingArticle(null)} onSave={handleEdit} />
    </>
  );
};