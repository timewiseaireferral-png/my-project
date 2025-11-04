import React, { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HomeNavigation } from './HomeNavigation';
import { EnhancedHeroSection } from './EnhancedHeroSection';
import { FeaturesSection } from './FeaturesSection';
import { HowItWorksSection } from './HowItWorksSection';
import { PricingPage } from './PricingPage';
import { WritingTypesSection } from './WritingTypesSection';
// import { Footer } from './Footer'; // Removed to avoid duplication
import { SuccessMetricsSection } from './SuccessMetricsSection';
import { ComparisonSection } from './ComparisonSection';
import { ArrowRight, CheckCircle, Star, Users, Zap, BookOpen, Award, Target, Play } from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: string, type?: string) => void;
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onSignInClick, onSignUpClick }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      {/* Enhanced Navigation */}
      <HomeNavigation onNavigate={onNavigate} onSignInClick={onSignInClick} onSignUpClick={onSignUpClick} />

      {/* Enhanced Hero Section */}
      <EnhancedHeroSection onNavigate={onNavigate} onSignUpClick={onSignUpClick} />

      {/* Success Metrics Section - NEW */}
      <SuccessMetricsSection />

      {/* Original hero replaced with EnhancedHeroSection above */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-20 pb-32" style={{display: 'none'}}>
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] bg-[size:32px_32px]"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Trust Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full mb-8 border border-blue-100">
              <Star className="w-4 h-4 text-yellow-500 fill-current mr-2" />
              <span className="text-sm font-semibold text-gray-700">AI-Powered Writing Coach for NSW Students</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Master Writing for
              <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-700 bg-clip-text text-transparent">
                NSW Selective Exams
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
              Get instant AI-powered feedback, personalized coaching, and proven strategies to achieve top marks in your writing exam.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <button
                onClick={user ? () => onNavigate('dashboard') : onSignUpClick}
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {user ? 'Go to Dashboard' : 'Start Free Trial'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('pricing')}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-lg transition-all duration-200"
              >
                See How It Works
              </button>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-gray-900 mb-1">Instant Feedback</div>
                <div className="text-xs text-gray-600">Real-time AI analysis</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-gray-900 mb-1">NSW Aligned Curriculum</div>
                <div className="text-xs text-gray-600">Official NSW Department of Education rubric</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-semibold text-gray-900 mb-1">Personalized</div>
                <div className="text-xs text-gray-600">Adapts to your level</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Video Section - NEWLY ADDED */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
              See Writing Mate in Action
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-400 max-w-3xl mx-auto">
              Watch how our AI-powered platform helps students master writing skills and achieve top marks in NSW Selective exams.
            </p>
          </div>

                      {/* Video Container */}
          <div className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-gray-900">
            {/* Video Player */}
            <div className="relative aspect-video bg-black">
              <video
                src="/Quick Start.mp4"
                className="w-full h-full"
                ref={videoRef}
                onPlay={( ) => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                loop
                playsInline
                controls
              >
                Your browser does not support the video tag.
              </video>
              {!isVideoPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer" onClick={handlePlayPause}>
                  <Play className="w-20 h-20 text-white" />
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-2 text-gray-100">Complete Platform Demo</h3>
                  <p className="text-gray-200">Learn how to get started with Writing Mate and unlock your writing potential</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-200 mb-2">Duration: 2:12</div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Benefits */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Platform Overview</h3>
              <p className="text-gray-600">Get a complete walkthrough of all features and tools available to help you improve your writing.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real Examples</h3>
              <p className="text-gray-600">See real examples of how the AI feedback works and how students use it to improve their writing.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Start Guide</h3>
              <p className="text-gray-600">Learn how to get started in just a few minutes and begin your writing improvement journey today.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Why Students Struggle with Writing Exams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Traditional tutoring is expensive, time-consuming, and doesn't provide instant feedback when you need it most.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 border-2 border-red-200 dark:border-red-900/50 shadow-sm hover:border-red-300 dark:hover:border-red-800 transition-colors">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-3">No Instant Feedback</h3>
              <p className="text-red-800 dark:text-red-200">Wait days for tutor feedback, missing crucial practice time before exams.</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 border-2 border-red-200 dark:border-red-900/50 shadow-sm hover:border-red-300 dark:hover:border-red-800 transition-colors">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                <Award className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-3">Expensive Tutoring</h3>
              <p className="text-red-800 dark:text-red-200">Private tutors cost $60-120/hour with inconsistent quality and availability.</p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-8 border-2 border-red-200 dark:border-red-900/50 shadow-sm hover:border-red-300 dark:hover:border-red-800 transition-colors">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-3">Generic Advice</h3>
              <p className="text-red-800 dark:text-red-200">One-size-fits-all guidance doesn't address your specific weaknesses.</p>
            </div>
          </div>

          {/* Pricing Anchor */}
          <div id="pricing" className="pt-20 -mt-20"></div>

          {/* Solution Highlight */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 rounded-3xl p-12 md:p-16 text-center relative overflow-hidden">
            {/* Decorative grid overlay */}
            <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_70%)]"></div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl font-bold mb-8 text-white">
                Get Unlimited AI Coaching for Less Than One Tutoring Session
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white mb-10 max-w-4xl mx-auto">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="font-medium">Instant feedback</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="font-medium">Available 24/7</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="font-medium">Personalized</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <span className="font-medium">NSW aligned</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate(user ? 'dashboard' : 'pricing')}
                className="inline-flex items-center justify-center px-10 py-5 text-lg font-bold bg-white text-indigo-600 dark:text-indigo-700 rounded-xl hover:shadow-2xl hover:shadow-white/50 transform hover:scale-105 transition-all duration-200"
              >
                {user ? 'Start Writing Now' : 'View Pricing'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <FeaturesSection />

      {/* Comparison Section - NEW */}
      <ComparisonSection />

      {/* How It Works */}
      <div id="how-it-works">
        <HowItWorksSection />
      </div>

      {/* Writing Types */}
      <WritingTypesSection onSignInClick={onSignInClick} />


      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            Ready to Excel in Your Writing Exam?
          </h2>
          <p className="text-xl text-gray-600 dark:text-slate-400 mb-10">
            Start improving your writing skills today with personalized AI-powered coaching.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
            <button
              onClick={user ? () => onNavigate('dashboard') : onSignUpClick}
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {user ? 'Continue Writing' : 'Start Your 3-Day Free Trial'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-slate-400">
            No credit card required • Cancel anytime • Money-back guarantee
          </p>
        </div>
      </section>

      {/* Footer is now rendered globally in AppContent.tsx to ensure it appears on all marketing pages. */}
    </div>
  );
};