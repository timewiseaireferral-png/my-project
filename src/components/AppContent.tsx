// src/components/AppContent.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import './layout-fix.css';

// Add this import at the top with other imports
import { EnhancedWritingLayoutNSW } from './EnhancedWritingLayoutNSW';
import { LearningPage } from './LearningPage';
import { EnhancedLearningHub } from './EnhancedLearningHub';
import { LessonDetail } from './LessonDetail';
import { LessonCard } from './LessonCard';

import { NavBar } from './NavBar';
import { StandardHeader } from './StandardHeader'; // <-- NEW IMPORT
import { HomePage } from './HomePage';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { ToolsSection } from './ToolsSection';
import { WritingTypesSection } from './WritingTypesSection';
import { StudentSuccessSection } from './StudentSuccessSection';
import { HowItWorksSection } from './HowItWorksSection';
import { EnhancedSuccessSection } from './EnhancedSuccessSection';
import { Footer } from './Footer';
import { PaymentSuccessPage } from './PaymentSuccessPage';
import { PricingPage } from './PricingPage';
import { PricingPageNew } from './PricingPageNew';
import { Dashboard } from './Dashboard';
import { AuthModal } from './AuthModal';
import { FAQPage } from './FAQPage';
import { AboutPage } from './AboutPage';
import { SettingsPage } from './SettingsPage';
import { ErrorBoundary } from './ErrorBoundary';
// Writing components
import { SplitScreen } from './SplitScreen';
import { TabbedCoachPanel } from './TabbedCoachPanel';
import { ExamSimulationMode } from './ExamSimulationMode';
import { SupportiveFeatures } from './SupportiveFeatures';
import { HelpCenter } from './HelpCenter';
import { EssayFeedbackPage } from './EssayFeedbackPage';
import { EnhancedHeader } from './EnhancedHeader';
import { SpecializedCoaching } from './text-type-templates/SpecializedCoaching';
import { BrainstormingTools } from './BrainstormingTools';
import { WritingAccessCheck } from './WritingAccessCheck';
import { WritingToolbar } from './WritingToolbar';
import { PlanningToolModal } from './PlanningToolModal';
import { EmailVerificationHandler } from './EmailVerificationHandler';
import { EvaluationPage } from './EvaluationPage';
import ReferralPage from './ReferralPage'; // New import for referral system
import { checkOpenAIConnectionStatus } from '../lib/openai';
import { AdminButton } from './AdminButton';

function AppContent() {
  const { user, loading: isLoading, paymentCompleted, emailVerified, authSignOut } = useAuth();
  const { isDark: darkMode } = useTheme();
  const [activePage, setActivePage] = useState('home');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [pendingPaymentPlan, setPendingPaymentPlan] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Writing state
  const [content, setContent] = useState('');
  const [textType, setTextType] = useState('narrative'); 
  const [assistanceLevel, setAssistanceLevel] = useState('detailed');
  const [timerStarted, setTimerStarted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedText, setSelectedText] = useState('');
  const [showExamMode, setShowExamMode] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showPlanningTool, setShowPlanningTool] = useState(false);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [popupFlowCompleted, setPopupFlowCompleted] = useState(false); 
  const [hasSignedIn, setHasSignedIn] = useState(false);
  
  // Panel state for attached chat
  const [panelVisible, setPanelVisible] = useState(true);
  const [openAIConnected, setOpenAIConnected] = useState<boolean | null>(null);
  const [openAILoading, setOpenAILoading] = useState<boolean>(true);

  // New states for button functionality
  const [showStructureGuide, setShowStructureGuide] = useState(false);
  const [showTips, setShowTips] = useState(false);

  // Timer logic - increment elapsed time every second when timer is running
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (timerStarted) {
      intervalId = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerStarted]);
  const [focusMode, setFocusMode] = useState(false);

  // CRITICAL FIX: Load prompt from localStorage AND database when component mounts
  useEffect(() => {
    const loadPromptFromStorage = async () => {
      try {
        // First try localStorage
        const generatedPrompt = localStorage.getItem('generatedPrompt');
        const customPrompt = localStorage.getItem('customPrompt');
        const storedTextType = localStorage.getItem('selectedWritingType');

        console.log('🔍 Loading prompt from localStorage:', {
          generatedPrompt: generatedPrompt ? generatedPrompt.substring(0, 50) + '...' : null,
          customPrompt: customPrompt ? customPrompt.substring(0, 50) + '...' : null,
          storedTextType
        });

        // Set the prompt (prioritize generated over custom)
        if (generatedPrompt) {
          setPrompt(generatedPrompt);
          console.log('✅ Loaded generated prompt from localStorage');
        } else if (customPrompt) {
          setPrompt(customPrompt);
          console.log('✅ Loaded custom prompt from localStorage');
        } else if (user?.id) {
          // If no localStorage prompt, try loading from database
          console.log('🔍 No localStorage prompt found, checking database...');
          const { supabase } = await import('../lib/supabase');
          const { data: sessions } = await supabase
            .from('chat_sessions')
            .select('prompt, text_type')
            .eq('user_id', user.id)
            .order('last_accessed_at', { ascending: false })
            .limit(1);

          if (sessions && sessions.length > 0 && sessions[0].prompt) {
            setPrompt(sessions[0].prompt);
            setTextType(sessions[0].text_type || 'narrative');
            console.log('✅ Loaded prompt from database');

            // Also update localStorage for faster future access
            localStorage.setItem('generatedPrompt', sessions[0].prompt);
            localStorage.setItem('selectedWritingType', sessions[0].text_type || 'narrative');
          }
        }

        // Set the text type if available
        if (storedTextType) {
          setTextType(storedTextType);
          console.log('✅ Loaded text type:', storedTextType);
        }

        // Mark popup flow as completed if we have a prompt
        if (generatedPrompt || customPrompt) {
          setPopupFlowCompleted(true);
          console.log('✅ Popup flow marked as completed');
        }

      } catch (error) {
        console.error('❌ Error loading prompt:', error);
      }
    };

    // Load prompt when component mounts
    loadPromptFromStorage();

    // Listen for prompt generation events from Dashboard
    const handlePromptGenerated = (event: CustomEvent) => {
      console.log('🎯 Received promptGenerated event:', event.detail);
      const { prompt: newPrompt, textType: newTextType } = event.detail;
      
      if (newPrompt) {
        setPrompt(newPrompt);
        console.log('✅ Prompt updated from event');
      }
      
      if (newTextType && newTextType !== 'custom') {
        setTextType(newTextType);
        console.log('✅ Text type updated from event');
      }
      
      setPopupFlowCompleted(true);
    };

    // Add event listener
    window.addEventListener('promptGenerated', handlePromptGenerated as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('promptGenerated', handlePromptGenerated as EventListener);
    };
  }, []);

  // ADDITIONAL FIX: Reload prompt when navigating to writing page
  useEffect(() => {
    if (location.pathname === '/writing') {
      const generatedPrompt = localStorage.getItem('generatedPrompt');
      const customPrompt = localStorage.getItem('customPrompt');
      const storedTextType = localStorage.getItem('selectedWritingType');
      
      console.log('📍 Navigated to writing page, checking localStorage:', {
        generatedPrompt: generatedPrompt ? 'Found' : 'Not found',
        customPrompt: customPrompt ? 'Found' : 'Not found',
        storedTextType
      });

      // Update prompt if we find one in localStorage
      if (generatedPrompt && generatedPrompt !== prompt) {
        setPrompt(generatedPrompt);
        console.log('✅ Updated prompt from localStorage on navigation');
      } else if (customPrompt && customPrompt !== prompt) {
        setPrompt(customPrompt);
        console.log('✅ Updated custom prompt from localStorage on navigation');
      }

      // Update text type if available
      if (storedTextType && storedTextType !== textType) {
        setTextType(storedTextType);
        console.log('✅ Updated text type from localStorage on navigation');
      }

      // Mark popup flow as completed if we have a prompt
      if ((generatedPrompt || customPrompt) && !popupFlowCompleted) {
        setPopupFlowCompleted(true);
        console.log('✅ Popup flow marked as completed on navigation');
      }
    }
  }, [location.pathname, prompt, textType, popupFlowCompleted]);

  // Handle sign-in behavior - clear content and show modal when user signs in
  useEffect(() => {
    if (user && !hasSignedIn) {
      // User just signed in
      setHasSignedIn(true);
      
      // Clear content and reset state
      setContent('');
      setTextType('narrative'); 
      setPopupFlowCompleted(false);
      
      // If we're on the writing page, this will trigger the writing type modal
      if (activePage === 'writing') {
        // The WritingArea component will handle showing the modal
      }
    } else if (!user && hasSignedIn) {
      // User signed out
      setHasSignedIn(false);
      // Clear all local storage related to writing session
      localStorage.removeItem('generatedPrompt');
      localStorage.removeItem('customPrompt');
      localStorage.removeItem('selectedWritingType');
      localStorage.removeItem('writingContent');
      localStorage.removeItem('elapsedTime');
      localStorage.removeItem('timerStarted');
      // Navigate to home page after sign out
      navigate('/');
    }
  }, [user, hasSignedIn, activePage, navigate]);

  // Handle navigation changes
  const handleNavigation = useCallback((page: string) => {
    console.log(`Navigating to: ${page}`);
    setActivePage(page);
    
    // Convert page name to path
    let path = '/';
    switch (page) {
      case 'home':
        path = '/';
        break;
      case 'features':
        path = '/features';
        break;
      case 'pricing':
        path = '/pricing';
        break;
      case 'about':
        path = '/about';
        break;
      case 'faq':
        path = '/faq';
        break;
      case 'dashboard':
        path = '/dashboard';
        break;
      case 'settings':
        path = '/settings';
        break;
      case 'writing':
        path = '/writing';
        break;
      case 'exam':
        path = '/exam';
        break;
      case 'learning':
        path = '/learning';
        break;
      case 'signin':
        path = '/sign-in';
        break;
      case 'signup':
        path = '/sign-up';
        break;
      default:
        path = `/${page}`;
        break;
    }
    navigate(path);
  }, [navigate]);

  // Handle sign out
  const handleForceSignOut = useCallback(async () => {
    console.log('Forcing sign out...');
    await authSignOut();
    // The useEffect hook above handles the rest of the sign-out logic (state reset, navigation)
  }, [authSignOut]);

  // Handle sign in/up clicks - now navigates to dedicated pages
  const handleSignInClick = () => {
    navigate('/sign-in');
  };

  const handleSignUpClick = () => {
    navigate('/sign-up');
  };

  // Handle submit (e.g., from Exam Mode)
  const handleSubmit = useCallback(() => {
    // Logic to save content and navigate to feedback page
    console.log('Submitting content for feedback...');
    // For now, just navigate to a placeholder
    navigate('/dashboard');
  }, [navigate]);

  // Helper functions for writing area
  const handleToggleFocusMode = useCallback(() => setFocusMode(prev => !prev), []);
  const handleToggleStructureGuide = useCallback(() => setShowStructureGuide(prev => !prev), []);
  const handleToggleTips = useCallback(() => setShowTips(prev => !prev), []);
  const handleTextTypeChange = useCallback((newType: string) => {
    setTextType(newType);
    localStorage.setItem('selectedWritingType', newType);
  }, []);
  const handlePopupCompleted = useCallback(() => setPopupFlowCompleted(true), []);

  // Check OpenAI connection status
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkOpenAIConnectionStatus();
      setOpenAIConnected(isConnected);
      setOpenAILoading(false);
    };
    checkConnection();
  }, []);

  // Determine if the footer should be shown
  const shouldShowFooter = () => {
    // Don't show footer on writing, exam, or dashboard pages
    const noFooterPaths = ['/writing', '/exam', '/dashboard', '/settings', '/feedback', '/evaluation', '/referral'];
    return !noFooterPaths.some(path => location.pathname.startsWith(path));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content-wrapper bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="route-with-footer">
        <Routes>
          {/* Public Pages with StandardHeader */}
          <Route path="/" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="main-route-content">
                <HomePage onNavigate={handleNavigation} onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              </div>
            </>
          } />

          <Route path="/features" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="main-route-content">
                  <FeaturesSection />
                </div>
              </>
          } />

          <Route path="/how-it-works" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="main-route-content">
                <HowItWorksSection />
              </div>
            </>
          } />

          <Route path="/pricing" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="main-route-content">
                <PricingPageNew />
              </div>
            </>
          } />

          <Route path="/faq" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="main-route-content">
                <FAQPage onNavigate={handleNavigation} />
              </div>
            </>
          } />

          <Route path="/about" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="main-route-content">
                <AboutPage onNavigate={handleNavigation} onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              </div>
            </>
          } />

          {/* Auth Pages with StandardHeader */}
          <Route path="/sign-in" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="max-w-md mx-auto py-12">
                <AuthModal
                  isOpen={true}
                  onClose={() => navigate('/')}
                  mode={'signin'}
                  onAuthSuccess={(user) => {
                    console.log('Auth success callback received, closing modal');
                    setHasSignedIn(true);
                    navigate('/dashboard');
                  }}
                />
              </div>
            </>
          } />
          <Route path="/sign-up" element={
            <>
              <StandardHeader onSignInClick={handleSignInClick} onSignUpClick={handleSignUpClick} />
              <div className="pt-20"></div>
              <div className="max-w-md mx-auto py-12">
                <AuthModal
                  isOpen={true}
                  onClose={() => navigate('/')}
                  mode={'signup'}
                  onAuthSuccess={(user) => {
                    console.log('Auth success callback received, closing modal');
                    setHasSignedIn(true);
                    navigate('/dashboard');
                  }}
                />
              </div>
            </>
          } />

          {/* Authenticated Routes */}
          <Route path="/dashboard" element={
            user ? (
              <Dashboard 
                onNavigate={handleNavigation}
                onSignOut={handleForceSignOut}
              />
            ) : (
              <Navigate to="/" />
            )
          } />
          <Route path="/settings" element={
            user ? <SettingsPage onBack={() => setActivePage('dashboard')} /> : <Navigate to="/" />
          } />
          <Route path="/exam" element={
            <WritingAccessCheck onNavigate={handleNavigation}>
              <ExamSimulationMode
                content={content}
                onChange={setContent}
                textType={textType || 'narrative'}
                initialPrompt={prompt || ''}
                wordCount={content.split(/\s+/).filter(Boolean).length}
                onWordCountChange={() => { /* handled internally */ }}
                darkMode={darkMode}
                isTimerRunning={false}
                elapsedTime={elapsedTime}
                onStartTimer={() => setTimerStarted(true)}
                onPauseTimer={() => setTimerStarted(false)}
                onResetTimer={() => { setTimerStarted(false); setElapsedTime(0); }}
                onSubmit={handleSubmit}
                user={user}
                openAIConnected={openAIConnected}
                openAILoading={openAILoading}
              />
            </WritingAccessCheck>
          } />
          <Route path="/writing" element={
            <WritingAccessCheck onNavigate={handleNavigation}>
              {prompt ? (
                <EnhancedWritingLayoutNSW
                  content={content}
                  onChange={setContent}
                  textType={textType || 'narrative'}
                  initialPrompt={prompt || ''}
                  wordCount={content.split(/\s+/).filter(Boolean).length}
                  onWordCountChange={() => { /* handled internally */ }}
                  darkMode={darkMode}
                  isTimerRunning={timerStarted}
                  elapsedTime={elapsedTime}
                  onStartTimer={() => setTimerStarted(true)}
                  onPauseTimer={() => setTimerStarted(false)}
                  onResetTimer={() => { setTimerStarted(false); setElapsedTime(0); }}
                  focusMode={focusMode}
                  onToggleFocus={handleToggleFocusMode}
                  showStructureGuide={showStructureGuide}
                  onToggleStructureGuide={handleToggleStructureGuide}
                  showTips={showTips}
                  onToggleTips={handleToggleTips}
                  analysis={null}
                  onAnalysisChange={() => { /* handle analysis change */ }}
                  setPrompt={setPrompt}
                  assistanceLevel={assistanceLevel}
                  onAssistanceLevelChange={setAssistanceLevel}
                  onSubmit={handleSubmit}
                  selectedText={selectedText}
                  onTextTypeChange={handleTextTypeChange}
                  onPopupCompleted={handlePopupCompleted}
                  popupFlowCompleted={popupFlowCompleted}
                  user={user}
                  openAIConnected={openAIConnected}
                  openAILoading={openAILoading}
                  panelVisible={panelVisible}
                  setPanelVisible={setPanelVisible}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Please go back to the Dashboard to select a writing prompt.
                </div>
              )}
            </WritingAccessCheck>
          } />
          <Route path="/learning" element={
            <>
              <NavBar
                activePage={activePage}
                onNavigate={handleNavigation}
                user={user}
                onSignInClick={handleSignInClick}
                onSignUpClick={handleSignUpClick}
                onForceSignOut={handleForceSignOut}
              />
              <div className="main-route-content">
                 <EnhancedLearningHub onNavigate={handleNavigation} />
              </div>
            </>
          } />
          <Route path="/feedback/:essayId" element={<EssayFeedbackPage />} />
          <Route path="/evaluation/:evaluationId" element={<EvaluationPage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/auth/callback" element={<EmailVerificationHandler />} />
          <Route path="/payment-success" element={
            showPaymentSuccess ? (
              <PaymentSuccessPage 
                planType={pendingPaymentPlan}
                onClose={() => setShowPaymentSuccess(false)}
              />
            ) : (
              <Navigate to="/" />
            )
          } />
          <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          {shouldShowFooter() && <Footer onNavigate={handleNavigation} />}
        </div>
      </div>
  );
}

export default AppContent;