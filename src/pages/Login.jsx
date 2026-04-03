import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import gsap from 'gsap';
import { authService } from '@/src/services/auth.service';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline();

    gsap.set([leftPaneRef.current, rightPaneRef.current], { opacity: 0 });
    gsap.set('.reveal-item', { opacity: 0, y: 10 });

    tl.to([leftPaneRef.current, rightPaneRef.current], {
      opacity: 1,
      duration: 0.8,
      ease: 'power2.out',
      stagger: 0.1,
    }).to(
      '.reveal-item',
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.05,
        ease: 'power2.out',
      },
      '-=0.4',
    );

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const xMove = (clientX / window.innerWidth - 0.5) * 30;
      const yMove = (clientY / window.innerHeight - 0.5) * 30;

      gsap.to('.parallax-content', {
        x: xMove,
        y: yMove,
        duration: 1.5,
        ease: 'power2.out',
        overwrite: true,
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

      const authData = response?.data ? response.data : response;
      const token = authData?.token || authData?.data?.token;

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
    <div className="flex h-screen w-full overflow-hidden bg-white font-sans">
      <div
        ref={leftPaneRef}
        className="z-10 flex w-full flex-col justify-center bg-white px-8 sm:px-16 lg:w-[45%] lg:px-24 xl:px-32"
      >
        <div className="reveal-item mb-16 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 uppercase">
            CMS <span className="font-light text-gray-400">Enterprise</span>
          </span>
        </div>

        <div ref={formRef} className="w-full max-w-md">
          <div className="reveal-item mb-10">
            <h1 className="mb-3 text-4xl font-semibold tracking-tight text-gray-900">Sign in</h1>
            <p className="font-medium text-gray-500">Please enter your details to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="reveal-item space-y-2">
              <label className="ml-1 text-xs font-semibold text-gray-700">Username</label>
              <div className="group relative">
                <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium placeholder:text-gray-400 transition-[border-color,box-shadow,background-color] duration-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            <div className="reveal-item space-y-2">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-semibold text-gray-700">Password</label>
              </div>
              <div className="group relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-brand" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-12 text-sm font-medium placeholder:text-gray-400 transition-[border-color,box-shadow,background-color] duration-200 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="reveal-item group flex w-full items-center justify-center gap-3 rounded-xl bg-gray-900 py-4 text-sm font-semibold text-white shadow-lg shadow-gray-200 transition-[background-color,box-shadow] duration-200 hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <span>Sign in to account</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>

            {errorMessage && (
              <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {errorMessage}
              </div>
            )}
          </form>

          <div className="reveal-item mt-12 flex items-center justify-between border-t border-gray-100 pt-8">
            <p className="text-xs font-medium text-gray-400">Version 2.4.0</p>
            <div className="flex gap-6">
              <a href="#" className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-900">
                Help Center
              </a>
              <a href="#" className="text-xs font-medium text-gray-400 transition-colors hover:text-gray-900">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={rightPaneRef}
        className="relative hidden w-[55%] items-center justify-center overflow-hidden bg-gray-900 p-24 lg:flex"
      >
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-[-10%] top-[-10%] h-[70%] w-[70%] rounded-full bg-brand/30 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-500/20 blur-[100px]" />
        </div>

        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />

        <div className="parallax-content relative z-10 w-full max-w-xl">
          <div className="space-y-12">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <div className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  Enterprise Solutions
                </span>
              </div>
              <h2 className="text-6xl font-bold leading-[1.1] tracking-tight text-white">
                Streamline your <br />
                <span className="text-brand">workforce</span> operations.
              </h2>
              <p className="max-w-md text-lg font-medium leading-relaxed text-gray-400">
                The next generation of content and employee management, designed for modern enterprise scale.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-12 border-t border-white/10 pt-12">
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <ShieldCheck className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold text-white">Secure by Design</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  Advanced encryption and role-based access control out of the box.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Sparkles className="h-5 w-5 text-brand" />
                </div>
                <h3 className="font-semibold text-white">Real-time Sync</h3>
                <p className="text-sm leading-relaxed text-gray-500">
                  Collaborate seamlessly across teams with instant data synchronization.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 left-12 flex items-center gap-4 opacity-30">
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-white">
            CMS_CORE_INFRASTRUCTURE
          </span>
          <div className="h-px w-8 bg-white/50" />
        </div>
      </div>
    </div>
  );
}
