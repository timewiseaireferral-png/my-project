import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { UpgradeModal } from './UpgradeModal';
import { Loader } from 'lucide-react';
import { getFeatureName, getFeatureDescription, Feature } from '../lib/accessControl';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPro?: boolean;
  feature?: Feature;
  redirectTo?: string;
  showModal?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresPro = true,
  feature,
  redirectTo = '/pricing',
  showModal = true
}) => {
  const { user } = useAuth();
  const { plan, isLoading, hasAccess } = useSubscription();
  const navigate = useNavigate();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasCheckedAccess) {
      setHasCheckedAccess(true);

      // If user is not signed in, redirect to home
      if (!user) {
        console.log('ProtectedRoute: No user, redirecting to home');
        navigate('/');
        return;
      }

      // If route requires Pro access
      if (requiresPro) {
        // Check if user has access to specific feature
        if (feature && !hasAccess(feature)) {
          console.log(`ProtectedRoute: User lacks access to feature: ${feature}`);
          if (showModal) {
            setShowUpgradeModal(true);
          } else {
            navigate(redirectTo);
          }
          return;
        }

        // Check general Pro access
        if (!feature && plan !== 'Pro') {
          console.log('ProtectedRoute: User does not have Pro plan');
          if (showModal) {
            setShowUpgradeModal(true);
          } else {
            navigate(redirectTo);
          }
          return;
        }
      }

      console.log(`ProtectedRoute: Access granted - Plan: ${plan}`);
    }
  }, [isLoading, hasCheckedAccess, user, requiresPro, feature, plan, hasAccess, navigate, redirectTo, showModal]);

  const handleModalClose = () => {
    setShowUpgradeModal(false);
    navigate(redirectTo);
  };

  // Show loading state while checking access
  if (isLoading || !hasCheckedAccess) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  // If user doesn't have access, show modal or nothing (will redirect)
  if (requiresPro && ((feature && !hasAccess(feature)) || (!feature && plan !== 'Pro'))) {
    return (
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={handleModalClose}
        featureName={feature ? getFeatureName(feature) : 'Pro Features'}
        featureDescription={feature ? getFeatureDescription(feature) : 'This area requires a Pro subscription to access all features.'}
      />
    );
  }

  // User has access, render children
  return <>{children}</>;
};

export default ProtectedRoute;
