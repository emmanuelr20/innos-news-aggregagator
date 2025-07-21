'use client';

import { Navigation } from '@/components/layout/Navigation';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Navigation />
      {children}
    </ProtectedRoute>
  );
} 