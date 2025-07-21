'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AppContext';
import { useState } from 'react';
import { HiMenu, HiX, HiNewspaper, HiUser, HiLogout, HiLogin, HiUserAdd } from 'react-icons/hi';

export function Navigation() {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false); // Close mobile menu after logout
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                href="/" 
                className="text-xl font-bold text-primary hover:text-primary/90 transition-colors duration-200"
                onClick={closeMobileMenu}
              >
                📰 News Aggregator
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/feed"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                  >
                    <HiNewspaper className="w-4 h-4 mr-2" />
                    Feed
                  </Link>
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                  >
                    <HiUser className="w-4 h-4 mr-2" />
                    Profile <span className="text-primary text-sm ml-1">({user?.name?.split(' ')[0]})</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                  >
                    <HiLogout className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center"
                  >
                    <HiLogin className="w-4 h-4 mr-2" />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center"
                  >
                    <HiUserAdd className="w-4 h-4 mr-2" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-blue-600 focus:outline-none focus:text-blue-600 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <HiX className="w-6 h-6 transform transition-transform duration-200" />
                ) : (
                  <HiMenu className="w-6 h-6 transform transition-transform duration-200" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`md:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
            <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 rounded-lg mt-2 mb-4 shadow-inner">
              {isAuthenticated ? (
                <>
                  <div className="px-3 py-2 text-sm font-medium text-gray-900 border-b border-gray-200 mb-2">
                    Welcome, <span className="text-blue-600">{user?.name || 'User'}</span>
                  </div>
                  <Link
                    href="/feed"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <HiNewspaper className="w-5 h-5 mr-3" />
                    Feed
                  </Link>
                  <Link
                    href="/profile"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <HiUser className="w-5 h-5 mr-3" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left text-gray-700 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center"
                  >
                    <HiLogout className="w-5 h-5 mr-3" />
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center"
                    onClick={closeMobileMenu}
                  >
                    <HiLogin className="w-5 h-5 mr-3" />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-base font-medium text-center transition-colors duration-200 flex items-center justify-center"
                    onClick={closeMobileMenu}
                  >
                    <HiUserAdd className="w-5 h-5 mr-2" />
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <div className="h-20 bg-gray-50"></div>
    </>
  );
}