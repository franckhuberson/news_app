import React from 'react';
import { Newspaper, X, Globe, Calendar } from 'lucide-react';
import type { Article } from '../../types';

interface ArticleReaderModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({ 
  article, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !article) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* En-tête */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-6 flex justify-between items-start">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Globe size={14} />
              <span className="font-medium">{article.source || 'Source inconnue'}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <Calendar size={14} />
              <span>{new Date(article.scrapedAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tighter leading-tight dark:text-white">
              {article.title}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            <X size={24} />
          </button>
        </div>

        {/* Corps */}
        <div className="p-6 space-y-6">
          {/* Image */}
          {article.imageUrl ? (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-auto max-h-100 object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <Newspaper size={48} className="text-gray-400" />
            </div>
          )}

          {/* Résumé */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
              📝 Résumé de l'article
            </h3>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {article.summary || 'Aucun résumé disponible.'}
              </p>
            </div>
          </div>

          {/* Source */}
          {article.sourceUrl && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                🔗 Source originale
              </h3>
              <a 
                href={article.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm break-all"
              >
                {article.sourceUrl}
              </a>
            </div>
          )}

          {/* Métadonnées */}
          {article.metadata?.wordCount && (
            <div className="text-xs text-gray-400 border-t border-gray-200 dark:border-gray-800 pt-4">
              {article.metadata.wordCount} mots · Scrapé le {new Date(article.scrapedAt).toLocaleString('fr-FR')}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-6 flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-3 bg-black dark:bg-white dark:text-black text-white font-black uppercase text-xs tracking-widest rounded-lg hover:bg-primary-500 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleReaderModal;