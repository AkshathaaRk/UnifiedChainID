import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!heroRef.current) return;

      const { clientX, clientY } = e;
      const rect = heroRef.current.getBoundingClientRect();

      // Calculate mouse position relative to the center of the element
      const xPos = (clientX - rect.left) / rect.width - 0.5;
      const yPos = (clientY - rect.top) / rect.height - 0.5;

      // Parallax effect for hero content
      const content = heroRef.current.querySelector('.hero-content') as HTMLElement;
      if (content) {
        content.style.transform = `translate(${xPos * -20}px, ${yPos * -20}px)`;
      }
    };

    const heroElement = heroRef.current;
    if (heroElement) {
      heroElement.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (heroElement) {
        heroElement.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
    }
  };

  return (
    <section
      ref={heroRef}
      className="min-h-screen flex items-center pt-[100px] overflow-hidden relative"
      id="hero"
    >
      <div className="responsive-container">
        <motion.div
          className="hero-content max-w-3xl transition-transform duration-[250ms] ease-out will-change-transform"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="text-hero font-bold mb-24 leading-tight text-gradient"
            variants={itemVariants}
          >
            One Identity, <br />Any Blockchain
          </motion.h1>

          <motion.p
            className="text-subtitle text-uc-white/80 mb-48 max-w-xl"
            variants={itemVariants}
          >
            Seamlessly manage your digital identity across all blockchain networks with unprecedented security and control.
          </motion.p>

          <motion.div className="flex flex-wrap gap-16 md:gap-24" variants={itemVariants}>
            <Link to="/dashboard" className="btn-primary group">
              Get Started
              <ArrowRight className="ml-8 inline-block transition-transform group-hover:translate-x-1" size={20} />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;