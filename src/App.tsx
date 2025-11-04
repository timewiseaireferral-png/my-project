import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { LearningProvider } from './contexts/LearningContext';
import AppContent from './components/AppContent';
import NSWDemoPage from './components/NSWDemoPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <LearningProvider>
            <Router>
              <AppContent />
            </Router>
          </LearningProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
