import { ENV, API_ENDPOINTS } from '@/constants/env';
import type {
  ApiResponse,
  PaginatedResponse,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  Article,
  ArticleParams,
  UserPreferences,
  Source,
  Category,
  User,
} from '@/types';

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Token management
class TokenManager {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }
}

// Base API client class
class BaseApiClient {
  private baseURL: string;
  private timeout: number;

  constructor() {
    this.baseURL = ENV.API_BASE_URL;
    this.timeout = ENV.API_TIMEOUT;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = TokenManager.getToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different response types
      const contentType = response.headers.get('content-type');
      let data: ApiResponse<T>;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        data = {
          success: response.ok,
          data: text as unknown as T,
          message: response.ok ? 'Success' : 'Request failed',
        };
      }

      if (!response.ok) {
        throw new ApiError(
          data.message || `HTTP ${response.status}`,
          response.status,
          data.errors
        );
      }

      return data.data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
        throw new ApiError(error.message, 0);
      }

      throw new ApiError('Unknown error occurred', 0);
    }
  }

  protected get<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(
          Object.entries(params).reduce(
            (acc, [key, value]) => {
              if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                  value.forEach((item, index) => {
                    acc[`${key}[${index}]`] = String(item);
                  });
                } else {
                  acc[key] = String(value);
                }
              }
              return acc;
            },
            {} as Record<string, string>
          )
        ).toString()}`
      : endpoint;

    return this.request<T>(url, { method: 'GET' });
  }

  protected post<T>(endpoint: string, data?: unknown): Promise<T> {
    const config: RequestInit = {
      method: 'POST',
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, config);
  }

  protected put<T>(endpoint: string, data?: unknown): Promise<T> {
    const config: RequestInit = {
      method: 'PUT',
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    return this.request<T>(endpoint, config);
  }

  protected delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Authentication API
class AuthApi extends BaseApiClient {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials
    );
    TokenManager.setToken(response.token);
    return response;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData
    );
    TokenManager.setToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      TokenManager.clearTokens();
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.get<{ user: User }>(API_ENDPOINTS.AUTH.USER);
    return response.user;
  }

  async refreshToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new ApiError('No refresh token available', 401);
    }

    const response = await this.post<{ token: string }>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken }
    );

    TokenManager.setToken(response.token);
    return response.token;
  }

  async forgotPassword(email: string): Promise<void> {
    await this.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
  }

  async resetPassword(
    token: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<void> {
    await this.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  }
}

// Articles API
class ArticlesApi extends BaseApiClient {
  async getArticles(
    params: ArticleParams = {}
  ): Promise<PaginatedResponse<Article>> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return this.get<PaginatedResponse<Article>>(API_ENDPOINTS.ARTICLES.LIST, {
      ...params,
      saved: params?.saved ? 1 : undefined,
    });
  }

  async searchArticles(
    query: string,
    filters: Record<string, unknown> = {}
  ): Promise<Article[]> {
    return this.get<Article[]>(API_ENDPOINTS.ARTICLES.SEARCH, {
      q: query,
      ...filters,
    });
  }

  async getArticle(id: number): Promise<Article> {
    return this.get<Article>(API_ENDPOINTS.ARTICLES.DETAIL(id));
  }

  async saveArticle(id: number): Promise<void> {
    await this.post(API_ENDPOINTS.ARTICLES.SAVE(id));
  }

  async unsaveArticle(id: number): Promise<void> {
    await this.delete(API_ENDPOINTS.ARTICLES.UNSAVE(id));
  }

  async getSavedArticles(params?: {
    page?: number;
    per_page?: number;
    sort_by?: 'created_at' | 'published_at' | 'title';
    sort_order?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Article>> {
    return this.get<PaginatedResponse<Article>>(
      API_ENDPOINTS.ARTICLES.SAVED,
      params as Record<string, unknown>
    );
  }
}

// Preferences API
class PreferencesApi extends BaseApiClient {
  async getPreferences(): Promise<UserPreferences> {
    return this.get<UserPreferences>(API_ENDPOINTS.PREFERENCES.GET);
  }

  async updatePreferences(
    preferences: Partial<UserPreferences>
  ): Promise<UserPreferences> {
    return this.put<UserPreferences>(
      API_ENDPOINTS.PREFERENCES.UPDATE,
      preferences
    );
  }
}

// Feed API
class FeedApi extends BaseApiClient {
  async getPersonalizedFeed(
    params: ArticleParams = {}
  ): Promise<PaginatedResponse<Article>> {
    return this.get<PaginatedResponse<Article>>(
      API_ENDPOINTS.FEED,
      params as Record<string, unknown>
    );
  }
}

// Sources and Categories API
class MetadataApi extends BaseApiClient {
  async getSources(): Promise<Source[]> {
    return this.get<Source[]>(API_ENDPOINTS.SOURCES);
  }

  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>(API_ENDPOINTS.CATEGORIES);
  }
}

// Main API client
export class ApiClient {
  public auth: AuthApi;
  public articles: ArticlesApi;
  public preferences: PreferencesApi;
  public feed: FeedApi;
  public metadata: MetadataApi;

  constructor() {
    this.auth = new AuthApi();
    this.articles = new ArticlesApi();
    this.preferences = new PreferencesApi();
    this.feed = new FeedApi();
    this.metadata = new MetadataApi();
  }

  // Utility method to check if user is authenticated
  isAuthenticated(): boolean {
    return TokenManager.getToken() !== null;
  }

  // Utility method to get current token
  getToken(): string | null {
    return TokenManager.getToken();
  }

  // Utility method to clear authentication
  clearAuth(): void {
    TokenManager.clearTokens();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export token manager for use in other parts of the app
export { TokenManager };
