'use client';

import { useEffect, useState } from 'react';

export function ParallaxBlobs() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const offset = scrollY * 0.2;

  return (
    <>
      <div
        className="absolute top-1/4 -right-40 w-[600px] h-[600px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, hsl(145 100% 55%) 0%, transparent 70%)',
          transform: `translateY(${offset}px)`,
        }}
      />
      <div
        className="absolute bottom-1/4 -left-40 w-[500px] h-[500px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, hsl(265 60% 50%) 0%, transparent 70%)',
          transform: `translateY(${-offset * 0.5}px)`,
        }}
      />
    </>
  );
}

export function ParallaxFloat({ children }: { children: React.ReactNode }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="relative float"
      style={{ transform: `translateY(${scrollY * 0.06}px)` }}
    >
      {children}
    </div>
  );
}
