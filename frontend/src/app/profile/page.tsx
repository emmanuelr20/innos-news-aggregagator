'use client';

import { useAuth } from '@/contexts/AppContext';
import { UserProfileForm } from '@/components/forms/UserProfileForm';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
      <div className="max-w-4xl mx-auto sm:px-6 lg:px-8 ">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Account Settings
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your account information and preferences.
            </p>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Profile Information
                  </h2>
                  <UserProfileForm user={user} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
} 