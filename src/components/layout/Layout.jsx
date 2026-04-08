import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/src/lib/utils';
import gsap from 'gsap';

export default function Layout({ onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const contentRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    if (contentRef.current) {
      // Set initial state to avoid jump
      gsap.set(contentRef.current, { opacity: 0, y: 10 });
      
      gsap.to(
        contentRef.current,
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.4, 
          ease: 'power2.out',
          overwrite: true 
        }
      );
    }
  }, [location.pathname]);

  // Barcode scanner listener — detects rapid keystrokes followed by Enter
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = 0;
    const SCAN_THRESHOLD_MS = 50; // max ms between keystrokes for scanner input
    const MIN_BARCODE_LENGTH = 4;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input/textarea/select
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      const now = Date.now();

      if (e.key === 'Enter' && buffer.length >= MIN_BARCODE_LENGTH) {
        e.preventDefault();
        const scannedBarcode = buffer.trim();
        buffer = '';
        window.open(`${window.location.origin}/product/${scannedBarcode}`, '_blank');
        return;
      }

      // Only accept printable single characters
      if (e.key.length === 1) {
        if (now - lastKeyTime > 300) {
          // Too long gap — reset buffer (manual typing, not scanner)
          buffer = '';
        }
        buffer += e.key;
        lastKeyTime = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn("flex h-screen bg-white font-sans", darkMode && "dark")}>
      <Sidebar 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      <div className="flex flex-col flex-1 overflow-hidden bg-gray-50/30">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} onLogout={onLogout} />
        
        <main 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-8"
        >
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
