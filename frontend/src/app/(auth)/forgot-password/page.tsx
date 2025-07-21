'use client';

import { useState } from 'react';
import Link from 'next/link';

import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailSent = () => {
    setEmailSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {emailSent ? 'Check your email' : 'Reset your password'}
          </h2>
          {emailSent ? (
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a password reset link to your email address.
            </p>
          ) : (
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          )}
        </div>

        {emailSent ? (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <p className="text-green-800">
                Password reset email sent successfully!
              </p>
            </div>
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <ForgotPasswordForm onSuccess={handleEmailSent} />
            
            <div className="text-center">
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}