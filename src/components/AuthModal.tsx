// SIMPLIFIED Kid-Friendly AuthModal component
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader, Star, Heart, Smile } from 'lucide-react';
import { supabase, isEmailVerified } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'signin' | 'signup';
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  mode: initialMode,
  onClose,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'confirmation'>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string>('');
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Reset form when mode changes
  useEffect(() => {
    console.log('AuthModal: mode changed to', initialMode, 'isOpen:', isOpen);
    setMode(initialMode);
    setError('');
    setSuccess(false);
    setCurrentStep(1);

    // Try to get email from localStorage
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setConfirmationEmail(savedEmail);
    }
  }, [initialMode, isOpen]);

  // Kid-friendly error messages
  const getKidFriendlyError = (error: string): string => {
    if (error.includes('Invalid login credentials') || error.includes('Invalid email or password')) {
      return "Oops! That email or password doesn't look right. Let's try again! 🤔";
    }
    if (error.includes('Email not confirmed')) {
      return "Almost there! Please check your email for a special link! 📧";
    }
    if (error.includes('Password should be at least')) {
      return "Your password needs to be a bit longer - at least 6 characters! 🔐";
    }
    if (error.includes('Passwords do not match')) {
      return "Oops! Your passwords don't match. Let's make sure they're the same! 🔄";
    }
    if (error.includes('User already registered')) {
      return "You already have an account! Try signing in instead! 😊";
    }
    if (error.includes('Invalid email')) {
      return "That email doesn't look quite right. Can you check it? 📧";
    }
    return "Something went wrong, but don't worry! Let's try again! 🌟";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCurrentStep(2);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError(getKidFriendlyError('Passwords do not match'));
          setLoading(false);
          setCurrentStep(1);
          return;
        }

        // Get referral code from localStorage if it exists
        const referralCode = localStorage.getItem('referred_by');
        console.log('AuthModal: Signing up with referral code:', referralCode);

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              referred_by: referralCode || null
            }
          }
        });

        if (error) {
          setError(getKidFriendlyError(error.message));
          setCurrentStep(1);
        } else if (data.user) {
          localStorage.setItem('userEmail', email);
          setConfirmationEmail(email);
          setMode('confirmation');
          setSuccess(true);
          setCurrentStep(3);

          // Store the referral code in the user profile
          if (referralCode) {
            console.log('AuthModal: Storing referral code in user profile');
            try {
              const { error: profileError } = await supabase
                .from('user_profiles')
                .update({ referred_by: referralCode })
                .eq('id', data.user.id);

              if (profileError) {
                console.error('AuthModal: Error storing referral code:', profileError);
              } else {
                console.log('AuthModal: Referral code stored successfully');
                // Clear the referral code from localStorage after storing
                localStorage.removeItem('referred_by');
              }
            } catch (err) {
              console.error('AuthModal: Exception storing referral code:', err);
            }
          }
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          setError(getKidFriendlyError(error.message));
          setCurrentStep(1);
        } else if (data.user) {
          localStorage.setItem('userEmail', email);
          
          const emailVerified = isEmailVerified(data.user);

          if (emailVerified) {
            setSuccess(true);
            setCurrentStep(3);
            // Call onAuthSuccess to close modal after showing success message
            setTimeout(() => {
              onAuthSuccess(data.user);
            }, 1500);
          } else {
            setConfirmationEmail(email);
            setMode('confirmation');
            setCurrentStep(3);
          }
        }
      }
    } catch (err: any) {
      setError(getKidFriendlyError(err.message || 'An unexpected error occurred'));
      setCurrentStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: confirmationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        setError(getKidFriendlyError(error.message));
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(getKidFriendlyError(err.message || 'Failed to resend confirmation email'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationCheck = async () => {
    setVerificationChecking(true);
    setError('');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("We couldn't find your user session. Please try signing in again. 🤔");
        setVerificationChecking(false);
        return;
      }
      const emailVerified = isEmailVerified(user);
      
      if (emailVerified) {
        setSuccess(true);
        
        if (user) {
          setTimeout(() => {
            onAuthSuccess(user);
          }, 1500);
        }
      } else {
        setError("We haven't received your email confirmation yet. Please check your email and click the magic link! ✨");
      }
    } catch (err: any) {
      setError(getKidFriendlyError(err.message || 'Failed to check verification status'));
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleContinueAnyway = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Always call onAuthSuccess to close the modal and proceed
        onAuthSuccess(user);
      } else {
        setError("Let's try signing in again! 🔄");
      }
    } catch (error) {
      setError("Let's try signing in again! 🔄");
    }
  };

  // Progress indicator component
  const ProgressIndicator = ({ step }: { step: number }) => (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-2">
        {[1, 2, 3].map((stepNum) => (
          <React.Fragment key={stepNum}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              stepNum <= step 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}>
              {stepNum <= step ? (
                stepNum === step && loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  stepNum === 3 ? <Star className="w-4 h-4" /> : stepNum
                )
              ) : (
                stepNum
              )}
            </div>
            {stepNum < 3 && (
              <div className={`w-8 h-1 rounded transition-all duration-300 ${
                stepNum < step ? 'bg-blue-500' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  if (!isOpen) {
    console.log('AuthModal: Not rendering (isOpen is false)');
    return null;
  }

  console.log('AuthModal: Rendering with mode:', mode, 'isOpen:', isOpen);

  if (mode === 'confirmation') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl" onClick={e => e.stopPropagation()}>
          <ProgressIndicator step={currentStep} />
          
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
            Check Your Email! <Heart className="w-5 h-5 text-red-500 ml-2" />
          </h2>

          <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            We sent a special magic link to <br />
            <strong className="text-blue-600">{confirmationEmail}</strong>
            <br />
            Click it to activate your account! ✨
          </p>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl border-2 border-red-200">
              <div className="flex items-center justify-center">
                <Smile className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-base font-medium">{error}</p>
              </div>
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-xl border-2 border-green-200">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                <p className="text-base font-medium">Email sent successfully! 🎉</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col space-y-4">
            {/* Removed: Green Button (I Clicked the Magic Link!) and Blue Button (Continue (If Already Done)) as per user request. */}

            
            <button
              onClick={handleResendConfirmation}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-base font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Sending Magic...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Another Magic Link
                </>
              )}
            </button>
            
            <button
              onClick={() => setMode('signin')}
              className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success && mode === 'signin') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center">
            Welcome Back! <Star className="w-5 h-5 text-yellow-500 ml-2" />
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-4">
            You're all set! Taking you to your writing space... ✨
          </p>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            {mode === 'signin' ? (
              <>
                <Smile className="mr-2 h-5 w-5 text-blue-500" />
                Welcome Back!
              </>
            ) : (
              <>
                <Star className="mr-2 h-5 w-5 text-purple-500" />
                Join the Fun!
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="px-4 pt-3">
          <ProgressIndicator step={currentStep} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 pt-2">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 rounded-xl">
              <div className="flex items-center">
                <Smile className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-base font-bold text-gray-700 dark:text-gray-300 mb-2">
              📧 Your Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-base font-bold text-gray-700 dark:text-gray-300 mb-2">
              🔐 Your Secret Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Sign Up only) */}
          {mode === 'signup' && (
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-base font-bold text-gray-700 dark:text-gray-300 mb-2"
              >
                🗝️ Confirm Your Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 text-base border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="mb-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-base font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  {mode === 'signin' ? 'Signing In...' : 'Creating Account...'}
                </>
              ) : (
                <>
                  {mode === 'signin' ? '🚀 Let\'s Go!' : '✨ Create My Account'}
                </>
              )}
            </button>
          </div>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {mode === 'signin' ? "Don't have an account yet? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'signup' : 'signin');
                  setError('');
                  setSuccess(false);
                  setCurrentStep(1);
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-sm transition-all duration-200 hover:text-blue-700"
              >
                {mode === 'signin' ? '🌟 Join the fun!' : '👋 Welcome back!'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
