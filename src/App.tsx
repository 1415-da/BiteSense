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
import './App.css';

function App() {
  const [showAuth, setShowAuth] = React.useState<'none' | 'signin' | 'signup'>('none');

  return (
    <div className="app-container">
      <Navbar onAuthClick={(type) => setShowAuth(type)} />
      
      <main>
        <Hero />
        <ValueStrip />
        <Features />
        <HowItWorks />
        <Personalization />
        <FinalCTA />
      </main>

      <Footer />

      {showAuth !== 'none' && (
        <AuthUI 
          initialView={showAuth === 'signin' ? 'signin' : 'signup'} 
          onClose={() => setShowAuth('none')} 
        />
      )}
    </div>
  );
}

export default App;
