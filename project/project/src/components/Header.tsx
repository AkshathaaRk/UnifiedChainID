import React, { useState, useEffect } from 'react';
import { Menu, X, YoutubeIcon as CubeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
                ${isScrolled ? 'bg-uc-black/90 backdrop-blur-md py-16' : 'bg-transparent py-24'}`}
    >
      <div className="responsive-container flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-8 group">
          <CubeIcon className="h-8 w-8 text-uc-purple transition-transform duration-300 group-hover:rotate-[20deg]" />
          <span className="text-xl font-semibold tracking-tight">UnifiedChain ID</span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-32">
          <a href="#features" className="text-uc-white/80 hover:text-uc-white transition-colors">
            Features
          </a>
          <a href="#about" className="text-uc-white/80 hover:text-uc-white transition-colors">
            About
          </a>
          <Link to="/blockchain-test" className="text-uc-white/80 hover:text-uc-white transition-colors">
            Blockchain Test
          </Link>
          <Link to="/dashboard" className="btn-primary">
            Get Started
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-uc-white p-8"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-uc-black/95 backdrop-blur-md">
          <nav className="flex flex-col p-24">
            <a
              href="#features"
              className="py-16 px-8 text-uc-white/80 hover:text-uc-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#about"
              className="py-16 px-8 text-uc-white/80 hover:text-uc-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </a>
            <Link
              to="/blockchain-test"
              className="py-16 px-8 text-uc-white/80 hover:text-uc-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blockchain Test
            </Link>
            <Link
              to="/dashboard"
              className="mt-16 btn-primary text-center"
              onClick={() => setIsMenuOpen(false)}
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;