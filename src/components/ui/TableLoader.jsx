import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function TableLoader({ label = 'Loading records...' }) {
  const ringRef = useRef(null);
  const dotsRef = useRef([]);

  useEffect(() => {
    if (!ringRef.current || dotsRef.current.length === 0) return undefined;

    const ctx = gsap.context(() => {
      gsap.to(ringRef.current, {
        rotate: 360,
        duration: 1.8,
        repeat: -1,
        ease: 'none',
      });

      gsap.fromTo(
        dotsRef.current,
        { y: 0, opacity: 0.45, scale: 0.9 },
        {
          y: -6,
          opacity: 1,
          scale: 1.1,
          duration: 0.5,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
          stagger: 0.1,
        },
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-brand/15"></div>
        <div
          ref={ringRef}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand border-r-brand"
        ></div>
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((idx) => (
          <span
            key={idx}
            ref={(el) => {
              dotsRef.current[idx] = el;
            }}
            className="w-2 h-2 rounded-full bg-brand"
          ></span>
        ))}
      </div>

      <p className="text-sm font-semibold text-brand/90">{label}</p>
    </div>
  );
}
