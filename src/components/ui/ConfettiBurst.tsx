'use client';

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAppStore } from '@/store/useAppStore';

export const ConfettiBurst: React.FC = () => {
  const confettiCount = useAppStore((state) => state.confettiCount);
  const prevCount = useRef(confettiCount);

  useEffect(() => {
    if (confettiCount > prevCount.current) {
      prevCount.current = confettiCount;

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#22D3EE', '#1D4ED8', '#6366F1', '#38BDF8', '#FFFFFF'],
          disableForReducedMotion: true,
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
    }
  }, [confettiCount]);

  return null;
};
