import React, { useState, useEffect } from 'react';
import { PenTool, Save, Eye, ArrowLeft, Clock, Image as ImageIcon, Upload, X, ChevronDown, FileText, Plus, Trash2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// Types pour les sections
type SectionType = 'subtitle' | 'paragraph' | 'image' | 'video';

interface Section {
  id: string;
  type: SectionType;
  content: string;
}

interface ArticleData {
  title: string;
  sections: Section[];
  summary: string;
  imageUrl: string;
  source: string;
  sourceUrl: string;
  categorie: string;
  status: string;
  scrapedAt: Date;
  metadata: {
    authors: string[];
    keywords: string[];
    wordCount: number;
  };
  isScheduled?: boolean;
  scheduledPublishDate?: Date;
}

// ✅ URL de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const WriteArticle: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingArticle = location.state?.article;
  
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingSectionImage, setUploadingSectionImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // ✅ Charger les données de l'article si on est en mode édition
  useEffect(() => {
    if (editingArticle) {
      console.log('📝 Chargement de l\'article pour édition:', editingArticle);
      setIsEditing(true);
      
      setTitle(editingArticle.title || '');
      setCategory(editingArticle.categorie || '');
      setImageUrl(editingArticle.imageUrl || '');
      setSummary(editingArticle.summary || '');
      
      // Si l'article a des sections, les charger
      if (editingArticle.sections && editingArticle.sections.length > 0) {
        setSections(editingArticle.sections);
      } else if (editingArticle.originalContent) {
        // Si pas de sections mais un contenu original, on le met dans un paragraphe
        setSections([{
          id: Date.now().toString(),
          type: 'paragraph',
          content: editingArticle.originalContent
        }]);
      }
    }
  }, [editingArticle]);

  const categories = [
    { value: 'Politique', label: 'POLITIQUE' },
    { value: 'Santé', label: 'SANTÉ' },
    { value: 'Tech', label: 'TECH' },
    { value: 'Économie', label: 'ÉCONOMIE' },
    { value: 'Culture', label: 'CULTURE' },
    { value: 'Sports', label: 'SPORTS' },
    { value: 'Buzz', label: 'BUZZ' },
    { value: 'Emploi', label: 'EMPLOI' }
  ];

  // 🔹 Ajouter une section
  const addSection = (type: SectionType) => {
    const newSection: Section = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      type: type,
      content: ''
    };
    setSections([...sections, newSection]);
  };

  // 🔹 Supprimer une section
  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
  };

  // 🔹 Mettre à jour le contenu d'une section
  const updateSection = (id: string, content: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, content } : s));
  };

  // 🔹 Déplacer une section vers le haut
  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index], newSections[index - 1]] = [newSections[index - 1], newSections[index]];
    setSections(newSections);
  };

  // 🔹 Déplacer une section vers le bas
  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    setSections(newSections);
  };

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

  // 🔹 Upload d'image pour une section
  const handleSectionImageUpload = async (sectionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSectionImage(sectionId);

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        updateSection(sectionId, data.data.url);
      }
    } catch (error) {
      console.error('Erreur upload image de section:', error);
      setError("Erreur lors de l'upload de l'image");
    } finally {
      setUploadingSectionImage(null);
    }
  };

  // 🔹 Upload de l'image principale
  const handleMainImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (data.success) {
        const uploadedImageUrl = data.data.url;
        setImageUrl(uploadedImageUrl);
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      setError("Erreur lors de l'upload de l'image");
    } finally {
      setUploadingImage(false);
    }
  };

  // 🔹 Générer le contenu complet à partir des sections
  const getFullContent = (): string => {
    return sections
      .map(s => {
        switch (s.type) {
          case 'subtitle': return `## ${s.content}`;
          case 'paragraph': return s.content;
          case 'image': return `![Image](${s.content})`;
          case 'video': return `[Vidéo: ${s.content}]`;
          default: return s.content;
        }
      })
      .filter(s => s.trim())
      .join('\n\n');
  };

  // 🔹 Rendu d'une section en prévisualisation
  const renderSectionPreview = (section: Section) => {
    switch (section.type) {
      case 'subtitle':
        return <h2 className="text-2xl font-black uppercase mt-8 mb-4">{section.content || '(Sous-titre)'}</h2>;
      case 'paragraph':
        return <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg mb-6">{section.content || '(Paragraphe)'}</p>;
      case 'image':
        return section.content ? (
          <div className="my-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img src={section.content} alt="Image" className="w-full h-auto max-h-96 object-cover" />
          </div>
        ) : (
          <div className="my-6 p-12 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-400">Image</div>
        );
      case 'video':
        if (section.content) {
          const videoId = extractYouTubeId(section.content);
          if (videoId) {
            return (
              <div className="my-6 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
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
          return <div className="my-6 p-12 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-gray-500 border-2 border-dashed border-gray-300">🎬 Lien vidéo invalide</div>;
        }
        return <div className="my-6 p-12 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-gray-500 border-2 border-dashed border-gray-300">🎬 {section.content || 'Lien vidéo'}</div>;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        setError('Vous devez être connecté');
        setLoading(false);
        return;
      }

      const fullContent = getFullContent();
      
      let scheduledPublishDate: Date | undefined = undefined;
      let finalStatus = 'published';
      
      if (isScheduled && scheduleDate && scheduleTime) {
        scheduledPublishDate = new Date(`${scheduleDate}T${scheduleTime}`);
        finalStatus = 'scheduled';
      }
      
      const articleData: ArticleData = {
        title: title,
        sections: sections,
        summary: summary || '',
        imageUrl: imageUrl || '',
        source: 'Amaya News',
        sourceUrl: `https://amaya-news.com/article/${Date.now()}`,
        categorie: category,
        status: finalStatus,
        scrapedAt: new Date(),
        metadata: {
          authors: ['Amaya News'],
          keywords: [],
          wordCount: fullContent.split(' ').length
        }
      };
      
      if (isScheduled && scheduledPublishDate) {
        articleData.isScheduled = true;
        articleData.scheduledPublishDate = scheduledPublishDate;
      }
      
      // ✅ Déterminer l'URL et la méthode
      const url = isEditing && editingArticle?._id 
        ? `${API_BASE_URL}/articles/${editingArticle._id}` 
        : `${API_BASE_URL}/articles`;
      const method = isEditing && editingArticle?._id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...articleData,
          originalContent: fullContent
        })
      });
      
      const data = await response.json();
      
      if (response.ok && (data.success || data.data)) {
        if (isScheduled) {
          navigate('/admin/articles/scheduled');
        } else {
          navigate('/admin');
        }
      } else {
        setError(data.message || data.error || "Erreur lors de la création de l'article");
      }
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setError(`Impossible de contacter le serveur. Vérifiez que le backend est démarré.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* En-tête */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b-4 border-black dark:border-white">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-primary-500 font-black uppercase tracking-[0.3em] text-[10px]">
                <PenTool size={14} /> Rédaction
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => navigate('/admin')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <ArrowLeft size={24} />
                </button>
                <h1 className="text-4xl font-black uppercase tracking-tighter dark:text-white italic">
                  {isEditing ? 'Modifier' : 'Rédiger un'} <span className="text-primary-500">Article</span>
                </h1>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setPreviewMode(!previewMode)}
                className="px-6 py-3 border-2 border-black dark:border-white text-black dark:text-white text-[11px] font-black uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
              >
                <Eye size={16} /> {previewMode ? 'Éditer' : 'Prévisualiser'}
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-[11px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Save size={16} /> {loading ? (isEditing ? 'Mise à jour...' : 'Publication...') : (isScheduled ? 'Programmer' : (isEditing ? 'Mettre à jour' : 'Publier'))}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-8 mt-4">
          <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-500 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
            <p className="text-sm font-bold">❌ {error}</p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-8">
        {previewMode ? (
          // ============ PRÉVISUALISATION ============
          <div className="bg-white dark:bg-gray-900 border border-black dark:border-gray-800 shadow-xl">
            <div className="relative h-80 overflow-hidden border-b border-black dark:border-gray-800">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                  <ImageIcon size={64} className="text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="max-w-3xl">
                  {category && (
                    <span className="inline-block bg-primary-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 mb-4">
                      {category}
                    </span>
                  )}
                  <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4 leading-tight">
                    {title || 'Titre de l\'article'}
                  </h1>
                  <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-2">
                      <Clock size={14} /> {new Date().toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 md:p-12">
              {/* ✅ SECTION RÉSUMÉ EN PRÉVISUALISATION */}
              {summary && (
                <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
                    📝 Résumé
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xl leading-relaxed italic border-l-4 border-primary-500 pl-6">
                    {summary}
                  </p>
                </div>
              )}

              {sections.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm font-black uppercase tracking-widest">Aucun contenu rédigé</p>
                  <p className="text-xs mt-2">Ajoutez des sections en mode édition</p>
                </div>
              ) : (
                sections.map((section) => (
                  <div key={section.id} className="relative">
                    {renderSectionPreview(section)}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          // ============ ÉDITEUR ============
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations principales */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-xl overflow-hidden">
              <div className="bg-black dark:bg-white px-6 py-3">
                <h2 className="text-white dark:text-black text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Informations principales
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">TITRE DE L'ARTICLE *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Les nouvelles tendances technologiques en 2024"
                    className="w-full px-4 py-3 text-lg font-bold bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">RÉSUMÉ DE L'ARTICLE</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Résumé concis de l'article (2-3 phrases)..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none resize-vertical text-sm leading-relaxed"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">Le résumé apparaîtra en tête de l'article et dans les aperçus.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">CATÉGORIE *</label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 appearance-none bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none text-sm font-medium cursor-pointer"
                        required
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map((cat) => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">IMAGE À LA UNE</label>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <label className="cursor-pointer px-6 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all flex items-center gap-2 rounded-lg">
                          <Upload size={14} /> {uploadingImage ? 'Upload...' : 'Choisir'}
                          <input type="file" accept="image/*" onChange={handleMainImageUpload} className="hidden" disabled={uploadingImage} />
                        </label>
                        <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Ou URL de l'image" className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none text-sm" />
                      </div>
                      {(imagePreview || imageUrl) && (
                        <div className="relative h-40 overflow-hidden rounded-lg border-2 border-gray-200 dark:border-gray-700">
                          <img src={imagePreview || imageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => { setImageUrl(''); setImageFile(null); setImagePreview(''); }} className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"><X size={14} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============ SECTIONS DE L'ARTICLE ============ */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-xl overflow-hidden">
              <div className="bg-black dark:bg-white px-6 py-3 flex items-center justify-between">
                <h2 className="text-white dark:text-black text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                  <PenTool size={14} /> Structure de l'article
                </h2>
                <div className="flex gap-2">
                  <span className="text-white/60 dark:text-black/60 text-[9px] font-black uppercase tracking-widest">
                    {sections.length} section{sections.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {sections.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                    <p className="text-sm font-black uppercase tracking-widest text-gray-400">Aucune section</p>
                    <p className="text-xs text-gray-400 mt-1">Ajoutez des sections ci-dessous</p>
                  </div>
                ) : (
                  sections.map((section, index) => (
                    <div key={section.id} className="relative group border-2 border-gray-100 dark:border-gray-800 rounded-lg p-4 hover:border-primary-500 transition-colors">
                      {/* En-tête de la section */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                            {section.type === 'subtitle' && '📌 Sous-titre'}
                            {section.type === 'paragraph' && '📄 Paragraphe'}
                            {section.type === 'image' && '🖼️ Image'}
                            {section.type === 'video' && '🎬 Vidéo'}
                            <span className="ml-2 text-gray-300">#{index + 1}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            type="button"
                            onClick={() => moveSectionUp(index)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title="Déplacer vers le haut"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button 
                            type="button"
                            onClick={() => moveSectionDown(index)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                            title="Déplacer vers le bas"
                            disabled={index === sections.length - 1}
                          >
                            ↓
                          </button>
                          <button 
                            type="button"
                            onClick={() => removeSection(section.id)}
                            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Contenu de la section */}
                      {section.type === 'subtitle' && (
                        <input
                          type="text"
                          value={section.content}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          placeholder="Sous-titre..."
                          className="w-full px-4 py-2 text-xl font-black uppercase bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none transition-colors"
                        />
                      )}

                      {section.type === 'paragraph' && (
                        <textarea
                          value={section.content}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          placeholder="Rédigez votre paragraphe ici..."
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none resize-vertical font-mono text-sm leading-relaxed"
                        />
                      )}

                      {section.type === 'image' && (
                        <div className="space-y-2">
                          <div className="flex gap-3">
                            <label className="cursor-pointer px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-500 transition-all flex items-center gap-2 rounded-lg">
                              <Upload size={14} /> {uploadingSectionImage === section.id ? 'Upload...' : 'Uploader'}
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => handleSectionImageUpload(section.id, e)} 
                                className="hidden" 
                                disabled={uploadingSectionImage === section.id} 
                              />
                            </label>
                            <input
                              type="text"
                              value={section.content}
                              onChange={(e) => updateSection(section.id, e.target.value)}
                              placeholder="Ou URL de l'image..."
                              className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                            />
                          </div>
                          {section.content && (
                            <div className="relative h-32 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                              <img src={section.content} alt="Aperçu" className="w-full h-full object-cover" />
                              <button 
                                type="button" 
                                onClick={() => updateSection(section.id, '')} 
                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {section.type === 'video' && (
                        <input
                          type="text"
                          value={section.content}
                          onChange={(e) => updateSection(section.id, e.target.value)}
                          placeholder="Lien YouTube ou Vimeo..."
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none text-sm"
                        />
                      )}
                    </div>
                  ))
                )}

                {/* Boutons d'ajout */}
                <div className="flex flex-wrap gap-3 pt-4 border-t-2 border-gray-100 dark:border-gray-800">
                  <button 
                    type="button"
                    onClick={() => addSection('paragraph')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all rounded-lg flex items-center gap-2"
                  >
                    <Plus size={14} /> Paragraphe
                  </button>
                  <button 
                    type="button"
                    onClick={() => addSection('subtitle')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all rounded-lg flex items-center gap-2"
                  >
                    <Plus size={14} /> Sous-titre
                  </button>
                  <button 
                    type="button"
                    onClick={() => addSection('image')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all rounded-lg flex items-center gap-2"
                  >
                    <Plus size={14} /> Image
                  </button>
                  <button 
                    type="button"
                    onClick={() => addSection('video')}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-black uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-gray-700 transition-all rounded-lg flex items-center gap-2"
                  >
                    <Plus size={14} /> Vidéo
                  </button>
                </div>
                <p className="text-[9px] text-gray-400 mt-2">
                  Les sections sont affichées dans l'ordre. Vous pouvez les déplacer, les modifier ou les supprimer.
                </p>
              </div>
            </div>

            {/* Publication */}
            <div className="bg-white dark:bg-gray-900 border-2 border-black dark:border-white shadow-xl overflow-hidden">
              <div className="bg-black dark:bg-white px-6 py-3">
                <h2 className="text-white dark:text-black text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Publication</h2>
              </div>
              <div className="p-6">
                <label className="flex items-center gap-3 cursor-pointer mb-4">
                  <input type="checkbox" checked={isScheduled} onChange={(e) => setIsScheduled(e.target.checked)} className="w-4 h-4 text-primary-500 rounded" />
                  <span className="text-[11px] font-black uppercase tracking-widest">Programmer la publication</span>
                </label>
                {isScheduled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t-2 border-gray-100 dark:border-gray-800">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-2">DATE</label>
                      <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-wider text-gray-500 mb-2">HEURE</label>
                      <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-primary-500 focus:outline-none text-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};