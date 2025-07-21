'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

import { apiClient, ApiError } from '@/lib/api-client';
import type {
  User,
  Article,
  ArticleParams,
  PaginatedResponse,
  UserPreferences,
  Source,
  Category,
} from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface ArticlesState {
  currentFeed: Article[];
  searchResults: Article[];
  savedArticles: Article[];
  currentArticle: Article | null;
  pagination: {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
  } | null;
  isLoading: boolean;
  error: string | null;
}

interface PreferencesState {
  preferences: UserPreferences | null;
  sources: Source[];
  categories: Category[];
  isLoading: boolean;
  error: string | null;
}

interface AppState {
  auth: AuthState;
  articles: ArticlesState;
  preferences: PreferencesState;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' };

type ArticlesAction =
  | { type: 'ARTICLES_LOADING' }
  | {
      type: 'ARTICLES_LOAD_SUCCESS';
      payload: { articles: Article[]; pagination?: PaginatedResponse<Article> };
    }
  | { type: 'ARTICLES_SEARCH_SUCCESS'; payload: Article[] }
  | { type: 'ARTICLES_SAVED_SUCCESS'; payload: Article[] }
  | { type: 'ARTICLE_DETAIL_SUCCESS'; payload: Article }
  | { type: 'ARTICLE_SAVE_SUCCESS'; payload: number }
  | { type: 'ARTICLE_UNSAVE_SUCCESS'; payload: number }
  | { type: 'ARTICLES_FAILURE'; payload: string }
  | { type: 'ARTICLES_CLEAR_ERROR' };

type PreferencesAction =
  | { type: 'PREFERENCES_LOADING' }
  | { type: 'PREFERENCES_SUCCESS'; payload: UserPreferences }
  | { type: 'SOURCES_SUCCESS'; payload: Source[] }
  | { type: 'CATEGORIES_SUCCESS'; payload: Category[] }
  | { type: 'PREFERENCES_FAILURE'; payload: string }
  | { type: 'PREFERENCES_CLEAR_ERROR' };

type AppAction = AuthAction | ArticlesAction | PreferencesAction;

const initialState: AppState = {
  auth: {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  },
  articles: {
    currentFeed: [],
    searchResults: [],
    savedArticles: [],
    currentArticle: null,
    pagination: null,
    isLoading: false,
    error: null,
  },
  preferences: {
    preferences: null,
    sources: [],
    categories: [],
    isLoading: false,
    error: null,
  },
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

function articlesReducer(state: ArticlesState, action: ArticlesAction): ArticlesState {
  switch (action.type) {
    case 'ARTICLES_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'ARTICLES_LOAD_SUCCESS':
      return {
        ...state,
        currentFeed: action.payload.articles,
        pagination: action.payload.pagination
          ? {
              currentPage: action.payload.pagination.current_page,
              lastPage: action.payload.pagination.last_page,
              total: action.payload.pagination.total,
              perPage: action.payload.pagination.per_page,
            }
          : null,
        isLoading: false,
        error: null,
      };
    case 'ARTICLES_SEARCH_SUCCESS':
      return {
        ...state,
        searchResults: action.payload,
        isLoading: false,
        error: null,
      };
    case 'ARTICLES_SAVED_SUCCESS':
      return {
        ...state,
        savedArticles: action.payload,
        isLoading: false,
        error: null,
      };
    case 'ARTICLE_DETAIL_SUCCESS':
      return {
        ...state,
        currentArticle: action.payload,
        isLoading: false,
        error: null,
      };
    case 'ARTICLE_SAVE_SUCCESS':
      return {
        ...state,
        currentFeed: state.currentFeed.map(article =>
          article.id === action.payload
            ? { ...article, is_saved: true }
            : article,
        ),
        searchResults: state.searchResults.map(article =>
          article.id === action.payload
            ? { ...article, is_saved: true }
            : article,
        ),
        currentArticle: state.currentArticle?.id === action.payload
          ? { ...state.currentArticle, is_saved: true }
          : state.currentArticle,
        isLoading: false,
        error: null,
      };
    case 'ARTICLE_UNSAVE_SUCCESS':
      return {
        ...state,
        currentFeed: state.currentFeed.map(article =>
          article.id === action.payload
            ? { ...article, is_saved: false }
            : article,
        ),
        searchResults: state.searchResults.map(article =>
          article.id === action.payload
            ? { ...article, is_saved: false }
            : article,
        ),
        savedArticles: state.savedArticles.filter(
          article => article.id !== action.payload,
        ),
        currentArticle: state.currentArticle?.id === action.payload
          ? { ...state.currentArticle, is_saved: false }
          : state.currentArticle,
        isLoading: false,
        error: null,
      };
    case 'ARTICLES_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'ARTICLES_CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

function preferencesReducer(
  state: PreferencesState,
  action: PreferencesAction,
): PreferencesState {
  switch (action.type) {
    case 'PREFERENCES_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'PREFERENCES_SUCCESS':
      return {
        ...state,
        preferences: action.payload,
        isLoading: false,
        error: null,
      };
    case 'SOURCES_SUCCESS':
      return { ...state, sources: action.payload, isLoading: false, error: null };
    case 'CATEGORIES_SUCCESS':
      return { ...state, categories: action.payload, isLoading: false, error: null };
    case 'PREFERENCES_FAILURE':
      return { ...state, isLoading: false, error: action.payload };
    case 'PREFERENCES_CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

function appReducer(state: AppState, action: AppAction): AppState {
  return {
    auth: authReducer(state.auth, action as AuthAction),
    articles: articlesReducer(state.articles, action as ArticlesAction),
    preferences: preferencesReducer(state.preferences, action as PreferencesAction),
  };
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<void>;
    logout: () => Promise<void>;
    clearAuthError: () => void;

    loadArticles: (params?: { page?: number; source?: number; category?: number }) => Promise<void>;
    searchArticles: (params: ArticleParams) => Promise<void>;
    loadSavedArticles: (params?: { page?: number; source?: number; category?: number }) => Promise<void>;
    loadArticleDetail: (id: number) => Promise<void>;
    saveArticle: (id: number) => Promise<void>;
    unsaveArticle: (id: number) => Promise<void>;
    clearArticlesError: () => void;

    loadPreferences: () => Promise<void>;
    updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
    loadSources: () => Promise<void>;
    loadCategories: () => Promise<void>;
    clearPreferencesError: () => void;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = apiClient.getToken();
      if (!token) {
        dispatch({ type: 'AUTH_FAILURE', payload: '' });
        return;
      }

      dispatch({ type: 'AUTH_START' });
      
      try {
        const user = await apiClient.auth.getCurrentUser();
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token },
        });
      } catch (error) {
        console.warn('Token validation failed:', error);
        apiClient.clearAuth();
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;

    if (state.auth.isAuthenticated && state.auth.token) {
      refreshInterval = setInterval(async () => {
        try {
          await apiClient.auth.refreshToken();
        } catch (error) {
          console.warn('Token refresh failed:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }, 50 * 60 * 1000);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [state.auth.isAuthenticated, state.auth.token]);

  const actions = {
    login: async (email: string, password: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const response = await apiClient.auth.login({ email, password });
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.token },
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Login failed';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        throw error;
      }
    },

    register: async (name: string, email: string, password: string, passwordConfirmation: string) => {
      dispatch({ type: 'AUTH_START' });
      try {
        const response = await apiClient.auth.register({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: response.user, token: response.token },
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Registration failed';
        dispatch({ type: 'AUTH_FAILURE', payload: message });
        throw error;
      }
    },

    logout: async () => {
      try {
        await apiClient.auth.logout();
      } catch (error) {
        console.warn('Logout API call failed:', error);
      } finally {
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    },

    clearAuthError: () => {
      dispatch({ type: 'AUTH_CLEAR_ERROR' });
    },

    loadArticles: async (params = {}) => {
      dispatch({ type: 'ARTICLES_LOADING' });
      try {
        const response = await apiClient.articles.getArticles(params);
        dispatch({
          type: 'ARTICLES_LOAD_SUCCESS',
          payload: { articles: response.items, pagination: response },
        });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load articles';
        dispatch({ type: 'ARTICLES_FAILURE', payload: message });
        throw error;
      }
    },

    searchArticles: async (params: ArticleParams) => {
      dispatch({ type: 'ARTICLES_LOADING' });
      try {
        const response = await apiClient.articles.getArticles(params);
        dispatch({ type: 'ARTICLES_SEARCH_SUCCESS', payload: response.items });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to search articles';
        dispatch({ type: 'ARTICLES_FAILURE', payload: message });
        throw error;
      }
    },

    loadSavedArticles: async (params: ArticleParams = {}) => {
      dispatch({ type: 'ARTICLES_LOADING' });
      try {
        const response = await apiClient.articles.getArticles({ ...params, saved: true });
        dispatch({ type: 'ARTICLES_SAVED_SUCCESS', payload: response.items });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load saved articles';
        dispatch({ type: 'ARTICLES_FAILURE', payload: message });
        throw error;
      }
    },

    loadArticleDetail: async (id: number) => {
      dispatch({ type: 'ARTICLES_LOADING' });
      try {
        const article = await apiClient.articles.getArticle(id);
        dispatch({ type: 'ARTICLE_DETAIL_SUCCESS', payload: article });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load article';
        dispatch({ type: 'ARTICLES_FAILURE', payload: message });
        throw error;
      }
    },

    saveArticle: async (id: number) => {
      try {
        await apiClient.articles.saveArticle(id);
        dispatch({ type: 'ARTICLE_SAVE_SUCCESS', payload: id });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to save article';
        dispatch({ type: 'ARTICLES_FAILURE', payload: message });
        throw error;
      }
    },

    unsaveArticle: async (id: number) => {
      try {
        await apiClient.articles.unsaveArticle(id);
        dispatch({ type: 'ARTICLE_UNSAVE_SUCCESS', payload: id });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to unsave article';
        dispatch({ type: 'ARTICLES_FAILURE', payload: message });
        throw error;
      }
    },

    clearArticlesError: () => {
      dispatch({ type: 'ARTICLES_CLEAR_ERROR' });
    },

    loadPreferences: async () => {
      dispatch({ type: 'PREFERENCES_LOADING' });
      try {
        const preferences = await apiClient.preferences.getPreferences();
        dispatch({ type: 'PREFERENCES_SUCCESS', payload: preferences });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load preferences';
        dispatch({ type: 'PREFERENCES_FAILURE', payload: message });
        throw error;
      }
    },

    updatePreferences: async (preferences: Partial<UserPreferences>) => {
      dispatch({ type: 'PREFERENCES_LOADING' });
      try {
        const updated = await apiClient.preferences.updatePreferences(preferences);
        dispatch({ type: 'PREFERENCES_SUCCESS', payload: updated });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to update preferences';
        dispatch({ type: 'PREFERENCES_FAILURE', payload: message });
        throw error;
      }
    },

    loadSources: async () => {
      dispatch({ type: 'PREFERENCES_LOADING' });
      try {
        const sources = await apiClient.metadata.getSources();
        dispatch({ type: 'SOURCES_SUCCESS', payload: sources });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load sources';
        dispatch({ type: 'PREFERENCES_FAILURE', payload: message });
        throw error;
      }
    },

    loadCategories: async () => {
      dispatch({ type: 'PREFERENCES_LOADING' });
      try {
        const categories = await apiClient.metadata.getCategories();
        dispatch({ type: 'CATEGORIES_SUCCESS', payload: categories });
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load categories';
        dispatch({ type: 'PREFERENCES_FAILURE', payload: message });
        throw error;
      }
    },

    clearPreferencesError: () => {
      dispatch({ type: 'PREFERENCES_CLEAR_ERROR' });
    },
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useAuth() {
  const { state, actions } = useApp();
  return {
    ...state.auth,
    login: actions.login,
    register: actions.register,
    logout: actions.logout,
    clearError: actions.clearAuthError,
  };
}

export function usePreferences() {
  const { state, actions } = useApp();
  return {
    ...state.preferences,
    loadPreferences: actions.loadPreferences,
    updatePreferences: actions.updatePreferences,
    loadSources: actions.loadSources,
    loadCategories: actions.loadCategories,
    clearError: actions.clearPreferencesError,
  };
}