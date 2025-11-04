import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isEmailVerified, hasAnyAccess, getUserAccessStatus, supabase } from '../lib/supabase';
import { WritingTypeSelectionModal } from './WritingTypeSelectionModal';
import { PromptOptionsModal } from './PromptOptionsModal';
import { CustomPromptModal } from './CustomPromptModal';
import { generatePrompt } from '../lib/openai';
import { Mail, CheckCircle, Clock, FileText, PenTool, BarChart3, Settings, X, Star, BookOpen, Zap, Heart, Trophy, Sparkles, Smile, Target, Gift, Flame, TrendingUp, Award, Rocket, Crown, Gem, Wand2, Palette, Music, Camera, Gamepad2, HelpCircle, ArrowRight, Play, Calendar, Users, ChevronRight, Activity, BookMarked, CreditCard as Edit3, Timer, Brain, Lightbulb, Home } from 'lucide-react';

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
        throw new Error('No prompt generated');
      }

    } catch (error) {
      console.error('❌ Error generating prompt:', error);

      // FALLBACK: Use high-quality static prompts if AI generation fails
      const fallbackPrompts = {
        narrative: "Write an engaging story about a character who discovers something unexpected that changes their life forever. Include vivid descriptions, realistic dialogue, and show the character's emotional journey. Make sure your story has a clear beginning, middle, and end with a satisfying conclusion. Focus on showing rather than telling, and use sensory details to bring your story to life.",
        persuasive: "Choose a topic you feel strongly about and write a persuasive essay to convince others of your viewpoint. Use strong evidence, logical reasoning, and persuasive techniques like rhetorical questions and emotional appeals. Structure your argument clearly with an introduction that states your position, body paragraphs that support your argument with evidence, and a conclusion that reinforces your main point.",
        expository: "Select a topic you know well and write an informative essay that teaches others about it. Use clear explanations, relevant examples, and organize your information in a logical sequence. Include an engaging introduction that hooks your reader, body paragraphs that explore different aspects of your topic, and a strong conclusion that summarizes your main points.",
        reflective: "Think about a meaningful experience in your life and write a reflective piece exploring what you learned from it. Show your thoughts and feelings, and explain how this experience changed or influenced you. Be honest and thoughtful in your reflection, using specific details to help your reader understand the significance of this experience.",
        descriptive: "Choose a place, person, or object that is special to you and write a descriptive piece that brings it to life for your reader. Use sensory details (sight, sound, smell, touch, taste) and figurative language like metaphors and similes to create vivid imagery. Paint a picture with words that allows your reader to experience what you're describing.",
        recount: "Write about an important event or experience in your life, telling what happened in the order it occurred. Include details about who was involved, where it happened, when it took place, and why it was significant to you. Use descriptive language to help your reader visualize the events and understand their importance."
      };

      const fallbackPrompt = fallbackPrompts[selectedWritingType as keyof typeof fallbackPrompts] || fallbackPrompts.narrative;

      console.log('🔄 Using fallback prompt:', fallbackPrompt);

      // Save fallback prompt
      localStorage.setItem(`${selectedWritingType}_prompt`, fallbackPrompt);
      localStorage.setItem('generatedPrompt', fallbackPrompt);
      localStorage.setItem('selectedWritingType', selectedWritingType);
      localStorage.setItem('promptType', 'generated');

      // Save to database for persistence
      await saveWritingSessionToDatabase(fallbackPrompt, selectedWritingType);

      // Close prompt options modal
      setShowPromptOptionsModal(false);

      // Navigate to writing area with fallback prompt
      await new Promise(resolve => setTimeout(resolve, 200));
      navigate('/writing');

    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  // FIXED: Step 3 - Handle custom prompt with timestamp, then navigate to writing area
  const handleCustomPrompt = () => {
    console.log('✏️ Dashboard: Using custom prompt for:', selectedWritingType);

    // Store the prompt type
    localStorage.setItem('promptType', 'custom');
    localStorage.setItem('selectedWritingType', selectedWritingType);

    // Close prompt options modal and show custom prompt modal
    setShowPromptOptionsModal(false);
    setShowCustomPromptModal(true);
  };

  // Handle custom prompt submission and navigate to writing area
  const handleCustomPromptSubmit = async (prompt: string) => {
    console.log('✏️ Dashboard: Custom prompt submitted:', prompt.substring(0, 50) + '...');

    // FIXED: Clear generated prompt and save custom prompt with timestamp
    localStorage.removeItem("generatedPrompt");
    localStorage.removeItem("generatedPromptTimestamp");
    localStorage.setItem("customPrompt", prompt);
    localStorage.setItem("customPromptTimestamp", new Date().toISOString());

    // Save to database for persistence
    await saveWritingSessionToDatabase(prompt, selectedWritingType);

    console.log('✅ Custom prompt saved to localStorage with timestamp');

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('promptGenerated', {
      detail: { prompt, textType: 'custom', timestamp: new Date().toISOString() }
    }));

    // Close custom prompt modal
    setShowCustomPromptModal(false);

    // Navigate to writing page (Step 4 - Writing Area)
    console.log('📍 Dashboard: Navigating to writing area with custom prompt...');

    // FIXED: Use React Router navigate directly for consistent navigation
    try {
      navigate('/writing');
    } catch (error) {
      console.error('❌ Dashboard: Navigation error:', error);
      // Fallback to onNavigate if available
      if (onNavigate) {
        console.log('📍 Dashboard: Using onNavigate fallback');
        onNavigate('writing');
      } else {
        console.log('📍 Dashboard: Using window.location fallback');
        window.location.href = '/writing';
      }
    }
  };

  const handlePracticeExam = () => {
    console.log('🚀 Dashboard: Navigating to practice exam...');
    try {
      navigate('/exam');
    } catch (error) {
      console.error('❌ Dashboard: Exam navigation error:', error);
      if (onNavigate) {
        onNavigate('exam');
      } else {
        window.location.href = '/exam';
      }
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTimeRemaining = (dateString: string) => {
    const now = new Date();
    const target = new Date(dateString);
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 dark:text-slate-200 text-lg font-medium">Loading your dashboard...</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Preparing your writing journey</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative">

      {/* Welcome Message Modal - Modern Design */}
      {showWelcomeMessage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full relative border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleDismissWelcome}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              
              <h2 className="heading-3 text-slate-900 dark:text-slate-100 mb-4">
                Welcome, {getUserName()}! 🎉
              </h2>
              
              <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                You're all set to start your writing journey! Your AI writing buddy is ready to help you create amazing stories and essays.
              </p>
              
              <button
                onClick={handleDismissWelcome}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
              >
                Let's Get Started!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Here Guide Modal */}
      {showStartHereGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full relative border border-slate-200 dark:border-slate-700">
            <button
              onClick={handleDismissGuide}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-300 dark:hover:text-slate-100 transition-colors bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 p-2 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-10 w-10 text-white" />
                </div>
                <h2 className="heading-2 text-slate-900 dark:text-slate-100 mb-2">Quick Start Guide</h2>
                <p className="text-slate-600 dark:text-slate-300">Follow these simple steps to begin writing</p>
              </div>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Start Writing</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Click the "Start Writing" button to begin your writing session</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Choose Writing Type</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Select from narrative, persuasive, descriptive, and more</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Get Your Prompt</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm">Receive an AI-generated prompt or create your own</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
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
      )}

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
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-700">{getUserName()}</span>! 👋
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
                    <Edit3 className="h-10 w-10 text-blue-600" />
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
                  <Lightbulb className="h-4 w-4 text-blue-600" />
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 group-hover:from-blue-200 group-hover:to-blue-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <BookMarked className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">View Essays</span>
            </button>

            <button className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 group-hover:from-green-200 group-hover:to-green-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-slate-200">Progress</span>
            </button>

            <button className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 group-hover:from-purple-200 group-hover:to-purple-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </button>

            <button className="flex flex-col items-center p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 group-hover:from-orange-200 group-hover:to-orange-300 rounded-xl flex items-center justify-center mb-3 transition-all">
                <HelpCircle className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Help</span>
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