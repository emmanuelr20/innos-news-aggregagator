'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiClient } from '@/lib/api-client';
import { Source, Category, UserPreferences } from '@/types';
import { useAuth } from '@/contexts/AppContext';
import { HiExclamationCircle, HiCheckCircle } from 'react-icons/hi';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (preferences: UserPreferences) => void;
}

export function PreferencesModal({ isOpen, onClose, onSave }: PreferencesModalProps) {
  const { user } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [customTopics, setCustomTopics] = useState<string>('');

  const loadData = useCallback(async () => {
    if (!isOpen) return;
    
    try {
      setIsLoading(true);
      setError(null);

      const [sourcesData, categoriesData, preferencesData] = await Promise.all([
        apiClient.metadata.getSources(),
        apiClient.metadata.getCategories(),
        apiClient.preferences.getPreferences().catch(() => null),
      ]);

      setSources(sourcesData);
      setCategories(categoriesData);
      setPreferences(preferencesData);
      
      if (preferencesData?.preferred_authors) {
        setCustomTopics(preferencesData.preferred_authors.join(', '));
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSourceToggle = (sourceId: number) => {
    if (!preferences) return;
    
    const currentSources = preferences.preferred_sources || [];
    const newSources = currentSources.includes(sourceId)
      ? currentSources.filter(id => id !== sourceId)
      : [...currentSources, sourceId];
    
    setPreferences({
      ...preferences,
      preferred_sources: newSources,
    });
  };

  const handleCategoryToggle = (categoryId: number) => {
    if (!preferences) return;
    
    const currentCategories = preferences.preferred_categories || [];
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId];
    
    setPreferences({
      ...preferences,
      preferred_categories: newCategories,
    });
  };

  const handleTopicsChange = (topics: string) => {
    setCustomTopics(topics);
    if (preferences) {
      const topicsArray = topics
        .split(',')
        .map(topic => topic.trim())
        .filter(topic => topic.length > 0);
      
      setPreferences({
        ...preferences,
        preferred_authors: topicsArray,
      });
    }
  };

  const handleSave = async () => {
    if (!preferences || !user) return;

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const updatedPreferences = await apiClient.preferences.updatePreferences(preferences);
      setPreferences(updatedPreferences);
      setSuccessMessage('Preferences saved successfully!');
      
      if (onSave) {
        onSave(updatedPreferences);
      }
      
      // Close modal after successful save
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1000);
    } catch (err) {
      console.error('Error saving preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const selectAllSources = () => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      preferred_sources: sources.map(source => source.id),
    });
  };

  const selectAllCategories = () => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      preferred_categories: categories.map(category => category.id),
    });
  };

  const clearAllSources = () => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      preferred_sources: [],
    });
  };

  const clearAllCategories = () => {
    if (!preferences) return;
    setPreferences({
      ...preferences,
      preferred_categories: [],
    });
  };

  const resetToDefaults = () => {
    if (!user) return;
    
    setPreferences({
      id: preferences?.id || 0,
      user_id: user.id,
      preferred_sources: [],
      preferred_categories: [],
      preferred_authors: [],
      created_at: preferences?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setCustomTopics('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-4 py-6 sm:px-6 border-b">
          <DialogTitle className="text-lg sm:text-xl">News Preferences</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-4 sm:px-6 py-4 space-y-4 sm:space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
                <div className="flex">
                  <HiExclamationCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 sm:p-4">
                <div className="flex">
                  <HiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div className="ml-2 sm:ml-3">
                    <p className="text-xs sm:text-sm text-green-800">{successMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <Tabs defaultValue="sources" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 bg-primary/20 gap-1 sm:gap-2 h-auto p-1">
                <TabsTrigger className="cursor-pointer text-xs sm:text-sm py-2 sm:py-2.5" value="sources">
                  Sources
                </TabsTrigger>
                <TabsTrigger className="cursor-pointer text-xs sm:text-sm py-2 sm:py-2.5" value="categories">
                  Categories
                </TabsTrigger>
                <TabsTrigger className="cursor-pointer text-xs sm:text-sm py-2 sm:py-2.5" value="authors">
                  Authors
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sources" className="space-y-3 sm:space-y-4 mt-4">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Preferred Sources</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Choose the news sources you want to see in your personalized feed.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllSources} className="text-xs sm:text-sm">
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllSources} className="text-xs sm:text-sm">
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {sources.map((source) => (
                    <div key={source.id} className="flex items-center space-x-2 p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id={`source-${source.id}`}
                        checked={preferences?.preferred_sources?.includes(source.id) || false}
                        onCheckedChange={() => handleSourceToggle(source.id)}
                        className="flex-shrink-0"
                      />
                      <label htmlFor={`source-${source.id}`} className="text-xs sm:text-sm text-gray-900 cursor-pointer leading-tight">
                        {source.name}
                      </label>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="categories" className="space-y-3 sm:space-y-4 mt-4">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Preferred Categories</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">Select the categories of news you're most interested in.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <Button variant="outline" size="sm" onClick={selectAllCategories} className="text-xs sm:text-sm">
                      Select All
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearAllCategories} className="text-xs sm:text-sm">
                      Clear All
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-start space-x-2 p-2 sm:p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={preferences?.preferred_categories?.includes(category.id) || false}
                        onCheckedChange={() => handleCategoryToggle(category.id)}
                        className="flex-shrink-0 mt-0.5"
                      />
                      <div className="cursor-pointer flex-1 min-w-0" onClick={() => handleCategoryToggle(category.id)}>
                        <label htmlFor={`category-${category.id}`} className="text-xs sm:text-sm text-gray-900 cursor-pointer font-medium leading-tight block">
                          {category.name}
                        </label>
                        {category.description && (
                          <p className="text-xs text-gray-500 mt-0.5 leading-tight">{category.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="authors" className="space-y-3 sm:space-y-4 mt-4">
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Custom Authors</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 mt-1">
                    Add specific authors you're interested in. Separate multiple authors with commas.
                  </p>
                  <Textarea
                    value={customTopics}
                    onChange={(e) => handleTopicsChange(e.target.value)}
                    placeholder="e.g., Elon Musk, Satoshi Nakamoto, Jane Doe"
                    rows={3}
                    className="w-full text-sm resize-none"
                  />
                  {preferences?.preferred_authors && preferences.preferred_authors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">Current authors:</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {preferences.preferred_authors.map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 sm:px-2.5 sm:py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 break-words"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t bg-white px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="text-xs sm:text-sm order-2 sm:order-1"
              size="sm"
            >
              Reset to Defaults
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="text-xs sm:text-sm"
                size="sm"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="text-xs sm:text-sm"
                size="sm"
              >
                {isSaving ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 