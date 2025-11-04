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
  // src/components/AppContent.tsx (Line 62)
  // Before: const [textType, setTextType] = useState('');
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
      // src/components/AppContent.tsx (Line 234)
      // Before: setTextType('');
      setTextType('narrative'); 
      setPopupFlowCompleted(false);
      
      // If we're on the writing page, this will trigger the writing type modal
      if (activePage === 'writing') {
        // The WritingArea component will handle showing the modal
      }
    } else if (!user && hasSignedIn) {
      // User signed out
      setHasSignedIn(false);
    }
  }, [user, hasSignedIn, activePage]);

  useEffect(() => {
    const fetchOpenAIStatus = async () => {
      setOpenAILoading(true);
      const status = await checkOpenAIConnectionStatus();
      setOpenAIConnected(status.is_connected);
      setOpenAILoading(false);
    };

    fetchOpenAIStatus();
  }, []);

  // Check for payment success in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('paymentSuccess') === 'true' || urlParams.get('payment_success') === 'true';
    const planType = urlParams.get('planType') || urlParams.get('plan');
    const userEmail = urlParams.get('email');
    
    if (paymentSuccess && planType) {
      console.log('[DEBUG] Payment success detected for plan:', planType);
      
      // Store payment info
      if (userEmail) {
        localStorage.setItem('userEmail', userEmail);
      }
      localStorage.setItem('payment_plan', planType);
      localStorage.setItem('payment_date', new Date().toISOString());
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setShowPaymentSuccess(true);
      setPendingPaymentPlan(planType);
      setActivePage('payment-success');
    }
  }, []);

  // Set active page based on current path
  useEffect(() => {
    const path = location.pathname.substring(1) || 'home';
    if (path !== 'auth/callback') { // Don't change active page during auth callback
      setActivePage(path);
    }
  }, [location.pathname]);

  // Text selection logic for writing area
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setSelectedText(selection.toString());
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  const handleNavigation = useCallback((page: string) => {
    console.log(`Navigating to: ${page}`);
    setActivePage(page);
    
    if (page === 'home') {
      navigate('/');
    } else {
      navigate(`/${page}`);
    }
  }, [navigate]);

  const handleGetStarted = useCallback(() => {
    if (user) {
      handleNavigation('dashboard');
    } else {
      setAuthModalMode('signup');
      setShowAuthModal(true);
    }
  }, [user, handleNavigation]);

  const handleForceSignOut = useCallback(async () => {
    try {
      await authSignOut();
      setActivePage('home');
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [authSignOut, navigate]);

  const handleTextTypeChange = useCallback((newTextType: string) => {
    setTextType(newTextType);
    localStorage.setItem('selectedWritingType', newTextType);
  }, []);

  const handleSubmit = useCallback((submittedContent: string) => {
    console.log('Content submitted:', submittedContent.length, 'characters');
  }, []);

  const handlePopupCompleted = useCallback(() => {
    try {
      setPopupFlowCompleted(true);
    } catch (error) {
      console.error('Popup completion error:', error);
    }
  }, []);

  // Toggle functions for the buttons
  const handleTogglePlanningTool = useCallback(() => {
    setShowPlanningTool(prev => !prev);
  }, []);

  const handleToggleStructureGuide = useCallback(() => {
    setShowStructureGuide(prev => !prev);
  }, []);

  const handleToggleTips = useCallback(() => {
    setShowTips(prev => !prev);
  }, []);

  const handleToggleExamMode = useCallback(() => {
    setShowExamMode(prev => !prev);
  }, []);

  const handleToggleFocusMode = useCallback(() => {
    setFocusMode(prev => !prev);
  }, []);

  // NAVIGATION FIX: Improved footer visibility logic
  const shouldShowFooter = useCallback(() => {
    // Show footer only on marketing pages and hide on application pages
    const marketingPages = ['home', 'features', 'pricing', 'faq', 'about', 'learning', 'referral', 'payment-success'];
    // The pricing page is a marketing page, but the user wants to remove the duplicate footer from it.
    // Since the HomePage already renders the Footer, we need to ensure AppContent does not render it on the home route.
    // The main app pages are: dashboard, writing, exam, settings.
    const appPages = ['dashboard', 'writing', 'exam', 'settings'];
    
    // Check if the current page is a marketing page, and NOT an app page.
    // We explicitly exclude the home page here because HomePage.tsx already renders the footer.
    const isMarketingPage = marketingPages.includes(activePage) && !appPages.includes(activePage);
    
    // We want to show the footer on all marketing pages *except* the one that already includes it (HomePage)
    // and *except* the pricing page if we assume the duplication was from AppContent rendering it.
    // The safest approach is to only render it on pages that *don't* have it already.
    // Let's assume the duplication was caused by HomePage rendering it, and AppContent rendering it again.
    // Since we restored the Footer in HomePage, we should only render it in AppContent for pages that are not HomePage.
    
    // Let's check the current path:
    const path = location.pathname.split('/').filter(Boolean)[0] || 'home';
    
    // Pages that should NOT have a footer rendered by AppContent:
    // 1. Pages that render their own footer (e.g., home, pricing, if they are full-page marketing components)
    // 2. Application pages (dashboard, writing, exam, settings)
    const noAppContentFooter = ['/', 'home', 'dashboard', 'writing', 'exam', 'settings'];
    
    // The user wants the footer on all pages. Since HomePage renders it, and AppContent renders it globally,
    // the duplication was on the home page. The pricing page must have been a full-page component that
    // did NOT render the footer, and AppContent's global render was the only one.
    // The user's request was to remove the duplicate footers.
    // The duplicate was: CTA (inside Footer.tsx) + Main Footer (inside Footer.tsx) + Main Footer (from AppContent).
    
    // New strategy:
    // 1. Footer.tsx: CTA is removed. Main Footer content is kept.
    // 2. HomePage.tsx: Renders Footer.
    // 3. AppContent.tsx: Should only render Footer on pages that are NOT HomePage and NOT app pages.
    
    const pagesThatShouldHaveAppContentFooter = ['features', 'faq', 'about', 'learning', 'referral', 'payment-success', 'pricing'];
    
    // Let's use the activePage state, which seems to be derived from the path.
    // The original logic was: Don't show footer on app pages. This implies it was shown on all marketing pages.
    // The duplication was likely because HomePage renders it, and AppContent renders it too.
    
    // Let's keep the original logic, and remove the explicit render from HomePage.tsx.
    // But the user's new request is to have the footer on all pages.
    
    // Let's go with the safest assumption: The footer should be rendered by AppContent for all pages *except* the main app pages.
    const appRoutes = ['dashboard', 'writing', 'exam', 'settings', 'feedback', 'evaluation'];
    return !appRoutes.some(route => location.pathname.includes(route));
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-content-wrapper bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="route-with-footer">
        <Routes>
          <Route path="/" element={
            <div className="main-route-content">
<HomePage onNavigate={handleNavigation} onSignInClick={() => {
	              setAuthModalMode("signin");
	              setShowAuthModal(true);
	            }}
	            onSignUpClick={() => {
	              setAuthModalMode("signup");
	              setShowAuthModal(true);
	            }} />
            </div>
          } />
          <Route path="/home" element={
            <div className="main-route-content">
<HomePage onNavigate={handleNavigation} onSignInClick={() => {
	              setAuthModalMode("signin");
	              setShowAuthModal(true);
	            }}
	            onSignUpClick={() => {
	              setAuthModalMode("signup");
	              setShowAuthModal(true);
	            }} />
            </div>
          } />
          <Route path="/features" element={
            <>
              <NavBar 
                activePage={activePage}
                onNavigate={handleNavigation}
                user={user}
                onSignInClick={() => {
                  console.log('AppContent: onSignInClick called');
                  setAuthModalMode('signin');
                  setShowAuthModal(true);
                  console.log('AppContent: Auth modal state set to open');
                }}
                onSignUpClick={() => {
                  console.log('AppContent: onSignUpClick called');
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                  console.log('AppContent: Auth modal state set to open');
                }}
                onForceSignOut={handleForceSignOut}
              />
              <div className="main-route-content">
                <FeaturesSection />
              </div>
            </>
          } />
          <Route path="/pricing" element={<PricingPageNew />} />
          <Route path="/faq" element={<FAQPage onNavigate={handleNavigation} />} />
          <Route path="/about" element={<AboutPage onNavigate={handleNavigation} />} />
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
                onSignInClick={() => {
                  setAuthModalMode('signin');
                  setShowAuthModal(true);
                }}
                onSignUpClick={() => {
                  setAuthModalMode('signup');
                  setShowAuthModal(true);
                }}
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

        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            mode={authModalMode}
            onAuthSuccess={(user) => {
              console.log('Auth success callback received, closing modal');
              setShowAuthModal(false);
              setHasSignedIn(true);
            }}
          />
        )}

        {shouldShowFooter() && <Footer onNavigate={handleNavigation} />}
      </div>
    </div>
  );
}

export default AppContent;