import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import gsap from 'gsap';
import { authService } from '@/src/services/auth.service';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    // Set initial states to prevent FOUC and shaking
    gsap.set([leftPaneRef.current, rightPaneRef.current], { opacity: 0 });
    gsap.set('.reveal-item', { opacity: 0, y: 10 });

    tl.to([leftPaneRef.current, rightPaneRef.current], { 
      opacity: 1, 
      duration: 0.8, 
      ease: 'power2.out',
      stagger: 0.1
    })
    .to('.reveal-item', { 
      opacity: 1, 
      y: 0, 
      duration: 0.6, 
      stagger: 0.05, 
      ease: 'power2.out' 
    }, '-=0.4');

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xMove = (clientX / window.innerWidth - 0.5) * 30;
      const yMove = (clientY / window.innerHeight - 0.5) * 30;

      gsap.to('.parallax-content', {
        x: xMove,
        y: yMove,
        duration: 1.5,
        ease: 'power2.out',
        overwrite: true
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await authService.login({
        username: username.trim(),
        password,
      });

      const authData = response?.data || {};
      const token = authData?.token;

      if (!token) {
        throw new Error('Login succeeded but token was not returned by API.');
      }

      gsap.to([leftPaneRef.current, rightPaneRef.current], {
        opacity: 0,
        y: -20,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => onLogin(authData),
      });
    } catch (requestError) {
      setIsLoading(false);
      setErrorMessage(requestError.message || 'Invalid username or password.');
    }
  };

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      {/* Left Pane: Minimalist Login Form */}
      <div 
        ref={leftPaneRef}
        className="w-full lg:w-[45%] flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 bg-white z-10"
      >
        <div className="reveal-item mb-16 flex items-center gap-3">
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 uppercase">CMS <span className="font-light text-gray-400">Enterprise</span></span>
        </div>

        <div ref={formRef} className="max-w-md w-full">
          <div className="reveal-item mb-10">
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-3">Sign in</h1>
            <p className="text-gray-500 font-medium">Please enter your details to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="reveal-item space-y-2">
              <label className="text-xs font-semibold text-gray-700 ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-brand transition-colors" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-[border-color,box-shadow,background-color] duration-200 text-sm font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="reveal-item space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-semibold text-gray-700">Password</label>
                <a href="#" className="text-xs font-medium text-brand hover:underline">Forgot password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-brand transition-colors" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-[border-color,box-shadow,background-color] duration-200 text-sm font-medium placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="reveal-item flex items-center gap-3 py-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-gray-300 text-brand focus:ring-brand" />
              <label htmlFor="remember" className="text-sm font-medium text-gray-600 cursor-pointer">Remember for 30 days</label>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="reveal-item w-full py-4 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-black transition-[background-color,box-shadow] duration-200 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed group shadow-lg shadow-gray-200"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign in to account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {errorMessage && (
              <div className="px-4 py-3 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700 font-medium">
                {errorMessage}
              </div>
            )}
          </form>

          <div className="reveal-item mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium">Version 2.4.0</p>
            <div className="flex gap-6">
              <a href="#" className="text-xs text-gray-400 hover:text-gray-900 transition-colors font-medium">Help Center</a>
              <a href="#" className="text-xs text-gray-400 hover:text-gray-900 transition-colors font-medium">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>

      {/* Right Pane: Professional Editorial Visuals */}
      <div 
        ref={rightPaneRef}
        className="hidden lg:flex w-[55%] bg-gray-900 relative overflow-hidden items-center justify-center p-24"
      >
        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-brand/30 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/20 rounded-full blur-[100px]"></div>
        </div>
        
        {/* Subtle Grid Overlay */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>

        <div className="relative z-10 w-full max-w-xl parallax-content">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                <div className="w-1.5 h-1.5 bg-brand rounded-full"></div>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em]">Enterprise Solutions</span>
              </div>
              <h2 className="text-6xl font-bold text-white leading-[1.1] tracking-tight">
                Streamline your <br/>
                <span className="text-brand">workforce</span> operations.
              </h2>
              <p className="text-lg text-gray-400 font-medium leading-relaxed max-w-md">
                The next generation of content and employee management, designed for modern enterprise scale.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 pt-12 border-t border-white/10">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-white font-semibold">Secure by Design</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Advanced encryption and role-based access control out of the box.</p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Sparkles className="w-5 h-5 text-brand" />
                </div>
                <h3 className="text-white font-semibold">Real-time Sync</h3>
                <p className="text-sm text-gray-500 leading-relaxed">Collaborate seamlessly across teams with instant data synchronization.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Subtle Rail Text */}
        <div className="absolute left-12 bottom-12 flex items-center gap-4 opacity-30">
          <span className="text-white text-[9px] font-bold uppercase tracking-[0.4em]">CMS_CORE_INFRASTRUCTURE</span>
          <div className="w-8 h-px bg-white/50"></div>
        </div>
      </div>
    </div>
  );
}
