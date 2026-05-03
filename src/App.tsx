import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ValueStrip from './components/ValueStrip';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import Personalization from './components/Personalization';
import AuthUI from './components/AuthUI';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import InfoDialog, { type LegalDialogKind } from './components/InfoDialog';
import './App.css';

function App() {
  const [showAuth, setShowAuth] = React.useState<'none' | 'signin' | 'signup'>('none');
  const [legalDialog, setLegalDialog] = React.useState<'none' | LegalDialogKind>('none');

  const openAuth = (type: 'signin' | 'signup') => {
    setLegalDialog('none');
    setShowAuth(type);
  };

  const openLegal = (kind: LegalDialogKind) => {
    setShowAuth('none');
    setLegalDialog(kind);
  };

  return (
    <div className="app-container" id="top">
      <Navbar onAuthClick={openAuth} onLegalOpen={openLegal} />
      
      <main>
        <Hero onGetStarted={() => openAuth('signup')} onSignIn={() => openAuth('signin')} />
        <ValueStrip />
        <Features onGetStarted={() => openAuth('signup')} />
        <HowItWorks />
        <Personalization />
        <FinalCTA onPrimaryClick={() => openAuth('signup')} />
      </main>

      <Footer onLegalOpen={openLegal} />

      {showAuth !== 'none' && (
        <AuthUI
          key={showAuth}
          initialView={showAuth === 'signin' ? 'signin' : 'signup'}
          onClose={() => setShowAuth('none')}
        />
      )}

      {legalDialog !== 'none' && (
        <InfoDialog kind={legalDialog} onClose={() => setLegalDialog('none')} />
      )}
    </div>
  );
}

export default App;
