'use client';

import { WelcomeHeader, TabNavigation, TabContent, type TabType } from '@/components/feed';
import { useAuth } from '@/contexts/AppContext';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('personalized');

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && (tabFromUrl === 'personalized' || tabFromUrl === 'saved' || tabFromUrl === 'all')) {
      setActiveTab(tabFromUrl);
    } else {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'personalized');
      router.replace(`/feed?${params.toString()}`, { scroll: false });
    }
  }, [searchParams, router]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/feed?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <WelcomeHeader userName={user?.name} />
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
          <TabContent activeTab={activeTab} />
        </div>
      </div>
    </div>
  );
} 