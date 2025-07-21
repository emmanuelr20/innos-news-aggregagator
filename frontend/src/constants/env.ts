export const ENV = {
  API_BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api',
  API_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'News Aggregator',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING:
    process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === 'true',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    USER: '/auth/user',
  },
  ARTICLES: {
    LIST: '/articles',
    SEARCH: '/articles/search',
    DETAIL: (id: number) => `/articles/${id}`,
    SAVE: (id: number) => `/articles/${id}/save`,
    UNSAVE: (id: number) => `/articles/saved/${id}`,
    SAVED: '/articles/saved',
  },
  PREFERENCES: {
    GET: '/preferences',
    UPDATE: '/preferences',
  },
  FEED: '/feed',
  SOURCES: '/sources',
  CATEGORIES: '/categories',
} as const;
