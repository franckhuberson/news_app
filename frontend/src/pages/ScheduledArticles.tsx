import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Calendar, Clock, Trash2, Newspaper } from 'lucide-react';
import { api } from '../services/api';
import type { Article } from '../types';

export const ScheduledArticles: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledArticles();
  }, []);

  const fetchScheduledArticles = async () => {
    try {
      const response = await api.get('/articles/scheduled');
      setArticles(response.data.data || []);
    } catch (error) {
      console.error('Erreur chargement articles programmés:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async (id: string) => {
    if (!confirm('Annuler la programmation de cet article ?')) return;
    try {
      await api.delete(`/articles/${id}/schedule`);
      fetchScheduledArticles();
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="m-8">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-4 border-black dark:border-white">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#FF4500] font-black uppercase tracking-[0.3em] text-[10px]">
              <Calendar size={14} /> Articles programmés
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">
              Publications <span className="text-[#FF4500]">programmées</span>
            </h1>
          </div>
        </div>

        {/* CONTENU */}
        <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-black dark:border-gray-800">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 border-r border-b border-black dark:border-gray-800 animate-pulse bg-gray-50 dark:bg-gray-800" />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="py-24 text-center border-4 border-dashed border-gray-100 dark:border-gray-900 flex flex-col items-center">
              <Calendar size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-gray-300">Aucun article programmé</p>
              <p className="text-xs text-gray-400 mt-2">
                Les articles que vous programmerez apparaîtront ici
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-black dark:border-gray-800 shadow-2xl">
              {articles.map((article) => (
                <article key={article._id} className="group flex flex-col bg-white dark:bg-gray-900 border-r border-b border-black dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-300">
                  {/* Image */}
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
                    <div className="absolute top-4 right-4 bg-black/80 text-white text-[9px] font-black uppercase px-2 py-1 tracking-widest shadow-lg flex items-center gap-1">
                      <Clock size={10} />
                      Programmé
                    </div>
                  </div>

                  {/* Contenu */}
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Calendar size={12} /> {formatDate(article.scheduledPublishDate || '')}
                    </div>
                    <h3 className="font-black text-lg uppercase leading-[1.1] mb-4 group-hover:text-[#FF4500] transition-colors line-clamp-2 dark:text-white italic">
                      {article.title}
                    </h3>
                    
                    {article.summary && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                        {article.summary}
                      </p>
                    )}
                    
                    <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                      <button 
                        onClick={() => handleCancelSchedule(article._id)}
                        className="w-full py-3 bg-black dark:bg-white dark:text-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} />
                        Annuler la programmation
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};