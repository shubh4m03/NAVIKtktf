import React, { useState, useEffect } from 'react';
import { HeroExperience } from './hero';
import { ArrowLeft, Compass } from 'lucide-react';

/**
 * NAVIK Master Host Application
 * 
 * Flow:
 * 1. Cinematic Hero Intro Scene (/)
 * 2. GET STARTED / Scroll Trigger
 * 3. Cinematic Fade Transition
 * 4. Clean Handoff to Existing Main Application (/app)
 */
function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  // =========================================================================
  // NAVIK APPLICATION HANDOFF
  // Connect this to the main application route / backend integration.
  // =========================================================================
  const handleEnterApplication = () => {
    console.log('[NAVIK Handoff] Cinematic intro completed. Handing control over to main application.');
    navigateTo('/app');
  };

  // 1. Existing Main Application Mount Point (/app)
  if (currentPath === '/app') {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#030712',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        fontFamily: "'Space Grotesk', sans-serif",
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 80, 200, 0.3))',
          border: '1px solid rgba(0, 212, 255, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)'
        }}>
          <Compass color="#00d4ff" size={32} />
        </div>

        <h1 style={{
          fontSize: '2.0rem',
          fontWeight: 800,
          letterSpacing: '0.15em',
          textTransform: 'uppercase'
        }}>
          NAVIK APPLICATION WORKSPACE
        </h1>

        <p style={{
          maxWidth: '520px',
          color: '#94a3b8',
          fontSize: '1.0rem',
          lineHeight: '1.6',
          fontFamily: "'Outfit', sans-serif"
        }}>
          Intelligent freight rate forecasting, bulk vessel chartering optimization, and predictive route orchestration.
        </p>

        {/* =========================================================================
            NAVIK APPLICATION HANDOFF
            Connect this to the main application route/backend integration.
           ========================================================================= */}
        <div style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          color: '#38bdf8'
        }}>
          // NAVIK APPLICATION HANDOFF: Team connects main application / backend here
        </div>

        <button
          type="button"
          onClick={() => navigateTo('/')}
          style={{
            marginTop: '1rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontFamily: "'Space Grotesk', sans-serif",
            textDecoration: 'underline',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <ArrowLeft size={16} />
          <span>Return to Cinematic Intro</span>
        </button>
      </div>
    );
  }

  // 2. Cinematic Hero Intro Scene (/)
  return (
    <div className="app-container">
      <HeroExperience 
        autoPlay={true}
        onEnterNavik={handleEnterApplication}
      />
    </div>
  );
}

export default App;
