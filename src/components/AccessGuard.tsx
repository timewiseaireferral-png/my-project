import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Loader, Lock } from 'lucide-react';

interface AccessGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onNavigate?: (page: string) => void;
}

export function AccessGuard({ 
  children, 
  fallback,
  onNavigate
}: AccessGuardProps) {
  const { user, paymentCompleted, emailVerified, loading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!loading) {
      // User has access if they have completed payment and verified email
      const userHasAccess = user && emailVerified && paymentCompleted;
      setHasAccess(!!userHasAccess);
    }
  }, [user, emailVerified, paymentCompleted, loading]);

  if (loading || hasAccess === null) {
    return (
      <div className="flex items-center justify-center p-4 h-full">
        <Loader className="h-6 w-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (hasAccess === false) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-4 h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
        <Lock className="h-8 w-8 text-gray-400 mb-2" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          Premium Feature
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          This feature requires a subscription
        </p>
        {onNavigate && (
          <button
            onClick={() => onNavigate('pricing')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            View Plans
          </button>
        )}
      </div>
    );
  }

  return <>{children}</>;
}