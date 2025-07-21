import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ApiClient, ApiError, TokenManager } from '../api-client';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('ApiClient', () => {
  let apiClient: ApiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('TokenManager', () => {
    it('should store and retrieve tokens', () => {
      const token = 'test-token';
      const refreshToken = 'refresh-token';

      mockLocalStorage.getItem.mockReturnValue(null);
      expect(TokenManager.getToken()).toBeNull();

      TokenManager.setToken(token);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', token);

      TokenManager.setRefreshToken(refreshToken);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('refresh_token', refreshToken);

      TokenManager.clearTokens();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: 1, email: 'test@example.com', name: 'Test User' },
          token: 'jwt-token',
          expires_in: 3600,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.auth.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password',
          }),
        }),
      );

      expect(result).toEqual(mockResponse.data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', 'jwt-token');
    });

    it('should handle login failure', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid credentials',
        errors: { email: ['Invalid email or password'] },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockErrorResponse),
      });

      await expect(
        apiClient.auth.login({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(ApiError);
    });

    it('should logout successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve({ success: true, data: null }),
      });

      await apiClient.auth.logout();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('Articles', () => {
    it('should fetch articles with pagination', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [
            {
              id: 1,
              title: 'Test Article',
              content: 'Test content',
              url: 'https://example.com/article',
              published_at: '2023-01-01T00:00:00Z',
            },
          ],
          current_page: 1,
          last_page: 5,
          per_page: 10,
          total: 50,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.articles.getArticles({ page: 1, per_page: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/articles?page=1&per_page=10',
        expect.objectContaining({
          method: 'GET',
        }),
      );

      expect(result).toEqual(mockResponse.data);
    });

    it('should search articles', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            title: 'Search Result',
            content: 'Matching content',
            url: 'https://example.com/search-result',
            published_at: '2023-01-01T00:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'application/json' },
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiClient.articles.searchArticles('test query', {
        sources: [1, 2],
        categories: [3],
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/articles/search?q=test%20query&sources=1%2C2&categories=3',
        expect.objectContaining({
          method: 'GET',
        }),
      );

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.articles.getArticles()).rejects.toThrow(ApiError);
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            setTimeout(() => resolve({ ok: true }), 15000); // Longer than timeout
          }),
      );

      await expect(apiClient.articles.getArticles()).rejects.toThrow(ApiError);
    });

    it('should handle non-JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => 'text/html' },
        text: () => Promise.resolve('<html>Success</html>'),
      });

      const result = await apiClient.articles.getArticles();
      expect(result).toBe('<html>Success</html>');
    });
  });

  describe('Authentication State', () => {
    it('should check authentication status', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(apiClient.isAuthenticated()).toBe(false);

      mockLocalStorage.getItem.mockReturnValue('token');
      expect(apiClient.isAuthenticated()).toBe(true);
    });

    it('should get current token', () => {
      const token = 'test-token';
      mockLocalStorage.getItem.mockReturnValue(token);
      expect(apiClient.getToken()).toBe(token);
    });

    it('should clear authentication', () => {
      apiClient.clearAuth();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('refresh_token');
    });
  });
});