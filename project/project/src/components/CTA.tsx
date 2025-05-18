import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

  return (
    <section id="cta" className="py-64 md:py-96">
      <div className="responsive-container">
        <motion.div
          ref={ref}
          className="relative rounded-2xl overflow-hidden border border-uc-purple/30 p-48 md:p-64"
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-uc-black to-uc-purple/20 z-0" />

          {/* Content */}
          <div className="relative z-10 max-w-3xl mx-auto text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-24"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Ready to <span className="text-gradient">Unify</span> Your Blockchain Identity?
            </motion.h2>

            <motion.p
              className="text-uc-white/80 mb-48"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Join thousands of users and developers who are already simplifying their
              blockchain experience with UnifiedChain ID.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-16 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link
                to="/dashboard"
                className="btn-primary group"
              >
                Get Started
                <ArrowRight className="ml-8 inline-block transition-transform group-hover:translate-x-1" size={20} />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;