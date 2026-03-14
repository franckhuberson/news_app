// src/types/index.ts

export interface Article {
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

export interface ArticlesResponse {
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

export interface ArticleResponse {
  success: boolean;
  data: Article;
}

export interface StatsResponse {
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

export interface ApiError {
  success: false;
  message: string;
  error?: string;
}