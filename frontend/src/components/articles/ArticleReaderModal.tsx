import React from 'react';
import { X, Globe, Calendar } from 'lucide-react';
import type { Article } from '../../types';

interface ArticleReaderModalProps {
  article: Article | null;
  isOpen: boolean;
  onClose: () => void;
}

// 🔹 Extraire l'ID d'une vidéo YouTube
const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/,
    /youtube\.com\/embed\/([^/?]+)/,
    /youtube\.com\/v\/([^/?]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

// 🔹 Parser le contenu Markdown
const parseContent = (content: string): React.ReactNode[] => {
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
        <div key={`image-${i}`} className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <img 
            src={url} 
            alt="Image de l'article" 
            className="w-full h-auto max-h-80 object-cover"
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
          <div key={`video-${i}`} className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title="Vidéo YouTube"
              className="w-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      } else {
        elements.push(
          <div key={`video-${i}`} className="my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-gray-500 border-2 border-dashed border-gray-300">
            🎬 Lien vidéo invalide
          </div>
        );
      }
      continue;
    }
    
    // ✅ Sous-titre (format: ## texte)
    const subtitleMatch = line.match(/^##\s+(.+)/);
    if (subtitleMatch) {
      elements.push(
        <h3 key={`subtitle-${i}`} className="text-xl font-black mt-6 mb-3 dark:text-white leading-tight">
          {subtitleMatch[1]}
        </h3>
      );
      continue;
    }
    
    // ✅ Paragraphe normal
    if (line === '---') continue;
    if (line.startsWith('Source :') || line.startsWith('Source:')) continue;
    
    elements.push(
      <p key={`paragraph-${i}`} className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-4">
        {line}
      </p>
    );
  }
  
  return elements;
};

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({ 
  article, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !article) return null;

  // ✅ Déterminer le contenu à afficher
  const contentElements: React.ReactNode[] = [];
  
  // Vérifier si l'article a des sections (type Article avec sections)
  const articleWithSections = article as any;
  const hasSections = articleWithSections.sections && Array.isArray(articleWithSections.sections) && articleWithSections.sections.length > 0;
  
  if (hasSections) {
    // Si l'article a des sections structurées
    articleWithSections.sections.forEach((section: any, index: number) => {
      switch (section.type) {
        case 'subtitle':
          contentElements.push(
            <h3 key={section.id || index} className="text-xl font-black mt-6 mb-3 dark:text-white leading-tight">
              {section.content}
            </h3>
          );
          break;
        case 'paragraph':
          contentElements.push(
            <p key={section.id || index} className="text-gray-700 dark:text-gray-300 leading-relaxed text-base mb-4">
              {section.content}
            </p>
          );
          break;
        case 'image':
          if (section.content) {
            contentElements.push(
              <div key={section.id || index} className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                <img src={section.content} alt="Image" className="w-full h-auto max-h-80 object-cover" />
              </div>
            );
          }
          break;
        case 'video':
          if (section.content) {
            const videoId = extractYouTubeId(section.content);
            if (videoId) {
              contentElements.push(
                <div key={section.id || index} className="my-4 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="Vidéo YouTube"
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              );
            }
          }
          break;
        default:
          break;
      }
    });
  } else if (article.originalContent) {
    // Fallback : contenu en Markdown
    const parsed = parseContent(article.originalContent);
    contentElements.push(...parsed);
  }

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
          {/* Image de couverture */}
          {article.imageUrl ? (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
              <img 
                src={article.imageUrl} 
                alt={article.title} 
                className="w-full h-auto max-h-80 object-cover"
                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
              />
            </div>
          ) : null}

          {/* Résumé */}
          {article.summary && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                📝 Résumé de l'article
              </h3>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {article.summary}
                </p>
              </div>
            </div>
          )}

          {/* ✅ Contenu de l'article */}
          {contentElements.length > 0 && (
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                📄 Contenu de l'article
              </h3>
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {contentElements}
              </div>
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