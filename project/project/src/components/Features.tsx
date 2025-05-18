import React, { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShieldCheck, Link, Layers, GitBranch } from 'lucide-react';

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}

const Feature: React.FC<FeatureProps> = ({ title, description, icon, index }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  
  return (
    <motion.div
      ref={ref}
      className="feature-card"
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div className="flex flex-col h-full">
        <div className="mb-24 text-uc-purple animate-pulse-glow w-fit p-8 rounded-md bg-uc-purple/10">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-16">{title}</h3>
        <p className="text-uc-white/70">{description}</p>
      </div>
    </motion.div>
  );
};

const Features: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  
  const features = [
    {
      title: "Unified Security",
      description: "Military-grade encryption that secures your identity across multiple blockchains with a single verification process.",
      icon: <ShieldCheck size={24} />
    },
    {
      title: "Chain Agnostic",
      description: "Seamlessly connect to any blockchain network without managing multiple private keys or complex identity protocols.",
      icon: <Link size={24} />
    },
    {
      title: "Multi-Layer Verification",
      description: "Advanced cryptographic proof systems ensure your identity is verifiable while maintaining complete privacy.",
      icon: <Layers size={24} />
    },
    {
      title: "Developer Friendly",
      description: "Comprehensive SDKs and APIs that make integration into existing applications straightforward and secure.",
      icon: <GitBranch size={24} />
    }
  ];
  
  return (
    <section id="features" className="py-64 md:py-96">
      <div className="responsive-container">
        <motion.div
          ref={ref}
          className="text-center mb-64"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            Future-Proof Identity <span className="text-gradient">Infrastructure</span>
          </h2>
          <p className="text-uc-white/70 max-w-2xl mx-auto">
            Built for the multi-chain future, UnifiedChain ID removes complexity
            while enhancing security for both users and developers.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24">
          {features.map((feature, index) => (
            <Feature 
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;