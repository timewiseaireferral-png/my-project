import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified, hasAnyAccess, getUserAccessStatus, supabase } from '../lib/supabase';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';
import { generatePrompt } from '../lib/openai';
import { Mail, CheckCircle, Clock, FileText, PenTool, BarChart3, Settings, X, Star, BookOpen, Zap, Heart, Trophy, Sparkles, Smile, Target, Gift, Flame, TrendingUp, Award, Rocket, Crown, Gem, Wand2, Palette, Music, Camera, Gamepad2, HelpCircle, ArrowRight, Play, Calendar, Users, ChevronRight, Activity, BookMarked, CreditCard, Timer, Brain, Lightbulb, Home } from 'lucide-react';

interface DashboardProps {
  user?: any;
  emailVerified?: boolean;
  paymentCompleted?: boolean;
  onNavigate?: (page: string) => void;
  onSignOut?: () => void;
}

export function Dashboard({ user: propUser, emailVerified: propEmailVerified, paymentCompleted: propPaymentCompleted, onNavigate, onSignOut }: DashboardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVerified, setIsVerified] = useState(false);
  const [accessType, setAccessType] = useState<'none' | 'temporary' | 'permanent'>('none');
  const [tempAccessUntil, setTempAccessUntil] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userAccessData, setUserAccessData] = useState<any>(null);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [showStartHereGuide, setShowStartHereGuide] = useState(false);

  // Modal states for proper sequence
  const [showWritingTypeModal, setShowWritingTypeModal] = useState(false);
  const [showPromptOptionsModal, setShowPromptOptionsModal] = useState(false);
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [selectedWritingType, setSelectedWritingType] = useState<string>('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // Use prop user if provided, otherwise use context user
  const currentUser = propUser || user;

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (currentUser) {
        console.log('🔍 Dashboard: Checking verification status for user:', currentUser.id);
        setIsLoading(true);

        try {
          // Get detailed user access status from database
          const accessData = await getUserAccessStatus(currentUser.id);
          setUserAccessData(accessData);

          if (accessData) {
            console.log('📊 User access data:', accessData);

            // Check if user has permanent access (payment verified or manual override)
            if (accessData.payment_verified || accessData.manual_override || accessData.has_access) {
              setIsVerified(true);
              setAccessType('permanent');

              // Check if this is the first time showing the welcome message
              const hasSeenWelcome = localStorage.getItem(`welcome_shown_${currentUser.id}`);
              if (!hasSeenWelcome) {
                setShowWelcomeMessage(true);
                localStorage.setItem(`welcome_shown_${currentUser.id}`, 'true');
              }

              // Check if user needs the "Start Here" guide
              const hasSeenGuide = localStorage.getItem(`start_guide_shown_${currentUser.id}`);
              if (!hasSeenGuide) {
                setShowStartHereGuide(true);
              }

              console.log('✅ Dashboard: Permanent access confirmed - payment verified:', accessData.payment_verified);
              setIsLoading(false);
              return;
            }

            // Check if user has valid temporary access
            if (accessData.temp_access_until) {
              const tempDate = new Date(accessData.temp_access_until);
              if (tempDate > new Date()) {
                setIsVerified(true);
                setAccessType('temporary');
                setTempAccessUntil(accessData.temp_access_until);
                console.log('⏰ Dashboard: Temporary access confirmed until:', accessData.temp_access_until);
                setIsLoading(false);
                return;
              }
            }
          }

          // No valid access found
          setIsVerified(false);
          setAccessType('none');
          console.log('❌ Dashboard: No valid access found');

        } catch (error) {
          console.error('❌ Dashboard: Error checking verification status:', error);
          setIsVerified(false);
          setAccessType('none');
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkVerificationStatus();
  }, [currentUser]);

  const getUserName = () => {
    if (currentUser?.user_metadata?.full_name) {
      return currentUser.user_metadata.full_name.split(' ')[0];
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'Writer';
  };

  const handleDismissWelcome = () => {
    setShowWelcomeMessage(false);
  };

  const handleDismissGuide = () => {
    setShowStartHereGuide(false);
    localStorage.setItem(`start_guide_shown_${currentUser.id}`, 'true');
  };

  const handleManualRefresh = async () => {
    setIsLoading(true);
    // Trigger a re-check of verification status
    const event = new Event('checkVerificationStatus');
    window.dispatchEvent(event);
    
    // Refresh the page data
    window.location.reload();
  };

  // FIXED: Step 1 - Clear any existing data and start the flow
  const handleStartWriting = () => {
    console.log('🚀 Dashboard: Starting writing flow...');
    
    // Clear any existing data to start fresh
    localStorage.removeItem('selectedWritingType');
    localStorage.removeItem('promptType');
    localStorage.removeItem('navigationSource');
    localStorage.removeItem('writingContent');
    localStorage.removeItem('generatedPrompt');

    // Set navigation source to track the flow
    localStorage.setItem('navigationSource', 'dashboard');

    // Show the writing type selection modal (Step 2)
    setShowWritingTypeModal(true);
  };

  // FIXED: Step 2 - Handle writing type selection, then show prompt options
  const handleWritingTypeSelect = (type: string) => {
    console.log('📝 Dashboard: Writing type selected:', type);

    // Store the selected writing type
    setSelectedWritingType(type);
    localStorage.setItem('selectedWritingType', type);

    // Close writing type modal and open prompt options modal (Step 3)
    setShowWritingTypeModal(false);
    setShowPromptOptionsModal(true);
  };

  // Helper function to save writing session to database
  const saveWritingSessionToDatabase = async (prompt: string, textType: string) => {
    if (!user?.id) return;

    try {
      // Check if there's an active session
      const { data: existingSessions } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false })
        .limit(1);

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      if (existingSessions && existingSessions.length > 0) {
        // Update existing session
        const { error } = await supabase
          .from('chat_sessions')
          .update({
            prompt: prompt,
            text_type: textType,
            last_accessed_at: new Date().toISOString(),
            metadata: {
              ...existingSessions[0].metadata,
              lastPromptUpdate: new Date().toISOString()
            }
          })
          .eq('id', existingSessions[0].id);

        if (error) {
          console.error('Error updating session:', error);
        } else {
          console.log('✅ Session updated in database');
        }
      } else {
        // Create new session
        const { error } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            text_type: textType,
            prompt: prompt,
            user_text: '',
            metadata: {
              startedAt: new Date().toISOString(),
              promptType: 'generated'
            }
          });

        if (error) {
          console.error('Error creating session:', error);
        } else {
          console.log('✅ New session created in database');
        }
      }
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  // FIXED: Step 3 - Handle prompt generation with timestamp, then navigate to writing area
  const handleGeneratePrompt = async () => {
    console.log('🎯 Dashboard: Generating prompt for:', selectedWritingType);
    setIsGeneratingPrompt(true);

    try {
      // Call the OpenAI prompt generation function
      const prompt = await generatePrompt(selectedWritingType);

      if (prompt) {
        console.log('✅ Prompt generated successfully:', prompt);

        // CRITICAL: Clear custom prompt and save generated prompt with timestamp
        localStorage.removeItem("customPrompt");
        localStorage.removeItem("customPromptTimestamp");
        localStorage.setItem("generatedPrompt", prompt);
        localStorage.setItem("generatedPromptTimestamp", new Date().toISOString());
        localStorage.setItem('selectedWritingType', selectedWritingType);
        localStorage.setItem("promptType", "generated");

        console.log('✅ Prompt saved to localStorage with timestamp');

        // Save to database for persistence
        await saveWritingSessionToDatabase(prompt, selectedWritingType);

        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('promptGenerated', {
          detail: { prompt, textType: selectedWritingType, timestamp: new Date().toISOString() }
        }));

        // Small delay to ensure localStorage is written
        await new Promise(resolve => setTimeout(resolve, 200));

        // Navigate to writing area AFTER prompt is generated
        navigate("/writing");
        setShowPromptOptionsModal(false);
        console.log('✅ Dashboard: Navigation to /writing initiated');

      } else {
        console.error('❌ Dashboard: Prompt generation failed (empty prompt)');
      }
    } catch (error) {
      console.error('❌ Dashboard: Error during prompt generation:', error);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // FIXED: Step 4 - Handle custom prompt submission, save with timestamp, then navigate
  const handleCustomPromptSubmit = async (prompt: string) => {
    console.log('✍️ Dashboard: Custom prompt submitted for:', selectedWritingType);

    // CRITICAL: Clear generated prompt and save custom prompt with timestamp
    localStorage.removeItem("generatedPrompt");
    localStorage.removeItem("generatedPromptTimestamp");
    localStorage.setItem("customPrompt", prompt);
    localStorage.setItem("customPromptTimestamp", new Date().toISOString());
    localStorage.setItem('selectedWritingType', selectedWritingType);
    localStorage.setItem("promptType", "custom");

    console.log('✅ Custom prompt saved to localStorage with timestamp');

    // Save to database for persistence
    await saveWritingSessionToDatabase(prompt, selectedWritingType);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('promptGenerated', {
      detail: { prompt, textType: selectedWritingType, timestamp: new Date().toISOString() }
    }));

    // Small delay to ensure localStorage is written
    await new Promise(resolve => setTimeout(resolve, 200));

    // Navigate to writing area AFTER prompt is submitted
    navigate("/writing");
    setShowCustomPromptModal(false);
    console.log('✅ Dashboard: Navigation to /writing initiated');
  };

  // FIXED: Step 3b - Handle custom prompt selection, open custom prompt modal
  const handleCustomPrompt = () => {
    console.log('📝 Dashboard: Custom prompt option selected');
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
  };

  const handlePracticeExam = () => {
    navigate('/exam');
  };

  const renderAccessStatus = () => {
    if (isLoading) {
      return (
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
          <Clock className="w-5 h-5 animate-spin" />
          <span className="font-medium">Checking Access Status...</span>
        </div>
      );
    }

    if (accessType === 'permanent') {
      return (
        <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Full Access</span>
        </div>
      );
    }

    if (accessType === 'temporary' && tempAccessUntil) {
      const untilDate = new Date(tempAccessUntil).toLocaleDateString();
      return (
        <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
          <Clock className="w-5 h-5" />
          <span className="font-medium">Trial Access until {untilDate}</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
        <X className="w-5 h-5" />
        <span className="font-medium">No Active Access</span>
        <button
          onClick={() => navigate('/pricing')}
          className="ml-4 px-3 py-1 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors"
        >
          Get Access
        </button>
      </div>
    );
  };

  const renderWelcomeMessage = () => {
    if (!showWelcomeMessage) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-8 relative">
          <button
            onClick={handleDismissWelcome}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">Welcome, {getUserName()}!</h2>
            <p className="text-gray-600 dark:text-slate-300 mb-6">
              You now have **{accessType === 'permanent' ? 'Full Access' : 'Temporary Access'}** to our powerful writing tools.
              We're excited to help you become a better writer!
            </p>
            <div className="space-y-4 text-left">
              <div className="flex items-start space-x-3">
                <Trophy className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 dark:text-slate-200">
                  **Start with a Writing Session:** Click the "Start Writing" button to begin a new essay with AI guidance.
                </p>
              </div>
              <div className="flex items-start space-x-3">
                <BarChart3 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <p className="text-gray-700 dark:text-slate-200">
                  **Track Your Progress:** View your past essays and progress metrics on the dashboard.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissWelcome}
              className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              Let's Get Started!
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStartHereGuide = () => {
    if (!showStartHereGuide || accessType === 'none') return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-8 relative">
          <div className="text-center">
            <Lightbulb className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-3">Your First Steps</h2>
            <p className="text-gray-600 dark:text-slate-300 mb-6">
              Follow this quick guide to start your first AI-guided writing session.
            </p>
            
            <div className="space-y-6 mb-8">
              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl shadow-inner">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Click "Start Writing"</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">The big blue card on your dashboard</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl shadow-inner">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Choose a Text Type</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Narrative, Persuasive, or other</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl shadow-inner">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Get a Prompt</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Use a generated one or write your own</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl shadow-inner">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Write & Get Feedback</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Start writing and receive real-time AI feedback to improve</p>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDismissGuide}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors"
                >
                  Skip for Now
                </button>
                <button
                  onClick={() => {
                    handleDismissGuide();
                    handleStartWriting();
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                >
                  Start Writing Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900 relative">
      {renderWelcomeMessage()}
      {renderStartHereGuide()}
      
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-blue-50 dark:from-slate-800 to-indigo-100 dark:to-slate-900/50"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Buttons */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm transition-all hover:shadow-md text-gray-700 dark:text-slate-200 font-medium"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </button>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg shadow-sm transition-all hover:shadow-md text-red-700 dark:text-red-400 font-medium"
            >
              <X className="w-5 h-5" />
              Sign Out
            </button>
          )}
        </div>

        {/* Header Section */}
        <div className="mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-3">
              Welcome back! 👋
            </h1>
            <p className="text-xl text-gray-600 dark:text-slate-300">
              Ready to create something amazing today?
            </p>
          </div>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Start Writing Card - Redesigned for Kids */}
          <button
            onClick={handleStartWriting}
            className="group relative bg-white rounded-3xl p-1.5 cursor-pointer overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl w-full text-left active:scale-[0.98]"
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-purple-500 rounded-3xl"></div>

            {/* Inner content */}
            <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-[22px] p-8">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[22px]"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <PenTool className="h-10 w-10 text-blue-600" />
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2.5 text-white font-bold text-sm flex items-center space-x-2 group-hover:bg-white group-hover:text-blue-600 transition-all shadow-lg">
                    <span>Click Me!</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold !text-white mb-3 group-hover:!text-yellow-300 transition-colors" style={{textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>Start Writing ✨</h2>
                <p className="text-white/95 text-lg mb-6 leading-relaxed font-medium">
                  Begin a new writing session with AI-powered guidance and real-time feedback
                </p>

                <div className="flex flex-wrap gap-3 text-white/95">
                  <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-full font-medium shadow-md">
                    <Brain className="h-5 w-5" />
                    <span className="text-sm">AI Assistance</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-full font-medium shadow-md">
                    <Zap className="h-5 w-5" />
                    <span className="text-sm">Real-time Feedback</span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-purple-400/20 rounded-full blur-3xl group-hover:bg-purple-300/30 transition-all"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-300/20 rounded-full blur-3xl group-hover:bg-blue-200/30 transition-all"></div>
            </div>
          </button>

          {/* Practice Exam Card - Redesigned for Kids */}
          <button
            onClick={handlePracticeExam}
            className="group relative bg-white rounded-3xl p-1.5 cursor-pointer overflow-hidden transform transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl w-full text-left active:scale-[0.98]"
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-pink-500 rounded-3xl"></div>

            {/* Inner content */}
            <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-pink-600 rounded-[22px] p-8">
              {/* Animated background effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[22px]"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Timer className="h-10 w-10 text-orange-600" />
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2.5 text-white font-bold text-sm flex items-center space-x-2 group-hover:bg-white group-hover:text-orange-600 transition-all shadow-lg">
                    <span>Click Me!</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>

                <h2 className="text-3xl font-bold !text-white mb-3 group-hover:!text-yellow-300 transition-colors" style={{textShadow: '0 2px 4px rgba(0,0,0,0.2)'}}>Practice Exam 🎯</h2>
                <p className="text-white/95 text-lg mb-6 leading-relaxed font-medium">
                  Test your skills with timed practice sessions under real exam conditions
                </p>

                <div className="flex flex-wrap gap-3 text-white/95">
                  <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-full font-medium shadow-md">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">Timed Sessions</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/15 backdrop-blur-sm px-4 py-2.5 rounded-full font-medium shadow-md">
                    <Target className="h-5 w-5" />
                    <span className="text-sm">NSW Aligned</span>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl group-hover:bg-pink-300/30 transition-all"></div>
              <div className="absolute -top-6 -left-6 w-32 h-32 bg-orange-300/20 rounded-full blur-3xl group-hover:bg-orange-200/30 transition-all"></div>
            </div>
          </button>
        </div>

        {/* Tools & Tips Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Writing Tools Overview */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Your Writing Tools</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-900 dark:text-slate-100 font-semibold mb-1">Multiple Text Types</p>
                <p className="text-gray-600 dark:text-slate-300 text-sm">Narrative, Persuasive & More</p>
              </div>

              <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-900 dark:text-slate-100 font-semibold mb-1">AI Feedback</p>
                <p className="text-gray-600 dark:text-slate-300 text-sm">Real-time guidance</p>
              </div>

              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-900 dark:text-slate-100 font-semibold mb-1">NSW Aligned</p>
                <p className="text-gray-600 dark:text-slate-300 text-sm">Curriculum specific</p>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-6">Writing Tips</h3>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smile className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Use Strong Verbs</p>
                  <p className="text-xs text-gray-600 dark:text-slate-300">Make your writing exciting</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Show, Don't Tell</p>
                  <p className="text-xs text-gray-600 dark:text-slate-300">Use vivid descriptions</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Plan First</p>
                  <p className="text-xs text-gray-600 dark:text-slate-300">Structure your ideas</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-slate-100">Edit & Revise</p>
                  <p className="text-xs text-gray-600 dark:text-slate-300">Polish your work</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">Quick Actions</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* View Essays */}
            <button onClick={() => navigate('/essays')} className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">View Essays</span>
            </button>

            {/* Progress */}
            <button onClick={() => navigate('/progress')} className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 group-hover:from-green-200 group-hover:to-green-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Progress</span>
            </button>
            
            {/* Billing */}
            <button onClick={() => navigate('/settings')} className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 group-hover:from-teal-200 group-hover:to-teal-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <CreditCard className="h-6 w-6 text-teal-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Billing</span>
            </button>

            {/* Referral */}
            <button onClick={() => navigate('/referral')} className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-yellow-200 group-hover:from-yellow-200 group-hover:to-yellow-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <Gift className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Referral</span>
            </button>

            {/* Settings - FIX: Added dark:text-slate-200 */}
            <button onClick={() => navigate('/settings')} className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Settings</span>
            </button>

            {/* Help - FIX: Added dark:text-slate-200 */}
            <button onClick={() => navigate('/help')} className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 group-hover:from-orange-200 group-hover:to-orange-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <HelpCircle className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showWritingTypeModal && (
        <WritingTypeSelectionModal
          isOpen={showWritingTypeModal}
          onClose={() => setShowWritingTypeModal(false)}
          onSelect={handleWritingTypeSelect}
        />
      )}

      {showPromptOptionsModal && (
        <PromptOptionsModal
          isOpen={showPromptOptionsModal}
          onClose={() => setShowPromptOptionsModal(false)}
          onGeneratePrompt={handleGeneratePrompt}
          onCustomPrompt={handleCustomPrompt}
          selectedWritingType={selectedWritingType}
          isGenerating={isGeneratingPrompt}
        />
      )}

      {showCustomPromptModal && (
        <CustomPromptModal
          isOpen={showCustomPromptModal}
          onClose={() => setShowCustomPromptModal(false)}
          onSubmit={handleCustomPromptSubmit}
          writingType={selectedWritingType}
        />
      )}
    </div>
  );
}
