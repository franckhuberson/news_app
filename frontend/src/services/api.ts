import axios from 'axios';

// Définis les types localement pour éviter les erreurs d'import
interface Article {
  _id: string;
  title: string;
  originalContent: string;
  summary: string;
  imageUrl?: string;
  source: string;
  sourceUrl: string;
  status: 'pending' | 'published' | 'rejected' | 'modified' | 'scheduled';
  scheduledPublishDate?: string;
  isScheduled?: boolean;
  scrapedAt: string;
  publishedAt?: string;
  modifiedBy?: string;
  metadata: {
    authors?: string[];
    keywords?: string[];
    wordCount?: number;
  };
}

interface ArticlesResponse {
  success: boolean;
  count: number;
  data: Article[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface ArticleResponse {
  success: boolean;
  data: Article;
}

interface StatsResponse {
  success: boolean;
  data: {
    total: number;
    byStatus: {
      pending: number;
      published: number;
      rejected: number;
      modified: number;
      scheduled?: number;
    };
    bySource: Record<string, number>;
    lastScraped: string | null;
    scheduledCount?: number;
  };
}

interface ScheduleResponse {
  success: boolean;
  message: string;
  data: Article;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes
});

// 🔐 Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token envoyé à:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Intercepteur pour gérer les erreurs - CORRIGÉ
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gestion des timeouts - ne pas bloquer
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Timeout - Le serveur met trop de temps à répondre');
      // Retourner une erreur mais ne pas casser l'application
      return Promise.reject(error);
    }
    
    // Gestion des erreurs 401 (non autorisé)
    if (error.response?.status === 401) {
      console.error('🔐 Session expirée - Redirection vers login');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Gestion des erreurs réseau
    if (!error.response) {
      console.error('❌ Erreur réseau - Vérifie que le backend est lancé');
    } else {
      console.error('❌ Erreur API:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Service pour les articles
export const articleService = {
  getArticles: async (status?: string) => {
    const params = status ? { status, limit: 100 } : { limit: 100 };
    console.log('📡 Appel API /articles avec params:', params);
    try {
      const response = await api.get<ArticlesResponse>('/articles', { params });
      console.log('📡 Réponse reçue, articles:', response.data.data?.length);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getArticles:', error);
      return { success: false, count: 0, data: [] };
    }
  },

  getPendingArticles: async () => {
    try {
      const response = await api.get<ArticlesResponse>('/articles/pending');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getPendingArticles:', error);
      return { success: false, count: 0, data: [] };
    }
  },

  getScheduledArticles: async () => {
    try {
      const response = await api.get<ArticlesResponse>('/articles/scheduled');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getScheduledArticles:', error);
      return { success: false, count: 0, data: [] };
    }
  },

  getArticleById: async (id: string) => {
    const response = await api.get<ArticleResponse>(`/articles/${id}`);
    return response.data;
  },

  updateArticle: async (id: string, data: Partial<Article>) => {
    const response = await api.put<ArticleResponse>(`/articles/${id}`, data);
    return response.data;
  },

  changeStatus: async (id: string, status: string) => {
    const response = await api.patch<ArticleResponse>(`/articles/${id}/status`, { status });
    return response.data;
  },

  schedulePublish: async (id: string, publishDate: Date) => {
    const response = await api.post<ScheduleResponse>(`/articles/${id}/schedule`, { 
      publishDate: publishDate.toISOString() 
    });
    return response.data;
  },

  cancelSchedule: async (id: string) => {
    const response = await api.delete<ScheduleResponse>(`/articles/${id}/schedule`);
    return response.data;
  },

  publishNow: async (id: string) => {
    const response = await api.post<ArticleResponse>(`/articles/publish-now/${id}`);
    return response.data;
  },

  deleteArticle: async (id: string) => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  }
};

export const statsService = {
  getStats: async () => {
    try {
      const response = await api.get<StatsResponse>('/articles/stats');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur getStats:', error);
      return { 
        success: false, 
        data: {
          total: 0,
          byStatus: { pending: 0, published: 0, rejected: 0, modified: 0 },
          bySource: {},
          lastScraped: null
        }
      };
    }
  }
};

export const scraperService = {
  runScraper: async () => {
    const response = await api.post('/scrape');
    return response.data;
  }
};

export const uploadService = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Export par défaut pour la compatibilité
export default api;