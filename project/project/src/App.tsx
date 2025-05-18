import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import CTA from './components/CTA';
import Footer from './components/Footer';
import Loader from './components/Loader';
import Dashboard from './pages/Dashboard';
import SeedPhraseTest from './components/SeedPhraseTest';
import BlockchainTest from './pages/BlockchainTest';
import { UserProvider } from './contexts/UserContext';

// Lazily load 3D background for performance
const ThreeBackground = React.lazy(() => import('./components/ThreeBackground'));

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading essential resources
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Router>
      <UserProvider>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/test-seed-phrases" element={<SeedPhraseTest />} />
          <Route path="/blockchain-test" element={<BlockchainTest />} />
          <Route path="/" element={
            <div className="flex flex-col min-h-screen relative">
              {/* Background */}
              <Suspense fallback={<div className="canvas-container bg-uc-black" />}>
                <ThreeBackground />
              </Suspense>

              {/* Content */}
              <Header />
              <main>
                <Hero />
                <Features />
                <CTA />
              </main>
              <Footer />
            </div>
          } />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;