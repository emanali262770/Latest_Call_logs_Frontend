import { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  User,
} from 'lucide-react';
import { motion as Motion } from 'motion/react';
import gsap from 'gsap';
import { authService } from '@/src/services/auth.service';

function FloatingPaths({ position = 1, className = '' }) {
  const paths = Array.from({ length: 36 }, (_, index) => ({
    id: index,
    d: `M-${380 - index * 5 * position} -${189 + index * 6}C-${380 - index * 5 * position} -${
      189 + index * 6
    } -${312 - index * 5 * position} ${216 - index * 6} ${152 - index * 5 * position} ${
      343 - index * 6
    }C${616 - index * 5 * position} ${470 - index * 6} ${684 - index * 5 * position} ${
      875 - index * 6
    } ${684 - index * 5 * position} ${875 - index * 6}`,
    width: 0.32 + index * 0.014,
    duration: 20 + (index % 10),
  }));

  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`}>
      <svg className="h-full w-full" viewBox="0 0 696 316" fill="none" aria-hidden="true">
        {paths.slice(3).map((path) => (
          <Motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.075 + path.id * 0.01}
            initial={{ pathLength: 0.3, opacity: 0.38 }}
            animate={{
              pathLength: 1,
              opacity: [0.24, 0.48, 0.24],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: path.duration,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export default function Login({ onLogin, skipIntro = false }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    if (skipIntro) {
      gsap.set([leftPaneRef.current, rightPaneRef.current], { opacity: 1, y: 0 });
      gsap.set('.reveal-item', { opacity: 1, y: 0 });
      return undefined;
    }

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

    return () => {
      tl.kill();
    };
  }, [skipIntro]);

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
    <div className="relative flex min-h-screen w-full overflow-hidden bg-[#f8fafc] font-sans text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.92)_48%,rgba(238,242,255,0.72)_100%)]" />
      <div className="absolute inset-0 text-slate-800">
        <FloatingPaths position={1} className="opacity-[0.29]" />
        <FloatingPaths position={-1} className="opacity-[0.21]" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(79,70,229,0.10),transparent_28%),radial-gradient(circle_at_88%_28%,rgba(15,23,42,0.06),transparent_24%)]" />
      <div className="absolute inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:42px_42px]" />
      <section
        ref={leftPaneRef}
        className="relative hidden min-h-screen w-1/2 overflow-hidden px-10 py-9 text-slate-950 lg:flex xl:px-14"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.58)_0%,rgba(255,255,255,0.24)_55%,rgba(255,255,255,0.02)_100%)]" />

        <div className="relative z-10 ml-auto mr-6 flex h-full w-full max-w-[540px] flex-col justify-between xl:mr-10">
          <div className="reveal-item flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white/80 text-brand shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.14em]">CMS Enterprise</p>
              <p className="text-xs font-medium text-slate-500">Operations Control</p>
            </div>
          </div>

          <div className="reveal-item max-w-lg pb-10">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/15 bg-white/70 px-3 py-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Secure Business Suite
              </span>
            </div>
            <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-normal text-slate-950 xl:text-[38px]">
              Business operations, controlled from one workspace.
            </h1>
            <p className="mt-5 max-w-sm text-sm font-medium leading-6 text-slate-600">
              Secure access for stock, quotations, setup records, reports, and administration.
            </p>

            <div className="mt-9 grid max-w-md grid-cols-2 gap-4 border-t border-slate-200/80 pt-6">
              {[
                ['Verified access', 'Role-aware workspace security'],
                ['Clean records', 'Controlled operational data'],
              ].map(([title, description]) => (
                <div key={title} className="rounded-md border border-slate-200 bg-white/60 p-3.5 shadow-sm backdrop-blur-sm">
                  <CheckCircle2 className="mb-3 h-4 w-4 text-brand" />
                  <h2 className="text-[13px] font-bold text-slate-900">{title}</h2>
                  <p className="mt-1.5 text-[11px] leading-5 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal-item flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
            <span>CMS_CORE_INFRASTRUCTURE</span>
            <span className="h-px w-10 bg-slate-300" />
          </div>
        </div>
      </section>

      <section
        ref={rightPaneRef}
        className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-5 py-8 text-slate-950 sm:px-8 lg:w-1/2 lg:flex-none lg:justify-start lg:px-10 lg:pl-14 xl:pl-16"
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(255,255,255,0.48))]" />

        <div ref={formRef} className="relative z-10 w-full max-w-[382px]">
          <div className="reveal-item mb-9 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-slate-950">CMS Enterprise</p>
              <p className="text-xs font-semibold text-slate-500">Operations Control</p>
            </div>
          </div>

          <div className="reveal-item rounded-2xl border border-white/80 bg-white/58 px-6 py-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-md sm:px-7">
            <div className="mb-6">
              <h2 className="text-[34px] font-semibold leading-none tracking-normal text-slate-950">Welcome</h2>
              <p className="mt-3.5 text-sm font-medium leading-6 text-slate-500">
                Access your account and continue your work securely.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-username" className="text-[13px] font-semibold text-slate-600">
                    Username
                  </label>
                  <div className="group relative">
                    <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand" />
                    <input
                      id="login-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      autoComplete="username"
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white/76 px-3.5 pl-10 text-sm font-semibold text-slate-950 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-[13px] font-semibold text-slate-600">
                    Password
                  </label>
                  <div className="group relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-brand" />
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white/76 px-3.5 pl-10 pr-11 text-sm font-semibold text-slate-950 outline-none transition-[border-color,box-shadow,background-color] placeholder:text-slate-400 hover:border-slate-300 focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group flex h-11 w-full items-center justify-center gap-2.5 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-[0_16px_32px_rgba(15,23,42,0.16)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-slate-900 hover:shadow-[0_20px_42px_rgba(15,23,42,0.20)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 pt-1">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-400">Protected access</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
