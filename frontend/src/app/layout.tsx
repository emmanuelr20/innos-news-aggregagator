import type { Metadata } from 'next';

import { ENV } from '@/constants/env';
import { AppProvider } from '@/contexts/AppContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

import './globals.css';

export const metadata: Metadata = {
  title: ENV.APP_NAME,
  description: 'Stay informed with personalized news from multiple sources',
  keywords: ['news', 'aggregator', 'articles', 'personalized', 'current events'],
  authors: [{ name: 'News Aggregator Team' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background antialiased">
        <ErrorBoundary>
          <AppProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AppProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
