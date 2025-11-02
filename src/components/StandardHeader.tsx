import React from 'react';
import { useNavigate } from 'react-router-dom';

interface StandardHeaderProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export function StandardHeader({ onSignInClick, onSignUpClick }: StandardHeaderProps) {
  const navigate = useNavigate();

  const navigationItems = [
    { name: 'Features', path: '/features' },
    { name: 'How it Works', path: '/how-it-works' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'About', path: '/about' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                WM
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                Writing Mate
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                className="text-gray-600 hover:text-purple-700 font-medium transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <button
              onClick={onSignInClick}
              className="px-4 py-2 rounded-lg font-medium text-purple-700 border border-purple-200 hover:bg-purple-50 transition-all"
            >
              Sign In
            </button>
            <button
              onClick={onSignUpClick}
              className="px-4 py-2 rounded-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-700 hover:shadow-lg transition-all"
            >
              Start Free Trial
            </button>
          </div>

          {/* Mobile Menu Button - Placeholder for now */}
          <div className="md:hidden">
            {/* Mobile menu implementation can be added here if needed */}
          </div>
        </div>
      </div>
    </header>
  );
}
