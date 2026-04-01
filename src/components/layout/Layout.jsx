import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { cn } from '@/src/lib/utils';
import gsap from 'gsap';

export default function Layout({ children, activePage, setActivePage }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const contentRef = useRef(null);

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
  }, [activePage]);

  return (
    <div className={cn("flex h-screen bg-white font-sans", darkMode && "dark")}>
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      
      <div className="flex flex-col flex-1 overflow-hidden bg-gray-50/30">
        <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
        
        <main 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-8"
        >
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
