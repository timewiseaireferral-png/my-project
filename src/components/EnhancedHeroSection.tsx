import React, { useState, useRef } from 'react';
import { ArrowRight, Play, Zap, BookOpen, Target, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EnhancedHeroSectionProps {
  onNavigate: (page: string) => void;
  onSignUpClick: () => void;
}

export const EnhancedHeroSection: React.FC<EnhancedHeroSectionProps> = ({ onNavigate, onSignUpClick }) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const handlePlayVideo = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 pt-24 pb-32">
      {/* Decorative Background */}
      <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgb(15,23,42),rgba(15,23,42,0.6))] bg-[size:32px_32px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left">
            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-slate-100 mb-6 leading-tight">
              Boost Your Child's{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Selective Writing Score
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-700 dark:text-slate-300 mb-4 leading-relaxed font-bold ml-12">
              with AI-Powered Practice & Feedback
            </p>

            <p className="text-lg text-gray-600 dark:text-slate-400 mb-8 leading-relaxed">
              Master all writing types including narrative, persuasive, creative, descriptive, expository, and more with personalized AI guidance. Join students preparing for NSW Selective exams.
            </p>

            {/* Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">Instant Feedback</div>
                </div>
                <div className="text-xs text-gray-600 dark:text-slate-400">Real-time AI analysis</div>
              </div>

              <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">NSW Aligned</div>
                </div>
                <div className="text-xs text-gray-600 dark:text-slate-400">Official NSW DOE rubric</div>
              </div>

              <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">Personalized</div>
                </div>
                <div className="text-xs text-gray-600 dark:text-slate-400">Adapts to your level</div>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={user ? () => onNavigate('dashboard') : onSignUpClick}
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                {user ? 'Go to Dashboard' : 'Start Free Trial'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg transition-all duration-200"
              >
                See How It Works
              </button>
            </div>
            
            {/* Data Security and Compliance Statement */}
            <div className="mt-8 flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-400">
              <Star className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="font-medium">
                <span className="font-bold text-gray-800 dark:text-slate-200">Trust & Compliance:</span> 
                Student data is protected with end-to-end encryption and stored securely in Australia, compliant with Australian Privacy Principles (APPs).
              </p>
            </div>
          </div>

          {/* Right Column - Video Card */}
          <div className="relative">
            <div className="relative rounded-2xl border-2 border-white dark:border-slate-900 shadow-2xl overflow-hidden bg-gray-900 transform hover:scale-105 transition-transform duration-300">

              {/* Video Container */}
              <div className="relative aspect-video bg-black">
                <video
                  ref={videoRef}
                  src="/Quick Start.mp4"
                  poster="/image.png"
                  className="w-full h-full object-cover"
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  loop
                  playsInline
                  controls
                >
                  Your browser does not support the video tag.
                </video>

                {/* Play Button Overlay */}
                {!isVideoPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer group"
                    onClick={handlePlayVideo}
                  >
                    <div className="w-20 h-20 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                      <Play className="w-10 h-10 text-indigo-600 ml-1" />
                    </div>
                  </div>
                )}

                {/* Duration Badge */}
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/80 text-white text-sm font-semibold backdrop-blur-sm">
                  2:12
                </div>
              </div>

              {/* Video Info Bar */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 px-6 py-4">
                <div className="flex items-center text-white">
                  <div>
                    <div className="text-sm font-semibold opacity-90">Quick Start Demo</div>
                    <div className="text-xs opacity-75">The fastest way to get started</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-32 h-32 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-pink-400 to-indigo-600 rounded-full blur-3xl opacity-20 dark:opacity-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};
