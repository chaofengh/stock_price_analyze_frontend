import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Box } from '@mui/material';

function shouldReduceMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fireSignupConfetti(instance) {
  const origin = { x: 0.5, y: 1 };

  const burst = (overrides) =>
    instance({
      origin,
      angle: 90,
      spread: 80 + Math.random() * 55,
      startVelocity: 80 + Math.random() * 18,
      gravity: 0.8 + Math.random() * 0.25,
      decay: 0.92 + Math.random() * 0.03,
      drift: (Math.random() - 0.5) * 0.8,
      ticks: 420 + Math.floor(Math.random() * 120),
      scalar: 0.75 + Math.random() * 0.35,
      shapes: ['square'],
      ...overrides,
    });

  burst({ particleCount: 200 });
  const t1 = setTimeout(() => burst({ particleCount: 140, startVelocity: 72 }), 110);
  const t2 = setTimeout(() => burst({ particleCount: 120, startVelocity: 64 }), 220);

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
  };
}

function fireFirstTickerConfetti(instance) {
  const colors = ['#00B8FF', '#4CE37E', '#FF8A3D', '#E3ECFF'];

  const cannon = (origin, angle) =>
    instance({
      origin,
      angle,
      spread: 48 + Math.random() * 16,
      startVelocity: 56 + Math.random() * 12,
      gravity: 0.85 + Math.random() * 0.2,
      decay: 0.915 + Math.random() * 0.02,
      drift: (Math.random() - 0.5) * 0.35,
      ticks: 340 + Math.floor(Math.random() * 120),
      scalar: 0.85 + Math.random() * 0.2,
      shapes: ['circle', 'square'],
      colors,
      particleCount: 140,
    });

  const sprinkle = () =>
    instance({
      origin: { x: 0.5, y: 0 },
      angle: 270,
      spread: 65,
      startVelocity: 34 + Math.random() * 8,
      gravity: 1.15,
      decay: 0.93,
      drift: (Math.random() - 0.5) * 0.22,
      ticks: 420,
      scalar: 0.6 + Math.random() * 0.18,
      shapes: ['circle'],
      colors,
      particleCount: 70,
    });

  cannon({ x: 0.12, y: 1 }, 60);
  cannon({ x: 0.88, y: 1 }, 120);
  const t1 = setTimeout(() => sprinkle(), 140);
  const t2 = setTimeout(() => sprinkle(), 340);

  return () => {
    clearTimeout(t1);
    clearTimeout(t2);
  };
}

export default function ConfettiBurst({ active, burstId = 0, zIndex = 1400, variant = 'signup' }) {
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return undefined;
    instanceRef.current = confetti.create(canvasRef.current, { resize: true, useWorker: true });
    return () => {
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    if (!burstId) return;
    if (shouldReduceMotion()) return;

    const instance = instanceRef.current || confetti;
    const fire =
      variant === 'firstTicker'
        ? fireFirstTickerConfetti
        : fireSignupConfetti;

    return fire(instance);
  }, [active, burstId, variant]);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </Box>
  );
}
