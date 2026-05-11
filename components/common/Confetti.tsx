import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  show: boolean;
  duration?: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ show, duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      return;
    }

    setIsVisible(true);
    const timer = setTimeout(() => setIsVisible(false), duration);
    return () => clearTimeout(timer);
  }, [show, duration]);

  if (!isVisible) return null;

  const palette = [
    'var(--chart-1)',
    'var(--chart-4)',
    'var(--chart-2)',
    'var(--destructive)',
    'var(--chart-3)',
  ] as const;
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * duration,
    duration: Math.random() * 2000 + 1000,
    color: palette[Math.floor(Math.random() * palette.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {confettiPieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-2 h-2 rounded-full animate-bounce"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}ms`,
            animationDuration: `${piece.duration}ms`,
            top: '-10px',
          }}
        />
      ))}
    </div>
  );
};
