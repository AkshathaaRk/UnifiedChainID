import React from 'react';
import { YoutubeIcon as CubeIcon, Github, Twitter, Linkedin } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="py-48 border-t border-uc-purple/20">
      <div className="responsive-container">
        <div className="flex justify-center">
          {/* Brand */}
          <div className="text-center">
            <a href="#" className="flex items-center gap-8 group justify-center">
              <CubeIcon className="h-8 w-8 text-uc-purple transition-transform duration-300 group-hover:rotate-[20deg]" />
              <span className="text-xl font-semibold tracking-tight">UnifiedChain ID</span>
            </a>
            <p className="mt-16 text-uc-white/60 text-sm">
              One identity solution for all your blockchain needs.
            </p>
            <div className="mt-24 flex gap-16 justify-center">
              <a href="#" className="text-uc-white/60 hover:text-uc-purple transition-colors" aria-label="GitHub">
                <Github size={20} />
              </a>
              <a href="#" className="text-uc-white/60 hover:text-uc-purple transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-uc-white/60 hover:text-uc-purple transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-64 pt-32 border-t border-uc-purple/20 flex justify-center">
          <p className="text-uc-white/60 text-sm">
            © {new Date().getFullYear()} UnifiedChain ID. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;