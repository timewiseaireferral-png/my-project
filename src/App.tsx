import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LearningProvider } from './contexts/LearningContext';
import AppContent from './components/AppContent';
import NSWDemoPage from './components/NSWDemoPage';

// Component to handle URL parameters
const ReferralHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');

    if (refCode) {
      // Store the referral code in local storage
      localStorage.setItem('referred_by', refCode);
      console.log('Referral code stored:', refCode);
      
      // Optionally, clean the URL to prevent sharing the ref parameter
      // This is commented out as it might interfere with other routing logic
      // if (window.history.replaceState) {
      //   const url = new URL(window.location.href);
      //   url.searchParams.delete('ref');
      //   window.history.replaceState({path: url.href}, '', url.href);
      // }
    }
  }, [location.search]);

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <LearningProvider>
            {/* Only use BrowserRouter on the client side */}
            {typeof window !== 'undefined' ? (
              <BrowserRouter>
                <ReferralHandler>
                  <AppContent />
                </ReferralHandler>
              </BrowserRouter>
            ) : (
              <ReferralHandler>
                <AppContent />
              </ReferralHandler>
            )}
          </LearningProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;