// frontend/src/types/index.ts

export interface Section {
  id: string;
  type: 'subtitle' | 'paragraph' | 'image' | 'video';
  content: string;
}

export interface Article {
  sections?: Section[];
  _id: string;
  title: string;
  originalContent?: string;
  summary: string;
  imageUrl?: string;
  source: string;
  sourceUrl?: string;
  status: 'pending' | 'published' | 'rejected' | 'modified' | 'scheduled';
  scheduledPublishDate?: string;
  isScheduled?: boolean;
  scrapedAt: string;
  publishedAt?: string;
  modifiedBy?: string;
  categorie?: string;
  facebookPostId?: string;
  sharedOnFacebook?: boolean;
  facebookShareDate?: string;
  lastWhatsAppShare?: string;
  modifications?: Array<{
    field: string;
    oldValue: string;
    newValue: string;
    modifiedAt: string;
  }>;
  metadata?: {
    authors?: string[];
    keywords?: string[];
    wordCount?: number;
    publishDate?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Stats {
  total: number;
  byStatus: {
    pending: number;
    published: number;
    rejected: number;
    modified: number;
    scheduled?: number;  // ✅ Ajout
  };
  bySource: Record<string, number>;
  lastScraped: string | null;
  scheduledCount?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
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