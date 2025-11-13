import React, { useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { useLearning } from '../contexts/LearningContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import { LogOut, Menu, X, ChevronDown, Home, Sparkles, Users, HelpCircle, BookOpen, Star, Brain, Target, Lock, Crown } from 'lucide-react';

interface NavBarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  user: User | null;
  onSignInClick: () => void;
  onSignUpClick: () => void;
  onForceSignOut: () => void;
}

export function NavBar({
  activePage,
  onNavigate,
  user,
  onSignInClick,
  onSignUpClick,
  onForceSignOut
}: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLearningMenuOpen, setIsLearningMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { progress } = useLearning();
  const { isPro } = useSubscription();
  // Dark mode removed

  // Use ref to prevent multiple simultaneous sign out attempts
  const isSigningOut = useRef(false);

  const navigationItems = [
    { id: 'home', name: 'Home', href: '/', icon: Home },
    { id: 'features', name: 'Features', href: '/features', icon: Sparkles },
    { id: 'about', name: 'About', href: '/about', icon: Users },
    { id: 'faq', name: 'FAQ', href: '/faq', icon: HelpCircle }
  ];

  const learningItems = [
    { id: 'learning', name: 'Learning Journey', description: 'Your learning progress', icon: BookOpen },
    { id: 'progress-dashboard', name: 'Progress Dashboard', description: 'Track your achievements', icon: Star },
    { id: 'quiz-demo', name: 'Practice Quiz', description: 'Test your knowledge', icon: Brain }
  ];

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent multiple simultaneous sign out attempts
    if (isSigningOut.current) {
      console.log('Sign out already in progress, ignoring click...');
      return;
    }

    try {
      isSigningOut.current = true;
      console.log('NavBar: Sign out clicked');

      // Close all menus immediately
      setIsUserMenuOpen(false);
      setIsMenuOpen(false);
      setIsLearningMenuOpen(false);

      // Call the sign out function
      await onForceSignOut();

    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      // Reset the flag after a delay to prevent rapid clicks
      setTimeout(() => {
        isSigningOut.current = false;
      }, 2000);
    }
  };

  // Helper function to get navigation item classes with consistent styling
  const getNavItemClasses = (itemId: string, isActive: boolean) => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm";

    if (isActive) {
      return `${baseClasses} bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg transform scale-105`;
    }

    return `${baseClasses} text-gray-700 hover:text-purple-700 hover:bg-purple-50 hover:shadow-md hover:transform hover:scale-102 border border-transparent hover:border-purple-200`;
  };

  // Helper function to get button classes with consistent styling
  const getButtonClasses = (variant: 'primary' | 'secondary' = 'primary') => {
    const baseClasses = "px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center space-x-2 text-sm";

    if (variant === 'primary') {
      return `${baseClasses} bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg hover:shadow-xl hover:transform hover:scale-105`;
    }

    return `${baseClasses} bg-white text-purple-700 border border-purple-200 hover:bg-purple-50 hover:shadow-md hover:transform hover:scale-102`;
  };

  // Helper function for user avatar
  const getUserAvatar = () => {
    if (!user?.email) return null;

    const initial = user.email.charAt(0).toUpperCase();
    return (
      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-700 rounded-full flex items-center justify-center text-white font-medium text-sm">
        {initial}
      </div>
    );
  };

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                WM
              </div>
              <span>Writing Mate</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={getNavItemClasses(item.id, isActive)}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              );
            })}

            {/* Learning Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsLearningMenuOpen(!isLearningMenuOpen)}
                  className={getNavItemClasses('learning', activePage.includes('learning') || activePage.includes('progress') || activePage.includes('quiz'))}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Learning</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {isLearningMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    {learningItems.map((item) => {
                      const Icon = item.icon;
                      const isLearningJourney = item.id === 'learning';
                      const isLocked = isLearningJourney && !isPro;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (isLocked) {
                              setShowUpgradeModal(true);
                              setIsLearningMenuOpen(false);
                            } else {
                              onNavigate(item.id);
                              setIsLearningMenuOpen(false);
                            }
                          }}
                          className={`w-full px-4 py-3 text-left flex items-start space-x-3 transition-colors duration-200 relative ${
                            isLocked ? 'opacity-60 hover:bg-amber-50' : 'hover:bg-indigo-50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mt-0.5 ${
                            isLocked ? 'text-amber-600' : 'text-indigo-600'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              {isLocked && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
                                  <Crown className="w-3 h-3" />
                                  PRO
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                          {isLocked && (
                            <Lock className="w-4 h-4 text-amber-600 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Button - Moved to top navigation */}
            {user && (
              <button
                onClick={() => onNavigate('dashboard')}
                className={getNavItemClasses('dashboard', activePage === 'dashboard')}
              >
                <Target className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
            )}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-indigo-50 transition-colors duration-200"
                >
                  {getUserAvatar()}
                  <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                    {user.email}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700">Settings</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Sign In button clicked');
                    onSignInClick();
                  }}
                  className={getButtonClasses('secondary')}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation(); // This is the critical fix
                    console.log('Start Free Trial button clicked');
                    onSignUpClick();
                  }}
                  className={getButtonClasses('primary')}
                  type="button"
                >
                  Start Free Trial
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
            <div className="space-y-2">

              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getNavItemClasses(item.id, isActive)} justify-start`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </button>
                );
              })}

              {user && (
                <>
                  {/* Dashboard Button - Also moved to mobile navigation */}
                  <button
                    onClick={() => {
                      onNavigate('dashboard');
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getNavItemClasses('dashboard', activePage === 'dashboard')} justify-start`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">
                      Learning
                    </div>
                    {learningItems.map((item) => {
                      const Icon = item.icon;
                      const isLearningJourney = item.id === 'learning';
                      const isLocked = isLearningJourney && !isPro;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (isLocked) {
                              setShowUpgradeModal(true);
                              setIsMenuOpen(false);
                            } else {
                              onNavigate(item.id);
                              setIsMenuOpen(false);
                            }
                          }}
                          className={`w-full px-4 py-3 text-left flex items-start space-x-3 transition-colors duration-200 relative ${
                            isLocked ? 'opacity-60 hover:bg-amber-50' : 'hover:bg-indigo-50'
                          }`}
                        >
                          <Icon className={`w-5 h-5 mt-0.5 ${
                            isLocked ? 'text-amber-600' : 'text-indigo-600'
                          }`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{item.name}</span>
                              {isLocked && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold">
                                  <Crown className="w-3 h-3" />
                                  PRO
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{item.description}</div>
                          </div>
                          {isLocked && (
                            <Lock className="w-4 h-4 text-amber-600 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-indigo-50 flex items-center space-x-2 transition-colors duration-200"
                    >
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span className="text-gray-700">Settings</span>
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-2 transition-colors duration-200 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}

              {!user && (
                <div className="pt-2 border-t border-gray-200 space-y-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Mobile Sign In button clicked');
                      onSignInClick();
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getButtonClasses('secondary')} justify-center`}
                    type="button"
                  >
                    Sign In
                  </button>
       <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // This is the critical fix
                      console.log('Mobile Start Free Trial button clicked');
                      onSignUpClick();
                      setIsMenuOpen(false);
                    }}
                    className={`w-full ${getButtonClasses('primary')} justify-center`}
                    type="button"
                  >
                    Start Free Trial
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Upgrade to Pro
              </h2>
              <p className="text-gray-600 mb-6">
                Learning Mode is a premium feature available to Pro members
              </p>

              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  What you'll get:
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Structured learning paths with 50+ lessons</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Interactive quizzes and practice exercises</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Progress tracking and achievement badges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Personalized learning recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>Unlimited AI coaching and feedback</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    onNavigate('pricing');
                  }}
                  className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  View Pro Plans
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

