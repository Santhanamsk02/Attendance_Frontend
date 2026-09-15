import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function GlobalLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout;
    
    const handleShow = () => {
      setIsLoading(true);
      // Small delay before showing to prevent flashing on very fast requests
      timeout = setTimeout(() => setShow(true), 300);
    };

    const handleHide = () => {
      setIsLoading(false);
      setShow(false);
      clearTimeout(timeout);
    };

    window.addEventListener('show_loader', handleShow);
    window.addEventListener('hide_loader', handleHide);

    return () => {
      window.removeEventListener('show_loader', handleShow);
      window.removeEventListener('hide_loader', handleHide);
      clearTimeout(timeout);
    };
  }, []);

  if (!isLoading || !show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative flex flex-col items-center justify-center p-8 bg-white/10 dark:bg-black/20 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
        
        {/* Animated Glow Effect Background */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse pointer-events-none" />
        
        {/* Spinner */}
        <div className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full bg-white/20 border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        
        {/* Text */}
        <h3 className="relative z-10 mt-6 text-lg font-semibold tracking-wide text-white drop-shadow-md">
          Syncing Data
        </h3>
        <p className="relative z-10 mt-1 text-sm text-white/70 tracking-wider">
          Please wait...
        </p>
      </div>
    </div>
  );
}
