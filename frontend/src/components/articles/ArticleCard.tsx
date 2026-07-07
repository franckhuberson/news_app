import React from 'react';
import { Edit, CheckCircle, XCircle } from 'lucide-react';

interface ArticleCardProps {
  article: {
    _id: string;
    title: string;
    summary: string;
    imageUrl?: string;
    source: string;
    status: string;
    scrapedAt: string;
  };
  onEdit: (id: string) => void;
  onPublish: (id: string) => void;
  onReject: (id: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ 
  article, 
  onEdit, 
  onPublish, 
  onReject 
}) => {
  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Couleur du badge selon le statut
  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
      published: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
      rejected: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-500/30',
      modified: 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  // Libellé du statut
  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'En attente',
      published: 'Publié',
      rejected: 'Rejeté',
      modified: 'Modifié',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 rounded-2xl border border-white/30 dark:border-gray-800/50 p-6 hover:shadow-xl transition-all">
      {/* En-tête avec statut et source */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(article.status)}`}>
            {getStatusLabel(article.status)}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {article.source}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDate(article.scrapedAt)}
          </span>
        </div>
      </div>

      {/* Image si présente */}
      {article.imageUrl && (
        <div className="mb-4">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-48 object-cover rounded-xl"
          />
        </div>
      )}

      {/* Titre */}
      <h3 className="text-xl font-bold mb-3 line-clamp-2">{article.title}</h3>

      {/* Résumé */}
      <p className="text-gray-600 dark:text-gray-300 mb-6 line-clamp-3">
        {article.summary || "Aucun résumé disponible"}
      </p>

      {/* BOUTONS D'ACTION - C'EST CE QUE TU DEMANDAIS */}
      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200/50 dark:border-gray-800/50">
        {/* Bouton Modifier */}
        <button
          onClick={() => onEdit(article._id)}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all"
        >
          <Edit className="w-4 h-4" />
          <span className="text-sm">Modifier</span>
        </button>

        {/* Bouton Publier (si pas déjà publié) */}
        {article.status !== 'published' && (
          <button
            onClick={() => onPublish(article._id)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Publier</span>
          </button>
        )}

        {/* Bouton Rejeter (si pas déjà rejeté) */}
        {article.status !== 'rejected' && (
          <button
            onClick={() => onReject(article._id)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/20 text-rose-700 dark:text-rose-400 rounded-xl hover:bg-rose-500/30 transition-all"
          >
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Rejeter</span>
          </button>
        )}
      </div>
    </div>
  );
};