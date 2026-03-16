import axios from 'axios';
import authService from './auth'; 

// Définis les types localement pour éviter les erreurs d'import
interface Article {
  _id: string;
  title: string;
  originalContent: string;
  summary: string;
  imageUrl?: string;
  source: string;
  sourceUrl: string;
  status: 'pending' | 'published' | 'rejected' | 'modified';
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
    };
    bySource: Record<string, number>;
    lastScraped: string | null;
  };
}

const API_URL = 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// 🔐 Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 Token ajouté à la requête');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs et les 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔐 Gestion spécifique des erreurs 401 (non autorisé)
    if (error.response?.status === 401) {
      console.error('🔐 Session expirée - Redirection vers login');
      authService.logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Gestion des autres erreurs
    if (error.code === 'ECONNABORTED') {
      console.error('❌ Timeout - Le serveur ne répond pas');
    } else if (!error.response) {
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
    const params = status ? { status } : {};
    const response = await api.get<ArticlesResponse>('/articles', { params });
    return response.data;
  },

  getPendingArticles: async () => {
    const response = await api.get<ArticlesResponse>('/articles/pending');
    return response.data;
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

  deleteArticle: async (id: string) => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  }
};

export const statsService = {
  getStats: async () => {
    const response = await api.get<StatsResponse>('/articles/stats');
    return response.data;
  }
};

export const scraperService = {
  runScraper: async () => {
    const response = await api.post('/scrape');
    return response.data;
  }
};