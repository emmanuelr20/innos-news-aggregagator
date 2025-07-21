'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [passwordReset, setPasswordReset] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');
    if (!tokenParam || !emailParam) {
      router.push('/forgot-password');
      return;
    }
    setToken(tokenParam);
    setEmail(emailParam);
  }, [searchParams, router]);

  const handlePasswordReset = () => {
    setPasswordReset(true);
  };

  if (!token || !email) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        {passwordReset ? (
          <div className="text-center">
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-lg font-medium text-green-800">
                Password Reset Successful
              </h3>
              <p className="mb-4 text-sm text-green-700">
                Your password has been reset successfully.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                Sign In
              </Link>
            </div>
          </div>
        ) : (
          <ResetPasswordForm
            token={token}
            email={email}
            onSuccess={handlePasswordReset}
          />
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
