export interface User {
  id: number;
  email: string;
  name: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Article {
  id: number;
  title: string;
  content: string | null;
  summary: string | null;
  url: string;
  image_url: string | null;
  published_at: string;
  author: string | null;
  source: Source;
  category: Category;
  created_at: string;
  updated_at: string;
  is_saved?: boolean;
}

export interface Source {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface UserPreferences {
  id?: number;
  user_id?: number;
  preferred_sources: number[];
  preferred_categories: number[];
  preferred_authors: string[];
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: string;
    request_id: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expires_in: number;
}

export interface ArticleParams {
  page?: number;
  per_page?: number;
  source_ids?: number[];
  category_ids?: number[];
  search?: string | undefined;
  sort_by?: string;
  sort_order?: string;
  saved?: boolean;
  author?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface FormState<T = unknown> extends LoadingState {
  data: T;
  isDirty: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}
