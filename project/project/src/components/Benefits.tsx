import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const Benefits: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });
  
  const benefits = [
    "No more managing multiple identities across chains",
    "Enhanced privacy with selective disclosure",
    "Reduced vulnerability to phishing attacks",
    "Seamless cross-chain transactions",
    "Compliant with global identity standards",
    "Recovery mechanisms for lost credentials",
    "Reduced gas costs through optimized verification",
    "Open source implementation with regular audits"
  ];
  
  return (
    <section id="benefits" className="py-64 md:py-96 bg-gradient-to-b from-transparent to-uc-black/80">
      <div className="responsive-container">
        <div className="flex flex-col md:flex-row items-center gap-48 md:gap-64">
          <motion.div
            ref={ref}
            className="flex-1"
            initial={{ opacity: 0, x: -50 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-24">
              Why Choose <span className="text-uc-purple">UnifiedChain ID</span>
            </h2>
            
            <p className="text-uc-white/70 mb-32">
              Our blockchain identity solution was built from the ground up to address
              the fragmentation and security challenges of multi-chain environments.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-16">
              {benefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="flex items-start gap-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <CheckCircle className="text-uc-purple mt-4 flex-shrink-0" size={20} />
                  <span className="text-uc-white/80">{benefit}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          
          <motion.div 
            className="flex-1 w-full md:w-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative aspect-square max-w-[400px] mx-auto">
              {/* Code snippet with syntax highlighting */}
              <div className="absolute inset-0 rounded-lg overflow-hidden border border-uc-purple/30 bg-uc-black/80 backdrop-blur-sm">
                <pre className="p-24 text-sm overflow-auto h-full">
                  <code className="font-mono text-uc-white/90">
                    <span className="text-blue-400">import</span> {'{'} UnifiedChainID {'}'} <span className="text-blue-400">from</span> <span className="text-green-400">'@unifiedchain/id'</span>;{'\n\n'}
                    <span className="text-blue-400">const</span> <span className="text-yellow-400">wallet</span> = <span className="text-blue-400">new</span> UnifiedChainID();{'\n\n'}
                    <span className="text-green-400">// Connect to multiple chains with one identity</span>{'\n'}
                    <span className="text-blue-400">await</span> wallet.<span className="text-yellow-400">connect</span>([{'\n'}
                    {'  '}<span className="text-green-400">'ethereum'</span>,{'\n'}
                    {'  '}<span className="text-green-400">'solana'</span>,{'\n'}
                    {'  '}<span className="text-green-400">'polkadot'</span>{'\n'}
                    ]);{'\n\n'}
                    <span className="text-green-400">// Sign transaction on any connected chain</span>{'\n'}
                    <span className="text-blue-400">const</span> <span className="text-yellow-400">signature</span> = <span className="text-blue-400">await</span> wallet.<span className="text-yellow-400">signTransaction</span>({'\n'}
                    {'  '}chain: <span className="text-green-400">'ethereum'</span>,{'\n'}
                    {'  '}transaction: txData{'\n'}
                    {'}'});{'\n\n'}
                    <span className="text-green-400">// Verify your identity across chains</span>{'\n'}
                    <span className="text-blue-400">const</span> <span className="text-yellow-400">proof</span> = <span className="text-blue-400">await</span> wallet.<span className="text-yellow-400">createVerifiableCredential</span>({'\n'}
                    {'  '}claims: {'{'}{'\n'}
                    {'    '}id: <span className="text-green-400">'did:unified:0x1a2b...'</span>{'\n'}
                    {'  '}{'}'},{'\n'}
                    {'}'});
                  </code>
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;