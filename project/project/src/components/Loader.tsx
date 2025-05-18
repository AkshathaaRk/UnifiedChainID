import React from 'react';
import { YoutubeIcon as CubeIcon } from 'lucide-react';

const Loader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-uc-black flex flex-col items-center justify-center z-50">
      <div className="animate-pulse">
        <CubeIcon className="h-16 w-16 text-uc-purple animate-pulse-glow" />
      </div>
      <div className="mt-24 w-48 h-1 bg-uc-purple/20 rounded-full overflow-hidden">
        <div className="h-full bg-uc-purple animate-[loading_1.5s_ease-in-out_infinite]" style={{
          width: '30%',
          '@keyframes loading': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(400%)' }
          }
        }} />
      </div>
      <p className="mt-16 text-uc-white/60 text-sm">Loading UnifiedChain ID</p>
    </div>
  );
};

export default Loader;